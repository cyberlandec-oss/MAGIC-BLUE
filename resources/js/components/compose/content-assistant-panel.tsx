import { useId, useState } from 'react';

import {
    simulatedContentAssistant,
    type ContentAssistantAdapter,
    type ContentAssistantResult,
} from '@/lib/compose/content-assistant';
import type { PlatformName } from '@/types/compose';

type Props = {
    platform: PlatformName;
    initialBrief: string;
    currentDraft: string;
    disabled: boolean;
    onApply: (text: string) => void;
    usage?: {
        quota: { limit: number; used: number; remaining: number } | null;
        reserve: (platform: string, brief: string) => Promise<{ generation_id: string; provider: string; status: string }>;
        complete: (id: string, suggestion: string, accepted: boolean) => Promise<void>;
        release: (id: string) => Promise<void>;
    };
    assistant?: ContentAssistantAdapter;
};

export function ContentAssistantPanel({
    platform,
    initialBrief,
    currentDraft,
    disabled,
    onApply,
    usage,
    assistant = simulatedContentAssistant,
}: Props) {
    const briefId = useId();
    const suggestionId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const [brief, setBrief] = useState(initialBrief);
    const [suggestion, setSuggestion] = useState('');
    const [notice, setNotice] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [confirmReplacement, setConfirmReplacement] = useState(false);
    const [previousDraft, setPreviousDraft] = useState<string | null>(null);
    const [appliedDraft, setAppliedDraft] = useState<string | null>(null);
    const [confirmRestore, setConfirmRestore] = useState(false);
    const [generationId, setGenerationId] = useState<string | null>(null);
    const [generatedBrief, setGeneratedBrief] = useState<string | null>(null);
    const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);

    async function generateSuggestion() {
        setIsGenerating(true);
        setConfirmReplacement(false);

        let reservedId: string | null = null;
        if (usage) {
            if (usage.quota?.remaining === 0) {
                setNotice('Monthly assistant quota reached.');
                setIsGenerating(false);
                return;
            }

            try {
                reservedId = (await usage.reserve(platform, brief)).generation_id;
                setGenerationId(reservedId);
            } catch {
                setNotice('The assistant quota could not be reserved. Your draft was not changed.');
                setIsGenerating(false);
                return;
            }
        }

        let response: ContentAssistantResult;
        try {
            response = await assistant.generate(brief, platform);
        } catch {
            if (reservedId && usage) {
                await usage.release(reservedId);
                setGenerationId(null);
            }
            setSuggestion('');
            setNotice(
                'The assistant could not generate a suggestion. Your draft was not changed.',
            );
            setIsGenerating(false);

            return;
        }

        setIsGenerating(false);

        if (response.status === 'empty_brief') {
            if (reservedId && usage) {
                await usage.release(reservedId);
                setGenerationId(null);
            }
            setSuggestion('');
            setNotice('Enter a brief before generating a suggestion.');

            return;
        }

        if (response.status === 'unavailable') {
            if (reservedId && usage) {
                await usage.release(reservedId);
                setGenerationId(null);
            }
            setSuggestion('');
            setNotice(
                'The simulated assistant is unavailable. Your draft was not changed.',
            );

            return;
        }

        setSuggestion(response.text);
        setGeneratedBrief(brief);
        setGeneratedDraft(currentDraft);
        setNotice(
            `${response.provider === 'simulated' ? 'Simulated response only.' : `Response from ${response.provider}.`} Review and edit it before applying it to the draft.`,
        );
    }

    async function applySuggestion() {
        if (suggestion.trim() === '') {
            return;
        }

        if (brief !== generatedBrief || currentDraft !== generatedDraft) {
            setConfirmReplacement(false);
            setNotice(
                'The brief or draft changed after generation. Generate a fresh suggestion before applying it.',
            );

            return;
        }

        if (currentDraft.trim() !== '' && !confirmReplacement) {
            setConfirmReplacement(true);
            setNotice(
                'The editor already contains a draft. Confirm replacement or cancel to keep it unchanged.',
            );

            return;
        }

        setPreviousDraft(currentDraft);
        setAppliedDraft(suggestion);
        setConfirmRestore(false);
        onApply(suggestion);
        if (generationId && usage) {
            await usage.complete(generationId, suggestion, true);
            setGenerationId(null);
        }
        setConfirmReplacement(false);
        setNotice(
            'Applied to the draft editor. Nothing was published; you can restore the previous draft.',
        );
    }

    function restorePreviousDraft() {
        if (previousDraft === null) {
            return;
        }

        if (currentDraft !== appliedDraft) {
            setConfirmRestore(true);
            setNotice(
                'The draft changed after the suggestion was applied. Confirm restoring to replace those edits.',
            );

            return;
        }

        confirmPreviousDraftRestore();
    }

    function confirmPreviousDraftRestore() {
        if (previousDraft === null) {
            return;
        }

        onApply(previousDraft);
        setPreviousDraft(null);
        setAppliedDraft(null);
        setConfirmRestore(false);
        setNotice('The previous draft was restored.');
    }

    return (
        <section className="border-t border-border px-4 py-3 sm:px-[26px]">
            <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
                {isOpen ? 'Close writing assistant' : 'Writing assistant'}
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Simulated
                </span>
            </button>

            {isOpen && (
                <div className="mt-3 space-y-3">
                    <p className="text-xs text-muted-foreground">
                        This local simulation does not call an AI provider.
                        Suggestions stay here until you edit and apply them.
                    </p>

                    {disabled ? (
                        <p className="text-sm text-muted-foreground">
                            Assistance currently supports single-message drafts,
                            not threaded posts.
                        </p>
                    ) : (
                        <>
                            <div className="space-y-1.5">
                                <label
                                    htmlFor={briefId}
                                    className="text-sm font-medium"
                                >
                                    Brief for {platform}
                                </label>
                                <textarea
                                    id={briefId}
                                    value={brief}
                                    onChange={(event) => {
                                        setBrief(event.target.value);
                                        setSuggestion('');
                                        setGeneratedBrief(null);
                                        setGeneratedDraft(null);
                                        setConfirmReplacement(false);
                                    }}
                                    rows={3}
                                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={generateSuggestion}
                                disabled={isGenerating}
                                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                            >
                                {isGenerating
                                    ? 'Generating…'
                                    : 'Generate simulated suggestion'}
                            </button>

                            {suggestion !== '' && (
                                <div className="space-y-2">
                                    <label
                                        htmlFor={suggestionId}
                                        className="block text-sm font-medium"
                                    >
                                        Editable suggestion
                                    </label>
                                    <textarea
                                        id={suggestionId}
                                        value={suggestion}
                                        onChange={(event) =>
                                            setSuggestion(event.target.value)
                                        }
                                        rows={5}
                                        className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={applySuggestion}
                                        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                    >
                                        {currentDraft.trim() === ''
                                            ? 'Apply to draft'
                                            : 'Review and apply to draft'}
                                    </button>
                                    {confirmReplacement && (
                                        <div
                                            role="alert"
                                            className="flex flex-wrap items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3"
                                        >
                                            <span className="mr-auto text-sm">
                                                This replaces the current draft.
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setConfirmReplacement(false)
                                                }
                                                className="rounded-md border border-border px-3 py-1.5 text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={applySuggestion}
                                                className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                                            >
                                                Confirm replacement
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {previousDraft !== null &&
                                previousDraft.trim() !== '' && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={restorePreviousDraft}
                                            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium"
                                        >
                                            Restore previous draft
                                        </button>
                                        {confirmRestore && (
                                            <div
                                                role="alert"
                                                className="flex flex-wrap items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3"
                                            >
                                                <span className="mr-auto text-sm">
                                                    Restoring replaces edits
                                                    made after applying the
                                                    suggestion.
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setConfirmRestore(false)
                                                    }
                                                    className="rounded-md border border-border px-3 py-1.5 text-sm"
                                                >
                                                    Keep current edits
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={
                                                        confirmPreviousDraftRestore
                                                    }
                                                    className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                                                >
                                                    Confirm restore
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                        </>
                    )}

                    <p
                        aria-live="polite"
                        className="text-xs text-muted-foreground"
                    >
                        {notice}
                    </p>
                </div>
            )}
        </section>
    );
}
