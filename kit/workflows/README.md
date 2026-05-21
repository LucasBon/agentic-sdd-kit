# Kit workflows (predefined)

| File | Description |
|------|-------------|
| `green-field.v2.yaml` | **Recommended** — 6 steps via step catalog (brief → architecture) |
| `green-field-minimal.v2.yaml` | 3 steps — product intent → business requirements → system design |
| `green-field.v1.yaml` | **Legacy** — inline steps (deprecated; use v2) |

All v2 workflows use `stages` + references to `kit/steps/*.step.yaml`.

Project-specific workflows belong in repo root `workflows/` (see `workflows/README.md`).
