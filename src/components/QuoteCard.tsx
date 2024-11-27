import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Share2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { generateQuote } from "@/lib/openai";

interface QuoteCardProps {
  quote?: string;
  author?: string;
}

export const QuoteCard = ({ quote: initialQuote = "Click refresh to generate a quote", author: initialAuthor = "AI" }: QuoteCardProps) => {
  const [quote, setQuote] = useState(initialQuote);
  const [author, setAuthor] = useState(initialAuthor);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    toast.success("Quote saved to favorites!");
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
      const newQuote = await generateQuote("inspiration");
      setQuote(newQuote);
      setAuthor("AI");
      toast.success("New quote generated!");
    } catch (error) {
      toast.error("Failed to generate quote. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-6 animate-fade-in bg-white/50 backdrop-blur-sm">
      <div className="space-y-4">
        <p className="text-xl font-serif italic text-gray-800">{quote}</p>
        <p className="text-right text-sm text-gray-600">- {author}</p>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className="hover:text-primary"
          >
            <Heart className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="hover:text-primary"
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="hover:text-primary"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </Card>
  );
};