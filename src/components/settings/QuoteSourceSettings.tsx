import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

interface QuoteSourceSettingsProps {
  value: string;
  onChange: (value: string) => void;
}

export const QuoteSourceSettings = ({ value, onChange }: QuoteSourceSettingsProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        Quote Source
      </label>
      <RadioGroup value={value} onValueChange={onChange} className="grid gap-2">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="ai" id="ai" />
          <Label htmlFor="ai">AI-Generated Quotes</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="human" id="human" />
          <Label htmlFor="human">Classic Quotes</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="mixed" id="mixed" />
          <Label htmlFor="mixed">Mix of Both</Label>
        </div>
      </RadioGroup>
    </div>
  );
};