import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FrequencySettingsProps {
  frequency: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export const FrequencySettings = ({ frequency, onChange, disabled }: FrequencySettingsProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Frequency</label>
      <Select value={frequency} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full bg-white/90">
          <SelectValue placeholder="Select frequency" />
        </SelectTrigger>
        <SelectContent className="w-full bg-white">
          <SelectItem value="daily" className="py-2.5">Daily</SelectItem>
          <SelectItem value="twice-daily" className="py-2.5">Twice per day</SelectItem>
          <SelectItem value="every-2-days" className="py-2.5">Every 2 days</SelectItem>
          <SelectItem value="weekly" className="py-2.5">Weekly</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};