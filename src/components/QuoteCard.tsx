import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Share2 } from "lucide-react";
import { toast } from "sonner";

interface QuoteCardProps {
  quote: string;
  author: string;
}

export const QuoteCard = ({ quote, author }: QuoteCardProps) => {
  const handleSave = () => {
    toast.success("Quote saved to favorites!");
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        text: `"${quote}" - ${author}`,
      });
    } catch {
      toast.success("Quote copied to clipboard!");
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
        </div>
      </div>
    </Card>
  );
};