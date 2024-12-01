import { Clock } from "lucide-react";

interface TimeSettingsProps {
  time1: string;
  time2: string;
  onTime1Change: (value: string) => void;
  onTime2Change: (value: string) => void;
  showSecondTime: boolean;
  disabled: boolean;
}

export const TimeSettings = ({ 
  time1, 
  time2, 
  onTime1Change, 
  onTime2Change, 
  showSecondTime, 
  disabled 
}: TimeSettingsProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2 text-white">
        <Clock className="h-4 w-4" />
        Delivery Time
      </label>
      <div className="space-y-2">
        <input
          type="time"
          value={time1}
          onChange={(e) => onTime1Change(e.target.value)}
          className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white"
          disabled={disabled}
        />
        {showSecondTime && (
          <input
            type="time"
            value={time2}
            onChange={(e) => onTime2Change(e.target.value)}
            className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white mt-2"
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};