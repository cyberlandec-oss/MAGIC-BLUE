import { useHttp } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type Quota = { limit: number; used: number; remaining: number };
type ReserveResponse = {
    generation_id: string;
    provider: string;
    status: string;
};

export function useContentAssistantUsage() {
    const quotaHttp = useHttp<Record<string, never>, Quota>({});
    const reserveHttp = useHttp<
        { platform: string; brief: string; idempotency_key: string },
        ReserveResponse
    >({ platform: '', brief: '', idempotency_key: '' });
    const completeHttp = useHttp<
        { suggestion: string; accepted: boolean },
        { status: string }
    >({ suggestion: '', accepted: false });
    const releaseHttp = useHttp<Record<string, never>, { status: string }>({});
    const [quota, setQuota] = useState<Quota | null>(null);

    async function refreshQuota() {
        const response = await quotaHttp.get('/content-assistant/quota');
        if (response) {
            setQuota(response);
        }
    }

    // The initial quota request must run once for the mounted workspace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        void refreshQuota();
    }, []);

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

    async function complete(
        id: string,
        suggestion: string,
        accepted: boolean,
    ): Promise<void> {
        completeHttp.transform(() => ({ suggestion, accepted }));
        await completeHttp.post(
            `/content-assistant/generations/${id}/complete`,
        );
        await refreshQuota();
    }

    async function release(id: string): Promise<void> {
        await releaseHttp.post(`/content-assistant/generations/${id}/release`);
        await refreshQuota();
    }

    return { quota, reserve, complete, release };
}
