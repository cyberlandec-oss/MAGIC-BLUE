#!/bin/sh
set -eu

if [ "${VISUAL_TESTING_AUTHORIZED:-}" != "1" ] || [ "${APP_ENV:-}" != "testing" ]; then
    echo "Refusing visual seed outside the authorized testing environment." >&2
    exit 1
fi

case "${DB_DATABASE:-}" in
    /tmp/rsmanager-visual.sqlite) ;;
    *) echo "Refusing visual seed for a non-disposable database." >&2; exit 1 ;;
esac

php artisan db:seed --class=DefaultUserSeeder --no-interaction
php artisan db:seed --class=DummyAnalyticsSeeder --no-interaction

php artisan tinker --execute='
$workspaces = App\Models\Workspace::query()->whereIn("slug", ["test-workspace", "test-workspace-2"])->get();
foreach ($workspaces as $workspace) {
    for ($i = 1; $i <= 2; $i++) {
        $campaign = App\Models\SalesCampaign::query()->firstOrCreate(
            ["workspace_id" => $workspace->id, "name" => "Visual Campaign {$i}"],
            ["utm_source" => "visual", "utm_medium" => "synthetic", "utm_campaign" => "workspace-{$i}", "status" => "draft"],
        );
        for ($j = 1; $j <= 2; $j++) {
            App\Models\CrmLead::query()->firstOrCreate(
                ["workspace_id" => $workspace->id, "email" => "visual-{$workspace->id}-{$i}-{$j}@example.test"],
                ["sales_campaign_id" => $campaign->id, "name" => "Visual Lead {$i}-{$j}", "status" => "new"],
            );
        }
        App\Models\AdPlan::query()->firstOrCreate(
            ["workspace_id" => $workspace->id, "name" => "Visual Ad Plan {$i}"],
            ["platform" => "meta", "objective" => "awareness", "planned_budget" => 1000 + ($i * 250), "planned_currency" => "USD", "status" => "draft"],
        );
    }
}
echo json_encode([
    "users" => App\Models\User::query()->count(),
    "workspaces" => $workspaces->count(),
    "accounts" => App\Models\ConnectedAccount::query()->count(),
    "metrics" => App\Models\AccountMetric::query()->count(),
    "campaigns" => App\Models\SalesCampaign::query()->count(),
    "leads" => App\Models\CrmLead::query()->count(),
    "ad_plans" => App\Models\AdPlan::query()->count(),
], JSON_THROW_ON_ERROR);
'
