# Demo (Next.js shell)

This app consumes the `seqdia` library from `packages/seqdia` and renders the demo/docs page. The library itself has no Next.js dependency; this shell is only for documentation and showcasing the components.

## Run locally

```bash
pnpm install
pnpm dev
# open http://localhost:3000
```

## UI components

The demo uses local shadcn-style components under `apps/demo/components/ui/*`. Swap these for your own design system as needed; the library does not ship UI primitives.

## Styling

Tailwind is configured in `apps/demo/tailwind.config.ts` and scans both the demo app and the library source.

## Lint/Test

```bash
pnpm lint
pnpm test   # runs library tests via workspace filter
```
