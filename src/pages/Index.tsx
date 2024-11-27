import { useAuth } from "@/hooks/useAuth"
import { AuthForm } from "@/components/AuthForm"
import { QuoteCard } from "@/components/QuoteCard"
import { Settings } from "@/components/Settings"

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gradient-to-b from-white to-secondary/20">
      {!user ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-4xl font-bold mb-2 text-primary-dark">Inspiro</h1>
          <p className="text-gray-600 mb-8">Daily inspiration for your journey</p>
          <AuthForm />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold text-center text-primary-dark mb-8">Inspiro</h1>
          <div className="grid gap-8 md:grid-cols-[1fr,auto] items-start">
            <QuoteCard />
            <Settings />
          </div>
        </div>
      )}
    </div>
  );
}