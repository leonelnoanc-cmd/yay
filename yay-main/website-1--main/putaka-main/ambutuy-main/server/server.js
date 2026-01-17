// server.js - Backend server for Research Paper Editor
// This handles API calls securely with your API key

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

// IMPORTANT: Replace with your actual Anthropic API key
const ANTHROPIC_API_KEY = 'AIzaSyCgsTxirq6pcEFBSTa1lbTG7Ka22nZfq2A';

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve your HTML file

// Research endpoint
app.post('/api/research', async (req, res) => {
    try {
        const { query, type } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        console.log(`Searching for ${type}: ${query}`);

        const promptText = `Search for recent academic papers about "${query}". 

Focus on finding 3-5 REAL published papers from:
- Google Scholar
- ResearchGate  
- PubMed
- Academic journals
- Conference proceedings

For each paper found, extract and provide:
1. Exact paper title
2. All authors (in "LastName, FirstInitial." format)
3. Publication year
4. Journal or conference name
5. A 2-3 sentence summary of the key findings
6. DOI or URL (if available)
7. Volume, issue, and page numbers (if available)

IMPORTANT: Only include papers that actually exist. Verify the information is real.

Return ONLY a JSON array in this exact format:
[
  {
    "title": "Exact paper title",
    "authors": "Author1, A., Author2, B., & Author3, C.",
    "year": "2024",
    "journal": "Journal Name",
    "summary": "Brief summary of findings and methodology",
    "doi": "https://doi.org/10.xxxx/xxxxx",
    "volume": "45",
    "issue": "3",
    "pages": "123-145"
  }
]

Only return the JSON array, nothing else.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${ANTHROPIC_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: promptText
                            }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 4000,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Anthropic API Error:', errorText);
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response received');

        let responseText = '';
        if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
                responseText = candidate.content.parts
                    .map(part => part.text)
                    .join('\n');
            }
        }

        let papers = [];
        try {
            const cleanText = responseText.replace(/```json\n?|\n?```/g, '').trim();
            papers = JSON.parse(cleanText);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            console.log('Raw response:', responseText);
            throw new Error('Unable to parse research results');
        }

        if (!Array.isArray(papers) || papers.length === 0) {
            throw new Error('No papers found in search results');
        }

        res.json({ success: true, papers });

    } catch (error) {
        console.error('Research error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📝 Open http://localhost:${PORT}/research-paper-editor.html in your browser`);
});