import { supabase } from "@/lib/supabase";

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
    const { data, error } = await supabase.functions.invoke('generate-quote', {
      body: { type, searchTerm }
    });

    if (error) {
      console.error('Error calling generate-quote function:', error);
      // Fallback to classic quotes if the function fails
      const randomIndex = Math.floor(Math.random() * classicQuotes.length);
      return classicQuotes[randomIndex];
    }

    return data;
  } catch (error) {
    console.error('Error generating quote:', error);
    // Fallback to classic quotes if there's an error
    const randomIndex = Math.floor(Math.random() * classicQuotes.length);
    return classicQuotes[randomIndex];
  }
};