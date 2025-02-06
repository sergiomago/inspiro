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
  console.log("Attempting to extract quote from:", text);
  
  // Try different quote formats
  const patterns = [
    /"([^"]+)"\s*[-–—]\s*([^[\n]+)/, // "quote" - author
    /"([^"]+)"\s+by\s+([^[\n]+)/, // "quote" by author
    /([^"]+)\s*[-–—]\s*([^[\n]+)/, // quote - author (no quotes)
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const quote = match[1].trim();
      let author = match[2].trim();
      
      // Clean up author name
      author = author.replace(/\[.*?\]/g, '').trim(); // Remove citations like [1]
      author = author.replace(/\.$/, '').trim(); // Remove trailing period
      
      if (quote && author) {
        console.log("Successfully extracted:", { quote, author });
        return { quote, author };
      }
    }
  }
  
  console.log("Failed to extract quote using patterns");
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

    // For mixed type without search term, randomly choose between AI and classic
    if (type === 'mixed' && !searchTerm) {
      const useClassic = Math.random() < 0.3; // 30% chance for classic quotes
      if (useClassic) {
        const randomIndex = Math.floor(Math.random() * classicQuotes.length);
        return new Response(JSON.stringify(classicQuotes[randomIndex]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Construct system prompt based on search type
    const systemPrompt = filterType === 'author' && searchTerm
      ? `You are a quote expert. Find a verified quote from ${searchTerm}. Format the response exactly as: "quote" - author`
      : `You are a quote expert. ${type === 'human' 
          ? `Find a real, verified quote${searchTerm ? ` about "${searchTerm}"` : ''}.` 
          : type === 'ai' 
            ? `Generate an original, inspiring quote${searchTerm ? ` about "${searchTerm}"` : ''} and attribute it to "Inspiro AI".`
            : `Either find a real quote or generate an AI quote${searchTerm ? ` about "${searchTerm}"` : ''}. If generating, attribute to "Inspiro AI".`}
        Format the response exactly as: "quote" - author`;

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
        temperature: 0.7, // Increased for more variety
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
    
    const extracted = extractQuoteAndAuthor(generatedText);
    if (!extracted) {
      console.error('Failed to extract quote from:', generatedText);
      // Fallback to classic quotes
      const randomIndex = Math.floor(Math.random() * classicQuotes.length);
      return new Response(JSON.stringify(classicQuotes[randomIndex]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For author searches, verify the author matches
    if (filterType === 'author' && searchTerm) {
      const authorLower = extracted.author.toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();
      if (!authorLower.includes(searchTermLower)) {
        console.log("Author mismatch, falling back to classic quote");
        const randomIndex = Math.floor(Math.random() * classicQuotes.length);
        return new Response(JSON.stringify(classicQuotes[randomIndex]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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