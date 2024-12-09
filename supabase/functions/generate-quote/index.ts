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
];

const getEinsteinQuotes = () => [
  { quote: "Imagination is more important than knowledge.", author: "Albert Einstein" },
  { quote: "Life is like riding a bicycle. To keep your balance, you must keep moving.", author: "Albert Einstein" },
  { quote: "The important thing is not to stop questioning.", author: "Albert Einstein" },
  { quote: "Logic will get you from A to B. Imagination will take you everywhere.", author: "Albert Einstein" },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type = 'mixed', searchTerm = '', filterType = 'topic' } = await req.json();
    console.log("Generate quote called with:", { type, searchTerm, filterType });

    // If searching for Einstein specifically, return a verified quote
    if (filterType === 'author' && searchTerm.toLowerCase().includes('einstein')) {
      const einsteinQuotes = getEinsteinQuotes();
      const randomQuote = einsteinQuotes[Math.floor(Math.random() * einsteinQuotes.length)];
      return new Response(JSON.stringify(randomQuote), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For classic quotes or when type is 'human'
    if (type === 'human' || (type === 'mixed' && Math.random() < 0.3)) {
      const randomQuote = classicQuotes[Math.floor(Math.random() * classicQuotes.length)];
      return new Response(JSON.stringify(randomQuote), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For AI-generated quotes
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let prompt = '';
    if (filterType === 'author') {
      prompt = `Generate an inspirational or thought-provoking quote that was actually said by ${searchTerm}. 
      If you can't find a verified quote, respond with exactly: "I could not find a verified quote from this author." - AI Assistant`;
    } else if (filterType === 'topic') {
      prompt = `Generate an inspirational quote about ${searchTerm}. Create a unique author name.`;
    } else if (filterType === 'keyword') {
      prompt = `Generate an inspirational quote that includes the word "${searchTerm}". Create a unique author name.`;
    } else {
      prompt = "Generate an inspirational quote with a unique author name.";
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a quote generator that creates meaningful and contextually relevant quotes.
            You MUST ALWAYS follow this EXACT format, including the quotes and dash:
            "[quote text]" - [author name]
            
            Examples of CORRECT format:
            "The journey of a thousand miles begins with a single step." - Lao Tzu
            "Innovation distinguishes between a leader and a follower." - Steve Jobs
            
            DO NOT include any additional text, explanation, or formatting.
            DO NOT use markdown or other formatting.
            ONLY return the quote in the exact format shown above.`
          },
          { role: 'user', content: prompt }
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
      throw new Error('Invalid quote format. Expected format: "[quote]" - [author]');
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