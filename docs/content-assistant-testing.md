# Content assistant test runner

The application image intentionally installs production dependencies only. Use
the isolated runner below for Pest, Pint and Larastan. It installs development
dependencies from `composer.lock` and never mounts the operational `.env`,
SQLite database, storage or credentials.

```powershell
$docker = 'C:\Users\mario\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe'
& $docker build --file Dockerfile.testing-runner --tag magic-blue:tests .
& $docker run --rm --network none --entrypoint /bin/sh `
  --env APP_ENV=testing `
  --env APP_KEY='base64:VFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFRUVFU=' `
  --env DB_CONNECTION=sqlite `
  --env DB_DATABASE=':memory:' `
  --env DB_URL='' `
  --env CACHE_STORE=array `
  --env SESSION_DRIVER=array `
  --env QUEUE_CONNECTION=sync `
  --env MAIL_MAILER=array `
  --env QUEUE_WORKER_ENABLED=false `
  --env SCHEDULER_ENABLED=false `
  magic-blue:tests `
  'php artisan package:discover --ansi && vendor/bin/pest --compact tests/Feature/ContentAssistant/ContentAssistantUsageTest.php'
```

The test guard in `tests/TestCase.php` rejects any effective database other
than SQLite `:memory:`. Use a persistent cache store only in a separate runner
when testing scheduler locking; `CACHE_STORE=array` does not prove
`withoutOverlapping()` locking across processes.
