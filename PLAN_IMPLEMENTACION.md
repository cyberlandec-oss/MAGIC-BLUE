# Plan de implementación

## Entrega 0 — Contexto técnico (integrada)

Se integró `inicio-adaptacion.patch` sobre el commit existente, sin reconstruir el
historial ni reemplazar las instrucciones originales de `AGENTS.md` y
`CLAUDE.md`. La documentación de producto, auditoría, arquitectura, contrato BI,
plan y continuación de trabajo está en el repositorio. Laravel, Inertia, React,
Bun y Recharts se mantienen.

## Entrega 1 — Métricas fiables (implementación integrada; despliegue local recuperado)

- Seguidores: `null` cuando no hay lecturas válidas; cero se conserva como
  medición. La cobertura cuenta cuentas no Discord medidas respecto de todas
  las cuentas no Discord consultadas en el workspace activo. El total se
  describe como suma por cuenta, no como personas únicas. El delta agregado es
  `null` si alguna cuenta del denominador no tiene dos lecturas comparables.
- Engagement: solo destinos `ok` aportan contadores al resumen, ranking y
  baseline anterior. `failed`, `unsupported` y `rate_limited` conservan sus
  datos almacenados, pero no se exponen como mediciones actuales. La cobertura
  es destinos medidos respecto de todos los destinos de posts publicados o
  parcialmente publicados en el intervalo.
- Publicaciones: el conteo completo de posts `published`/`partial` conserva el
  cero conocido. Las tarjetas distinguen ausencia de datos y cero, muestran
  cobertura y precisan que engagement son los últimos contadores exitosos de
  posts publicados en el intervalo, no interacciones necesariamente ocurridas
  durante él.
- No se añadieron migraciones ni se cambió el aislamiento existente por
  workspace. Se actualizaron juntos controlador, tipos, componentes y pruebas.

### Verificación efectuada

- La validación registrada previamente pasó Pest (`20 tests, 294 assertions`).
  No se repitió: el controlador PHP y sus pruebas no cambiaron desde esa
  ejecución.
- Revalidación del 27-10-2026, en contenedores efímeros y sin usar la base
  persistente:
  - Oxfmt en los cuatro archivos frontend modificados: aprobado.
  - Vitest focalizado en analytics: `9 tests passed`.
  - Oxlint en los cuatro archivos frontend modificados: `0 warnings, 0 errors`.
  - TypeScript: `tsc --noEmit` aprobado después de generar Wayfinder dentro del
    contenedor efímero, porque esos archivos generados no se incluyen en la
    imagen runtime.
  - Pint en el controlador y la prueba PHP modificados: aprobado.
  - Larastan/PHPStan, nivel 7 (`composer types:check`): `[OK] No errors`.
- La imagen desplegada `shoutrrr:dev` contiene hashes idénticos a los archivos
  modificados de aplicación y pruebas. El Compose de desarrollo no monta el
  código fuente (solo `storage` y `database/sqlite`); no hizo falta reconstruir
  ni copiar archivos al contenedor. Se conserva el mismo servicio, proyecto y
  volúmenes.
- Docker Engine responde. `shoutrrr-app-1` está `running` y `healthy`; la ruta
  de analítica respondió HTTP 200 y `/` redirige a `/login` cuando no se usa
  una sesión autenticada.
- La pantalla se inspeccionó en el navegador integrado: muestra las tarjetas
  Followers, Engagement y Posts published, sus definiciones y coberturas
  parciales (6/8 cuentas para seguidores y 72/87 destinos para engagement).
  La instancia contiene datos de demostración existentes (por ejemplo, Acme y
  una publicación `dummy-analytics`), así que la inspección valida el render y
  no resultados comerciales reales. No se añadieron datos persistentes.
  Playwright no registró errores de consola ni excepciones de página durante
  la carga. Los estados de sin medición, cero válido y cobertura parcial están
  cubiertos por las pruebas aisladas; la vista actual no expone un caso sin
  datos.
- El control inicial de formato y el primer intento de Oxlint no pudieron
  arrancar porque los lanzadores esperaban `node`, ausente en la imagen runtime.
  Se resolvió sin cambios al proyecto: Oxfmt se ejecutó con Bun y Oxlint con un
  enlace `node` temporal al Bun dentro del contenedor efímero.
- El primer `tsc` encontró 175 imports Wayfinder no generados, no errores de
  tipos de la aplicación. Tras generarlos en el entorno efímero, pasó.
- El contenedor histórico `rsmanager-analytics-test-...` finalizó con código
  137, `OOMKilled=false`, sin logs y con comando `sleep infinity`; no demuestra
  que se bloqueara una validación ni que hubiera falta de memoria. No hay
  evidencia disponible para determinar la causa exacta de ese cierre anterior.
  En la comprobación actual no había procesos de validación activos; el host
  informó 1.3 GiB de memoria física libre y la app usaba 648 MiB de un límite de
  3.8 GiB. `/tmp/rsmanager-delivery1-test` no existe en la app ni en el
  contenedor de inspección, por lo que no hubo que borrar archivos.

### Estado de cierre de la entrega

- Implementación, controles requeridos y despliegue local verificados. El
  trabajo permanece en la rama actual; no se han modificado credenciales,
  APP_KEY, configuración de base de datos ni volúmenes.
- No se avanza a las entregas posteriores. El commit de la entrega
  `14325d73f9b5ca9a11c041d5c13858700b46e4b3` ya se publicó mediante push
  normal a `origin/main`, con coincidencia del SHA local y remoto.

## Entrega 2 — Conexiones reales (en curso; no completada)

Validar Facebook, Instagram y LinkedIn con cuentas de prueba autorizadas. Separar perfil y página LinkedIn y comprobar capacidades del producto OAuth contratado/aprobado. Registrar publicación y lectura de métricas, permisos, errores y renovación. No enviar contenido real de clientes sin autorización editorial. Determinar si se necesita la prueba Upload-Post/Ayrshare descrita en arquitectura.

El inventario de capacidades, rutas OAuth, configuración observada, pruebas
aisladas, referencias de código y bloqueos está en
[MATRIZ_CONEXIONES.md](./MATRIZ_CONEXIONES.md). El conector Meta añadió
validación explícita de `state` OAuth porque el flujo Socialite stateless no
estaba verificando ese valor; la prueba focalizada cubre el envío y el rechazo
de un estado incorrecto.

La configuración local efectiva no contiene credenciales de aplicaciones
Meta ni LinkedIn. Los registros de cuentas existentes no se consideran
conexiones reales ni evidencia de acceso. Por tanto, ninguna lectura de API ni
publicación real fue autorizada o ejecutada. La matriz registra la validación
real como pendiente y Entrega 2 permanece abierta.

## Entrega 3 — Dashboard y reportes (implementada y validada)

La pantalla de analítica incorpora filtros por periodo, plataforma y cuenta,
restringidos al workspace autorizado. Resumen, gráficos y ranking usan el mismo
conjunto filtrado y la zona horaria del workspace. Se conservan `null` frente a
cero válido y las reglas de cobertura de la Entrega 1. Se añadieron la vista
imprimible y la exportación CSV autorizada, con filtros, cliente/workspace,
periodo, zona horaria, fecha de generación, cobertura y definiciones. La fecha
de generación se distingue de la última actualización de métricas y esta solo
se muestra cuando hay evidencia. Los endpoints vuelven a autorizar el acceso,
rechazan cuentas ajenas al workspace, escapan CSV y neutralizan fórmulas. No
hay enlaces públicos de reportes ni datos de prueba persistidos.

La prevención de pruebas está operativa: el Compose aislado no tiene red,
socket Docker, volúmenes de datos de la app ni credenciales de proveedores;
monta el código y dependencias en solo lectura y usa SQLite `:memory:`. El
guard rechaza una ruta SQLite de archivo desechable antes de crearla. Pest se
ejecutó únicamente en ese servicio y pasó `23 tests, 395 assertions`; cubre
filtros combinados y aislamiento de workspaces, fechas/zona horaria, `null`,
cero, cobertura parcial y la respuesta CSV con UTF-8, valores escapados,
fórmulas potenciales y saltos de línea. Vitest pasó `13 tests`; TypeScript,
Oxfmt y Oxlint focalizados también pasaron. Pint pasó sobre los archivos PHP
modificados y el análisis PHPStan focalizado de `tests/TestCase.php` y
`AnalyticsController.php` terminó sin errores.

El análisis global inicial `composer types:check` excedió 300 segundos con
374/545 archivos; entonces el servicio aislado tenía 64 MiB de `tmpfs` en
`/tmp`. El límite se amplió a 512 MiB únicamente en el Compose de pruebas. El
31-10 se repitió con `COMPOSER_PROCESS_TIMEOUT=1200`; también terminó por
timeout, tras 417/570 archivos. PHPStan había iniciado y siguió analizando,
pero no emitió un resultado final; el control global queda inconcluso. Se
observó un aviso de Git sobre ownership no confiable del checkout, sin evidencia
de que causara el timeout. No se atribuye el resultado a memoria ni a una causa
no demostrada. El análisis focalizado de `SalesController.php` pasó.

El build frontend se completó una vez en el servicio aislado, sin red ni acceso
a secretos; el checkout de código permaneció en solo lectura. Se validaron 146
entradas del manifest y los 154 archivos referenciados. Los assets actuales
están disponibles en `public/build`; la aplicación respondió con el bundle
`app-DQZ_omR6.js`, `public/hot` sigue ausente y Vite/HMR no se inició. Solo se
recargaron de forma controlada los workers de Octane para que leyeran el nuevo
manifest; no se recreó el contenedor ni se reinició Docker/WSL.

La inspección autenticada respondió HTTP 200 para analítica, reporte imprimible
y CSV. La instancia no tiene cuentas conectadas ni posts del workspace; la
pantalla muestra correctamente ausencia de mediciones y cero posts, sin añadir
datos. Con un filtro de plataforma activo se mostró «Reset filters»; al usarlo,
se volvió a 90 días sin plataforma ni cuenta. No hubo errores de consola ni
respuestas fallidas de assets. La respuesta CSV fue `text/csv; charset=UTF-8`
con `Content-Disposition` y conservó los filtros. En modo impresión se
ocultaron la navegación lateral y los controles de aplicación. El reporte
imprimible usa resumen y tablas, no gráficos; no hubo gráficos que pudieran
cortarse. La instancia vacía tampoco permitió una inspección visual de un
gráfico con series, aunque sus datos y estados están cubiertos por pruebas
aisladas.

Entrega 3 queda cerrada para el alcance implementado y validado en entorno
aislado y local. No implica mediciones reales ni validación con proveedores.
La única limitación visual es la ausencia de series en el workspace; no se
inventaron datos. Entrega 2 sigue abierta por OAuth, publicación y métricas de
proveedores reales. HMR queda como pendiente independiente.

## Entrega 4 — Creación asistida y aprobación (simulación local implementada)

El compositor ofrece una asistencia opcional y claramente marcada como
simulada. Construye sugerencias deterministas según la red seleccionada, permite
editarlas y solo aplica el texto al editor del borrador tras una acción humana.
Se limita a mensajes únicos; no altera hilos ni estados de envío y no puede
publicar. No integra proveedor, consume API, crea gastos ni agrega dependencias.
El borrador se guarda mediante el autosave y las rutas/permisos ya existentes
del compositor.

Validado en el entorno aislado: 11 pruebas Vitest para la adaptación por red,
brief vacío, edición, aplicación voluntaria, mensaje de no publicación y
exclusión de hilos; TypeScript, Oxfmt y Oxlint focalizados pasaron. Esta
simulación no es una integración real ni una evaluación de calidad de modelos.
Campos internos previstos: propuesta temporal en el compositor, texto editable,
plataforma, resultado del adaptador y decisión humana; el borrador aceptado se
conserva en el modelo Post existente. La simulación no transmite ni persiste el
brief fuera del borrador existente y no escribe el resultado automáticamente.
La futura integración debe persistir solo la propuesta necesaria, identificar
proveedor/modelo y autor, aplicar límites/cuotas por workspace y permitir
eliminación por el workspace; no registrar prompts ni PII en logs. Owner/admin
pueden gestionar configuración de IA; miembros conservan permisos actuales de
edición. La aprobación editorial y el estado de publicación deben permanecer
separados si se adopta un flujo persistente.

Pendientes para cerrar Entrega 4: proveedor, cuotas/costes por workspace,
retención/auditoría persistente, política de aprobación final, revisión visual
aislada e integración real. La generación real queda expresamente pendiente;
la ausencia de claves no bloquea la simulación ni las pruebas internas.

## Entrega 5 — Campañas, UTM y CRM

Alcance interno mínimo, sin SaaS/CRM externo:

- Campaña: nombre, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`,
  `utm_content`, fechas opcionales y estado. Cada campo UTM describe el origen
  declarado del enlace, no una atribución calculada.
- Lead: nombre opcional, email opcional, campaña opcional y estado comercial
  `new`, `qualified`, `opportunity`, `won` o `lost`. Debe suministrarse nombre
  o email. Se excluyen teléfono, notas libres, scraping, enriquecimiento y
  valores de venta para minimizar PII y evitar conversiones/ingresos sin
  evidencia. Las oportunidades no son ventas confirmadas.
- Los registros pertenecen al workspace y no se aceptan IDs de workspace desde
  formularios. Todos los miembros autorizados del workspace pueden consultar;
  owner/admin pueden crear, editar y eliminar. Se vuelve a verificar el
  workspace en cada operación.
- No hay envío comercial, sincronización externa, tracking de navegación ni
  atribución automática. La conservación continúa mientras el workspace
  necesite el registro; owner/admin pueden eliminar cada registro y la
  eliminación del workspace elimina sus campañas y leads. No se retiene una
  copia con PII en auditoría.
- El informe agrupa todos los registros del workspace por etapa declarada,
  sin presentar personas únicas, conversiones atribuidas ni ingresos. La lista
  interactiva conserva solo los 100 registros más recientes; los totales del
  informe no se limitan a esa página.

La implementación no declarará ingresos ni ROI. Cualquier futuro reporte
distinguirá datos declarados, observados y calculados; un valor comercial solo
se incorporará cuando se defina su fuente, moneda, evento e idempotencia.
Estado: núcleo interno y resumen de etapas implementados y validados con
pruebas aisladas, incluida la exclusión de registros de otro workspace. La
inspección visual y cualquier integración externa siguen pendientes; la
entrega no se declara cerrada hasta resolver la validación visual.

## Entrega 6 — Anuncios y SaaS productivo

Se limita la fase interna a borradores de planificación para Meta Ads: nombre,
objetivo, intervalo, presupuesto planeado y moneda. No se guardan tokens,
identificadores externos ni gasto observado. Owner/admin gestionan borradores;
miembros consultan. El presupuesto planeado nunca se etiqueta como gasto.
No hay endpoint, job o botón para activar, enviar o comprar anuncios. Cada
borrador se elimina por owner/admin o en cascada al borrar el workspace.

Meta Ads real queda pendiente de autorización, productos/permisos, límites y
confirmación humana de gasto. LinkedIn Ads/Google Ads siguen fuera de alcance.
Antes de clientes reales también deben revisarse facturación, cuotas, backups
restaurables, observabilidad y despliegue; no activar gasto como parte de QA.
Estado: planificación interna implementada y validada con pruebas aisladas;
no se crearon campañas externas ni se activó gasto. La revisión visual aislada
sigue pendiente, por lo que la entrega no se declara cerrada.

## Registro de avance

Actualizar aquí fecha, commit, alcance, pruebas ejecutadas y limitaciones por entrega. No marcar completado un conector por existir en código ni un dashboard por tener datos simulados.

31-10-2026 (continuación desde `be07563`): se corrigió el flujo de
restauración del asistente. Si el usuario edita el borrador después de aceptar
una propuesta, debe confirmar antes de reemplazar esas ediciones; cancelar
mantiene el texto actual. La prueba de regresión verifica ambas opciones.
`ContentAssistantPanel` pasó `6 tests`.

Verificación aislada de este cambio:

- Vitest focalizado: `6/6` con `--pool=threads --maxWorkers=1` y
  `--fsModuleCachePath=/tmp/rsmanager-vitest-cache`; el destino está en el
  `tmpfs` de pruebas, no en el volumen de dependencias de solo lectura.
- Oxfmt pasó en los dos archivos modificados; Oxlint pasó en esos archivos con
  `0 warnings, 0 errors`; `tsc --noEmit` terminó con código 0.
- Build aislado: `9315` módulos transformados y build completado en `13m 6s`.
  El manifest y los assets quedaron en el `tmpfs` efímero; no se activaron en
  la aplicación local. Vite avisó del loader de configuración, la dependencia
  opcional `fontaine` y chunks mayores de 500 kB; el build terminó correctamente.
- El pool `forks` agotó su espera de inicio de worker con Bun; el pool `threads`
  evitó ese problema. El primer intento con `threads` reveló que Vitest intentaba
  crear `.vitest-cache` en `node_modules` de solo lectura. Sin cambiar ese
  volumen, se redirigió el caché a `/tmp` y las seis pruebas pasaron.
- Los dos fallos Vitest previamente registrados también se clasificaron con
  pruebas focalizadas en una copia temporal de `resources/js`.
  `inertia-cache-policy` pasó `10 tests` y `build-feedback-payload` `3 tests`
  (`13/13`, `5.62s` en total). La primera recorre y lee todo `resources/js`;
  el timeout previo corresponde al acceso lento del bind mount Windows, no a
  una infracción de política. La segunda compara el tipo MIME sin sus
  parámetros, por lo que un `charset` opcional no cambia el payload esperado.

Matriz de estado interno revisada:

| Requisito | Implementación | Evidencia registrada | Pendiente |
| --- | --- | --- | --- |
| Entrega 3: filtros, cobertura, `null`/cero, CSV e impresión | Dashboard y reportes comparten filtros y ámbito de workspace; se conservan cobertura y zona horaria del contrato BI | Pest aislado `23 tests, 395 assertions`; Vitest `13 tests`; validación HTTP/imprimible previa sin métricas sintéticas en la cuenta operativa | Recorrido visual con datos sintéticos, CSV descargado e impresión inspeccionada en navegador |
| Entrega 4: propuesta, edición, aceptación y conservación del borrador | Adaptador explícitamente simulado, revisión humana, protección de ediciones y restauración confirmada | Vitest focalizado `6/6`; TypeScript, Oxfmt y Oxlint aprobados en el commit anterior | Recorrido visual. Proveedor real, cuotas y persistencia de auditoría siguen en fase final |
| Entrega 5: campañas, UTM, etapas, permisos y conservación | Núcleo interno por workspace, nombre/email mínimos, UTM declarativas, etapas comerciales, eliminación y resumen sin atribución | `SalesModuleTest` registrado previamente `6 tests, 49 assertions`; tests UI registrados en Vitest; no se atribuyen ingresos ni conversiones | Recorrido visual de creación/edición, UTM, permisos y aislamiento. Integración CRM externa fuera del alcance interno |
| Entrega 6: planes publicitarios sin activación | Planes Meta en borrador, objetivo, fechas, presupuesto planeado/moneda y revisión; sin ruta ni acción de lanzamiento | `AdPlanTest` y prueba de UI registrados en la suite aislada; no existe gasto ni llamada a proveedor | Recorrido visual de crear/editar/revisar/eliminar. Autorización real de Meta Ads se reserva para la fase final |

31-10-2026 (continuación desde `bff2fbc`): el servicio visual sigue
respondiendo dentro de la red aislada según la evidencia previa; no se repitió
el diagnóstico de conectividad. La imagen `mcr.microsoft.com/playwright:v1.55.0-noble`
no estaba disponible localmente. Su descarga quedó más de 36 minutos en
`Pulling from playwright`, sin completar ni reportar una causa; se canceló
únicamente el cliente de descarga. No se obtuvo navegador ni capturas, no se
cargaron fixtures y no se cambió la red `internal`. Por tanto, no se declara
completada la revisión visual ni se afirma que no haya defectos.

Cobertura Pest: `pest --list-tests --compact` en el entorno de pruebas aislado
generó un inventario persistente fuera del contenedor: `2.080` casos en `410`
archivos (`1.678 Feature`, `402 Unit`). Los informes históricos registran
`1.677 Feature + 402 Unit = 2.079` aprobados por lotes y una ejecución
interrumpida con `2.051` aprobados y `28` fallidos. Los manifiestos de esos
lotes y sus omitidos no se conservaron; la ejecución adicional de
`SalesModuleTest` se solapa y no se suma. Queda un caso Feature del inventario
actual sin correspondencia demostrable con los resultados históricos; no se
puede certificar que la cobertura anterior fuera sin huecos o doble conteo.
No se ejecutó Pest en esta continuación: mientras se intentaba la descarga del
navegador y el análisis PHPStan, una consulta Docker de solo lectura no
respondió en más de un minuto. No se reinició Docker/WSL ni se repitió la
consulta. El recuento de omitidos de los lotes anteriores tampoco quedó
registrado.

CI de GitHub Actions para `bff2fbce10b206d714255366269e98ef998b33e7`
(31-10-2026): linter, job de pruebas (incluido el paso `Tests`) y análisis
estático terminaron correctamente. La ejecución no publicó artefactos de
resultados Pest y el log disponible no permitió recuperar un recuento exacto
de aprobados/omitidos; por ello confirma el éxito del job, pero no cierra la
reconciliación numérica del inventario de `2.080` casos. La revisión de
seguridad pasó el escaneo de paquetes maliciosos, pero `composer audit`
terminó con código `1` por advisories medios para `phpunit/phpunit`
(`CVE-2026-119193`, versiones afectadas `<13.4.4`) y `symfony/mime`
(`CVE-2026-45070`, versión 8.1.7 afectada; corregida desde 8.1.10). También
reportó el paquete abandonado `symplify/rule-doc-generator-contracts`, sin
reemplazo sugerido. La corrección del lockfile requiere actualizar dependencias
y repetir controles aislados.

Tras la autorización expresa recibida para actualizar únicamente esas
dependencias, se intentó `composer update phpunit/phpunit symfony/mime
--with-all-dependencies --no-scripts --no-interaction`. El proceso no produjo
salida durante más de diez minutos y se detuvo de forma controlada. Una
inspección de solo lectura confirma que `composer.lock` conserva PHPUnit
13.4.3 y Symfony Mime 8.1.7; la corrección no quedó aplicada. No se volvió a
ejecutar Composer ni pruebas, y el estado de `vendor` tras la interrupción no
se pudo comprobar. El chequeo local `git status`/`git diff --check` tampoco
respondió; por ello no se creó commit ni se hizo push de esta actualización
documental.

PHPStan global nivel 7: se registra como aprobado el análisis directo previo
de `570/570` archivos con `[OK] No errors`; el `composer types:check` es un
resultado distinto y sigue inconcluso por el timeout predeterminado de
Composer a los `300 s` (`0/570`), sin que PHPStan informara errores. No se
aumentó ese timeout ni se rebajó memoria, reglas o alcance.

La verificación del candidato confirma que no hay cambios tracked en
`app/`, `bootstrap/`, `config/`, `database/`, `routes/`, `phpstan.neon`,
`composer.json` ni `composer.lock` respecto de `HEAD`. En un snapshot
temporal nuevo, una comparación SHA-256 `cmp` pasó para las `570` rutas PHP
del alcance (`app`, `bootstrap/app.php`, `config`, `database`, `routes`); los
hashes de `phpstan.neon`, `composer.json` y `composer.lock` también se
registraron. El autoloader Composer optimizado resuelve clases del proyecto a
la ruta de montaje `/var/www/html`, no a la copia temporal; el análisis
exitoso escaneó la copia temporal y esas rutas resueltas corresponden al mismo
candidato byte por byte. Una comprobación explícita de reflexión resolvió
`App\Models\User`, `Database\Factories\UserFactory` y
`Database\Seeders\DatabaseSeeder` a sus archivos de la copia temporal. La
configuración conserva las cinco rutas y nivel 7.

Comando reproducible para ese análisis directo, dentro del servicio de pruebas
aislado, tras copiar las cinco rutas de `phpstan.neon` a
`/tmp/rsmanager-phpstan` y enlazar su `vendor` de solo lectura a
`/var/www/html/vendor`:

```sh
cd /tmp/rsmanager-phpstan
APP_ENV=testing DB_CONNECTION=sqlite DB_DATABASE=:memory: \
    php /var/www/html/vendor/bin/phpstan analyse \
    --configuration=phpstan.neon --no-progress --memory-limit=1G
```

La ejecución suplementaria con autoload prioritario para la copia verificó
las rutas por reflexión, pero no produjo un resultado de análisis antes de
detenerse tras más de 29 minutos; no se interpreta como fallo PHPStan ni se
suma al análisis aprobado. No se inicia otra ejecución completa en esta ronda.

Preparación de activación local (no ejecutada): el Dockerfile copia el código
y genera los assets dentro de la imagen; `docker-compose.development.yaml`
monta solo `storage` y `database/sqlite`. Tras aprobar QA y preservar una copia
consistente de SQLite, el procedimiento será revisar el estado de migraciones,
construir únicamente `app`, ejecutar `php artisan migrate --force` con el
mismo proyecto Compose y volúmenes, y recrear solo `app` con la imagen nueva.
Las migraciones incrementales de esta entrega son
`2026_10_30_190000_create_sales_campaigns_and_leads_tables.php` y
`2026_10_30_190001_create_ad_plans_table.php`. No se ejecutó ninguna
migración ni build sobre la aplicación operativa. `bff2fbc` está publicado en
Git; los módulos no están validados visualmente ni desplegados localmente.
Entregas 3–6 siguen abiertas; las integraciones reales se mantienen para la
fase final.

30-10-2026: Se corrigió en la interfaz de CRM que miembros sin permiso de
gestión pudieran editar campañas existentes: los controles de actualización
ahora quedan deshabilitados y la prueba de permisos lo verifica. QA aislado:
Vitest focalizado en asistencia, analítica, CRM, anuncios e impresión pasó
`30 tests` en `6` archivos. TypeScript, Oxlint (`0` warnings, `0` errors) y
Oxfmt global pasaron. El build frontend aislado transformó `9315` módulos y
comprobó el manifest de JS/CSS en un `tmpfs`; no activó ni reemplazó assets de
la aplicación local. Pest focalizado registrado previamente pasó CRM/anuncios
(`9 tests, 72 assertions`) y analítica (`14 tests, 129 assertions`); un análisis
PHPStan nivel 7 previo pasó sobre `570` archivos, antes de esta ronda de
cambios. La suite Pest completa previa tuvo
`2051` aprobados y `28` fallidos (`7802` assertions); no se repitió porque no
hubo cambios PHP en esta validación. Vitest completo terminó con `932` tests
aprobados y `2` fallidos en tests ajenos a estos cambios: timeout al recorrer
fuentes en `inertia-cache-policy.test.ts` y expectativa de MIME sin
`charset=utf-8` en `build-feedback-payload.test.ts`. La inspección visual
aislada de las nuevas páginas queda pendiente; no se marcaron completas las
entregas 4–6 ni se desplegaron los assets nuevos.
Pint en los PHP modificados también pasó al ejecutarse sobre copias temporales
dentro del contenedor aislado.

31-10-2026: Se agruparon y corrigieron las causas comunes de los fallos
observados en la ejecución Pest interrumpida (28 fallos observados, sin
atribuirlos a código previo). La cobertura Feature se completó en lotes:
382, 197, 182, 179, 143, 292, 247 y 55 pruebas aprobadas; `SalesModuleTest`
se volvió a ejecutar completo tras añadir el resumen CRM (`6 tests, 49
assertions`). Unit se repitió completo después de corregir la expectativa
obsoleta: `402 tests, 1170 assertions`, todo aprobado. Vitest se completó por
áreas: `943 tests` en `140` archivos, todos aprobados; el test de GIF que
inicialmente falló bajo concurrencia y el grupo de componentes pasaron con un
solo worker, sin ampliar timeouts. Oxfmt pasó sobre 437 archivos, Oxlint sobre
439 archivos (`0 warnings, 0 errors`) y TypeScript pasó. Pint pasó sobre los
PHP modificados en copias temporales aisladas.

`composer types:check` permanece inconcluso: el intento ampliado terminó por
timeout a los 1.200 segundos tras analizar 417/570 archivos. El análisis
focalizado del controlador de ventas pasó; no se declara aprobado el control
global.

El guard de pruebas rechazó una conexión SQLite de archivo desechable antes de
la configuración de pruebas y no creó el archivo. El perfil visual migró la
base propia aislada, pero el navegador integrado no pudo alcanzar el puerto
publicado ni la IP interna del contenedor en la red `internal`; no se creó una
sesión sintética ni se insertaron datos. La inspección visual de Entregas 4–6
permanece pendiente y esas entregas no se declaran cerradas. No se conectaron
proveedores ni se ejecutaron campañas.

28-10-2026: Se cerró la causa del fallo de build sin retirar la directiva
`# syntax` ni desactivar BuildKit. El último build previo había fallado al
resolver `docker/dockerfile:1` (`DeadlineExceeded`) y luego con
`Unknown frontend grpc server closed unexpectedly`. Los builders `default` y
`desktop-linux` apuntaban al mismo Engine ID
`4271d2ca-8dae-4c43-b8dc-018b97c07eea` y worker BuildKit
`5840ed33-33c5-476b-818c-36bafe9cd15e`; `desktop-linux` era el contexto
activo y `DOCKER_CONTEXT`, `DOCKER_HOST` y `BUILDX_BUILDER` no estaban
definidas. La imagen del frontend ya estaba cacheada; se construyó una vez usando
`BUILDKIT_SYNTAX=docker/dockerfile:1@sha256:4edf897a3ffa55b89f906fc8cc78afdb3f1834cc9c7083565e611a8a7d5fe99e`
con el comando exacto `docker compose -f docker-compose.development.yaml build
--build-arg BUILDKIT_SYNTAX=docker/dockerfile:1@sha256:4edf897a3ffa55b89f906fc8cc78afdb3f1834cc9c7083565e611a8a7d5fe99e app`
(código 0). La imagen resultante tiene el digest registrado en Entrega 3.
Los registros retenidos no conservan la línea de comando ni el código de
salida de cada intento fallido; sí conservan los errores causales anteriores y
el comando exacto y el código 0 del reintento correctivo.

La primera recreación produjo timeouts de `frankenphp build-info` a los 60 s,
junto con procesos solapados de scheduler, `posts:dispatch-due` y healthcheck;
se observó hasta 9892 % de CPU. El contenedor usaba alrededor de 595 MiB de
3.8 GiB y no hubo evidencia de OOM; el host sí informó 0.44 GiB de memoria
física libre. Se recreó solo `app`, sin build y sin tocar los volúmenes, con
`QUEUE_WORKER_ENABLED=false` y `SCHEDULER_ENABLED=false` como overrides
temporales de proceso para impedir envíos durante la inspección. Tras completar
el arranque de debug, Octane inició, la app quedó `healthy`, el uso de CPU
descendió y `/analytics` respondió con redirección HTTP 302 a `/login`. Los
overrides no modificaron `.env` ni `docker-compose.development.yaml`.

La aplicación y la imagen se verificaron localmente, pero la revisión visual
autenticada sigue pendiente: el navegador integrado mostró el login y no se
dispone de una sesión iniciada para verificar analítica, impresión, CSV,
compositor y conexiones. No se iniciaron OAuth, publicaciones, ni se
insertaron datos. Entrega 2 sigue abierta por validación real externa; Entrega
3 no se declara completada hasta terminar la inspección visual.

28-10-2026 (continuación): En la inspección autenticada se detectó que el
chrome de la aplicación aparecía en la impresión. Se preparó una corrección
local, sin ejecutar aún sus controles de formato/lint/tipos. Después de un
reinicio normal de Docker Desktop, el servicio anterior quedó saludable, pero
el único build nuevo se bloqueó al exportar las capas de la imagen. Se detuvo
su CLI tras unos 24 minutos sin avance visible; Docker dejó de responder y la
petición HTTP local agotó el tiempo de espera. El usuario confirmó otros
servicios Docker activos, por lo que no se reinició de nuevo el motor. No se
recreó el contenedor ni se tocaron datos/volúmenes. `inicio-adaptacion.patch`
permanece ajeno y sin seguimiento.

28-10-2026 19:53: Una comprobación limitada de `docker version` y una consulta
de `docker inspect` respondieron con código 0. `shoutrrr-app-1` está
`running/healthy`, todavía en la imagen anterior
`sha256:3aadbfd3d4b59d6f3ccdcc4e5588ff06764ab7155fdc69833df231d22b1dc466`;
`/analytics` responde HTTP 302 a `/login`. Los overrides efectivos continúan
con `QUEUE_WORKER_ENABLED=false` y `SCHEDULER_ENABLED=false`, y los montajes
`shoutrrr_storage` y `shoutrrr_sqlite` siguen presentes. No se ejecutó otro
build ni se recreó el servicio.

Revisión del flujo local: existe `docker-compose.dev.yml`, pero no se ejecuta
directamente porque su comando de `app` instala Composer, migra, crea el enlace
de storage y ejecuta `DefaultUserSeeder`; además, monta todo el proyecto sin
proteger `vendor` ni `node_modules`. El Compose seleccionado para el servicio
actual (`docker-compose.development.yaml`) no montaba el código ni definía
Vite, por lo que un cambio frontend requería reconstruir la imagen. Se preparó
el override explícito `docker-compose.local-vite.yaml` sobre esa base: conserva
imagen, proyecto, puerto 8080 y volúmenes persistentes; monta el checkout,
protege `vendor` y `node_modules` con volúmenes separados y comparte
`public/hot` a través del bind mount del código. No contiene migraciones ni
seeders y desactiva cola, scheduler y SSR. La primera versión de este override
dejó el entrypoint de depuración activo y además instalaba dependencias en cada
arranque de Vite; se corrigió para desactivar APP_DEBUG y AUTORUN, conservar el
entrypoint de Serversideup, ejecutar solo `storage:link` idempotente antes de
supervisord, y mover Composer/Bun a un servicio de preparación explícito y
secuencial.

El Dockerfile instala Composer con dependencias de desarrollo para generar
Wayfinder y luego vuelve a instalar sin dependencias dev para `vendor/` final.
Copia `node_modules` para el runtime Bun del SSR opcional, desactivado por
defecto. El entrypoint del servidor ejecuta `composer install --dev` y
`optimize:clear` cuando `APP_DEBUG=true`; `10-init-app.sh` solo crea directorios
de storage y el archivo SQLite si falta. Estos efectos se mantienen bajo el
override, sin migrar, sembrar ni reemplazar una base existente.

El procedimiento reproducible preparado, una vez que Docker vuelva a responder
de forma estable, es:

1. Preparar `vendor` y `node_modules` una sola vez (o al cambiar sus lockfiles),
   en secuencia dentro del único servicio de dependencias:
   `docker compose -p shoutrrr -f docker-compose.development.yaml -f docker-compose.local-vite.yaml --profile local-dependencies run --rm dependencies`.
   Respeta `composer.lock` y `bun.lock`; ejecuta Composer, descubrimiento de
   paquetes, generación Wayfinder y Bun de forma secuencial, y verifica
   `vendor/autoload.php`, `node_modules/.bin/vite` y la versión de Vite. Los
   volúmenes no usan `nocopy`: al montarlos por primera vez Docker copia el
   contenido de `vendor/` y `node_modules/` de la imagen si están vacíos; luego
   los comandos sincronizan las dependencias bloqueadas. Generar Wayfinder y
   los paquetes es necesario porque el bind mount oculta los directorios
   generados/ignorados que sí existen en la imagen. No ejecutar este servicio en
   paralelo con `app` o `vite`.
2. Iniciar solo la app, sin build, y esperar health:
   `docker compose -p shoutrrr -f docker-compose.development.yaml -f docker-compose.local-vite.yaml up -d --no-build app`.
   Conserva APP_KEY, configuración y datos; `APP_DEBUG=false` omite el script
   que instala Composer y ejecuta `optimize:clear`; `AUTORUN_ENABLED=false`
   evita tareas automáticas de caché/enlace. El entrypoint sigue ejecutando
   `10-init-app.sh` (directorios de storage y SQLite solo si falta) y
   `99-debug-mode.sh` se salta por APP_DEBUG. El comando realiza únicamente el
   enlace de storage necesario antes de iniciar supervisord.
3. Iniciar Vite después de comprobar el health de la app:
   `docker compose -p shoutrrr -f docker-compose.development.yaml -f docker-compose.local-vite.yaml up -d --no-build vite`.
   Vite escucha en `0.0.0.0:5173` y anuncia `localhost:5173` al navegador. No
   instala dependencias al reiniciarse. Su trap elimina `public/hot` al parar;
   si termina con SIGKILL o abruptamente, ejecutar primero
   `docker compose -p shoutrrr -f docker-compose.development.yaml -f docker-compose.local-vite.yaml exec app rm -f public/hot`
   antes de servir la imagen compilada.
4. Para retornar al modo de imagen, detener Vite, limpiar `public/hot` si no
   puede detenerse normalmente y recrear solo `app` con el Compose base
   (`QUEUE_WORKER_ENABLED=false`, `SCHEDULER_ENABLED=false` y
   `INERTIA_SSR_ENABLED=false` conservados en el entorno del comando):
   `docker compose -p shoutrrr -f docker-compose.development.yaml -f docker-compose.local-vite.yaml stop vite`
   y
   `$env:QUEUE_WORKER_ENABLED='false'; $env:SCHEDULER_ENABLED='false'; $env:INERTIA_SSR_ENABLED='false'; docker compose -p shoutrrr -f docker-compose.development.yaml up -d --no-build --force-recreate app`.
   No iniciar workers/scheduler hasta autorización. No se modifican `.env`,
   APP_KEY, usuarios, contraseñas ni datos.

Cobertura de la corrección: se añadió una prueba Vitest focalizada para la
ruta `/analytics/print` con filtros, el dashboard normal y el cableado de las
clases print-only al layout. Las pruebas existentes de `app-sidebar` y
`app-sidebar-header` cubren navegación y actualización del chrome. La nueva
prueba no se ejecutó por falta de un runner disponible; los controles previos
aprobados pertenecen al candidato anterior y no validan este cambio.

La primera configuración combinada pasó `docker compose config --format json`
(código 0), sin imprimir secretos. APP_KEY y configuración de DB/URL coincidían
en memoria con el contenedor anterior. El puerto 5173 estaba libre. El primer
`up -d --no-build app` se bloqueó al recrear el servicio y Docker creó los
volúmenes nuevos `shoutrrr_dev_vendor` y `shoutrrr_dev_node_modules`. Una
comprobación posterior `docker ps -a` mostró solo el antiguo `shoutrrr-app-1`
(healthy, imagen
`sha256:3aadbfd3d4b59d6f3ccdcc4e5588ff06764ab7155fdc69833df231d22b1dc466`,
creado antes del intento) y un contenedor de pruebas ya detenido; no existían
contenedor Vite ni reemplazo de app. `docker inspect` confirmó que sigue usando
el entrypoint estándar y solo el Compose base. La recreación no se completó.
Los volúmenes de dependencias existen, pero ningún contenedor exitoso los montó
todavía; su contenido no se inspeccionó y no se presume completo. `docker top`
y `docker logs --tail 60` agotaron cada uno 10 s, así que no se pudo confirmar
actividad Composer/Bun ni leer logs de arranque.

Después de corregir el override para separar dependencias y no repetir
Composer/Bun en cada arranque, una sola validación acotada de
`docker compose ... --profile local-dependencies config --format json` se
bloqueó a los 15 s. No se ha comprobado la configuración efectiva corregida ni
se lanzó otro `up`, el servicio `dependencies` o Vite. Dado que Docker responde
a `ps`/`inspect` pero cuelga en `top`, logs, Compose y config, el motor no se
considera estable para una recreación segura. No se reinicia Docker Desktop
porque hay otros servicios activos; no se borraron imágenes, cachés ni
volúmenes. La pantalla autenticada anterior de Accounts no acredita el
candidato local ni HMR.

La corrección incluye un helper de detección de `/analytics/print` y pruebas
para el dashboard normal, la ruta de reporte con filtros y la conexión de esa
condición con las clases print-only del layout. No se pudieron ejecutar
formato, lint, TypeScript ni Vitest: el host carece de Bun/Node y el motor
Docker dejó de responder durante la recreación. VS Code no registró un
controlador de tests, así que su intento focalizado no ejecutó pruebas. No se
pudo validar el override corregido con Compose; dependencies/Vite no se
iniciaron, los volúmenes de dependencias siguen sin inspeccionar y no se
confirmó copia inicial de contenidos de imagen. Impresión, CSV descargado y
pantallas de conexiones/compositor siguen sin validación con el candidato
final. La Entrega 3 permanece abierta; tampoco se afirma que el cambio esté
incluido en una imagen reconstruida.

26-10-2026: Entregas 0 y 1 integradas localmente sobre `main` (base
`28bbc7f`). Pest focalizado pasó (20 tests, 294 assertions, SQLite en memoria).
En ese momento el cierre estaba bloqueado porque Docker Engine dejó de
responder y los reinicios CLI agotaron el tiempo de espera.

27-10-2026: Docker Engine recuperado y servicio local saludable; analítica HTTP
200 inspeccionada visualmente en el navegador integrado. Oxfmt, Vitest (9),
Oxlint, TypeScript, Pint y Larastan nivel 7 pasaron en contenedores efímeros.
Pest no se repitió porque el código PHP y sus pruebas no cambiaron desde la
ejecución aprobada (20 tests, 294 assertions). La imagen ya contenía el código
actual, así que no se reconstruyó. La pantalla usa datos de demostración ya
existentes; no se insertaron datos persistentes. Se conserva la limitación de
no poder establecer la causa exacta del contenedor histórico con exit code 137.
El commit de la entrega `14325d73f9b5ca9a11c041d5c13858700b46e4b3` se publicó
mediante push normal a `origin/main`; SHA local y remoto coincidieron en la
verificación posterior. Entregas 2–6 siguen pendientes.

27-10-2026: Entrega 2 continúa abierta. Inventario de Facebook Pages,
Instagram Business/Creator y LinkedIn personal/organización registrado en
[MATRIZ_CONEXIONES.md](./MATRIZ_CONEXIONES.md). En pruebas aisladas con SQLite
en memoria pasaron `ConnectMetaTest` (13 tests, 93 assertions), el grupo de
conexión Meta/LinkedIn (31 tests, 174 assertions) y las pruebas focalizadas de
publicación y métricas de los tres proveedores (70 tests, 196 assertions);
Pint y Larastan nivel 7 también pasaron. Estos resultados verifican flujos con
respuestas simuladas, no acceso a proveedores reales. No se modificó ni
reconstruyó el servicio local. El contenedor temporal de pruebas y sus
volúmenes anónimos ya se retiraron; el punto de montaje vacío `vendor` también
se eliminó. Pendiente: credenciales, permisos y autorización OAuth reales,
lecturas de métricas con cuentas autorizadas y validación del caso de
publicación antes de cualquier envío.

28-10-2026: Se revalidó el Compose combinado, incluido el perfil
`local-dependencies`, con un proceso PowerShell que inicia `ReadToEndAsync()`
para ambas salidas inmediatamente después de `Start()` y aplica un límite de
20 s. La invocación correcta de
`docker compose -p shoutrrr -f docker-compose.development.yaml -f docker-compose.local-vite.yaml --profile local-dependencies config --format json`
terminó con código 0; una primera lectura no válida correspondió al wrapper
de diagnóstico, no a Compose. No se imprimieron variables sensibles.

`docker info` excedió su límite de 12 s, pero `docker ps` respondió con código
0 y permitió confirmar que el motor no estaba totalmente inaccesible en ese
momento. `inspect`, `logs --tail 30` y `top` también respondieron: la app
original `shoutrrr-app-1` seguía `running/healthy`, publicada en 8080, usando
solo los volúmenes persistentes `shoutrrr_storage` y `shoutrrr_sqlite`.
`top` mostró supervisor, PHP y FrankenPHP. Los últimos 30 renglones de logs no
contenían coincidencias de `error`, `exception`, `fatal` o `failed`; el
contenedor candidato recién creado no tenía logs ni `StartedAt`. Ese candidato
`426474c1ddc5_shoutrrr-app-1` estaba en estado `created`, con el bind mount del
checkout y los volúmenes `shoutrrr_dev_vendor`/`shoutrrr_dev_node_modules`,
pero conservaba `APP_DEBUG=true` y `AUTORUN_ENABLED=true`; no se inició. La
configuración Compose actual define ambos como `false`. El contenedor de
analítica previo seguía detenido.

Se ejecutó una sola vez el servicio de dependencias mediante
`docker compose -p shoutrrr -f docker-compose.development.yaml -f docker-compose.local-vite.yaml --profile local-dependencies run --rm dependencies`.
Terminó con código 1. Composer estaba extrayendo archivos (88 % del lote de
53) cuando el proceso `/usr/bin/unzip -qq ...` excedió el límite de Composer
de 300 s (`Process.php`, línea 1205). No llegó a ejecutar descubrimiento de
paquetes, generación Wayfinder ni Bun. El volumen `shoutrrr_dev_vendor` puede
haber quedado parcialmente preparado; no se repitió la instalación ni se
inició app/Vite. No se demostró si el contenedor `--rm` y el estado exacto de
los volúmenes quedaron limpios: después del fallo, nuevas consultas acotadas
de `ps`, `stats` e inspección de volúmenes excedieron 10-12 s. Estas demoras
son timeouts de diagnóstico y no prueban por sí solas una caída total del
motor.

La app actual respondió `302` en `/accounts`; Vite no respondió en el puerto
5173. La consulta de recursos del host también se detuvo antes de producir
resultados. Por tanto no hay evidencia para atribuir el límite de extracción a
falta de memoria o espacio. No se recrearon servicios, se cambió la imagen, se
tocaron datos o volúmenes, ni se reinició Docker. Workers y scheduler siguen
configurados como desactivados en el Compose; la inspección actual confirma
SSR desactivado. HMR, assets actuales, impresión, descarga CSV y la inspección
visual de Entrega 3 siguen pendientes; la Entrega 2 continúa abierta por la
validación con proveedores reales.

29-10-2026: Se recuperó la salida que seguía disponible del único intento de
Composer, sin repetir la instalación. El comando ejecutado por el servicio
`dependencies` fue `composer install --dev --no-interaction --no-scripts`.
Terminó con código 1 por el timeout interno de Composer: `/usr/bin/unzip -qq
/var/www/html/vendor/composer/tmp-6c8d9006848eaf25b913ee00cb78a1e.zip -d
/var/www/html/vendor/composer/50a70b70` superó los 300 s (`Process.php`, línea
1205), mientras Composer mostraba 47/53 extracciones (88 %). El resultado
registró como fallidas las instalaciones de `phpunit/phpunit`,
`phpstan/phpstan`, `rector/rector`, `fakerphp/faker`,
`pestphp/pest-plugin-mutate` y `pestphp/pest`; la salida conservada no permite
asociar con certeza el archivo ZIP temporal y el directorio hash a un paquete
concreto. No se repitió la instalación para recuperar ese dato.

El timeout anterior fue del proceso de extracción de Composer, no del límite
de espera PowerShell: el comando exterior esperó hasta 900 s y recibió código
1. Los timeouts posteriores de `ps`, `top` y del contenedor auxiliar sí fueron
límites del diagnóstico PowerShell y no se interpretan como el mismo error.
Las consultas cortas previas confirmaron el candidato Compose en estado
`created`, con `/var/www/html/vendor` montado desde `shoutrrr_dev_vendor`, no
desde el bind mount de Windows; la app anterior siguió saludable con los
volúmenes persistentes. No se inició ese candidato con `APP_DEBUG` y
`AUTORUN_ENABLED` habilitados.

Una consulta read-only dentro de la app saludable mostró `984229020` bloques
de 1 KiB disponibles en sus montajes overlay (aprox. 938 GiB); esto no mide el
volumen dedicado `shoutrrr_dev_vendor`. El Composer que alcanzó 88 % demuestra
avance de extracción hacia su ruta en `/var/www/html/vendor`, pero no hay una
medición persistida de espacio libre ni una prueba concluyente de escritura
directa sobre el volumen tras el fallo. Se intentó una sonda no destructiva
separada sobre ese volumen; el CLI excedió 30 s, el contenedor auxiliar luego
apareció como ausente y Docker respondió que ya estaba marcado para eliminarse.
No se eliminó ni recreó ningún volumen.

Después de la sonda, una consulta nominal confirmó que el contenedor auxiliar
ya no existía, pero las nuevas consultas de contenedores del proyecto y
procesos agotaron sus límites. Por ello no se certifica que no haya una tarea
de preparación aún activa, aunque el servicio Composer ya había terminado con
código 1 y no se observa ningún contenedor auxiliar persistente. No se inició
otro Composer/Bun ni se arrancó el candidato. El servicio actual sigue sin
Vite: la verificación previa dio HTTP 302 en `/accounts` y no hubo respuesta
en 5173. Sin una consulta fiable del estado Docker ni de la capacidad del
volumen, no se autoriza el único reintento con `COMPOSER_PROCESS_TIMEOUT`
ampliado. Permanecen pendientes assets actuales, HMR, impresión, filtros,
CSV y revisión visual; Entrega 3 sigue abierta.

29-10-2026: Se sustituyó para esta ronda el diagnóstico por un único helper
PowerShell `Invoke-DockerBounded`, cuyo parámetro es `$DockerArguments` (no la
variable automática `$args`), que inicia `ReadToEndAsync()` para stdout y
stderr inmediatamente después de `Start()` y devuelve un objeto estructurado
con `ExitCode`, `Stdout`, `Stderr`, `TimedOut` y el límite aplicado. La
autoprueba local `docker --version` terminó con código 0 (`Docker version
29.9.2`), sin consultar el motor.

En una sola ronda, `docker ps -a --filter
label=com.docker.compose.project=shoutrrr` respondió con código 0:
`shoutrrr-app-1` estaba saludable; el contenedor candidato
`426474c1ddc5_shoutrrr-app-1` estaba `Created` con `APP_DEBUG=true` y
`AUTORUN_ENABLED=true`; no había servicio `dependencies` activo. El candidato
no se arrancó. Su montaje efectivo ya identificaba el volumen
`shoutrrr_dev_vendor` en `/var/www/html/vendor`, separado del bind mount del
checkout, junto con los mismos volúmenes persistentes de storage y SQLite.

La única sonda prevista sobre ese volumen se ejecutó como
`docker run --name rsmanager-vendor-probe-10993b --rm --pull=never --user www-data --entrypoint /bin/bash --mount type=volume,source=shoutrrr_dev_vendor,target=/var/www/html/vendor shoutrrr:dev -lc "set -eu; echo VENDOR_FILESYSTEM; df -Pk /var/www/html/vendor; echo VENDOR_INODES; df -Pi /var/www/html/vendor; test -d /var/www/html/vendor; test -w /var/www/html/vendor; probe=/var/www/html/vendor/.rsmanager-write-check-10993b; test ! -e \"$probe\"; : > \"$probe\"; test -f \"$probe\"; rm -f \"$probe\"; test ! -e \"$probe\"; echo WRITE_CHECK=PASS; test -f /var/www/html/vendor/autoload.php && echo AUTOLOAD_PRESENT=yes || echo AUTOLOAD_PRESENT=no; test -f /var/www/html/vendor/composer/installed.json && echo INSTALLED_METADATA_PRESENT=yes || echo INSTALLED_METADATA_PRESENT=no; printf VENDOR_TOPLEVEL_DIRS=; find /var/www/html/vendor -mindepth 1 -maxdepth 1 -type d | wc -l"`.
El comando venció el límite de diagnóstico de 20 s; no produjo código de salida
del contenedor ni salida útil. Se hizo la comprobación nominal requerida:
`docker ps -a --filter name=rsmanager-vendor-probe-10993b` respondió y mostró
el auxiliar como `Created`. No se inició ni eliminó manualmente el auxiliar,
no se repitió `ps`, no se ejecutó otro `exec`/sonda y no se volvió a invocar
Compose. La disponibilidad de Docker es parcial, no hay resultado sobre el
espacio/inodos ni la escritura del volumen, y el estado del auxiliar no permite
certificar que la sonda completara o limpiara su archivo temporal.

En consecuencia, no se reintentó Composer, no se inició app/Vite y no se
continuó con Wayfinder/Bun ni con validaciones visuales. Se conserva el
contenedor candidato sin iniciar y todos los volúmenes. Sin evidencia de
finalización de la sonda, no se afirma que `vendor` esté completo o utilizable.
Entrega 3 permanece abierta por assets/HMR, impresión, filtros y CSV; Entrega
2 permanece abierta por validación de proveedores reales.

29-10-2026, aclaración posterior de la sonda existente: se consultó una sola
vez `docker inspect rsmanager-vendor-probe-10993b`; Docker respondió `no such
object`. No había proceso `docker.exe` cuyo comando solicitara ese nombre.
Los eventos locales de Docker para 11:00–11:14 (hora local) y las siete
entradas locales de `AppData\Local\Docker\log\host\monitor.log.20261029-111240.024`
acotan la secuencia: create/attach a las 11:06:38, start a las 11:07:00,
`exec_die` con 137 a las 11:07:04, die del contenedor con código 0 a las
11:07:12 y destroy a las 11:07:17. El log de host muestra creación completada
y asignación de puertos, sin error de montaje o almacenamiento para ese
nombre. El estado terminal del contenedor fue éxito; no corresponde describir
el caso como un proceso que nunca inició ni como una falla de vendor.

La sonda alcanzó a ejecutar el comando completo y terminó con código 0, por lo
que sus verificaciones de directorio/montaje y escritura temporal seguida de
eliminación terminaron correctamente. El cliente PowerShell, limitado a 20 s,
no conservó stdout: se desconoce el valor numérico de espacio libre y la salida
de presencia de autoload/metadata. Los eventos muestran que el start del
contenedor llegó después de la consulta nominal que aún lo encontraba
`Created`; esto es evidencia de ejecución Docker retrasada respecto del
timeout del cliente y posterior finalización, no de una solicitud que siga
pendiente ahora. No se repitió Docker run, Composer, build ni sonda. El único
siguiente paso previsto será reanudar las dependencias con una espera de CLI
mayor cuando se autorice continuar; no hace falta reiniciar Docker Desktop por
esta evidencia. La app saludable, los datos y todos los volúmenes se
mantuvieron intactos; no se validó aún Vite ni Entrega 3.

29-10-2026: Se reanudó una sola vez la preparación sobre los volúmenes
dedicados existentes, sin `--rm`, con el contenedor
`rsmanager-dependencies-recovery-20261029-1118` y
`COMPOSER_PROCESS_TIMEOUT=900` solo en esa invocación. No había CLI ni
contenedor `dependencies` activo antes del comienzo. La ejecución terminó con
código 0; el contenedor retenido informa `StartedAt=16:19:46Z`,
`FinishedAt=16:38:43Z`, estado `exited`, sin error. El tiempo total del cliente
fue 1172 s; el arranque Docker hasta `StartedAt` tomó aproximadamente 35 s y
el contenedor se ejecutó 1137 s. Los archivos stdout, stderr y código están
guardados localmente en el directorio de sesión
`files/dependency-recovery-20261029-1118` (no se publican en GitHub).

Composer finalizó exitosamente sobre `composer.lock` y
`shoutrrr_dev_vendor`, con el timeout interno elevado solo para esta
ejecución. La salida conservada muestra extracción completa de los seis
paquetes pendientes, autoload optimizado, descubrimiento de paquetes y
Wayfinder generados; Bun terminó con `bun install --frozen-lockfile` sin
cambios en 603 instalaciones/702 paquetes. La comprobación de Vite devolvió
`vite/8.3.4 linux-x64 bun-v26.3.0` y el comando concluyó con
“Local Composer and Bun dependencies are ready.” El proceso de dependencia
montó `shoutrrr_dev_vendor` y `shoutrrr_dev_node_modules` como volúmenes de
escritura separados del bind mount del checkout. No se repitió instalación.

Después se intentó una sola vez
`docker compose -p shoutrrr -f docker-compose.development.yaml -f docker-compose.local-vite.yaml up -d --no-build app`.
Terminó con código 1. Compose reportó que al recrear
`426474c1ddc5_shoutrrr-app-1` el nombre `/shoutrrr-app-1` seguía ocupado por el
contenedor existente `426474c1ddc553fb98bb12daf0a2e0f686ed37e5ddb319859bb731cd58ce6e02`.
La consulta `docker ps` posterior respondió con código 0 y mostró la app
existente `Up ... (unhealthy)`, el candidato nuevo
`f69362d7ab62_shoutrrr-app-1` en `Created` y el contenedor de dependencias
terminado en 0. `/accounts` devolvió curl 52 (respuesta vacía). Una
inspección puntual de `shoutrrr-app-1` excedió 12 s; por eso no se conoce su
detalle de healthcheck ni la configuración del candidato. No se inició Vite,
no se repitió `up`, y no se tocaron los volúmenes de datos ni el contenedor
retenido de dependencias.

El bloqueo actual es el conflicto de nombre durante la recreación de la app;
la disponibilidad de health e inspección también se degradó tras el intento.
Se requiere una ventana de recuperación limitada a este proyecto para
identificar el propietario/configuración de ambos contenedores de app y
resolver la colisión antes de otro `up`. Hasta entonces no se afirma que la
app local con Vite esté desplegada: health, login con la instalación nueva,
assets, HMR, impresión, filtros y CSV siguen pendientes. Worker, scheduler y
SSR continúan desactivados en el override; no hubo migraciones ni seeders.

29-10-2026, actualización tras conciliar los contenedores: el conflicto exacto
guardado en `app-up.stderr.log` fue que Compose no pudo asignar
`/shoutrrr-app-1` porque lo ocupaba el contenedor
`426474c1ddc553fb98bb12daf0a2e0f686ed37e5ddb319859bb731cd58ce6e02`.
La inspección por ID determinó que ese era la app anterior: servicio Compose
`app`, solo Compose base, estado `exited` (137), montajes persistentes
`shoutrrr_storage` y `shoutrrr_sqlite`, flags `APP_DEBUG=true` y
`AUTORUN_ENABLED=true`; su capa escribible medía 157712384 bytes. Se conservó,
no se renombró ni eliminó.

El candidato de configuración local era distinto: ID `d63f856b44a7`, nombre
`f69362d7ab62_shoutrrr-app-1`, etiqueta de servicio `app`, ambos Compose
(development + local-vite), estado inicial `created`, capa escribible de 4096
bytes, bind mount del checkout, volúmenes dedicados `shoutrrr_dev_vendor` y
`shoutrrr_dev_node_modules`, y los volúmenes persistentes de storage/SQLite.
Sus flags eran correctos: APP_DEBUG, AUTORUN, worker, scheduler y SSR en
`false`. No había una recreación/CLI Compose activa. Para evitar el nombre
ocupado no se repitió `compose up`: se inició por ID el candidato ya creado,
con código 0, preservando la app anterior.

El candidato arrancó y completó `php artisan storage:link`; luego lanzó
supervisord, pero permaneció `unhealthy`. El healthcheck real
`healthcheck-octane` terminó repetidamente con exit -1 y
`Health check exceeded timeout (10s)`. `/accounts` devolvió curl 52, sin
respuesta HTTP. `docker logs --tail 100` mostró la inicialización de
ServersideUp y el éxito del enlace de storage, sin error Laravel/Octane ni
registro visible de procesos supervisados. El archivo supervisor dentro de la
imagen coincidía por SHA-256 con `docker/supervisord.conf`. Un snapshot de
procesos observó supervisord en PID 1 y varias comprobaciones
`php artisan octane:status`, pero no un proceso Octane/FrankenPHP servidor.
`supervisorctl status` no pudo consultar estado porque el archivo no tiene
sección `supervisorctl`; esto no identifica la causa raíz. Los logs Laravel
recientes solo registraron errores anteriores al arranque; no se imprimieron
sus mensajes.

Para evitar que siguieran acumulándose healthchecks y procesos `octane:status`,
se detuvo de forma normal únicamente el candidato (ID `d63f856b44a7`) con
`docker stop --timeout 10`; código 0. La consulta final confirmó que tanto ese
candidato como la app anterior y el contenedor de dependencias permanecen
detenidos, sin eliminar contenedores ni volúmenes. La causa del arranque
incompleto sigue sin demostrarse; no se modificó código ni configuración.
Actualmente no hay una versión de la app sirviendo en 8080 y Vite no se inició.
No se validaron login, assets/HMR, impresión, filtros ni CSV. Worker,
scheduler y SSR estaban apagados en el candidato. Entregas 2 y 3 permanecen
abiertas.

29-10-2026, recuperación del arranque local desde `966eb8a`:

- La configuración efectiva apuntaba a `/etc/supervisor/laravel.conf`, igual
  al archivo del repositorio verificado anteriormente. `[program:octane]`
  ejecuta `php /var/www/html/artisan octane:start --server=frankenphp
  --host=0.0.0.0 --port=8080`, con `autostart=true`; Supervisor hereda
  `www-data` y `/var/www/html` del contenedor. No hay sección `[include]`;
  stdout/stderr del programa van a `/dev/fd/1` y `/dev/fd/2`. Worker,
  scheduler y SSR estaban configurados para quedar inactivos por sus variables.
- `AUTORUN_ENABLED=false` evitó las instalaciones y tareas automáticas. El
  script `99-debug-mode.sh` tampoco ejecutó Composer ni `optimize:clear`
  porque `APP_DEBUG=false`. No se omitieron migraciones ni seeders necesarios:
  no se ejecutó ninguno. El comando local repetía `php artisan storage:link`;
  el registro mostraba el enlace creado, pero la última captura encontró el
  shell aún en ese prepaso y no encontró Supervisor en el árbol de procesos.
  El enlace `public/storage` ya existía. Se quitó esa repetición y se dejó que
  el entrypoint de la imagen ejecute Supervisor directamente.
- La prueba en primer plano del comando exacto de Octane inició FrankenPHP y
  `/up` devolvió HTTP 200. Después del cambio, `rsmanager-app-local-vite`,
  imagen `shoutrrr:dev` sin rebuild, quedó `healthy`: PID 1 es Supervisor,
  Octane y FrankenPHP están activos y `/up` devuelve HTTP 200. Se conservaron
  `shoutrrr_storage` y `shoutrrr_sqlite`. El contenedor anterior, detenido,
  fue renombrado como `rsmanager-previous-app-426474c1` para preservar su capa
  escribible; no se eliminó ni se iniciaron sus flags antiguos.
- Vite se inició una sola vez tras confirmar libre el puerto 5173. Su
  configuración fue `0.0.0.0:5173`, HMR `localhost`, y creó `public/hot`;
  sin embargo, `node /var/www/html/node_modules/.bin/vite` quedó en estado
  `Dl`, espera `folio_wait_bit_common`. La petición host a
  `/@vite/client` venció tras 8 segundos sin bytes. Se detuvo solo
  `shoutrrr-vite-1` (salida 137 tras el timeout de parada) y se comprobó que
  ya estaba detenido antes de retirar el `public/hot` regular obsoleto. No se
  repitió el arranque. No hay error de aplicación emitido ni evidencia para
  atribuir la espera a memoria, disco o antivirus.
- La respuesta HTTP del servicio está recuperada, pero sin Vite ni un
  manifiesto `public/build/manifest.json` la página Inertia no se validó: la
  prueba previa de `/posts/...` devolvió 500 por manifiesto ausente. Login
  autenticado, assets/HMR, impresión, filtros, CSV y revisión visual quedan
  pendientes. No se reconstruyó imagen, no se reinstalaron dependencias y no
  se alteraron APP_KEY, usuarios ni datos. Entregas 2 y 3 siguen abiertas.

29-10-2026, recuperación de navegación desde `1c10aba`:

- Se reprodujo una sola carga autenticada de `/posts/01a17947-e2ce-7127-ab9c-5c17b6ad4c90`;
  el último error Laravel fue `Illuminate\Foundation\ViteManifestNotFoundException`
  para `/var/www/html/public/build/manifest.json`. `public/build` y el manifest
  faltaban tanto en el checkout como en el contenedor. Esto confirma que el
  bind mount del checkout ocultaba los assets disponibles solo en la imagen.
- Se ejecutó una vez `bun run build` en el contenedor de app con los volúmenes
  existentes, sin instalación ni rebuild. Terminó con código 0 usando Vite
  8.3.4. El manifest se creó a las 17:47 y las entradas de app, CSS y
  dashboard apuntan a archivos existentes. El checkout montado contiene 148
  archivos en `public/build`; los bundles actuales incluyen
  `app-Bv_wTgCe.js`, `app-DwCDEfAc.css` y `dashboard-BgpxHoaG.js`.
- `/dashboard` respondió en el navegador ya autenticado; la vista renderizó
  navegación y contenido normal. `/login` respondió HTTP 200 a una petición
  sin sesión. La página autenticada de post volvió a renderizarse y cargó los
  bundles actuales. Las respuestas HTTP de los tres assets JS/CSS probados
  fueron 200. No aparecieron errores de consola en la lectura reciente del
  navegador. La respuesta curl no autenticada a `/dashboard` fue 302, como
  corresponde a la ruta protegida; no se usó como validación visual.
- Vite se probó después por separado. Su log llegó a indicar `ready` tras
  95723 ms, pero las peticiones a `localhost:5173/@vite/client` dieron primero
  respuesta vacía y después las consultas a procesos/logs y el CLI de parada
  de `shoutrrr-vite-1` quedaron sin respuesta. Se cancelaron esos clientes
  bloqueados; esto no acredita que el motor haya detenido el servicio. En la
  última lectura disponible `public/hot` estaba ausente, pero no se pudo
  confirmar el estado final del contenedor ni HMR. No se atribuye la demora a
  una causa raíz. No tocar `public/hot` ni afirmar que Vite está detenido
  hasta consultar el estado de ese servicio.
- La navegación autenticada está recuperada con assets construidos desde el
  checkout de `1c10aba`; no son bundles de la imagen anterior. El build generó
  archivos ignorados, no cambios rastreados. No se reconstruyó la imagen ni
  cambiaron APP_KEY, usuarios, datos o volúmenes. Impresión, filtros y CSV
  siguen sin validarse; Entrega 3 permanece abierta.

29-10-2026 21:45 -05:00, continuación desde `6c65ca3`:

- Se conservó el build compilado: `public/build/manifest.json` está presente.
  No se reinstalaron dependencias, reconstruyeron imágenes ni volvió a
  iniciarse Vite en esta ronda.
- El chequeo HTTP actual a `/login` no conectó en `localhost:8080` (curl
  exit 7). El chequeo a `localhost:5173/@vite/client` expiró (curl exit 28).
  Esto contrasta con la navegación anterior verificada; ahora el servicio no
  puede darse por desplegado ni disponible en el explorador.
- Una consulta única con lectura asíncrona de stdout/stderr a
  `docker inspect shoutrrr-vite-1` excedió 15 segundos. No se solicitó `stop`
  porque el estado real no quedó confirmado; cancelar el cliente no prueba
  que Docker detuviera el contenedor. No quedó ningún proceso CLI Docker de
  esta tarea en ejecución en la comprobación de procesos.
- `public/hot` volvió a existir como archivo regular con contenido
  `http://localhost:5173`. No se eliminó porque no se pudo confirmar que
  `shoutrrr-vite-1` estuviera detenido. Los bundles compilados siguen
  presentes, pero no se pueden probar páginas/activos mientras 8080 no
  responda.
- No se pudieron completar verificaciones visuales de login, dashboard,
  post, filtros, paridad de impresión/CSV, impresión ni descarga CSV; tampoco
  inspección de consola en esta sesión porque no hay una página del navegador
  compartida y la aplicación local no responde. No se añadieron datos de
  prueba ni se tocaron APP_KEY, usuarios, datos, volúmenes, worker, scheduler
  o SSR. HMR sigue pendiente por separado y Entrega 3 continúa abierta.
- Próximo paso: en Docker Desktop, inspeccionar solo `shoutrrr-vite-1`; si
  figura activo, detener ese contenedor y esperar su estado `Exited`. Luego
  confirmar que `public/hot` no existe, comprobar el estado de
  `rsmanager-app-local-vite` y solicitar asistencia con una sola acción si
  Docker Desktop sigue sin responder. No reiniciar Docker/WSL mientras haya
  otros proyectos activos.

29-10-2026 21:52 -05:00, continuación desde `c29f48b`:

- La inspección acotada, con stdout/stderr capturados mediante
  `ReadToEndAsync()`, confirmó `shoutrrr-vite-1` y
  `rsmanager-app-local-vite` en estado `exited`, ambos con exit code 255 y
  `FinishedAt=2026-10-30T01:55:06Z`. No se consultaron variables de entorno ni
  se expusieron secretos. Vite está detenido; `public/hot` era un archivo
  regular y se retiró solo después de confirmar el estado `exited`.
- `docker logs --timestamps --tail 100 rsmanager-app-local-vite` agotó su
  límite de 20 segundos sin stdout/stderr recuperable.
  `docker start rsmanager-app-local-vite` se ejecutó una única vez y agotó
  sus 30 segundos, también sin salida. La inspección posterior confirmó que
  la app continuó `exited|255`, con el mismo `StartedAt` previo y sin mensaje
  de error. No se repitió `start`, `compose up` ni se creó otro contenedor.
- No es un error de arranque Laravel demostrado: el resultado observado es
  una petición de start que no completó y una app que permanece detenida; la
  salida final del contenedor no pudo recuperarse porque `docker logs` venció.
  `/up`, `/login` y los assets no se pudieron comprobar y no se consultó el
  navegador mientras el servicio está caído. El manifest y los bundles del
  build previo se conservan en el checkout.
- Acción manual única necesaria: en Docker Desktop, usar **Start** únicamente
  para el contenedor existente `rsmanager-app-local-vite` y verificar que
  pase a `Running`. No iniciar Vite, no usar `Compose up`, no reiniciar
  Docker/WSL ni tocar otros proyectos. Después de esa comprobación se puede
  validar HTTP y abrir el explorador. Las validaciones funcionales de
  filtros, impresión y CSV y HMR siguen pendientes.

29-10-2026 23:04 -05:00 — Incidente de pruebas y aislamiento preventivo:

- La ejecución previa de `AnalyticsPageTest` ocurrió dentro de
  `rsmanager-app-local-vite`. Aunque `phpunit.xml` declaraba SQLite en memoria,
  las variables heredadas del contenedor tenían precedencia porque no se
  marcaban `force`; el proceso quedó en `APP_ENV=local` y usó el archivo
  SQLite montado desde `shoutrrr_sqlite`. `RefreshDatabase` ejecutó
  `migrate:fresh` contra esa conexión. No se volvieron a ejecutar pruebas,
  migraciones ni seeders durante esta revisión.
- Se creó y verificó un snapshot consistente de la base con la API de backup
  de SQLite, incluida la comprobación de integridad. Su SHA-256 coincide con
  el archivo local preservado fuera del repositorio y de la carpeta de sesión.
  La copia contiene cero usuarios, workspaces y membresías; no se encontró
  una copia SQLite anterior independiente. Los contenedores antiguos
  inspeccionados comparten `shoutrrr_sqlite` y no son respaldos.
- Los logs preservados registran un timeout PHP de 30 segundos durante la
  búsqueda de usuario por token de “remember me”. Es evidencia del HTTP 500
  actual, distinta del rechazo de credenciales; no demuestra la causa interna
  del bloqueo de la consulta. También existen errores históricos de manifiesto
  Vite, que no se atribuyen al error más reciente.
- Prevención implementada: `phpunit.xml` fuerza el entorno y los drivers de
  base de datos, sesión, caché y cola; `Tests\TestCase::createApplication()`
  aborta antes de que `RefreshDatabase` pueda correr si la configuración
  efectiva no es SQLite `:memory:` sin URL. `docker-compose.testing.yaml`
  prepara un servicio separado sin montar el volumen SQLite ni el storage de
  la aplicación; el `.env` real se enmascara con un archivo vacío de pruebas,
  `database/sqlite` también queda cubierto por `tmpfs`, solo se monta `vendor`
  como volumen externo de dependencias y no hay montaje de socket Docker,
  dispositivos ni variables con credenciales de proveedores.
  Código y dependencias se montan en solo lectura; storage, caché de bootstrap
  y temporales son `tmpfs`. El comando preparado para cuando se autorice
  reanudarlas es:
  `docker compose -f docker-compose.testing.yaml --profile testing run --rm tests`.
  El modelo Compose pasó `docker compose config`, pero no se levantó el
  contenedor ni se ejecutaron las pruebas; la protección aún no se ha ejercido
  en runtime y las pruebas permanecen suspendidas, conforme a la instrucción
  del usuario.
- Procedimiento preparado, no ejecutado, para crear un acceso nuevo si se
  autoriza: después de resolver el HTTP 500, abrir `/register` en el navegador
  local y enviar el formulario Fortify. Al no existir todavía un propietario,
  `CreateNewUser` permite el primer registro, `InstanceSettings` lo promueve a
  propietario de instancia y `WorkspaceProvisioningService` crea su workspace
  personal con membresía owner. Introducir una contraseña nueva desde el
  navegador usando un gestor de contraseñas; no pasarla por comandos, archivos
  de logs ni chat. Esto sería una cuenta/workspace vacíos, no una recuperación:
  las publicaciones, conexiones y métricas anteriores no están en la base
  disponible.
- Las Entregas 3 y 4 siguen suspendidas. No se cambió la base activa ni se
  reinició ningún servicio. No se ejecutó código de recuperación ni se publicó
  la evidencia.
- 29-10-2026 23:12 -05:00: Se volvió a comprobar la copia temporal transferida
  desde el archivo estable de Windows en su ruta explícita; `PRAGMA
  integrity_check` respondió `ok`, los conteos de usuarios/workspaces/
  membresías siguen en cero y el SHA-256 coincide con el original. En páginas
  nuevas del navegador, `GET /login` y `GET /register` mostraron sus formularios
  y respondieron HTTP 200; no se envió ningún formulario. Los logs de la app en
  la ventana reciente no registraron errores para estas solicitudes, por lo
  que el timeout no se reprodujo en esta navegación limpia, pero su causa no
  está resuelta. La URL local disponible para que el propietario se registre
  personalmente es `http://localhost:8080/register`.
- La inspección final del modelo de pruebas confirma que el directorio SQLite
  y `storage` son `tmpfs`, no se monta el volumen de datos ni el socket Docker,
  no se pasa ninguna variable con credenciales de proveedores y el `.env` real
  queda cubierto por un archivo vacío de solo lectura. El guard se ejecuta en
  `createApplication()` antes de `setUpTraits()`/`RefreshDatabase`. El modelo
  Compose y los archivos se inspeccionaron sin ejecutar el servicio ni tests.
