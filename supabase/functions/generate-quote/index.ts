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

let lastGeneratedType = 'classic';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type = 'mixed', searchTerm = '', filterType = 'topic' } = await req.json();
    console.log("Generate quote called with:", { type, searchTerm, filterType });

    // If searching by author, only return quotes from that author
    if (filterType === 'author' && searchTerm) {
      // For author searches, we should only return classic quotes
      const authorQuotes = classicQuotes.filter(q => 
        q.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (authorQuotes.length > 0) {
        const randomQuote = authorQuotes[Math.floor(Math.random() * authorQuotes.length)];
        console.log("Returning author quote:", randomQuote);
        return new Response(JSON.stringify(randomQuote), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // If no quotes found for author, return a message
      return new Response(JSON.stringify({
        quote: `No quotes found from ${searchTerm}`,
        author: "System"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For topic searches or no search, follow the saved settings
    if (type === 'human' || (type === 'mixed' && lastGeneratedType === 'ai')) {
      // For classic quotes, try to find one matching the topic if specified
      if (filterType === 'topic' && searchTerm) {
        const topicQuotes = classicQuotes.filter(q => 
          q.quote.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (topicQuotes.length > 0) {
          const randomQuote = topicQuotes[Math.floor(Math.random() * topicQuotes.length)];
          if (type === 'mixed') lastGeneratedType = 'classic';
          return new Response(JSON.stringify(randomQuote), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // If no topic match or no topic specified, return random classic quote
      const randomQuote = classicQuotes[Math.floor(Math.random() * classicQuotes.length)];
      if (type === 'mixed') lastGeneratedType = 'classic';
      return new Response(JSON.stringify(randomQuote), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For AI-generated quotes
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let systemPrompt = `You are a quote generator that creates meaningful and contextually relevant quotes.
    When generating quotes, follow these rules:
    1. Create completely original, inspiring quotes
    2. NEVER quote real people or historical figures
    3. Always attribute quotes to "Inspiro AI"
    4. Keep quotes concise and impactful
    5. If given a topic, make sure the quote directly relates to it
    6. Always follow this EXACT format: "[quote text]" - Inspiro AI
    
    DO NOT include any additional text or formatting.
    ONLY return the quote in the exact format shown above.`;

    let userPrompt = filterType === 'topic' && searchTerm
      ? `Generate an original inspirational quote about ${searchTerm}.`
      : "Generate an original inspirational quote.";

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
    
    const quoteMatch = generatedText.match(/"([^"]+)"\s*-\s*(.+)/);
    if (!quoteMatch) {
      console.error('Invalid quote format received:', generatedText);
      throw new Error('Invalid quote format received from OpenAI');
    }

    const result = {
      quote: quoteMatch[1].trim(),
      author: "Inspiro AI"
    };

    if (type === 'mixed') {
      lastGeneratedType = 'ai';
    }

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