# Translation Editor Wireframe (Markdown)

## Scope
- Entry: project card → Translation Editor.
- JSON view 없음; 대신 `Preview` 버튼으로 JSON 모달/패널 제공.
- 두 가지 메인 뷰: **Excel View** (테이블 스타일) / **CSV View** (세로 리스트).
- 권한: `viewer=read-only`, `editor+=edit/import/export`.

## Layout Overview
```
┌──────────────────────────────────────────────────────────────┐
│ Global App Shell (Sidebar + Header from DashboardLayout)     │
│  └─ Breadcrumb / Team switch / Profile                        │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Sticky Page Header                                            │
│  - Breadcrumb: Projects > {Project}                           │
│  - Meta badges: Default Lang, Target Langs, Status, Progress  │
│  - Actions: [New Key] [Import CSV/Excel] [Preview JSON]       │
│            [Export CSV] [Export Excel] [Settings]             │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Sub-header Metrics (optional)                                │
│  - Progress gauge | Untranslated count | API/Webhook (Pro+)   │
│  - Last import time | Plan limit badge (Free: 2 langs)        │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Filter & View Switcher (sticky under header)                 │
│  - Search key | Language filter | Status filter | Sort        │
│  - View toggle: Excel View | CSV View                         │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Main Content (70/30 split)                                   │
│                                                              │
│  Left: Data View                                              │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Excel View                                             │   │
│  │ ┌────────┬─────────┬──── Lang A ────┬──── Lang B ────┐ │   │
│  │ │  Key   │ Context │   value cell   │   value cell   │ │   │
│  │ └────────┴─────────┴────────────────┴────────────────┘ │   │
│  │ - Inline edit, dirty mark, Cmd/Ctrl+S save             │   │
│  │ - Sticky header, virtual scroll                        │   │
│  │ - Row click syncs right panel                          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ CSV View (vertical list)                              │   │
│  │ [Key] [Lang picker] [Value input]                     │   │
│  │ + Add row | Paste (csv/tsv)                           │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                              │
│  Footer (within left pane): pagination or infinite scroll,   │
│  save status (Unsaved/Syncing/Saved).                        │
│                                                              │
│  Right: Key Detail Panel                                     │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Key meta: name/namespace, context, tags                │   │
│  │ Language editors (multiline)                           │   │
│  │ QA notes, last modified (user/time)                    │   │
│  │ History (Pro+): versions, rollback                     │   │
│  │ Permissions banner when read-only                      │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Preview (modal/side panel, on demand)                        │
│  - JSON output for current filters/language                  │
│  - Copy button, read-only                                    │
└──────────────────────────────────────────────────────────────┘
```

## States & Edge Cases
- Empty: show CTA “Import CSV/Excel” or “New Key”.
- Archived project: entire editor read-only + top banner.
- Plan limits: Free → show “2 languages max” badge; upgrade link near actions.
- Error/Offline: toast + non-blocking inline alerts; keep local edits until saved.

## Key Interactions
- View toggle preserves filters and scroll.
- Inline edit:
  - Tab/Enter moves, Esc cancels.
  - Cmd/Ctrl+S triggers save; show syncing state.
  - Dirty indicator per cell/row.
- Import CSV/Excel:
  - File pick, mapping preview, conflict warnings.
- Export: CSV/Excel only; JSON only via Preview modal.
- Selection sync: selecting a row focuses right-side detail; editing detail updates left cells.

## Suggested Component Slots
- `TranslationEditorPage`: fetch project meta + permissions.
- `TranslationTopBar`: breadcrumb, meta badges, actions.
- `TranslationFilters`: search, filters, view toggle.
- `TranslationTable` (Excel View) with virtualized rows.
- `TranslationCsvList` (CSV View) with quick add/paste.
- `TranslationDetailPanel`: key meta, per-language editors, history.
- `PreviewModal`: JSON preview + copy.



