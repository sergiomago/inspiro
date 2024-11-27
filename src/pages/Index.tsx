import { useAuth } from "@/hooks/useAuth"
import { AuthForm } from "@/components/AuthForm"
import { QuoteCard } from "@/components/QuoteCard"
import { Settings } from "@/components/Settings"

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {!user ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-3xl font-bold mb-8">Welcome to DailyQuotes</h1>
          <AuthForm />
        </div>
      ) : (
        <div className="space-y-8">
          <QuoteCard quote="Welcome to DailyQuotes! Click refresh to generate your first quote." author="DailyQuotes" />
          <Settings />
        </div>
      )}
    </div>
  )
}