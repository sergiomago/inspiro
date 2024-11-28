import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Clock, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

interface SettingsProps {
  onClose?: () => void;
}

export const Settings = ({ onClose }: SettingsProps) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [frequency, setFrequency] = useState("daily");
  const [time1, setTime1] = useState("08:00");
  const [time2, setTime2] = useState("20:00");

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully!");
    onClose?.();
  };

  return (
    <Card className="glass-card border-none shadow-lg relative">
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary-dark">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>Configure your inspirational quotes delivery</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-medium">Enable Notifications</div>
            <div className="text-sm text-gray-500">Receive quotes on schedule</div>
          </div>
          <Switch 
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Frequency</label>
            <Select 
              value={frequency} 
              onValueChange={setFrequency}
              disabled={!notificationsEnabled}
            >
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

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Delivery Time
            </label>
            <div className="space-y-2">
              <input
                type="time"
                value={time1}
                onChange={(e) => setTime1(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                disabled={!notificationsEnabled}
              />
              {frequency === "twice-daily" && (
                <input
                  type="time"
                  value={time2}
                  onChange={(e) => setTime2(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  disabled={!notificationsEnabled}
                />
              )}
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSaveSettings}
          className="w-full bg-primary hover:bg-primary-light transition-colors"
          disabled={!notificationsEnabled}
        >
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
};