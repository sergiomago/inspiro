import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { generateQuote } from "@/lib/openai";
import { supabase } from "@/lib/supabase";

interface QuoteCardProps {
  quote?: string;
  author?: string;
}

export const QuoteCard = ({ 
  quote: initialQuote = "Welcome to Inspiro! Click refresh to generate your first inspirational quote.", 
  author: initialAuthor = "Inspiro" 
}: QuoteCardProps) => {
  const [quote, setQuote] = useState(initialQuote);
  const [author, setAuthor] = useState(initialAuthor);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data } = await supabase
        .from('user_settings')
        .select('quote_source')
        .eq('user_id', user.id);
      
      const quoteType = data && data.length > 0 ? data[0].quote_source : 'mixed';
      const { quote: newQuote, author: newAuthor } = await generateQuote(quoteType);
      setQuote(newQuote);
      setAuthor(newAuthor);
    } catch (error) {
      toast.error("Failed to generate quote. Please try again.");
      console.error('Error generating quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-8 animate-fade-in border-none shadow-lg bg-[#2D1B4D]">
      <div className="space-y-6">
        <div className="space-y-4">
          <p className="text-2xl font-serif italic text-white leading-relaxed">
            "{quote}"
          </p>
          <p className="text-right text-sm text-white/90 font-medium">
            - {author}
          </p>
        </div>
        
        <div className="flex justify-end">
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