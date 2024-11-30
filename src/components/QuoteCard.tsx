import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Share2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { generateQuote } from "@/lib/openai";
import { supabase } from "@/lib/supabase";

interface QuoteCardProps {
  quote?: string;
  author?: string;
}

export const QuoteCard = ({ quote: initialQuote = "Welcome to Inspiro! Click refresh to generate your first inspirational quote.", author: initialAuthor = "Inspiro" }: QuoteCardProps) => {
  const [quote, setQuote] = useState(initialQuote);
  const [author, setAuthor] = useState(initialAuthor);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const checkIfFavorite = async (quoteText: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('quote', quoteText);
        
        setIsFavorite(data && data.length > 0);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  useEffect(() => {
    checkIfFavorite(quote);
  }, [quote]);

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to save favorites");
        return;
      }

      if (isFavorite) {
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('quote', quote);

        if (data && data.length > 0) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', data[0].id);
            
          if (error) throw error;
          setIsFavorite(false);
          toast.success("Quote removed from favorites");
        }
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([
            { user_id: user.id, quote: quote, author: author }
          ]);
          
        if (error) throw error;
        setIsFavorite(true);
        toast.success("Quote saved to favorites");
      }
    } catch (error) {
      toast.error("Failed to save quote");
      console.error('Error saving quote:', error);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Inspirational Quote',
          text: `"${quote}" - ${author}`,
        });
        toast.success("Quote shared successfully!");
      } else {
        await navigator.clipboard.writeText(`"${quote}" - ${author}`);
        toast.success("Quote copied to clipboard!");
      }
    } catch (error) {
      console.error('Error sharing quote:', error);
      toast.error("Failed to share quote");
    }
  };

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
      setIsFavorite(false);
    } catch (error) {
      toast.error("Failed to generate quote. Please try again.");
      console.error('Error generating quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-8 animate-fade-in glass-card border-none shadow-lg bg-primary-dark/90">
      <div className="space-y-6">
        <div className="space-y-4">
          <p className="text-2xl font-serif italic text-white leading-relaxed drop-shadow-lg">
            "{quote}"
          </p>
          <p className="text-right text-sm text-white/90 font-medium drop-shadow">
            - {author}
          </p>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className={`hover:text-primary-light transition-colors drop-shadow-lg ${isFavorite ? 'text-primary-light' : 'text-white'}`}
          >
            <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="hover:text-primary-light transition-colors text-white drop-shadow-lg"
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="hover:text-primary-light transition-colors text-white drop-shadow-lg"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </Card>
  );
};