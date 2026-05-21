# Project steps

Project-specific steps override kit steps with the same `id`.

Scaffold a new step:

```bash
npm run scaffold-step -- --id my-step --title "My step" \
  --role id2s-role-business-analyst --artifact docs/id2s/my-artifact.md
```

Then add the step id to a workflow via `npm run compose-workflow` or edit `workflows/*.yaml` manually.
