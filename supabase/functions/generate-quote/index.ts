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

// Keep track of used quotes to avoid repetition
const usedQuotes = new Map<string, Set<string>>();

// Clear used quotes after 1 hour to prevent memory issues
setInterval(() => {
  usedQuotes.clear();
}, 3600000);

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

function isQuoteUsed(searchKey: string, quote: string): boolean {
  const quotesForKey = usedQuotes.get(searchKey) || new Set();
  return quotesForKey.has(quote);
}

function markQuoteAsUsed(searchKey: string, quote: string) {
  if (!usedQuotes.has(searchKey)) {
    usedQuotes.set(searchKey, new Set());
  }
  usedQuotes.get(searchKey)?.add(quote);
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

    // For author searches, try multiple times to get a new quote
    const maxAttempts = filterType === 'author' ? 5 : 3;
    let attempts = 0;
    let noMoreQuotes = false;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts} of ${maxAttempts}`);

      let systemPrompt = '';
      
      if (filterType === 'author' && searchTerm) {
        systemPrompt = `You are a quote expert. Find a verified, different quote from ${searchTerm} that hasn't been shared before. 
        Format the response exactly like this: "Quote text" - Author Name
        If no more unique quotes are available from this author, respond with: NO_MORE_QUOTES`;
      } else if (searchTerm) {
        systemPrompt = `You are a quote expert. ${
          type === 'human' 
            ? `Find a real, verified quote about "${searchTerm}" from an author we haven't used recently.` 
            : type === 'ai' 
              ? `Generate an original, inspiring quote about "${searchTerm}". Format the response exactly as: "Quote text" - Inspiro AI` 
              : `Either find a real quote or generate an AI quote about "${searchTerm}" from a different perspective than previous quotes. If generating, format as: "Quote text" - Inspiro AI`
        }
        Format the response exactly as: "Quote text" - Author Name`;
      } else {
        systemPrompt = `You are a quote expert. ${
          type === 'human'
            ? 'Provide a verified quote from history.' 
            : type === 'ai'
              ? 'Generate an original, inspiring quote. Format as: "Quote text" - Inspiro AI'
              : 'Either provide a verified historical quote or generate an original quote. If generating, format as: "Quote text" - Inspiro AI'
        }
        Format the response exactly as: "Quote text" - Author Name`;
      }

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
          temperature: 0.9,
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

      // Check for no more quotes message
      if (generatedText === 'NO_MORE_QUOTES') {
        noMoreQuotes = true;
        break;
      }

      const extracted = extractQuoteAndAuthor(generatedText);
      if (!extracted) {
        console.log('Failed to extract quote from:', generatedText);
        continue;
      }

      const searchKey = `${filterType}:${searchTerm || 'random'}`;
      if (!isQuoteUsed(searchKey, extracted.quote)) {
        markQuoteAsUsed(searchKey, extracted.quote);
        return new Response(JSON.stringify(extracted), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Quote was already used, trying again...');
    }

    if (noMoreQuotes) {
      return new Response(JSON.stringify({ 
        error: 'NO_MORE_QUOTES',
        message: `No more unique quotes available from ${searchTerm}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If we couldn't get a unique quote after all attempts, use a classic quote
    console.log('Failed to get unique quote after all attempts, using classic quote');
    const randomIndex = Math.floor(Math.random() * classicQuotes.length);
    return new Response(JSON.stringify(classicQuotes[randomIndex]), {
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
