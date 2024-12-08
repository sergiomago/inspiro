import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, X } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  currentFilter: string;
  onReset: () => void;
}

export const SearchBar = ({ onSearch, currentFilter, onReset }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim())
      await handleSaveFilter()
    }
  }

  const handleSaveFilter = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      const { error } = await supabase
        .from('user_filters')
        .insert({ 
          filter_text: searchTerm.trim(),
          user_id: null // explicitly set user_id to null for anonymous users
        })

      if (error) {
        if (error.message.includes('more than 3 filters')) {
          toast.error("You can only save up to 3 filters. Please delete one to save a new filter.")
        } else {
          throw error
        }
      } else {
        toast.success("Filter saved successfully!")
      }
    } catch (error: any) {
      console.error('Error saving filter:', error)
      toast.error("Failed to save filter")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e)
    }
  }

  return (
    <div className="w-full max-w-md space-y-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          placeholder="Filter quotes by topic, theme, or style..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          className="bg-white/90"
        />
        <Button 
          type="button" 
          variant="ghost" 
          size="icon"
          onClick={handleSaveFilter}
          disabled={!searchTerm.trim()}
          className="hover:text-primary transition-colors"
        >
          <Save className="h-5 w-5" />
        </Button>
      </form>
      {currentFilter && (
        <div className="flex items-center gap-2 text-sm text-primary-dark/80">
          <span>Current filter: {currentFilter}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            className="h-5 w-5 hover:text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}