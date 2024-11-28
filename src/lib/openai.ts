import OpenAI from 'openai';

const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || 'default-development-key';

export const openai = new OpenAI({
  apiKey: openaiApiKey,
  dangerouslyAllowBrowser: true
});

export const generateQuote = async (type: string = 'mixed') => {
  try {
    const systemPrompt = type === 'human' 
      ? "You are a quote curator. Provide only real, historical quotes from famous people. Include the author's name."
      : type === 'ai' 
      ? "You are an AI wisdom generator. Create original, inspiring quotes that sound modern and fresh."
      : "You are a quote curator and creator. Alternate between providing historical quotes and generating original inspiring quotes.";

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