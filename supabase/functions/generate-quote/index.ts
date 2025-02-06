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
              content: `You are a quote expert. Search for and verify quotes from the specified author.
              Only return quotes that you can verify are genuinely from this author.
              If no verified quotes are found, clearly state this.
              Format: "[quote text]" - [author name]`
            },
            {
              role: 'user',
              content: `Find a verified quote from ${searchTerm}`
            }
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 1000,
          search_domain_filter: ['quoteinvestigator.com', 'wikiquote.org', 'brainyquote.com'],
          search_recency_filter: 'month',
          frequency_penalty: 1,
          presence_penalty: 0
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
    }

    // For topic searches or random quotes, use Perplexity with different prompts
    const systemPrompt = searchTerm 
      ? `You are a quote expert. ${type === 'human' 
          ? `Search for real, verified quotes about "${searchTerm}".` 
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
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1000,
        search_domain_filter: ['quoteinvestigator.com', 'wikiquote.org', 'brainyquote.com'],
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
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