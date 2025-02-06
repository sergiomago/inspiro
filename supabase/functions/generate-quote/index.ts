import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache to store recently generated quotes (expires after 1 hour)
const quoteCache = new Map<string, { quotes: string[], timestamp: number }>();
const CACHE_EXPIRY = 3600000; // 1 hour in milliseconds
const MAX_CACHED_QUOTES = 10;

const cleanCache = () => {
  const now = Date.now();
  for (const [key, value] of quoteCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRY) {
      quoteCache.delete(key);
    }
  }
};

const addToCache = (cacheKey: string, quote: string) => {
  cleanCache();
  const cached = quoteCache.get(cacheKey) || { quotes: [], timestamp: Date.now() };
  cached.quotes = [quote, ...cached.quotes.slice(0, MAX_CACHED_QUOTES - 1)];
  cached.timestamp = Date.now();
  quoteCache.set(cacheKey, cached);
};

const isQuoteInCache = (cacheKey: string, quote: string): boolean => {
  const cached = quoteCache.get(cacheKey);
  return cached ? cached.quotes.includes(quote) : false;
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
      
      // Create a cache key for this author
      const cacheKey = `author:${searchTerm.toLowerCase()}`;
      
      // Try up to 3 times to get a non-cached quote
      for (let attempt = 0; attempt < 3; attempt++) {
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
                content: `You are a quote expert. Your task is to:
                1. Find and verify a quote specifically from ${searchTerm}.
                2. Only return quotes that you are certain are genuinely from this author.
                3. Format the response exactly as: "[quote text]" - ${searchTerm}
                4. Do not include any explanations or metadata.
                5. If you cannot find a verified quote from this author, respond with "NO_VERIFIED_QUOTE".
                6. Ensure the quote is different from previous ones.`
              },
              {
                role: 'user',
                content: `Find a verified quote from ${searchTerm} that is meaningful and inspirational.`
              }
            ],
            temperature: 0.7, // Increased for more variety
            top_p: 0.9,
            max_tokens: 1000,
            search_domain_filter: ['quoteinvestigator.com', 'wikiquote.org', 'brainyquote.com'],
            search_recency_filter: 'month',
            frequency_penalty: 1.5, // Increased to reduce repetition
            presence_penalty: 1.5  // Increased to encourage diversity
          }),
        });

        if (!response.ok) {
          throw new Error(`Perplexity API error: ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.choices[0].message.content.trim();
        
        // Check if it's a valid quote
        if (generatedText === 'NO_VERIFIED_QUOTE') {
          throw new Error(`No verified quotes found for ${searchTerm}`);
        }

        const quoteMatch = generatedText.match(/"([^"]+)"\s*-\s*(.+)/);
        if (!quoteMatch) {
          console.error('Invalid quote format received:', generatedText);
          continue; // Try again
        }

        const quote = quoteMatch[1].trim();
        const author = quoteMatch[2].trim();

        // Validate author match (case insensitive)
        if (!author.toLowerCase().includes(searchTerm.toLowerCase())) {
          console.error('Author mismatch:', { expected: searchTerm, received: author });
          continue; // Try again
        }

        // Check if quote is in cache
        if (!isQuoteInCache(cacheKey, quote)) {
          addToCache(cacheKey, quote);
          return new Response(JSON.stringify({
            quote,
            author: searchTerm // Use the original search term to maintain consistent author naming
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        console.log(`Attempt ${attempt + 1}: Quote was in cache, trying again...`);
      }

      throw new Error(`Could not find a new unique quote for ${searchTerm} after 3 attempts`);
    }

    // For topic searches or random quotes, use modified prompt
    const systemPrompt = searchTerm 
      ? `You are a quote expert. ${type === 'human' 
          ? `Search for real, verified quotes about "${searchTerm}". Format: "[quote]" - [author]` 
          : type === 'ai' 
            ? `Generate an original, inspiring quote about "${searchTerm}" and attribute it to "Inspiro AI".`
            : `Either find a real quote or generate an AI quote about "${searchTerm}". If generating, attribute to "Inspiro AI".`}`
      : `You are a quote expert. ${type === 'human'
          ? 'Provide a verified quote from history.'
          : type === 'ai'
            ? 'Generate an original, inspiring quote and attribute it to "Inspiro AI".'
            : 'Either provide a verified historical quote or generate an original quote (attribute AI-generated ones to "Inspiro AI").'}`;

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
            content: 'Provide a quote following the specified criteria.'
          }
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000,
        search_domain_filter: ['quoteinvestigator.com', 'wikiquote.org', 'brainyquote.com'],
        search_recency_filter: 'month',
        frequency_penalty: 1.5,
        presence_penalty: 1.5
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content.trim();
    
    const quoteMatch = generatedText.match(/"([^"]+)"\s*-\s*(.+)/);
    if (!quoteMatch) {
      console.error('Invalid quote format received:', generatedText);
      throw new Error('Invalid quote format received from Perplexity');
    }

    return new Response(JSON.stringify({
      quote: quoteMatch[1].trim(),
      author: quoteMatch[2].trim()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-quote function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});