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
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select frequency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="twice-daily">Twice per day</SelectItem>
          <SelectItem value="every-2-days">Every 2 days</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};