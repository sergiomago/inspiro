import OpenAI from 'openai';

const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!openaiApiKey) {
  throw new Error('Missing OpenAI API key');
}

export const openai = new OpenAI({
  apiKey: openaiApiKey,
  dangerouslyAllowBrowser: true // Note: In production, API calls should be made through a backend
});

export const generateQuote = async (topic: string) => {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a motivational quote generator. Generate a short, inspiring quote related to the given topic."
        },
        {
          role: "user",
          content: `Generate a motivational quote about ${topic}`
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