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

echo "🌱 Executando seed..."
npx prisma db seed && echo "✅ Seed concluído." || echo "⚠️  Seed ignorado (dados já existentes ou erro não crítico)."
echo ""

echo "🚀 Iniciando a aplicação..."
exec node dist/main
