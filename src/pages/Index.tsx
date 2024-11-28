import { useAuth } from "@/hooks/useAuth"
import { AuthForm } from "@/components/AuthForm"
import { QuoteCard } from "@/components/QuoteCard"
import { Settings } from "@/components/Settings"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings as SettingsIcon, Heart } from "lucide-react"

export default function Index() {
  const { user, loading } = useAuth()
  const [showSettings, setShowSettings] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary/20">
      {!user ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <img
            src="https://images.unsplash.com/photo-1469474968028-56623f02e42e"
            alt="Inspirational landscape"
            className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
          />
          <div className="relative z-10 text-center">
            <h1 className="text-4xl font-bold mb-2 text-primary-dark">Inspiro</h1>
            <p className="text-gray-600 mb-8">Daily inspiration for your journey</p>
            <AuthForm />
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8 relative">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-primary-dark">Inspiro</h1>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(s => !s)}
                className="hover:text-primary transition-colors"
              >
                <SettingsIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hover:text-primary transition-colors"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="grid gap-8 items-start">
            <QuoteCard />
            {showSettings && (
              <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                  <Settings onClose={() => setShowSettings(false)} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}