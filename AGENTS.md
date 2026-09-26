# Project Rules

- Generated preview code must pass through `sanitizeGeneratedCode` before compilation, because model output can contain multiline or duplicate imports.
- Existing preview code must be sent in the dedicated `currentCode` request field for every follow-up, because edits must preserve the active project.