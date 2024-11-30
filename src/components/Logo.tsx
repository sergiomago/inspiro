import { Sparkles } from "lucide-react";

export const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="w-8 h-8 bg-gradient-to-br from-primary via-primary-light to-secondary rounded-lg flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-secondary-foreground rounded-full" />
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary-foreground bg-clip-text text-transparent">
        Inspiro
      </span>
    </div>
  );
};