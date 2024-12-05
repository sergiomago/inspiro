import { Card } from "@/components/ui/card";

interface QuoteContentProps {
  quote: string;
  author: string;
}

export const QuoteContent = ({ quote, author }: QuoteContentProps) => {
  return (
    <div className="space-y-4">
      <p className="text-2xl font-serif italic text-white leading-relaxed">
        "{quote}"
      </p>
      <p className="text-right text-sm text-white/90 font-medium">
        - {author}
      </p>
    </div>
  );
};