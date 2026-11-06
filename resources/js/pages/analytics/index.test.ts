import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { StatTile } from '@/components/analytics/stat-tile';
import { disabledPlatformLabels } from '@/lib/platforms';

const source = readFileSync(resolve(import.meta.dirname, 'index.tsx'), 'utf8');
const printSource = readFileSync(
    resolve(import.meta.dirname, 'report-print.tsx'),
    'utf8',
);

function renderStatTile(value: number | null, caption: string): string {
    return renderToStaticMarkup(
        createElement(StatTile, {
            label: 'Followers',
            metric: { value, delta: null },
            caption,
            deltaLabel: 'vs previous period',
        }),
    );
}

describe('analytics disabled metric notices', () => {
    it('shows partial platform disables where metrics are used', () => {
        expect(source).toContain('{!metricsDisabled && (');
        expect(source).toContain('AnalyticsPollingBanner');
        expect(source).toContain('Some analytics are temporarily disabled');
        expect(source).toContain(
            'Some account metrics are temporarily disabled',
        );
        expect(source).toContain('Some post metrics are temporarily disabled');
    });

    it('derives disabled platform labels from the polling payload keys', () => {
        // The notices are built via disabledPlatformLabels, which derives the
        // set from the payload keys instead of a hardcoded platform list.
        expect(source).not.toContain(
            "const analyticsPlatforms: PlatformName[] = ['x', 'bluesky', 'linkedin'];",
        );
        expect(source).toContain('disabledPlatformLabels');

        expect(
            disabledPlatformLabels({
                x: true,
                bluesky: false,
                linkedin: false,
                facebook: true,
                instagram: true,
                threads: true,
                discord: true,
            }),
        ).toEqual(['Bluesky', 'LinkedIn']);
        expect(
            disabledPlatformLabels({
                x: true,
                bluesky: true,
                linkedin: true,
                facebook: true,
                instagram: true,
                threads: true,
                discord: true,
            }),
        ).toEqual([]);
    });
});

describe('analytics post comparison links', () => {
    it('links comparison rows to the post detail route', () => {
        expect(source).toContain(
            "import { show as postRoute } from '@/routes/posts';",
        );
        expect(source).toContain('href={postRoute(row.id).url}');
    });
});

describe('analytics headline summary', () => {
    it('renders stat tiles for followers, engagement, and posts', () => {
        expect(source).toContain('StatTile');
        expect(source).toContain('metric={summary.followers}');
        expect(source).toContain('metric={summary.engagement}');
        expect(source).toContain('metric={summary.posts}');
    });

    it('renders a per-account follower growth chart with post markers', () => {
        expect(source).toContain('FollowerChart');
        expect(source).toContain('accountMetricsEnabled={');
        expect(source).toContain('posts={posts}');
    });

    it('renders unavailable measurements as no data', () => {
        expect(renderStatTile(null, '0 of 2 accounts measured')).toContain(
            'No data',
        );
    });

    it('keeps a valid zero distinct from a missing measurement', () => {
        expect(renderStatTile(0, '1 of 1 accounts measured')).toContain(
            '>0</span>',
        );
        expect(renderStatTile(0, '1 of 1 accounts measured')).not.toContain(
            'No data',
        );
    });

    it('shows partial measurement coverage in the tile caption', () => {
        expect(
            renderStatTile(125, 'measured for 1 of 2 non-Discord accounts'),
        ).toContain('measured for 1 of 2 non-Discord accounts');
    });
});

describe('analytics range switching', () => {
    it('reloads only the range-dependent props and preserves scroll/state', () => {
        expect(source).toContain('preserveScroll');
        expect(source).toContain('preserveState');
        expect(source).toContain('only={RANGE_RELOAD_PROPS}');
    });
});

describe('printable analytics report', () => {
    it('reuses the follower chart and preserves the filtered report context', () => {
        expect(printSource).toContain(
            "import FollowerChart from '@/components/analytics/follower-chart';",
        );
        expect(printSource).toContain('<FollowerChart');
        expect(printSource).toContain('timezone={filters.timezone}');
    });
});

describe('analytics filter reset', () => {
    it('resets the period, platform, and account to the default view', () => {
        expect(source).toContain('analyticsFilters.days !== 90');
        expect(source).toContain('analyticsFilters.platform !== null');
        expect(source).toContain('analyticsFilters.account_id !== null');
        expect(source).toContain('query: { days: 90 }');
        expect(source).toContain('Reset filters');
    });
});
