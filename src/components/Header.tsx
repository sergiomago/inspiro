import { Button } from "@/components/ui/button"
import { Settings as SettingsIcon, Heart, MessageSquare } from "lucide-react"
import { Logo } from "@/components/Logo"

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
  return (
    <div className="flex justify-between items-center py-8">
      <Logo />
      <div className="flex gap-2">
        {user && (
          <>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowFavorites}
              className="hover:text-primary transition-colors text-primary-dark"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </>
        )}
        {!user && (
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