import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildPrompt(filterType: string, searchTerm: string) {
  const baseSystemPrompt = `You are a quote generator that creates meaningful and contextually relevant quotes. 
  Your responses must ALWAYS be in the format: quote - author`;

  switch (filterType) {
    case "author":
      return `${baseSystemPrompt}
      Generate a quote that could have been said by ${searchTerm}.
      - The quote should reflect their known philosophy, style, and areas of expertise
      - The author name in the response MUST be "${searchTerm}"
      - Make it feel authentic to their way of thinking
      - If it's a well-known person, base it on their actual views and works`;

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
        model: 'gpt-3.5-turbo',
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

    const parts = generatedText.split(' - ');
    
    if (parts.length < 2) {
      console.error('Invalid quote format:', generatedText);
      throw new Error('Invalid quote format received');
    }

    const result = {
      quote: parts[0].replace(/["']/g, ''),
      author: parts[1]
    };

    console.log('Returning result:', result);

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