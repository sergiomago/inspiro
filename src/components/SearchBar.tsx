import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // The search term will be used by the QuoteCard component through a shared state
    // This will be implemented in the next step
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-md flex gap-2">
      <Input
        type="text"
        placeholder="Search by keyword, author, or topic..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-white/90"
      />
      <Button type="submit" variant="ghost" size="icon">
        <Search className="h-5 w-5" />
      </Button>
    </form>
  )
}