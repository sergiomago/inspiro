import { useAuth } from "@/hooks/useAuth"
import { AuthForm } from "@/components/AuthForm"
import { QuoteCard } from "@/components/QuoteCard"
import { Settings } from "@/components/Settings"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings as SettingsIcon, Heart, MessageSquare } from "lucide-react"
import { FavoriteQuotes } from "@/components/FavoriteQuotes"
import { Logo } from "@/components/Logo"
import { FeedbackForm } from "@/components/FeedbackForm"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SearchBar } from "@/components/SearchBar"

export default function Index() {
  const { user, loading } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleResetFilter = () => {
    setSearchTerm("");
  };

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
  );
}