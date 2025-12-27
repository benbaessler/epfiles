# Epstein Files Interface

Next.js frontend for the Epstein Files RAG chatbot.

## Setup

```bash
bun install
bun dev
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_BACKEND_URL` - URL of the RAG backend API (default: `http://localhost:8000`)
- `NEXT_PUBLIC_APP_ENV` - Environment mode (`development` or `production`)
- `NEXT_PUBLIC_LOCAL_DEV` - Set to `true` to enable local dev features (mock auth, skip API key)

See [Configuration Reference](../../docs/CONFIGURATION.md) for all options.

## License

MIT
