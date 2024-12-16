import { Button } from "@/components/ui/button"
import { Settings as SettingsIcon, Heart, MessageSquare } from "lucide-react"
import { Logo } from "@/components/Logo"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface HeaderProps {
  user: any;
  onShowFilters: () => void;
  onShowFeedback: () => void;
  onShowSettings: () => void;
  onShowFavorites: () => void;
  onShowAuth: () => void;
}

export const Header = ({
  user,
  onShowFilters,
  onShowFeedback,
  onShowSettings,
  onShowFavorites,
  onShowAuth
}: HeaderProps) => {
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success("Signed out successfully")
    } catch (error) {
      toast.error("Error signing out")
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className="flex justify-between items-center py-8">
      <Logo />
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowFeedback}
          className="hover:text-primary transition-colors text-primary-dark"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowSettings}
          className="hover:text-primary transition-colors text-primary-dark"
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
        {user ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowFavorites}
              className="hover:text-primary transition-colors text-primary-dark"
            >
              <Heart className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="hover:text-primary transition-colors text-primary-dark"
            >
              Sign Out
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={onShowAuth}
            className="hover:text-primary transition-colors text-primary-dark"
          >
            Sign In
          </Button>
        )}
      </div>
    </div>
  )
}