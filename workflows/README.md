# Project workflows

Place composed or custom workflow YAML files here (Path B).

Example:

```bash
npm run compose-workflow -- --id my-product --title "My product" \
  --steps product-intent,business-requirements,system-design --set-config
npm run validate-workflows && npm run bootstrap
```

Predefined kit workflows live under `kit/workflows/`. Set `workflowFile` in `ask-kit.config.yaml` to either a kit path or `workflows/<name>.yaml`.
