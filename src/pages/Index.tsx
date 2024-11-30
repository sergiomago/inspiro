import { useAuth } from "@/hooks/useAuth"
import { AuthForm } from "@/components/AuthForm"
import { QuoteCard } from "@/components/QuoteCard"
import { Settings } from "@/components/Settings"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings as SettingsIcon, Heart } from "lucide-react"
import { FavoriteQuotes } from "@/components/FavoriteQuotes"
import { Logo } from "@/components/Logo"

export default function Index() {
  const { user, loading } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E5DEFF] via-[#b8a8f8] to-[#9b87f5]">
      {!user ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="relative z-10 text-center space-y-6">
            <Logo />
            <p className="text-primary-dark/80 mb-8">Daily inspiration for your journey</p>
            <AuthForm />
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 min-h-screen flex flex-col">
          <div className="flex justify-between items-center py-8">
            <Logo />
            <div className="flex gap-2">
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
            </div>
          </div>

          <div className="flex-grow flex items-center justify-center">
            <QuoteCard />
          </div>

          {showSettings && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md">
                <Settings onClose={() => setShowSettings(false)} />
              </div>
            </div>
          )}

          {showFavorites && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-2xl">
                <FavoriteQuotes onClose={() => setShowFavorites(false)} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}