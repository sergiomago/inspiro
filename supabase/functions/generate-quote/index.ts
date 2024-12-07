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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { type = 'mixed', searchTerm } = await req.json()
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

    console.log('Request received:', { type, searchTerm });

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured')
    }

    // Return classic quote for 'human' type or 50% of 'mixed' type requests without filters
    if (!searchTerm && (type === 'human' || (type === 'mixed' && Math.random() < 0.5))) {
      const randomIndex = Math.floor(Math.random() * classicQuotes.length)
      return new Response(
        JSON.stringify(classicQuotes[randomIndex]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let systemPrompt = type === 'ai' 
      ? "You are an AI wisdom generator that creates original, inspiring quotes that sound modern and fresh. These should be completely new, AI-generated quotes."
      : "You are a quote generator that creates inspiring and meaningful quotes. Make them sound natural and impactful."

    // Add filter context to system prompt
    if (searchTerm) {
      systemPrompt += ` Focus on creating quotes specifically about: ${searchTerm}. The quotes should deeply reflect this theme while remaining inspirational and meaningful.`
    }

    systemPrompt += " Always respond in the format: 'quote - author'. Make sure each quote is unique and hasn't been generated before. Avoid common clichés and create truly original content."

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: "Generate a unique and inspiring quote that hasn't been used before."
      }
    ]

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
        temperature: 0.9, // Increased for more creativity
        max_tokens: 100,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
    }

    const data = await response.json()
    console.log('OpenAI response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response format:', data);
      throw new Error('Invalid response format from OpenAI');
    }

    const generatedText = data.choices[0].message.content.trim()
    const parts = generatedText.split(' - ')

    if (parts.length < 2) {
      console.error('Invalid quote format:', generatedText);
      throw new Error('Invalid quote format received');
    }

    const result = {
      quote: parts[0].replace(/["']/g, ''),
      author: parts[1]
    }

    console.log('Returning result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-quote function:', error)
    const randomIndex = Math.floor(Math.random() * classicQuotes.length)
    return new Response(
      JSON.stringify(classicQuotes[randomIndex]),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})