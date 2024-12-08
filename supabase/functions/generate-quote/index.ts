import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

function determineSearchContext(searchTerm: string) {
  // List of known authors or historical figures
  const knownAuthors = [
    "einstein", "gandhi", "shakespeare", "plato", "aristotle", "socrates",
    "newton", "tesla", "darwin", "hawking", "curie", "da vinci"
  ];
  
  const searchTermLower = searchTerm.toLowerCase();
  
  if (knownAuthors.includes(searchTermLower)) {
    return "author";
  }
  
  // Check if it looks like a concept/topic
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

    if (!searchTerm || type === 'human') {
      console.log('No search term provided or classic quote requested, returning classic quote');
      const randomIndex = Math.floor(Math.random() * classicQuotes.length);
      return new Response(
        JSON.stringify(classicQuotes[randomIndex]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchContext = determineSearchContext(searchTerm);
    console.log('Determined search context:', searchContext);

    let systemPrompt = `You are a quote generator that creates unique, diverse, and meaningful quotes. `;
    
    if (searchContext === "author") {
      systemPrompt += `The search term '${searchTerm}' is a known author/figure.
      1. Generate a quote that reflects their philosophical style and thinking
      2. The quote should feel like something they might have said, but must be original
      3. Use their typical themes and areas of expertise
      4. For attribution, create a fictional but similar-sounding name (e.g. for Einstein, use names like 'Clara Westfield' or 'Edwin Thorne')`;
    } else if (searchContext === "concept") {
      systemPrompt += `The search term '${searchTerm}' is a concept/theme.
      1. Create a profound and original quote exploring this theme
      2. Avoid common phrases and clichés
      3. Make it universally relevant while being specific
      4. Attribute it to a fictional but credible author name`;
    } else {
      systemPrompt += `The search term '${searchTerm}' is a keyword to inspire the quote.
      1. Create an original quote that incorporates or relates to this keyword
      2. The connection can be literal or metaphorical
      3. Focus on making it meaningful and memorable
      4. Attribute it to a fictional but credible author name`;
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
    
    const randomIndex = Math.floor(Math.random() * classicQuotes.length);
    return new Response(
      JSON.stringify(classicQuotes[randomIndex]),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})