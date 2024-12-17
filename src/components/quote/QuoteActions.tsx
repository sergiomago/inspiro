import { Button } from "@/components/ui/button";
import { RefreshCw, Heart } from "lucide-react";
import { ShareDialog } from "./ShareDialog";

interface QuoteActionsProps {
  onRefresh: () => void;
  onFavorite: () => void;
  isLoading?: boolean;
  quote?: string;
  author?: string;
}

export const QuoteActions = ({ 
  onRefresh, 
  onFavorite, 
  isLoading,
  quote = "",
  author = ""
}: QuoteActionsProps) => {
  return (
    <div className="flex justify-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onFavorite}
        className="text-white/80 hover:text-white hover:bg-white/10"
      >
        <Heart className="h-5 w-5" />
      </Button>
      
      <ShareDialog quote={quote} author={author} />

      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        className="text-white/80 hover:text-white hover:bg-white/10"
        disabled={isLoading}
      >
        <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
};