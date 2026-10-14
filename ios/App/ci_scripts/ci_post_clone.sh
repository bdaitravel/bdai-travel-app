#!/bin/sh
set -e

# Xcode Cloud solo clona el repositorio — no instala Node, ni node_modules, ni los Pods.
# Este script corre automáticamente después del clone y antes de "Archive - iOS".

echo "Instalando Node.js..."
brew install node@20
export PATH="$(brew --prefix node@20)/bin:$PATH"

cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "Instalando dependencias npm..."
npm install

echo "Compilando la app web..."
npm run build

echo "Sincronizando con el proyecto nativo de iOS (incluye pod install)..."
npx cap sync ios
