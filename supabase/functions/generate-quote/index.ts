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
    const { type = 'mixed', searchTerm } = await req.json()
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured in Edge Function secrets')
    }

    if (type === 'human') {
      const randomIndex = Math.floor(Math.random() * classicQuotes.length)
      return new Response(
        JSON.stringify(classicQuotes[randomIndex]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (type === 'mixed' && Math.random() < 0.5) {
      const randomIndex = Math.floor(Math.random() * classicQuotes.length)
      return new Response(
        JSON.stringify(classicQuotes[randomIndex]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt = type === 'ai' 
      ? "You are an AI wisdom generator. Create original, inspiring quotes that sound modern and fresh. These should be completely new, AI-generated quotes."
      : "You are a quote generator that creates inspiring and meaningful quotes. Make them sound natural and impactful."

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: searchTerm ? `Generate an inspiring quote about: ${searchTerm}` : "Generate an inspiring quote"
      }
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
      }),
    })

    const data = await response.json()
    const generatedText = data.choices[0].message.content
    const parts = generatedText.split(' - ')

    return new Response(
      JSON.stringify({
        quote: parts[0].replace(/["']/g, ''),
        author: parts[1] || "Inspiro AI"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})