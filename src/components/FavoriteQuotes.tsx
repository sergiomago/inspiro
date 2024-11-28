import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface FavoriteQuotesProps {
  onClose?: () => void;
}

export const FavoriteQuotes = ({ onClose }: FavoriteQuotesProps) => {
  // This would typically come from your state management or database
  const favoriteQuotes = [
    { quote: "The best way to predict the future is to create it.", author: "Peter Drucker" },
    { quote: "Life is what happens while you're busy making other plans.", author: "John Lennon" },
  ];

  return (
    <Card className="glass-card border-none shadow-lg relative p-6 max-h-[80vh] overflow-y-auto">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <h2 className="text-2xl font-bold text-primary-dark mb-6">Favorite Quotes</h2>
      
      <div className="space-y-4">
        {favoriteQuotes.map((quote, index) => (
          <Card key={index} className="p-4 bg-white/50">
            <p className="text-lg italic text-primary-dark">{quote.quote}</p>
            <p className="text-sm text-gray-600 text-right mt-2">- {quote.author}</p>
          </Card>
        ))}
      </div>
    </Card>
  );
};