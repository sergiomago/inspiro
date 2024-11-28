import OpenAI from 'openai';

const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || 'default-development-key';

export const openai = new OpenAI({
  apiKey: openaiApiKey,
  dangerouslyAllowBrowser: true
});

export const generateQuote = async (type: string = 'mixed') => {
  try {
    let systemPrompt = '';
    
    switch (type) {
      case 'human':
        systemPrompt = "You are a quote curator. Provide only real, historical quotes from famous people. The quote must be from a real person and must be historically accurate. Include the author's real name.";
        break;
      case 'ai':
        systemPrompt = "You are an AI wisdom generator. Create original, inspiring quotes that sound modern and fresh. These should be completely new, AI-generated quotes.";
        break;
      default: // mixed
        systemPrompt = "Alternate between providing historical quotes from real people and generating original inspiring quotes. If it's a historical quote, include the real author's name.";
    }

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
      model: "gpt-4o",
    });

    return completion.choices[0]?.message?.content || "Could not generate quote";
  } catch (error) {
    console.error('Error generating quote:', error);
    throw error;
  }
};