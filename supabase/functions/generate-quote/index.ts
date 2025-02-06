import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const classicQuotes = [
  { quote: "Be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "Two roads diverged in a wood, and I took the one less traveled by.", author: "Robert Frost" },
  { quote: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { quote: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
];

function extractQuoteAndAuthor(text: string): { quote: string; author: string } | null {
  // Try different quote formats
  const formats = [
    /"([^"]+)"\s*-\s*(.+)/,                   // "Quote" - Author
    /"([^"]+)"\s+by\s+(.+)/,                  // "Quote" by Author
    /([^"]+)\s*-\s*(.+)/,                     // Quote - Author
    /([^"]+)\s+by\s+(.+)/                     // Quote by Author
  ];

  for (const format of formats) {
    const match = text.match(format);
    if (match) {
      return {
        quote: match[1].trim(),
        author: match[2].trim()
      };
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type = 'mixed', searchTerm = '', filterType = 'topic' } = await req.json();
    console.log("Generate quote called with:", { type, searchTerm, filterType });

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    // If searching by author, use Perplexity to find verified quotes
    if (filterType === 'author' && searchTerm) {
      console.log("Searching for author quotes using Perplexity");
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'system',
              content: `You are a quote expert. Find a verified quote from ${searchTerm}. 
              Format your response exactly as: "Quote text here" - Author Name
              Only return quotes that you can verify are genuinely from this author.
              If no verified quotes are found, say "No verified quotes found".
              Do not include any additional text or explanation.`
            },
            {
              role: 'user',
              content: `Return a random verified quote from ${searchTerm}`
            }
          ],
          temperature: 0.8, // Increased for more variety
          top_p: 0.9,
          max_tokens: 1000,
          frequency_penalty: 1.5, // Increased to reduce repetition
          presence_penalty: 1.5
        }),
      });

      if (!response.ok) {
        console.error('Perplexity API error:', response.status, response.statusText);
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Perplexity response:", data);
      
      const generatedText = data.choices[0].message.content.trim();
      console.log("Generated text:", generatedText);

      if (generatedText === "No verified quotes found") {
        throw new Error('No verified quotes found for this author');
      }

      const extracted = extractQuoteAndAuthor(generatedText);
      if (!extracted) {
        console.error('Failed to parse quote:', generatedText);
        throw new Error('Invalid quote format received from Perplexity');
      }

      // Verify the author matches (case-insensitive)
      if (!extracted.author.toLowerCase().includes(searchTerm.toLowerCase())) {
        console.error('Author mismatch:', { expected: searchTerm, got: extracted.author });
        throw new Error('Quote attribution mismatch');
      }

      return new Response(JSON.stringify(extracted), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For topic searches or random quotes, use classic quotes or generate new ones
    if (type === 'human' || (type === 'mixed' && Math.random() < 0.3)) {
      const randomIndex = Math.floor(Math.random() * classicQuotes.length);
      return new Response(JSON.stringify(classicQuotes[randomIndex]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate AI quote
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: `Generate an inspiring quote${searchTerm ? ` about ${searchTerm}` : ''}.
            Format your response exactly as: "Quote text here" - Inspiro AI
            The quote should be concise and meaningful.
            Do not include any additional text or explanation.`
          },
          {
            role: 'user',
            content: 'Generate a quote'
          }
        ],
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 1000,
        frequency_penalty: 1.5,
        presence_penalty: 1.5
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status, response.statusText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Perplexity response for AI quote:", data);
    
    const generatedText = data.choices[0].message.content.trim();
    console.log("Generated AI quote text:", generatedText);

    const extracted = extractQuoteAndAuthor(generatedText);
    if (!extracted) {
      console.error('Failed to parse AI quote:', generatedText);
      throw new Error('Invalid quote format received from Perplexity');
    }

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-quote function:', error);
    // Fall back to a classic quote on error
    const randomIndex = Math.floor(Math.random() * classicQuotes.length);
    return new Response(JSON.stringify(classicQuotes[randomIndex]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});