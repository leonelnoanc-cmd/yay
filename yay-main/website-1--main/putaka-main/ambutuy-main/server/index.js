const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const path = require('path');

// Serve static files (HTML/CSS/JS) from the project root so files like
// research-paper-editor.html are served with the correct Content-Type.
app.use(express.static(path.join(__dirname, '..')));

app.use(cors());
app.use(express.json());

// Convenience: serve the editor as the root page for quick access
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'research-paper-editor.html')));

if (!ANTHROPIC_API_KEY) {
  console.warn('Warning: ANTHROPIC_API_KEY is not set. Set it in .env to enable live searches.');
}

app.post('/api/search', async (req, res) => {
  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: 'Missing query parameter' });

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server not configured with ANTHROPIC_API_KEY' });
  }

  try {
    const prompt = `Search for 3 recent academic research papers or scholarly articles about "${query}". For each paper found, provide: 1. The exact title 2. Author names (in APA format: Last, F. M.) 3. Year of publication 4. Journal/publication name 5. A brief 2-3 sentence summary of the key findings 6. DOI or URL if available. Format your response as a JSON array with exactly 3 research papers.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Anthropic API error:', response.status, text);
      return res.status(502).json({ error: `Anthropic API error: ${response.status}` });
    }

    const data = await response.json();

    // Extract text content blocks if present
    let responseText = '';
    if (Array.isArray(data.content)) {
      for (const block of data.content) if (block.type === 'text') responseText += block.text;
    } else if (typeof data.response === 'string') {
      responseText = data.response;
    } else {
      responseText = JSON.stringify(data);
    }

    // Try to parse JSON from the model response
    let papers = [];
    try {
      const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
      papers = JSON.parse(cleaned);
    } catch (err) {
      console.error('Failed to parse model response:', err);
      // Return raw response so frontend can decide what to do
      return res.status(200).json({ raw: responseText });
    }

    return res.status(200).json({ papers });
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message || 'Unknown server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Research proxy listening on port ${PORT}`);
});