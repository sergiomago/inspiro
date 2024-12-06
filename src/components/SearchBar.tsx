import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, X } from "lucide-react"

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
        <Button 
          type="submit" 
          variant="ghost" 
          size="icon"
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