import OpenAI from 'openai';

const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || 'default-development-key';

export const openai = new OpenAI({
  apiKey: openaiApiKey,
  dangerouslyAllowBrowser: true
});

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

export const generateQuote = async (type: string = 'mixed', searchTerm?: string): Promise<{ quote: string; author: string }> => {
  try {
    if (searchTerm) {
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a quote generator that creates or finds inspiring quotes based on specific topics, keywords, or authors."
          },
          {
            role: "user",
            content: `Generate or find a relevant quote about: ${searchTerm}`
          }
        ],
        model: "gpt-4o-mini",
      });

      const response = completion.choices[0]?.message?.content || "Could not generate quote";
      const parts = response.split(' - ');
      return {
        quote: parts[0].replace(/["']/g, ''),
        author: parts[1] || "Unknown"
      };
    }

    if (type === 'human') {
      const randomIndex = Math.floor(Math.random() * classicQuotes.length);
      return {
        quote: classicQuotes[randomIndex].quote,
        author: classicQuotes[randomIndex].author
      };
    }

    if (type === 'mixed' && Math.random() < 0.5) {
      const randomIndex = Math.floor(Math.random() * classicQuotes.length);
      return {
        quote: classicQuotes[randomIndex].quote,
        author: classicQuotes[randomIndex].author
      };
    }

    const systemPrompt = type === 'ai' ? 
      "You are an AI wisdom generator. Create original, inspiring quotes that sound modern and fresh. These should be completely new, AI-generated quotes." :
      "You are a quote generator that creates inspiring and meaningful quotes. Make them sound natural and impactful.";

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: "Generate an inspiring quote"
        }
      ],
      model: "gpt-4o-mini",
    });

    return {
      quote: completion.choices[0]?.message?.content || "Could not generate quote",
      author: "Inspiro AI"
    };
  } catch (error) {
    console.error('Error generating quote:', error);
    throw error;
  }
};