import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildPrompt(filterType: string, searchTerm: string) {
  const baseSystemPrompt = `You are a quote generator that creates meaningful and contextually relevant quotes.
You MUST ALWAYS follow this EXACT format, including the quotes and dash:
"[quote text]" - [author name]

Examples of CORRECT format:
"The journey of a thousand miles begins with a single step." - Lao Tzu
"Innovation distinguishes between a leader and a follower." - Steve Jobs

DO NOT include any additional text, explanation, or formatting.
DO NOT use markdown or other formatting.
ONLY return the quote in the exact format shown above.`;

  switch (filterType) {
    case "author":
      return `${baseSystemPrompt}
Generate a quote that was actually said or written by ${searchTerm}.
The quote MUST be from this exact author.
If you can't find a real quote from this author, use this format:
"I could not find a verified quote from this author." - AI Assistant`;

    case "topic":
      return `${baseSystemPrompt}
Generate an inspirational quote about: ${searchTerm}
The quote should be meaningful and relate to this topic.
Create a unique, culturally diverse author name.`;

    case "keyword":
      return `${baseSystemPrompt}
Generate a quote that includes the word: ${searchTerm}
The quote MUST contain this exact word or a close variation.
Create a unique, culturally diverse author name.`;

    default:
      return `${baseSystemPrompt}
Generate an inspirational quote.
Make it meaningful and impactful.
Create a unique, culturally diverse author name.`;
  }
}

function parseQuote(text: string): { quote: string; author: string } {
  console.log('Parsing quote text:', text);
  
  // Match the exact format "[quote]" - [author]
  const quoteMatch = text.match(/"([^"]+)"\s*-\s*(.+)/);
  if (!quoteMatch) {
    throw new Error('Invalid quote format. Expected format: "[quote]" - [author]');
  }

  return {
    quote: quoteMatch[1].trim(),
    author: quoteMatch[2].trim()
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);
    
    const { type = 'mixed', searchTerm = '', filterType = '' } = JSON.parse(requestBody);
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
          { role: 'user', content: 'Generate a quote following the exact format specified.' }
        ],
        temperature: 0.7,
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