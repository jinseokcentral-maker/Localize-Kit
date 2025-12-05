# WASM Parser Integration Plan

## 개요

[Excel-To-Lang-Json-WASM](https://github.com/jinseok9338/Excel-To-Lang-Json-WASM) 프로젝트를 LocalizeKit에 통합하여 고성능 CSV/Excel 파싱 기능을 구현합니다.

### 왜 WASM인가?

| 방식              | 성능 (5000줄 Excel) | 비고                      |
| ----------------- | ------------------- | ------------------------- |
| 기존 Node.js 파서 | ~250ms              | JavaScript 기반           |
| **WASM 파서**     | **~40ms**           | Rust 기반, **4-5배 빠름** |

---

## 목표

### Phase 1: WASM 패키지 준비

- [ ] Excel-To-Lang-Json-WASM 레포 클론 및 분석
- [ ] LocalizeKit 요구사항에 맞게 수정
  - [ ] CSV 파싱 지원 추가
  - [ ] Separator 옵션 지원 (`.`, `/`, `-`)
  - [ ] Nested key 변환 로직 구현
  - [ ] 출력 포맷 지원 (JSON, YAML, i18n)
- [ ] 웹 타겟으로 빌드 (`wasm-pack build --target web`)
- [ ] npm 패키지로 배포 또는 로컬 패키지로 사용

### Phase 2: LocalizeKit 통합

- [ ] WASM 모듈 로딩 유틸리티 작성
- [ ] EditorSection에서 WASM 파서 호출
- [ ] 파일 업로드 시 WASM으로 파싱
- [ ] 실시간 변환 (CSV 입력 → JSON 출력)

### Phase 3: 최적화 및 폴백

- [ ] WASM 로딩 실패 시 JavaScript 폴백
- [ ] Web Worker로 파싱 처리 (메인 스레드 블로킹 방지)
- [ ] 대용량 파일 스트리밍 처리

---

## 기술 상세

### 현재 WASM 프로젝트 구조

```
Excel-To-Lang-Json-WASM/
├── src/           # Rust 소스 코드
├── web/           # 웹 타겟 빌드 결과물
├── node/          # Node.js 타겟 빌드 결과물
├── Cargo.toml     # Rust 의존성
└── package.json
```

### 필요한 수정사항

#### 1. CSV 파싱 지원

현재는 Excel(.xlsx)만 지원하므로 CSV 파싱 로직 추가 필요

```rust
// 예시: CSV 파싱 함수 추가
#[wasm_bindgen]
pub fn parse_csv(data: &[u8], separator: &str) -> Result<String, JsValue> {
    // CSV 파싱 로직
}
```

#### 2. Separator 옵션

```rust
pub struct ParseOptions {
    pub separator: String,      // ".", "/", "-"
    pub nested: bool,           // true면 nested object로 변환
    pub output_format: String,  // "json", "yaml", "i18n"
}
```

#### 3. 출력 포맷

| 포맷 | 설명               | 예시               |
| ---- | ------------------ | ------------------ |
| JSON | 표준 JSON          | `{"key": "value"}` |
| YAML | YAML 형식          | `key: value`       |
| i18n | react-i18next 호환 | 언어별 파일 구조   |

### LocalizeKit에서 사용 방법

```typescript
// lib/wasm/parser.ts
import init, { parse_csv, parse_excel } from "@localizekit/wasm-parser";

let wasmInitialized = false;

export async function initWasm() {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
}

export async function parseFile(
  file: File,
  options: {
    separator: "." | "/" | "-";
    nested: boolean;
    format: "json" | "yaml" | "i18n";
  }
): Promise<Record<string, Record<string, unknown>>> {
  await initWasm();

  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);

  const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

  const result = isExcel
    ? parse_excel(data, options.separator, options.nested)
    : parse_csv(data, options.separator, options.nested);

  return JSON.parse(result);
}
```

---

## 작업 순서

### Step 1: WASM 프로젝트 수정 (별도 작업)

1. Excel-To-Lang-Json-WASM 레포 포크/클론
2. CSV 파싱 기능 추가
3. Separator 옵션 추가
4. 웹 타겟으로 빌드 테스트
5. npm 패키지로 배포 (`@localizekit/wasm-parser`)

### Step 2: LocalizeKit 통합

1. WASM 패키지 설치
2. `lib/wasm/` 유틸리티 작성
3. EditorSection에서 WASM 파서 사용
4. 기존 JavaScript 파싱 로직을 폴백으로 유지

### Step 3: 테스트 및 최적화

1. 다양한 파일 크기로 성능 테스트
2. 에러 핸들링 강화
3. Web Worker 적용 (선택)

---

## 참고 자료

- [wasm-pack 문서](https://rustwasm.github.io/wasm-pack/)
- [Rust WASM 가이드](https://rustwasm.github.io/docs/book/)
- [원본 레포](https://github.com/jinseok9338/Excel-To-Lang-Json-WASM)

---

## 예상 일정

| 단계    | 작업             | 예상 소요 |
| ------- | ---------------- | --------- |
| Phase 1 | WASM 패키지 준비 | 2-3일     |
| Phase 2 | LocalizeKit 통합 | 1-2일     |
| Phase 3 | 최적화 및 폴백   | 1일       |

**총 예상: 4-6일**
