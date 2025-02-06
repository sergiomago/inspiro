
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
  
  const patterns = [
    /"([^"]+)"\s*[-–—]\s*([^[\n]+?)(?:\[.*?\])?\.?\s*$/, 
    /"([^"]+)"\s*by\s*([^[\n]+?)(?:\[.*?\])?\.?\s*$/, 
    /['']([^'']+)['']\s*[-–—]\s*([^[\n]+?)(?:\[.*?\])?\.?\s*$/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        quote: match[1].trim(),
        author: match[2].trim().replace(/\[\d+\]$/, '').trim()
      };
    }
  }

  const fallbackMatch = text.match(/"([^"]+)".*?[-–—]\s*([^,\n]+)/);
  if (fallbackMatch) {
    return {
      quote: fallbackMatch[1].trim(),
      author: fallbackMatch[2].trim().replace(/\[\d+\]$/, '').trim()
    };
  }

  return null;
}

async function isQuoteUsed(supabase: any, searchKey: string, quote: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('used_quotes')
    .select('id')
    .eq('search_key', searchKey)
    .eq('quote', quote)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error checking used quote:', error);
    return false; // On error, assume not used to allow operation to continue
  }

  return !!data;
}

async function markQuoteAsUsed(supabase: any, searchKey: string, quote: string) {
  const { error } = await supabase
    .from('used_quotes')
    .insert({ search_key: searchKey, quote });

  if (error) {
    console.error('Error marking quote as used:', error);
  }
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For mixed type without search term, adjust classic quote probability
    if (type === 'mixed' && !searchTerm) {
      const useClassic = Math.random() < 0.2; // Reduce to 20% chance for classic quotes
      if (useClassic) {
        const randomIndex = Math.floor(Math.random() * classicQuotes.length);
        const quote = classicQuotes[randomIndex];
        const searchKey = 'classic';
        if (!await isQuoteUsed(supabase, searchKey, quote.quote)) {
          await markQuoteAsUsed(supabase, searchKey, quote.quote);
          return new Response(JSON.stringify(quote), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    const maxAttempts = filterType === 'author' ? 5 : 3;
    let attempts = 0;
    let exhaustedQuotes = false;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts} of ${maxAttempts}`);

      let systemPrompt = '';
      
      if (filterType === 'author' && searchTerm) {
        systemPrompt = `You are a quote expert. Find a verified, different quote from ${searchTerm} that hasn't been shared before. 
        The quote must be historically accurate and properly attributed.
        Format the response exactly like this: "Quote text" - Author Name
        If you've exhausted all known quotes from this author, respond with: NO_MORE_QUOTES`;
      } else if (searchTerm) {
        systemPrompt = `You are a quote expert. ${
          type === 'human' 
            ? `Find a real, verified quote about "${searchTerm}" from a historically significant figure. Make sure it's accurate and properly attributed.` 
            : type === 'ai' 
              ? `Generate an original, inspiring quote about "${searchTerm}". Format the response exactly as: "Quote text" - Inspiro AI` 
              : `Either find a real quote or generate an AI quote about "${searchTerm}" from a different perspective than previous quotes. If generating, format as: "Quote text" - Inspiro AI`
        }
        Format the response exactly as: "Quote text" - Author Name`;
      } else {
        systemPrompt = `You are a quote expert. ${
          type === 'human'
            ? 'Provide a historically verified quote from a significant figure. Choose something meaningful and properly attributed.' 
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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Provide a quote following the specified format.' }
          ],
          temperature: 0.7, // Reduced for more consistent output
          top_p: 0.95, // Slightly increased for more variety
          frequency_penalty: 1.2, // Increased to reduce repetition
          presence_penalty: 1.2, // Increased to encourage different content
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.choices[0].message.content.trim();
      console.log("Perplexity response:", generatedText);

      if (generatedText === 'NO_MORE_QUOTES') {
        exhaustedQuotes = true;
        break;
      }

      const extracted = extractQuoteAndAuthor(generatedText);
      if (!extracted) {
        console.log('Failed to extract quote from:', generatedText);
        continue;
      }

      const searchKey = `${filterType}:${searchTerm || 'random'}`;
      if (!await isQuoteUsed(supabase, searchKey, extracted.quote)) {
        await markQuoteAsUsed(supabase, searchKey, extracted.quote);
        return new Response(JSON.stringify(extracted), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Quote was already used, trying again...');
    }

    if (exhaustedQuotes) {
      return new Response(JSON.stringify({ 
        error: 'NO_MORE_QUOTES',
        message: `No more unique quotes available from ${searchTerm}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If we couldn't get a unique quote after all attempts, try a classic quote
    console.log('Failed to get unique quote after all attempts, using classic quote');
    let classicQuote = null;
    for (const quote of classicQuotes) {
      if (!await isQuoteUsed(supabase, 'classic', quote.quote)) {
        classicQuote = quote;
        await markQuoteAsUsed(supabase, 'classic', quote.quote);
        break;
      }
    }

    // If all classic quotes are used, reset the oldest one
    if (!classicQuote) {
      const randomIndex = Math.floor(Math.random() * classicQuotes.length);
      classicQuote = classicQuotes[randomIndex];
    }

    return new Response(JSON.stringify(classicQuote), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-quote function:', error);
    // On error, return a random classic quote without marking it as used
    const randomIndex = Math.floor(Math.random() * classicQuotes.length);
    return new Response(JSON.stringify(classicQuotes[randomIndex]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
