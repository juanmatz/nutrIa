#!/usr/bin/env bash
set -e

echo "Compilando frontend de NutrIA..."
cd nutria-frontend
npm install
npm run build
mkdir -p ../dist
cp -r dist/* ../dist/ || true
echo "Build de frontend completado exitosamente."
