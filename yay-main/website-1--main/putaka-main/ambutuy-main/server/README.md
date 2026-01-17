# Putaka Research Proxy (Anthropic)

This small Node/Express proxy forwards search queries from the browser to the Anthropic API so you don't expose API keys or run into CORS issues.

## Setup

1. Copy `.env.example` to `.env` and set your `ANTHROPIC_API_KEY`.

2. Install dependencies:

   npm install

3. Run the server:

   npm start

   Or for development with automatic reload:

   npm run dev

The server will listen on the port defined in `PORT` (default 3000).

## API

POST /api/search
- Body: { "query": "your search term" }
- Response success: { "papers": [ ... parsed JSON ] } or { "raw": "...model text..." }
- Error: { "error": "message" }

## Security notes
- Do not commit your `.env` or API keys to source control.
- Use a server-side proxy like this in production to keep API keys secret and to handle rate limits / caching.

## Troubleshooting
- If the server returns `Server not configured with ANTHROPIC_API_KEY`, add your key to `.env` and restart.
- The model may return plain text instead of JSON; in that case the server returns `{ raw: ... }` and the frontend can show a fallback or manual search links.


## Quick smoke tests

1) Curl test (replace <query>):

   curl -X POST http://localhost:3000/api/search -H "Content-Type: application/json" -d '{"query":"<your search term>"}'

   Expected: HTTP 200 with `{ "papers": [...] }` or `{ "raw": "..." }`.

2) Browser test:
   - Start the server (npm start) and open `researchpaper_creation.html` in a browser that can access `http://localhost:3000` (serve the static files or open via a local dev server).
   - Highlight text in the editor, right-click → "Find Research & Literature" and confirm the modal shows results or the fallback links.

3) Common issues:
   - CORS: If your frontend is served from another origin, ensure the proxy allows that origin (currently it uses `cors()` for development).
   - API key: If the response is `{ "error": "Server not configured with ANTHROPIC_API_KEY" }`, set `ANTHROPIC_API_KEY` in `.env` and restart the server.
