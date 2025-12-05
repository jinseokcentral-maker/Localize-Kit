#!/bin/bash

# WASM 파서 빌드 및 frontend로 복사 스크립트

set -e

WASM_OPT="/Users/miso/Library/Caches/.wasm-pack/wasm-opt-50385c9e73ccee70/bin/wasm-opt"

echo "🔨 Building WASM..."
wasm-pack build --target web --out-dir pkg

# wasm-opt로 추가 최적화
if [ -f "$WASM_OPT" ]; then
    echo "⚡ Optimizing with wasm-opt..."
    $WASM_OPT --enable-bulk-memory -Oz pkg/parsing_bg.wasm -o pkg/parsing_bg_opt.wasm
    mv pkg/parsing_bg_opt.wasm pkg/parsing_bg.wasm
fi

# 불필요한 파일 제거
rm -f pkg/.gitignore
rm -f pkg/README.md

# 대상 디렉토리
TARGET_DIR="../frontend/app/lib/parser"

echo "📁 Creating target directory: $TARGET_DIR"
mkdir -p "$TARGET_DIR"

echo "📦 Copying WASM package to frontend..."
# index.ts는 덮어쓰지 않음
cp pkg/package.json "$TARGET_DIR/"
cp pkg/parsing_bg.wasm "$TARGET_DIR/"
cp pkg/parsing_bg.wasm.d.ts "$TARGET_DIR/"
cp pkg/parsing.d.ts "$TARGET_DIR/"
cp pkg/parsing.js "$TARGET_DIR/"

# 크기 출력
WASM_SIZE=$(ls -lh "$TARGET_DIR/parsing_bg.wasm" | awk '{print $5}')
GZIP_SIZE=$(gzip -c "$TARGET_DIR/parsing_bg.wasm" | wc -c | awk '{printf "%.0fKB", $1/1024}')

echo ""
echo "✅ Done!"
echo "📊 WASM Size: $WASM_SIZE (gzip: $GZIP_SIZE)"
echo "📁 Output: $TARGET_DIR"
