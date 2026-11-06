import { useHttp } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

type Quota = { limit: number; used: number; remaining: number };
type ReserveResponse = {
    generation_id: string;
    provider: string;
    status: string;
};

export function useContentAssistantUsage(workspaceId?: string) {
    const { get: getQuota } = useHttp<Record<string, never>, Quota>({});
    const reserveHttp = useHttp<
        { platform: string; brief: string; idempotency_key: string },
        ReserveResponse
    >({ platform: '', brief: '', idempotency_key: '' });
    const completeHttp = useHttp<{ suggestion: string }, { status: string }>({
        suggestion: '',
    });
    const releaseHttp = useHttp<Record<string, never>, { status: string }>({});
    const [quota, setQuota] = useState<Quota | null>(null);

    const refreshQuota = useCallback(async (): Promise<void> => {
        const response = await getQuota('/content-assistant/quota');
        if (response) {
            setQuota(response);
        }
    }, [getQuota]);

    useEffect(() => {
        if (workspaceId) {
            void refreshQuota();
        }
    }, [refreshQuota, workspaceId]);

    async function reserve(
        platform: string,
        brief: string,
    ): Promise<ReserveResponse> {
        reserveHttp.transform(() => ({
            platform,
            brief,
            idempotency_key: crypto.randomUUID(),
        }));
        const response = await reserveHttp.post(
            '/content-assistant/generations',
        );
        await refreshQuota();
        return response;
    }

    async function complete(id: string, suggestion: string): Promise<void> {
        completeHttp.transform(() => ({ suggestion }));
        await completeHttp.post(
            `/content-assistant/generations/${id}/complete`,
        );
        await refreshQuota();
    }

    async function release(id: string): Promise<void> {
        await releaseHttp.post(`/content-assistant/generations/${id}/release`);
        await refreshQuota();
    }

    async function accept(id: string): Promise<void> {
        await completeHttp.post(`/content-assistant/generations/${id}/accept`);
    }

    return { quota, reserve, complete, release, accept };
}
