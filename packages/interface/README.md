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
- `NEXT_PUBLIC_APP_ENV` - Environment mode (`development` or `production`). In development, auth is mocked and API key UI is hidden.

See [Configuration Reference](../../docs/CONFIGURATION.md) for all options.

## License

MIT
