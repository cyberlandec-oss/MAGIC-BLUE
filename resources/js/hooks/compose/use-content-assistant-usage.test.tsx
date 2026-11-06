import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useContentAssistantUsage } from './use-content-assistant-usage';

const { getQuota } = vi.hoisted(() => ({ getQuota: vi.fn() }));

vi.mock('@inertiajs/react', () => ({
    useHttp: () => ({ get: getQuota }),
}));

describe('useContentAssistantUsage', () => {
    beforeEach(() => {
        getQuota.mockReset();
    });

    it('refreshes the quota when the workspace changes, without refetching on ordinary renders', async () => {
        const first = { limit: 10, used: 2, remaining: 8 };
        const second = { limit: 20, used: 1, remaining: 19 };
        getQuota.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
        const { result, rerender } = renderHook(
            ({ workspaceId }) => useContentAssistantUsage(workspaceId),
            { initialProps: { workspaceId: 'workspace-a' } },
        );

        await waitFor(() => expect(result.current.quota).toEqual(first));
        rerender({ workspaceId: 'workspace-a' });
        expect(getQuota).toHaveBeenCalledTimes(1);

        rerender({ workspaceId: 'workspace-b' });
        await waitFor(() => expect(result.current.quota).toEqual(second));
        expect(getQuota).toHaveBeenCalledTimes(2);
        expect(getQuota).toHaveBeenLastCalledWith('/content-assistant/quota');
    });

    it('waits for a selected workspace before requesting quota', () => {
        const { result } = renderHook(() => useContentAssistantUsage());
        expect(result.current.quota).toBeNull();
        expect(getQuota).not.toHaveBeenCalled();
    });
});
