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
      <label className="text-sm font-medium text-white">Frequency</label>
      <Select value={frequency} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full bg-white/10 text-white border-white/20">
          <SelectValue placeholder="Select frequency" />
        </SelectTrigger>
        <SelectContent className="bg-[#2D1B4D]">
          <SelectItem value="daily" className="text-white">Daily</SelectItem>
          <SelectItem value="twice-daily" className="text-white">Twice per day</SelectItem>
          <SelectItem value="every-2-days" className="text-white">Every 2 days</SelectItem>
          <SelectItem value="weekly" className="text-white">Weekly</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};