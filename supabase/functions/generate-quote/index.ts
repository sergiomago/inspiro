
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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
  const patterns = [
    /"([^"]+)"\s*[-–—]\s*([^[\n]+?)(?:\[.*?\])?\.?\s*$/, 
    /"([^"]+)"\s*by\s*([^[\n]+?)(?:\[.*?\])?\.?\s*$/, 
    /['']([^'']+)['']\s*[-–—]\s*([^[\n]+?)(?:\[.*?\])?\.?\s*$/,
    /[""]([^""]+)[""]\s*[-–—]\s*([^[\n]+?)(?:\[.*?\])?\.?\s*$/,
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

  const fallbackMatch = text.match(/[""]([^""]+)[""].*?[-–—]\s*([^,\n]+)/);
  if (fallbackMatch) {
    return {
      quote: fallbackMatch[1].trim(),
      author: fallbackMatch[2].trim().replace(/\[\d+\]$/, '').trim()
    };
  }

  return null;
}

async function isQuoteUsed(supabase: any, searchKey: string, quote: string, quoteType: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('used_quotes')
      .select('id')
      .eq('search_key', searchKey)
      .eq('quote', quote)
      .eq('quote_type', quoteType);

    if (error) {
      console.error('Error checking used quote:', error);
      return false; // If there's an error, allow the quote to be used
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Exception checking used quote:', error);
    return false; // If there's an error, allow the quote to be used
  }
}

async function markQuoteAsUsed(supabase: any, searchKey: string, quote: string, quoteType: string) {
  try {
    const { error } = await supabase
      .from('used_quotes')
      .insert({ 
        search_key: searchKey, 
        quote: quote,
        quote_type: quoteType 
      });

    if (error) {
      console.error('Error marking quote as used:', error);
    }
  } catch (error) {
    console.error('Exception marking quote as used:', error);
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For mixed type without search term, try classic quotes first
    if (type === 'mixed' && !searchTerm) {
      const useClassic = Math.random() < 0.1; // 10% chance for classic quotes
      if (useClassic) {
        for (const quote of classicQuotes) {
          if (!await isQuoteUsed(supabase, 'classic', quote.quote, 'classic')) {
            await markQuoteAsUsed(supabase, 'classic', quote.quote, 'classic');
            return new Response(JSON.stringify(quote), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
    }

    let systemPrompt = '';
    const promptVariations = [
      'present a unique perspective',
      'share wisdom from a different angle',
      'offer a fresh insight',
      'express a thought-provoking idea',
    ];
    const variation = promptVariations[Math.floor(Math.random() * promptVariations.length)];
    
    if (filterType === 'author' && searchTerm) {
      systemPrompt = `You are a quote curator specializing in ${searchTerm}'s work. Find a verified, different quote that ${variation}. 
      The quote must be historically accurate and properly attributed.
      Format the response exactly like this: "Quote text" - ${searchTerm}`;
    } else if (searchTerm) {
      systemPrompt = `You are a quote curator. ${
        type === 'human' 
          ? `Find a real, verified quote about "${searchTerm}" that ${variation}. Ensure it's accurate and properly attributed.` 
          : type === 'ai' 
            ? `Generate an original, inspiring quote about "${searchTerm}" that ${variation}. Format as: "Quote text" - Inspiro AI` 
            : `Either find a real quote or generate an AI quote about "${searchTerm}" that ${variation}. If generating, format as: "Quote text" - Inspiro AI`
      }
      Format the response exactly as: "Quote text" - Author Name`;
    } else {
      systemPrompt = `You are a quote curator. ${
        type === 'human'
          ? `Share a historically verified quote that ${variation}. Choose something meaningful and properly attributed.` 
          : type === 'ai'
            ? `Generate an original, inspiring quote that ${variation}. Format as: "Quote text" - Inspiro AI`
            : `Either provide a verified historical quote or generate an original quote that ${variation}. If generating, format as: "Quote text" - Inspiro AI`
      }
      Format the response exactly as: "Quote text" - Author Name`;
    }

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Provide a quote following the specified format.' }
          ],
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.choices[0].message.content.trim();
      console.log("Generated text:", generatedText);

      const extracted = extractQuoteAndAuthor(generatedText);
      if (!extracted) {
        throw new Error('Failed to extract quote from response');
      }

      const quoteType = type === 'human' ? 'human' : type === 'ai' ? 'ai' : 'mixed';
      const searchKey = `${filterType}:${searchTerm || 'random'}`;

      if (!await isQuoteUsed(supabase, searchKey, extracted.quote, quoteType)) {
        await markQuoteAsUsed(supabase, searchKey, extracted.quote, quoteType);
        return new Response(JSON.stringify(extracted), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      console.error('Error generating quote:', error);
      
      // Fallback to classic quotes
      const randomIndex = Math.floor(Math.random() * classicQuotes.length);
      const fallbackQuote = classicQuotes[randomIndex];
      
      return new Response(JSON.stringify(fallbackQuote), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If everything fails, return a classic quote
    const randomIndex = Math.floor(Math.random() * classicQuotes.length);
    return new Response(JSON.stringify(classicQuotes[randomIndex]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Critical error in generate-quote function:', error);
    
    // Return a classic quote in case of critical error
    const randomIndex = Math.floor(Math.random() * classicQuotes.length);
    return new Response(JSON.stringify(classicQuotes[randomIndex]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
