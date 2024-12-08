import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function determineSearchContext(searchTerm: string) {
  const knownAuthors = [
    "einstein", "gandhi", "shakespeare", "plato", "aristotle", "socrates",
    "newton", "tesla", "darwin", "hawking", "curie", "da vinci"
  ];
  
  const searchTermLower = searchTerm.toLowerCase();
  
  if (knownAuthors.includes(searchTermLower)) {
    return "author";
  }
  
  const conceptPatterns = /^(love|life|success|happiness|wisdom|courage|peace|time|nature|science|art|music|philosophy|faith|hope|dreams|growth|change|leadership)$/i;
  if (conceptPatterns.test(searchTerm)) {
    return "concept";
  }
  
  return "keyword";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);
    
    const { type = 'mixed', searchTerm } = JSON.parse(requestBody);
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('Processing request with type and searchTerm:', { type, searchTerm });
    console.log('OpenAI API Key present:', !!openAIApiKey);

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const searchContext = determineSearchContext(searchTerm);
    console.log('Determined search context:', searchContext);

    let systemPrompt = `You are a quote generator that creates unique, diverse, and meaningful quotes. 
    IMPORTANT: For author names, use diverse and unique combinations of first and last names. 
    DO NOT reuse names like "Elara" or any other specific pattern. Each quote should have a completely different author name.`;
    
    if (searchContext === "author") {
      systemPrompt += `\nThe search term '${searchTerm}' is a known author/figure.
      1. Generate a quote that reflects their philosophical style and thinking
      2. The quote should feel like something they might have said, but must be original
      3. Use their typical themes and areas of expertise
      4. For attribution, create a fictional but similar-sounding name (use diverse names, never repeat patterns)`;
    } else if (searchContext === "concept") {
      systemPrompt += `\nThe search term '${searchTerm}' is a concept/theme.
      1. Create a profound and original quote exploring this theme
      2. Avoid common phrases and clichés
      3. Make it universally relevant while being specific
      4. Attribute it to a fictional but credible author name (use diverse names, never repeat patterns)`;
    } else {
      systemPrompt += `\nThe search term '${searchTerm}' is a keyword to inspire the quote.
      1. Create an original quote that incorporates or relates to this keyword
      2. The connection can be literal or metaphorical
      3. Focus on making it meaningful and memorable
      4. Attribute it to a fictional but credible author name (use diverse names, never repeat patterns)`;
    }

    systemPrompt += `\n\nRespond in exactly this format: quote - author`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate a unique and inspiring quote about ${searchTerm}. Remember to be original and avoid common phrases.` }
    ];

    console.log('Sending request to OpenAI with messages:', messages);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 1.2,
        max_tokens: 150,
        presence_penalty: 0.8,
        frequency_penalty: 0.8,
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
    throw error;
  }
});