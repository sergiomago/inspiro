import { useAuth } from "@/hooks/useAuth"
import { QuoteCard } from "@/components/QuoteCard"
import { useState, useEffect } from "react"
import { SearchBar } from "@/components/SearchBar"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/Header"
import { DialogManager } from "@/components/DialogManager"

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
        <Header 
          user={user}
          onShowFilters={() => setShowFilters(true)}
          onShowFeedback={() => setShowFeedback(true)}
          onShowSettings={() => setShowSettings(true)}
          onShowFavorites={() => setShowFavorites(true)}
          onShowAuth={() => setShowAuthDialog(true)}
        />

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

        <DialogManager
          user={user}
          showSettings={showSettings}
          showFavorites={showFavorites}
          showFeedback={showFeedback}
          showAuthDialog={showAuthDialog}
          showFilters={showFilters}
          savedFilters={savedFilters}
          onCloseSettings={() => setShowSettings(false)}
          onCloseFavorites={() => setShowFavorites(false)}
          onCloseFeedback={() => setShowFeedback(false)}
          onCloseAuth={() => setShowAuthDialog(false)}
          onCloseFilters={() => setShowFilters(false)}
          onSelectFilter={setSearchTerm}
          onDeleteFilter={handleDeleteFilter}
        />
      </div>
    </div>
  )
}