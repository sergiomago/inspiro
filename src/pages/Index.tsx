import { useAuth } from "@/hooks/useAuth"
import { AuthForm } from "@/components/AuthForm"
import { QuoteCard } from "@/components/QuoteCard"
import { Settings } from "@/components/Settings"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Settings as SettingsIcon, Heart, MessageSquare, Filter } from "lucide-react"
import { FavoriteQuotes } from "@/components/FavoriteQuotes"
import { Logo } from "@/components/Logo"
import { FeedbackForm } from "@/components/FeedbackForm"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SearchBar } from "@/components/SearchBar"
import { supabase } from "@/lib/supabase"

interface SavedFilter {
  id: number;
  filter_text: string;
}

export default function Index() {
  const { user, loading } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])

  useEffect(() => {
    if (user) {
      loadSavedFilters()
    }
  }, [user])

  const loadSavedFilters = async () => {
    try {
      const { data, error } = await supabase
        .from('user_filters')
        .select('id, filter_text')
      
      if (error) throw error
      setSavedFilters(data || [])
    } catch (error) {
      console.error('Error loading filters:', error)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleResetFilter = () => {
    setSearchTerm("")
  }

  const handleDeleteFilter = async (id: number) => {
    try {
      const { error } = await supabase
        .from('user_filters')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadSavedFilters()
    } catch (error) {
      console.error('Error deleting filter:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F0FB] via-[#E5DEFF] to-[#D6BCFA]">
      <div className="container mx-auto px-4 min-h-screen flex flex-col">
        <div className="flex justify-between items-center py-8">
          <Logo />
          <div className="flex gap-2">
            {user && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(true)}
                  className="hover:text-primary transition-colors text-primary-dark"
                >
                  <Filter className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFeedback(true)}
                  className="hover:text-primary transition-colors text-primary-dark"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(s => !s)}
                  className="hover:text-primary transition-colors text-primary-dark"
                >
                  <SettingsIcon className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFavorites(true)}
                  className="hover:text-primary transition-colors text-primary-dark"
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </>
            )}
            {!user && (
              <Button
                variant="outline"
                onClick={() => setShowAuthDialog(true)}
                className="hover:text-primary transition-colors text-primary-dark"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center gap-6">
          <SearchBar 
            onSearch={handleSearch} 
            currentFilter={searchTerm}
            onReset={handleResetFilter}
          />
          <QuoteCard 
            onNeedAuth={() => setShowAuthDialog(true)} 
            searchTerm={searchTerm}
          />
        </div>

        <footer className="py-4 text-center text-primary-dark/80">
          <a href="https://whytoai.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            Developed by Why to AI
          </a>
        </footer>

        {showSettings && user && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <Settings onClose={() => setShowSettings(false)} />
            </div>
          </div>
        )}

        {showFavorites && user && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <FavoriteQuotes onClose={() => setShowFavorites(false)} />
            </div>
          </div>
        )}

        {showFeedback && user && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <FeedbackForm onClose={() => setShowFeedback(false)} />
            </div>
          </div>
        )}

        {showFilters && user && (
          <Dialog open={showFilters} onOpenChange={setShowFilters}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Saved Filters</DialogTitle>
                <DialogDescription>
                  Your saved search filters. Click on a filter to use it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {savedFilters.map((filter) => (
                  <div key={filter.id} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearchTerm(filter.filter_text)
                        setShowFilters(false)
                      }}
                      className="text-left"
                    >
                      {filter.filter_text}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFilter(filter.id)}
                      className="hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {savedFilters.length === 0 && (
                  <p className="text-center text-muted-foreground">No saved filters yet.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sign in to save favorites</DialogTitle>
              <DialogDescription>
                Create an account or sign in to save your favorite quotes and access them anytime.
              </DialogDescription>
            </DialogHeader>
            <AuthForm onSuccess={() => setShowAuthDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}