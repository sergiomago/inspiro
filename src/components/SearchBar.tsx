import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  currentFilter: string;
  onReset: () => void;
}

export const SearchBar = ({ onSearch, currentFilter, onReset }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim())
    }
  }

  const handleSaveFilter = async () => {
    try {
      const { error } = await supabase
        .from('user_filters')
        .insert({ filter_text: currentFilter })

      if (error) throw error
      toast.success("Filter saved successfully!")
    } catch (error: any) {
      if (error.message.includes('more than 3 filters')) {
        toast.error("You can only save up to 3 filters")
      } else {
        toast.error("Failed to save filter")
      }
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
          className="bg-white/90"
        />
        {currentFilter && (
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={handleSaveFilter}
            className="hover:text-primary transition-colors"
          >
            <Save className="h-5 w-5" />
          </Button>
        )}
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