import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface FavoriteQuotesProps {
  onClose?: () => void;
}

export const FavoriteQuotes = ({ onClose }: FavoriteQuotesProps) => {
  const [favoriteQuotes, setFavoriteQuotes] = useState<Array<{ quote: string; author: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('favorites')
            .select('quote, author')
            .eq('user_id', user.id);
          setFavoriteQuotes(data || []);
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  return (
    <Card className="glass-card border-none shadow-lg relative p-6 max-h-[80vh] overflow-y-auto bg-white/10">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 text-white hover:text-primary"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <h2 className="text-2xl font-bold text-white mb-6">Favorite Quotes</h2>
      
      <div className="space-y-4">
        {loading ? (
          <p className="text-white/80">Loading your favorites...</p>
        ) : favoriteQuotes.length === 0 ? (
          <p className="text-white/80">No favorite quotes yet. Start saving some!</p>
        ) : (
          favoriteQuotes.map((quote, index) => (
            <Card key={index} className="p-4 bg-white/20">
              <p className="text-lg italic text-white">{quote.quote}</p>
              <p className="text-sm text-white/80 text-right mt-2">- {quote.author}</p>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};