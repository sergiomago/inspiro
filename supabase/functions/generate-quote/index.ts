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

    // For classic quotes, return from our predefined list
    if (type === 'human') {
      const randomQuote = classicQuotes[Math.floor(Math.random() * classicQuotes.length)];
      console.log("Returning classic quote:", randomQuote);
      return new Response(JSON.stringify(randomQuote), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For AI-generated quotes or when searching
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = `You are a quote generator that creates meaningful and contextually relevant quotes.
    When generating quotes, follow these rules:
    1. For AI quotes (type='ai'): Create completely original quotes with fictional modern authors. Never use real historical figures.
    2. For author quotes (filterType='author'): Create quotes that match the author's style and philosophy
    3. Always follow this EXACT format: "[quote text]" - [author name]
    
    DO NOT include any additional text or formatting.
    ONLY return the quote in the exact format shown above.`;

    let userPrompt = '';
    if (filterType === 'author' && searchTerm) {
      userPrompt = `Generate an inspirational quote in the style of ${searchTerm}. 
      The quote should reflect their known philosophy and speaking style.
      Make sure to attribute the quote to ${searchTerm}.`;
    } else if (type === 'ai') {
      userPrompt = `Create an original inspirational quote with a fictional modern author name.
      The author MUST be fictional, do not use any real historical figures.`;
    } else if (filterType === 'topic') {
      userPrompt = `Generate an inspirational quote about ${searchTerm}. Create a unique author name.`;
    } else if (filterType === 'keyword') {
      userPrompt = `Generate an inspirational quote that includes the word "${searchTerm}". Create a unique author name.`;
    } else {
      userPrompt = "Generate an original inspirational quote with a unique author name.";
    }

    console.log("Calling OpenAI with prompt:", userPrompt);

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content.trim();
    
    // Parse the quote to ensure correct format
    const quoteMatch = generatedText.match(/"([^"]+)"\s*-\s*(.+)/);
    if (!quoteMatch) {
      console.error('Invalid quote format received:', generatedText);
      throw new Error('Invalid quote format received from OpenAI');
    }

    const result = {
      quote: quoteMatch[1].trim(),
      author: quoteMatch[2].trim()
    };

    console.log("Generated quote:", result);
    return new Response(JSON.stringify(result), {
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