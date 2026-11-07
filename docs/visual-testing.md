# Entorno visual aislado

El perfil `visual` usa la imagen etiquetada con el SHA que se esta probando y
publica exclusivamente `127.0.0.1:18081`. Docker Desktop no publica puertos
de redes `internal`, por lo que la red visual usa bridge; el aislamiento se
mantiene con SQLite, almacenamiento y cache temporales, sin montar volumenes
operativos. Las integraciones externas permanecen desactivadas con
`SOCIALITE_ENABLED=false` y sin credenciales.

Construir y seleccionar explicitamente la imagen:

```text
docker build --tag magic-blue:<SHA> --build-arg APP_VERSION=<SHA> .
```

Actualizar `image` en `docker-compose.testing.yaml` a esa etiqueta y ejecutar:

```text
docker compose -f docker-compose.testing.yaml --profile visual up -d --force-recreate visual
docker compose -f docker-compose.testing.yaml --profile visual run --rm visual sh /usr/local/bin/seed-visual-testing.sh
```

El script de datos sinteticos exige `APP_ENV=testing`,
`VISUAL_TESTING_AUTHORIZED=1` y `/tmp/rsmanager-visual.sqlite`; rechaza bases
fuera del perfil autorizado. El perfil `testing` de Pest requiere dependencias
de desarrollo (`vendor/bin/pest`) y no se considera validado por la imagen
runtime visual.
