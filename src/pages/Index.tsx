import { useState } from "react";
import { QuoteCard } from "@/components/QuoteCard";
import { Settings } from "@/components/Settings";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

const Index = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-secondary to-primary-dark p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="bg-white/50 backdrop-blur-sm hover:bg-white/60"
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          {showSettings ? (
            <Settings />
          ) : (
            <QuoteCard
              quote="The only way to do great work is to love what you do."
              author="Steve Jobs"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;