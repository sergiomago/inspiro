import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Settings } from "@/components/Settings"
import { FavoriteQuotes } from "@/components/FavoriteQuotes"
import { FeedbackForm } from "@/components/FeedbackForm"
import { AuthForm } from "@/components/AuthForm"
import { X } from "lucide-react"
import { Button } from "./ui/button"

interface DialogManagerProps {
  user: any;
  showSettings: boolean;
  showFavorites: boolean;
  showFeedback: boolean;
  showAuthDialog: boolean;
  showFilters: boolean;
  savedFilters: Array<{ id: number; filter_text: string }>;
  onCloseSettings: () => void;
  onCloseFavorites: () => void;
  onCloseFeedback: () => void;
  onCloseAuth: () => void;
  onCloseFilters: () => void;
  onSelectFilter: (filterText: string) => void;
  onDeleteFilter: (id: number) => void;
}

export const DialogManager = ({
  user,
  showSettings,
  showFavorites,
  showFeedback,
  showAuthDialog,
  showFilters,
  savedFilters,
  onCloseSettings,
  onCloseFavorites,
  onCloseFeedback,
  onCloseAuth,
  onCloseFilters,
  onSelectFilter,
  onDeleteFilter,
}: DialogManagerProps) => {
  return (
    <>
      {showSettings && user && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Settings onClose={onCloseSettings} />
          </div>
        </div>
      )}

      {showFavorites && user && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <FavoriteQuotes onClose={onCloseFavorites} />
          </div>
        </div>
      )}

      {showFeedback && user && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <FeedbackForm onClose={onCloseFeedback} />
          </div>
        </div>
      )}

      <Dialog open={showAuthDialog} onOpenChange={onCloseAuth}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to save favorites</DialogTitle>
            <DialogDescription>
              Create an account or sign in to save your favorite quotes and access them anytime.
            </DialogDescription>
          </DialogHeader>
          <AuthForm onSuccess={onCloseAuth} />
        </DialogContent>
      </Dialog>

      <Dialog open={showFilters} onOpenChange={onCloseFilters}>
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
                    onSelectFilter(filter.filter_text);
                    onCloseFilters();
                  }}
                  className="text-left"
                >
                  {filter.filter_text}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteFilter(filter.id)}
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
    </>
  )
}