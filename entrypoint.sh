#!/bin/sh
set -e

echo ""
echo "============================================"
echo "  Se Liga no Açaí — Backend"
echo "============================================"
echo ""

echo "📦 Aplicando migrations Prisma..."
npx prisma migrate deploy
echo "✅ Migrations aplicadas com sucesso."
echo ""

if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Executando seed..."
  npx prisma db seed
  echo "✅ Seed concluído."
  echo ""
fi

echo "🚀 Iniciando a aplicação..."
exec node dist/main
