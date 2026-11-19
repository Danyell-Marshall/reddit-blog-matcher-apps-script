# Technical notes and limitations

This is a **historical source archive**, not a modern supported integration.

1. **Duplicate declarations.** `searchSubredditForMatches` and `onOpen` each occur twice. Under the script's top-level function semantics the later declarations normally take effect. The file is left unchanged for historical fidelity.
2. **Full blog content mismatch.** `getBlogContentByTitle()` expects the article text in column D. The recovered `BlogContent` sheet snapshot has only three populated columns. That may have affected reply quality and requires diagnosis before reuse.
3. **Keyword relevance, not semantic understanding.** Matching uses case-insensitive literal substring checks against comma-separated keywords. This can introduce false positives and misses; it is not proof of high-quality relevance.
4. **Generated responses require editorial checking.** Historic outputs included some unresolved placeholders; factual claims and source fit cannot be assumed accurate.
5. **Legacy provider endpoints.** The code uses Reddit `.json` endpoints and the historical `gemini-1.5-flash` API route. Do not assume these still work. A live modern version would need current authorized authentication, provider terms, error handling, retry/rate-limit logic, and a tested model choice.
6. **Sheets efficiency.** Appending rows within nested loops can be slow and may incur quota limits. Batch writes would be better in a modern edition.
7. **No automated Reddit publishing.** This tool prepares suggestions for manual editorial review and posting.
8. **No claimed current tests.** This archive has not been executed against current external services. The historic result sheet is operational evidence, but not a formal benchmark or engagement outcome.

## Sensitive information check

- No literal Gemini API key is present in `Code.gs`; credentials are retrieved through `PropertiesService`.
- This repository does not contain employer-owned spreadsheet data, production credentials, or real engagement records.
- Do not add screenshots with identifiable customers, private chats, or unpublished company strategy.

## Future independent modernization

Create a separate branch or repository if extending this code: use authorized API integrations; introduce tests with mocked Reddit and Gemini outputs; separate retrieval, matching, and drafting functions; add human-review safeguards; use batches instead of per-row appends; and require explicit human approval before publication.
