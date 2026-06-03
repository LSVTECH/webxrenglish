#!/usr/bin/env bash
# Levanta la app en local con paridad de producción usando `vercel dev`.
# Lee las credenciales desde .env.local (gitignored): GOOGLE_API_KEY,
# GOOGLE_TTS_API_KEY y, opcionalmente, VERCEL_TOKEN para que la CLI
# de Vercel no pida login interactivo.
#
# Uso:   ./dev.sh           (puerto 49271 por defecto)
#        ./dev.sh 3000      (otro puerto)
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env.local ]; then
  echo "Falta .env.local. Copia .env.example a .env.local y rellena los valores."
  exit 1
fi

# Exporta todas las variables de .env.local al entorno del proceso.
set -a; . ./.env.local; set +a

# Puerto: argumento posicional > variable DEV_PORT (.env.local) > 49271 por defecto.
PORT="${1:-${DEV_PORT:-49271}}"

if [ -n "${VERCEL_TOKEN:-}" ]; then
  exec vercel dev --listen "$PORT" --token="$VERCEL_TOKEN" --yes
else
  # Sin token: requiere haber hecho `vercel login` previamente.
  exec vercel dev --listen "$PORT" --yes
fi
