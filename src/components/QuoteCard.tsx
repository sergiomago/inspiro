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

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to save favorites");
        return;
      }

      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .match({ user_id: user.id, quote: quote });
        setIsFavorite(false);
        toast.success("Quote removed from favorites");
      } else {
        await supabase
          .from('favorites')
          .insert([
            { user_id: user.id, quote: quote, author: author }
          ]);
        setIsFavorite(true);
        toast.success("Quote saved to favorites");
      }
    } catch (error) {
      toast.error("Failed to save quote");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        text: `"${quote}" - ${author}`,
      });
    } catch {
      navigator.clipboard.writeText(`"${quote}" - ${author}`);
      toast.success("Quote copied to clipboard!");
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('quote_source')
        .single();
      
      const quoteType = settings?.quote_source || 'mixed';
      const newQuote = await generateQuote(quoteType);
      setQuote(newQuote);
      setAuthor(quoteType === 'human' ? 'Classic Quote' : 'Inspiro AI');
      toast.success("New quote generated!");
    } catch (error) {
      toast.error("Failed to generate quote. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-8 animate-fade-in glass-card border-none shadow-lg bg-white/10">
      <div className="space-y-6">
        <div className="space-y-4">
          <p className="text-2xl font-serif italic text-white leading-relaxed">
            "{quote}"
          </p>
          <p className="text-right text-sm text-white/80 font-medium">
            - {author}
          </p>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className={`hover:text-primary transition-colors ${isFavorite ? 'text-primary' : 'text-white'}`}
          >
            <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="hover:text-primary transition-colors text-white"
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="hover:text-primary transition-colors text-white"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </Card>
  );
};
