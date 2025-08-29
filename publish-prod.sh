#!/bin/bash

# Production 버전 배포 스크립트 (태그 기반)

echo "🚀 Publishing Production version..."

# Production 환경으로 빌드
docker compose run --rm --profile prod tomo-idv-client npm run build

# Production 버전으로 업데이트
npm version patch

# Production 태그로 배포 (latest)
npm publish

echo "✅ Production version published successfully!"
echo "📦 Install with: npm install tomo-idv-client@latest"
