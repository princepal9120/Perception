# Contributing

## Development defaults

- Use the OSS local path first.
- Prefer `AUTH_MODE=disabled` unless you are explicitly testing hosted auth.
- Keep Deep Research as the primary demo workflow when changing onboarding or landing/docs copy.

## Local workflow

```bash
cd server && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
cd client && npm install
```

Run before opening a PR:

```bash
cd client && npm run lint && npm run test && npm run build
cd server && pytest -q
```

## Change guidelines

- Keep diffs small and reversible.
- Prefer deletion over adding new layers.
- Do not add new dependencies without strong justification.
- Keep provider abstractions narrow: chat model, embeddings, search.
- Preserve the local-first OSS setup path.

## Pull requests

Please include:
- what changed
- why it changed
- how you verified it
- any config or provider assumptions

## Good first areas

- documentation improvements
- setup validation
- Deep Research UX polish
- provider-configuration hardening
- conversation tree quality-of-life fixes
