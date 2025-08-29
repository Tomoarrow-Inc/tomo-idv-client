#!/bin/bash

# Test 버전 배포 스크립트 (태그 기반)

echo "🚀 Publishing Test version with tag..."

# Test 환경으로 빌드 (명령행 인수 사용)
docker compose --profile test run --rm tomo-idv-client npm run build:test

# Test 버전으로 업데이트
docker compose --profile test run --rm tomo-idv-client npm version prerelease --preid=test

# Test 태그로 배포
docker compose --profile test run --rm tomo-idv-client npm publish --tag test

echo "✅ Test version published successfully with 'test' tag!"
echo "📦 Install with: npm install tomo-idv-client@test"
