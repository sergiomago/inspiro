import { useState } from "react";
import { toast } from "sonner";
import { generateQuote } from "@/lib/openai";
import { supabase } from "@/integrations/supabase/client";

export const useQuoteLogic = (
  initialQuote: string,
  initialAuthor: string,
  onNeedAuth?: () => void,
  searchTerm?: string,
  filterType?: string
) => {
  const [quote, setQuote] = useState(initialQuote);
  const [author, setAuthor] = useState(initialAuthor);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    console.log("handleRefresh called with:", { searchTerm, filterType });
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let quoteType = 'mixed';

      if (user) {
        const { data } = await supabase
          .from('user_settings')
          .select('quote_source')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          quoteType = data.quote_source;
        }
      }
      
      console.log("Calling generateQuote with:", { quoteType, searchTerm, filterType });
      const { quote: newQuote, author: newAuthor } = await generateQuote(quoteType, searchTerm, filterType);
      console.log("Generated quote:", { newQuote, newAuthor });
      
      setQuote(newQuote);
      setAuthor(newAuthor);
    } catch (error) {
      console.error('Error generating quote:', error);
      toast.error("Failed to generate quote. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        onNeedAuth?.();
        return;
      }

      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, quote, author });
      
      if (error) throw error;
      toast.success('Quote added to favorites!');
    } catch (error) {
      toast.error('Failed to save quote to favorites');
    }
  };

  return {
    quote,
    author,
    isLoading,
    handleRefresh,
    handleFavorite
  };
};