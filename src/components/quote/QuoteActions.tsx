import { Button } from "@/components/ui/button";
import { RefreshCw, Heart } from "lucide-react";

interface QuoteActionsProps {
  onFavorite: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const QuoteActions = ({ onFavorite, onRefresh, isLoading }: QuoteActionsProps) => {
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onFavorite}
        className="hover:text-primary-light transition-colors text-white"
      >
        <Heart className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={isLoading}
        className="hover:text-primary-light transition-colors text-white"
      >
        <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
};