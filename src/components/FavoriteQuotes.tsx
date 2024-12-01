import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface FavoriteQuotesProps {
  onClose?: () => void;
}

export const FavoriteQuotes = ({ onClose }: FavoriteQuotesProps) => {
  const [favoriteQuotes, setFavoriteQuotes] = useState<Array<{ id: number; quote: string; author: string }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('favorites')
          .select('id, quote, author')
          .eq('user_id', user.id);
        
        if (error) throw error;
        setFavoriteQuotes(data || []);
      }
    } catch (error) {
      toast.error('Error fetching favorites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (id: number) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await fetchFavorites();
      toast.success('Quote removed from favorites');
    } catch (error) {
      toast.error('Error removing favorite');
    }
  };

  return (
    <Card className="relative p-6 max-h-[80vh] overflow-y-auto bg-[#2D1B4D]/85 border-none shadow-lg">
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
          favoriteQuotes.map((quote) => (
            <Card key={quote.id} className="p-4 bg-[#2D1B4D]/95 relative border-none">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 text-white hover:text-red-500"
                onClick={() => handleRemoveFavorite(quote.id)}
              >
                <X className="h-4 w-4" />
              </Button>
              <p className="text-lg italic text-white pr-8">{quote.quote}</p>
              <p className="text-sm text-white/80 text-right mt-2">- {quote.author}</p>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};