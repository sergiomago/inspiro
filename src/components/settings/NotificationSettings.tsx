import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";

interface NotificationSettingsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const NotificationSettings = ({ enabled, onToggle }: NotificationSettingsProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <div className="font-medium text-white">Enable Notifications</div>
        <div className="text-sm text-white/60">Receive quotes on schedule</div>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
};