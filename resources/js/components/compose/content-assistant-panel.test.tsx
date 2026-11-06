import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ContentAssistantPanel } from '@/components/compose/content-assistant-panel';

describe('ContentAssistantPanel', () => {
    it('keeps the simulated suggestion editable until a human applies it', async () => {
        const onApply = vi.fn();

        const props = {
            platform: 'linkedin' as const,
            initialBrief: 'A product update',
            currentDraft: 'A product update',
            disabled: false,
            onApply,
        };
        const { rerender } = render(<ContentAssistantPanel {...props} />);

        fireEvent.click(
            screen.getByRole('button', { name: /writing assistant/i }),
        );
        expect(
            screen.getByText(/does not call an AI provider/i),
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Generate simulated suggestion',
            }),
        );

        const suggestion = await screen.findByRole('textbox', {
            name: 'Editable suggestion',
        });
        expect(suggestion).toHaveValue(
            'A professional perspective:\n\nA product update\n\nHow has your team approached this?',
        );

        fireEvent.change(suggestion, {
            target: { value: 'Reviewed and edited copy' },
        });
        expect(onApply).not.toHaveBeenCalled();

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Review and apply to draft',
            }),
        );
        expect(onApply).not.toHaveBeenCalled();

        fireEvent.click(
            screen.getByRole('button', { name: 'Confirm replacement' }),
        );

        expect(onApply).toHaveBeenCalledOnce();
        expect(onApply).toHaveBeenCalledWith('Reviewed and edited copy');
        rerender(
            <ContentAssistantPanel
                {...props}
                currentDraft="Reviewed and edited copy"
            />,
        );
        expect(
            screen.getByRole('button', { name: 'Restore previous draft' }),
        ).toBeInTheDocument();
        expect(screen.getByText(/Nothing was published/i)).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', { name: 'Restore previous draft' }),
        );
        expect(onApply).toHaveBeenLastCalledWith('A product update');
        expect(
            screen.getByText(/previous draft was restored/i),
        ).toBeInTheDocument();
    });

    it('confirms before restoring over edits made after applying a suggestion', async () => {
        const onApply = vi.fn();
        const props = {
            platform: 'linkedin' as const,
            initialBrief: 'Original draft',
            currentDraft: 'Original draft',
            disabled: false,
            onApply,
        };
        const { rerender } = render(<ContentAssistantPanel {...props} />);

        fireEvent.click(
            screen.getByRole('button', { name: /writing assistant/i }),
        );
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Generate simulated suggestion',
            }),
        );
        await screen.findByRole('textbox', { name: 'Editable suggestion' });
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Review and apply to draft',
            }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Confirm replacement' }),
        );

        rerender(
            <ContentAssistantPanel
                {...props}
                currentDraft="A newer unsaved edit"
            />,
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Restore previous draft' }),
        );

        expect(onApply).toHaveBeenCalledOnce();
        expect(screen.getByRole('alert')).toHaveTextContent(
            /replaces edits made after applying/i,
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Keep current edits' }),
        );
        expect(onApply).toHaveBeenCalledOnce();

        fireEvent.click(
            screen.getByRole('button', { name: 'Restore previous draft' }),
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Confirm restore' }),
        );

        expect(onApply).toHaveBeenCalledTimes(2);
        expect(onApply).toHaveBeenLastCalledWith('Original draft');
    });

    it('does not offer generated copy for threaded posts', () => {
        render(
            <ContentAssistantPanel
                platform="x"
                initialBrief="Thread"
                currentDraft="Thread"
                disabled
                onApply={vi.fn()}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: /writing assistant/i }),
        );

        expect(screen.getByText(/not threaded posts/i)).toBeInTheDocument();
        expect(
            screen.queryByRole('button', {
                name: 'Generate simulated suggestion',
            }),
        ).not.toBeInTheDocument();
    });

    it('requires a brief before generating a suggestion', async () => {
        render(
            <ContentAssistantPanel
                platform="instagram"
                initialBrief=""
                currentDraft=""
                disabled={false}
                onApply={vi.fn()}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: /writing assistant/i }),
        );
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Generate simulated suggestion',
            }),
        );

        expect(
            await screen.findByText(
                'Enter a brief before generating a suggestion.',
            ),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('textbox', { name: 'Editable suggestion' }),
        ).not.toBeInTheDocument();
    });

    it('surfaces adapter failures without changing the existing draft', async () => {
        const onApply = vi.fn();

        render(
            <ContentAssistantPanel
                platform="facebook"
                initialBrief="Existing draft"
                currentDraft="Existing draft"
                disabled={false}
                onApply={onApply}
                assistant={{
                    generate: async () => ({
                        status: 'unavailable',
                        provider: 'simulated',
                    }),
                }}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: /writing assistant/i }),
        );
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Generate simulated suggestion',
            }),
        );

        expect(
            await screen.findByText(/Your draft was not changed/i),
        ).toBeInTheDocument();
        expect(onApply).not.toHaveBeenCalled();
    });

    it('does not apply a suggestion if the draft changed after generation', async () => {
        const onApply = vi.fn();
        const props = {
            platform: 'linkedin' as const,
            initialBrief: 'Original draft',
            currentDraft: 'Original draft',
            disabled: false,
            onApply,
        };
        const { rerender } = render(<ContentAssistantPanel {...props} />);

        fireEvent.click(
            screen.getByRole('button', { name: /writing assistant/i }),
        );
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Generate simulated suggestion',
            }),
        );
        await screen.findByRole('textbox', { name: 'Editable suggestion' });

        rerender(
            <ContentAssistantPanel
                {...props}
                currentDraft="A newer unsaved edit"
            />,
        );
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Review and apply to draft',
            }),
        );

        expect(onApply).not.toHaveBeenCalled();
        expect(
            screen.getByText(/draft changed after generation/i),
        ).toBeInTheDocument();
    });

    it('reserves, completes, and reports editorial acceptance through usage', async () => {
        const usage = {
            quota: { limit: 10, used: 0, remaining: 10 },
            reserve: vi.fn().mockResolvedValue({
                generation_id: 'generation-1',
                provider: 'simulated',
                status: 'reserved',
            }),
            complete: vi.fn().mockResolvedValue(undefined),
            accept: vi.fn().mockResolvedValue(undefined),
            release: vi.fn().mockResolvedValue(undefined),
        };

        render(
            <ContentAssistantPanel
                platform="linkedin"
                initialBrief="A product update"
                currentDraft=""
                disabled={false}
                onApply={vi.fn()}
                usage={usage}
            />,
        );

        fireEvent.click(
            screen.getByRole('button', { name: /writing assistant/i }),
        );
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Generate simulated suggestion',
            }),
        );
        await screen.findByRole('textbox', { name: 'Editable suggestion' });
        fireEvent.click(screen.getByRole('button', { name: 'Apply to draft' }));

        expect(usage.reserve).toHaveBeenCalledWith(
            'linkedin',
            'A product update',
        );
        expect(usage.complete).toHaveBeenCalledWith(
            'generation-1',
            expect.any(String),
        );
        expect(usage.accept).toHaveBeenCalledWith('generation-1');
        expect(
            await screen.findByText(/Editorial acceptance recorded/i),
        ).toBeInTheDocument();
    });
});
