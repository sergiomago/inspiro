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
  console.log("Attempting to extract quote and author from:", text);
  
  // Try different quote formats
  const patterns = [
    /"([^"]+)"\s*[-–—]\s*([^[\n]+?)(?:\[.*?\])?\.?\s*$/, // Handles quotes with optional citation numbers
    /"([^"]+)"\s*by\s*([^[\n]+?)(?:\[.*?\])?\.?\s*$/, // Handles "quote" by Author format
    /['']([^'']+)['']\s*[-–—]\s*([^[\n]+?)(?:\[.*?\])?\.?\s*$/, // Handles single quotes
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        quote: match[1].trim(),
        author: match[2].trim().replace(/\[\d+\]$/, '').trim() // Remove citation numbers
      };
    }
  }

  // If no patterns match, try to find any quoted text and following text
  const fallbackMatch = text.match(/"([^"]+)".*?[-–—]\s*([^,\n]+)/);
  if (fallbackMatch) {
    return {
      quote: fallbackMatch[1].trim(),
      author: fallbackMatch[2].trim().replace(/\[\d+\]$/, '').trim()
    };
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
              content: `You are a quote expert. Find a verified quote from the specified author.
              Format the response exactly like this: "Quote text" - Author Name
              Do not include any other text or formatting.`
            },
            {
              role: 'user',
              content: `Find a verified quote from ${searchTerm}`
            }
          ],
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 1000,
          frequency_penalty: 1,
          presence_penalty: 1
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.choices[0].message.content.trim();
      console.log("Perplexity response:", generatedText);
      
      const extracted = extractQuoteAndAuthor(generatedText);
      if (!extracted) {
        console.error('Failed to extract quote from:', generatedText);
        throw new Error('Invalid quote format received from Perplexity');
      }

      return new Response(JSON.stringify(extracted), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For topic searches or random quotes, use Perplexity with different prompts
    const systemPrompt = searchTerm 
      ? `You are a quote expert. ${type === 'human' 
          ? `Find a real, verified quote about "${searchTerm}".` 
          : type === 'ai' 
            ? `Generate an original, inspiring quote about "${searchTerm}". Format the response exactly as: "Quote text" - Inspiro AI` 
            : `Either find a real quote or generate an AI quote about "${searchTerm}". If generating, format as: "Quote text" - Inspiro AI`}`
      : `You are a quote expert. ${type === 'human'
          ? 'Provide a verified quote from history.' 
          : type === 'ai'
            ? 'Generate an original, inspiring quote. Format as: "Quote text" - Inspiro AI'
            : 'Either provide a verified historical quote or generate an original quote. If generating, format as: "Quote text" - Inspiro AI'}
          Format the response exactly as: "Quote text" - Author Name`;

    console.log("Using system prompt:", systemPrompt);

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: 'Provide a quote following the specified format.'
          }
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000,
        frequency_penalty: 1,
        presence_penalty: 1
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content.trim();
    console.log("Perplexity response:", generatedText);
    
    const extracted = extractQuoteAndAuthor(generatedText);
    if (!extracted) {
      console.log('Failed to extract quote, falling back to classic quotes');
      const randomIndex = Math.floor(Math.random() * classicQuotes.length);
      return new Response(JSON.stringify(classicQuotes[randomIndex]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-quote function:', error);
    // Fallback to classic quotes on error
    const randomIndex = Math.floor(Math.random() * classicQuotes.length);
    return new Response(JSON.stringify(classicQuotes[randomIndex]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});