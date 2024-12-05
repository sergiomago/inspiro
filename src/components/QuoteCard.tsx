import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Heart } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { generateQuote } from "@/lib/openai";
import { supabase } from "@/lib/supabase";

interface QuoteCardProps {
  quote?: string;
  author?: string;
  onNeedAuth?: () => void;
}

export const QuoteCard = ({ 
  quote: initialQuote = "Welcome to Inspiro! Click refresh to generate your first inspirational quote.", 
  author: initialAuthor = "Inspiro",
  onNeedAuth 
}: QuoteCardProps) => {
  const [quote, setQuote] = useState(initialQuote);
  const [author, setAuthor] = useState(initialAuthor);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let quoteType = 'mixed'; // Default quote type

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
      
      const { quote: newQuote, author: newAuthor } = await generateQuote(quoteType);
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

  return (
    <Card className="w-full max-w-md p-8 animate-fade-in border-none shadow-lg bg-[#2D1B4D]/85">
      <div className="space-y-6">
        <div className="space-y-4">
          <p className="text-2xl font-serif italic text-white leading-relaxed">
            "{quote}"
          </p>
          <p className="text-right text-sm text-white/90 font-medium">
            - {author}
          </p>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavorite}
            className="hover:text-primary-light transition-colors text-white"
          >
            <Heart className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="hover:text-primary-light transition-colors text-white"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </Card>
  );
};