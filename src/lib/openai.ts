
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export const generateQuote = async (
  type: string = 'mixed',
  searchTerm?: string,
  filterType: string = 'topic'
): Promise<{ quote: string; author: string }> => {
  console.log("generateQuote called with:", { type, searchTerm, filterType });
  
  try {
    // For mixed type without search term, randomly choose between AI and classic
    if (type === 'mixed' && !searchTerm) {
      const useClassic = Math.random() < 0.3; // 30% chance for classic quotes
      if (useClassic) {
        const randomIndex = Math.floor(Math.random() * classicQuotes.length);
        return classicQuotes[randomIndex];
      }
    }

    // Always use AI for search terms or when specifically requested
    const { data, error } = await supabase.functions.invoke('generate-quote', {
      body: { type, searchTerm, filterType }
    });

    console.log("Edge function response:", { data, error });

    if (error) {
      console.error('Error calling generate-quote function:', error);
      const randomIndex = Math.floor(Math.random() * classicQuotes.length);
      return classicQuotes[randomIndex];
    }

    // Handle the NO_MORE_QUOTES error
    if (data.error === 'NO_MORE_QUOTES') {
      toast.error(data.message);
      const randomIndex = Math.floor(Math.random() * classicQuotes.length);
      return classicQuotes[randomIndex];
    }

    return data;
  } catch (error) {
    console.error('Error generating quote:', error);
    const randomIndex = Math.floor(Math.random() * classicQuotes.length);
    return classicQuotes[randomIndex];
  }
};
