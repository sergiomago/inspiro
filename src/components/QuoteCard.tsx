import { Card } from "@/components/ui/card";
import { QuoteContent } from "./quote/QuoteContent";
import { QuoteActions } from "./quote/QuoteActions";
import { useQuoteLogic } from "./quote/useQuoteLogic";

interface QuoteCardProps {
  quote?: string;
  author?: string;
  onNeedAuth?: () => void;
  searchTerm?: string;
}

export const QuoteCard = ({ 
  quote: initialQuote = "Welcome to Inspiro! Click refresh to generate your first inspirational quote.", 
  author: initialAuthor = "Inspiro",
  onNeedAuth,
  searchTerm
}: QuoteCardProps) => {
  const {
    quote,
    author,
    isLoading,
    handleRefresh,
    handleFavorite
  } = useQuoteLogic(initialQuote, initialAuthor, onNeedAuth, searchTerm);

  return (
    <Card className="w-full max-w-md p-8 animate-fade-in border-none shadow-lg bg-[#2D1B4D]/85">
      <div className="space-y-6">
        <QuoteContent quote={quote} author={author} />
        <QuoteActions 
          onFavorite={handleFavorite}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
      </div>
    </Card>
  );
};