import { Head, Link } from '@inertiajs/react';

import FollowerChart from '@/components/analytics/follower-chart';
import { index as analyticsRoute } from '@/routes/analytics';
import type { AnalyticsPageProps } from '@/types/metrics';

type Props = Pick<
    AnalyticsPageProps,
    | 'accounts'
    | 'posts'
    | 'ranking'
    | 'summary'
    | 'filters'
    | 'workspace'
    | 'generatedAt'
    | 'definitions'
    | 'filterOptions'
>;

const numberFormat = new Intl.NumberFormat();

function formatValue(value: number | null): string {
    return value === null ? 'No measurement' : numberFormat.format(value);
}

function formatDate(value: string, timezone: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: timezone,
    }).format(new Date(value));
}

export default function AnalyticsPrintReport({
    accounts,
    posts,
    ranking,
    summary,
    filters,
    workspace,
    generatedAt,
    definitions,
    filterOptions,
}: Props) {
    const selectedAccount = filterOptions.accounts.find(
        (account) => account.id === filters.account_id,
    );
    const query = {
        days: filters.days,
        platform: filters.platform ?? undefined,
        account_id: filters.account_id ?? undefined,
    };

    return (
        <>
            <Head title="Analytics report" />
            <section
                aria-labelledby="analytics-report-title"
                className="mx-auto w-full max-w-5xl space-y-8 px-6 py-8 text-foreground print:max-w-none print:space-y-5 print:px-0 print:py-0"
            >
                <header className="flex flex-wrap items-start justify-between gap-4 print:hidden">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {workspace.name}
                        </p>
                        <h1 className="font-heading text-3xl font-semibold">
                            Analytics report
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={analyticsRoute({ query }).url}
                            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                        >
                            Back to analytics
                        </Link>
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Print
                        </button>
                    </div>
                </header>

                <section className="space-y-2 border-b border-border pb-5">
                    <p className="text-sm font-medium text-muted-foreground">
                        {workspace.name}
                    </p>
                    <h1
                        id="analytics-report-title"
                        className="font-heading text-2xl font-semibold"
                    >
                        Analytics report
                    </h1>
                    <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <dt className="text-muted-foreground">Period</dt>
                            <dd>
                                {filters.from} – {filters.to}
                            </dd>
                            <dd className="text-xs text-muted-foreground">
                                {formatDate(filters.from_at, filters.timezone)}{' '}
                                – {formatDate(filters.to_at, filters.timezone)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Platform</dt>
                            <dd>{filters.platform ?? 'All platforms'}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Account</dt>
                            <dd>
                                {selectedAccount
                                    ? (selectedAccount.display_name ??
                                      selectedAccount.handle)
                                    : 'All accounts'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Timezone</dt>
                            <dd>{filters.timezone}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Generated</dt>
                            <dd>{formatDate(generatedAt, filters.timezone)}</dd>
                        </div>
                    </dl>
                </section>

                <section
                    aria-label="Summary"
                    className="grid gap-3 sm:grid-cols-3"
                >
                    <article className="rounded-xl border border-border p-4">
                        <h2 className="text-sm text-muted-foreground">
                            Followers
                        </h2>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                            {formatValue(summary.followers.value)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {summary.followers.coverage.measured} of{' '}
                            {summary.followers.coverage.total} accounts measured
                        </p>
                    </article>
                    <article className="rounded-xl border border-border p-4">
                        <h2 className="text-sm text-muted-foreground">
                            Engagement
                        </h2>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                            {formatValue(summary.engagement.value)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {summary.engagement.coverage.measured} of{' '}
                            {summary.engagement.coverage.total} destinations
                            measured
                        </p>
                    </article>
                    <article className="rounded-xl border border-border p-4">
                        <h2 className="text-sm text-muted-foreground">
                            Published posts
                        </h2>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                            {numberFormat.format(summary.posts.value)}
                        </p>
                    </article>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Follower history</h2>
                    {accounts.some((account) => account.series.length > 1) ? (
                        <FollowerChart
                            accounts={accounts}
                            posts={posts}
                            timezone={filters.timezone}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Not enough history is available to draw a follower
                            series for this filtered set.
                        </p>
                    )}
                </section>

                <section className="space-y-2">
                    <h2 className="text-lg font-semibold">
                        Coverage and definitions
                    </h2>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {definitions.map((definition) => (
                            <li key={definition}>{definition}</li>
                        ))}
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">Follower accounts</h2>
                    {accounts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No accounts match these filters.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="py-2 pr-4">Account</th>
                                        <th className="py-2 pr-4">Platform</th>
                                        <th className="py-2 pr-4">Followers</th>
                                        <th className="py-2 pr-4">
                                            Period change
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map((account) => (
                                        <tr
                                            key={account.id}
                                            className="border-b border-border"
                                        >
                                            <td className="py-2 pr-4">
                                                {account.display_name ??
                                                    account.handle}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {account.platform}
                                            </td>
                                            <td className="py-2 pr-4 tabular-nums">
                                                {formatValue(
                                                    account.latest_followers,
                                                )}
                                            </td>
                                            <td className="py-2 pr-4 tabular-nums">
                                                {formatValue(
                                                    account.followers_delta,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">
                        Posts in the selected period
                    </h2>
                    {posts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No posts match these filters.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="py-2 pr-4">Post</th>
                                        <th className="py-2 pr-4">Published</th>
                                        <th className="py-2 pr-4">Platforms</th>
                                        <th className="py-2 pr-4">
                                            Engagement
                                        </th>
                                        <th className="py-2 pr-4">Coverage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {posts.map((post) => (
                                        <tr
                                            key={post.id}
                                            className="border-b border-border"
                                        >
                                            <td className="py-2 pr-4">
                                                {post.title || 'Untitled post'}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {formatDate(
                                                    post.published_at,
                                                    filters.timezone,
                                                )}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {post.platforms.join(', ')}
                                            </td>
                                            <td className="py-2 pr-4 tabular-nums">
                                                {formatValue(post.engagement)}
                                            </td>
                                            <td className="py-2 pr-4 tabular-nums">
                                                {post.measured_targets} of{' '}
                                                {post.total_targets}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {ranking.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold">
                            Engagement ranking
                        </h2>
                        <ol className="list-decimal space-y-1 pl-5 text-sm">
                            {ranking.map((post) => (
                                <li key={post.id}>
                                    {post.title || 'Untitled post'} —{' '}
                                    {numberFormat.format(post.engagement)}{' '}
                                    engagement ({post.measured_targets} of{' '}
                                    {post.total_targets} destinations measured)
                                </li>
                            ))}
                        </ol>
                    </section>
                )}
            </section>
        </>
    );
}
