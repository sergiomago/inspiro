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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);
    
    const { type = 'mixed', searchTerm } = JSON.parse(requestBody);
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('Processing request:', { type, searchTerm });

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    // If no search term is provided, return a classic quote
    if (!searchTerm) {
      console.log('No search term provided, returning classic quote');
      const randomIndex = Math.floor(Math.random() * classicQuotes.length);
      return new Response(
        JSON.stringify(classicQuotes[randomIndex]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messages = [
      {
        role: "system",
        content: `You are a quote generator that creates unique, diverse, and meaningful quotes. 
        Important instructions:
        1. NEVER repeat quotes that have been commonly used or are well-known.
        2. If the search term '${searchTerm}' appears to be an author's name:
           - Generate a quote in their style but DO NOT use their actual quotes
           - Maintain their tone and philosophy while creating something new
        3. If '${searchTerm}' is a theme or topic:
           - Create a completely original quote that deeply explores this theme
           - Ensure the quote is profound, unique, and not cliché
           - Assign it to a fictional but credible author with a realistic name
        4. Each generated quote must be different from previous ones
        5. Avoid common phrases and overused metaphors
        6. Make the quote concise but impactful

        Respond in exactly this format: quote - author`
      },
      {
        role: "user",
        content: `Generate a unique and inspiring quote about ${searchTerm}. Remember to be original and avoid common phrases.`
      }
    ];

    console.log('Sending request to OpenAI:', { messages });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 1.2, // Increased for more creativity and variety
        max_tokens: 150,
        presence_penalty: 0.8, // Added to encourage unique content
        frequency_penalty: 0.8, // Added to discourage repetition
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
    
    // Only fall back to classic quotes for API key configuration errors
    if (error.message.includes('OpenAI API key not configured')) {
      const randomIndex = Math.floor(Math.random() * classicQuotes.length);
      return new Response(
        JSON.stringify(classicQuotes[randomIndex]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For other errors, return the error to the client
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})