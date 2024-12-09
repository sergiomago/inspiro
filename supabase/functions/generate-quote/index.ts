import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildPrompt(filterType: string, searchTerm: string) {
  const baseSystemPrompt = `You are a quote generator that creates meaningful and contextually relevant quotes.
Your response MUST ALWAYS follow this EXACT format:
"[The quote text here]" - [Author name here]

Example correct formats:
"The journey of a thousand miles begins with a single step." - Lao Tzu
"Innovation distinguishes between a leader and a follower." - Steve Jobs`;

  switch (filterType) {
    case "author":
      return `${baseSystemPrompt}
      Generate a quote that was actually said or written by ${searchTerm}.
      - The quote MUST be from a real person named ${searchTerm}
      - The author name in the response MUST be "${searchTerm}"
      - If you can't find a real quote from this author, respond with an error message
      - Base it on their actual views, works, and philosophy`;

    case "topic":
      return `${baseSystemPrompt}
      Generate a quote about the topic: ${searchTerm}
      - The quote should explore this theme deeply
      - It doesn't need to contain the exact word, but should clearly relate to the topic
      - Create a unique, non-existing author name (never use names like Elara, Zara, or any repetitive patterns)
      - Make the author name diverse and culturally varied`;

    case "keyword":
      return `${baseSystemPrompt}
      Generate a quote that includes the keyword: ${searchTerm}
      - The quote MUST contain this exact word or a close variation
      - Create a unique, non-existing author name (never use names like Elara, Zara, or any repetitive patterns)
      - Make the author name diverse and culturally varied`;

    default:
      return baseSystemPrompt;
  }
}

function parseQuote(text: string): { quote: string; author: string } {
  console.log('Parsing quote text:', text);
  
  // Try to match the format "[quote]" - [author]
  const quoteMatch = text.match(/"([^"]+)"\s*-\s*(.+)/);
  if (quoteMatch) {
    return {
      quote: quoteMatch[1],
      author: quoteMatch[2].trim()
    };
  }

  // If no quotes found, try to match anything before and after a hyphen
  const fallbackMatch = text.split(/\s*-\s*/);
  if (fallbackMatch.length === 2) {
    return {
      quote: fallbackMatch[0].replace(/['"]/g, '').trim(),
      author: fallbackMatch[1].trim()
    };
  }

  throw new Error('Invalid quote format. Expected format: "[quote]" - [author]');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);
    
    const { type = 'mixed', searchTerm, filterType = 'topic' } = JSON.parse(requestBody);
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('Processing request:', { type, searchTerm, filterType });

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = buildPrompt(filterType, searchTerm);
    console.log('Using system prompt:', systemPrompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate a quote based on the given context.' }
        ],
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      console.error('Unexpected OpenAI response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    const generatedText = data.choices[0].message.content.trim();
    console.log('Generated text:', generatedText);

    const result = parseQuote(generatedText);
    console.log('Parsed result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-quote function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});