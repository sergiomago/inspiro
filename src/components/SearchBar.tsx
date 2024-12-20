import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SearchBarProps {
  onSearch: (searchTerm: string, filterType: string) => void;
  currentFilter: string;
  onReset: () => void;
}

export const SearchBar = ({ onSearch, currentFilter, onReset }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("topic")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim(), filterType)
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
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] bg-white/90 backdrop-blur-sm">
            <SelectValue placeholder="Filter by..." />
          </SelectTrigger>
          <SelectContent className="bg-white/90 backdrop-blur-sm border-none">
            <SelectItem value="author">Author</SelectItem>
            <SelectItem value="topic">Topic</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="text"
          placeholder={`Search by ${filterType}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          className="bg-white/90 backdrop-blur-sm"
        />
      </form>
      {currentFilter && (
        <div className="flex items-center gap-2 text-sm text-primary-dark/80">
          <span>Current filter: {currentFilter}</span>
          <button
            onClick={onReset}
            className="text-primary-dark/80 hover:text-primary transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}