import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Clock, X, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface SettingsProps {
  onClose?: () => void;
}

export const Settings = ({ onClose }: SettingsProps) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [frequency, setFrequency] = useState("daily");
  const [time1, setTime1] = useState("08:00");
  const [time2, setTime2] = useState("20:00");
  const [quoteSource, setQuoteSource] = useState("mixed");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: settings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (settings) {
          setNotificationsEnabled(settings.notifications_enabled);
          setFrequency(settings.frequency);
          setTime1(settings.time1);
          setTime2(settings.time2);
          setQuoteSource(settings.quote_source);
        }
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            notifications_enabled: notificationsEnabled,
            frequency,
            time1,
            time2,
            quote_source: quoteSource
          });
        toast.success("Settings saved successfully!");
        onClose?.();
      }
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card border-none shadow-lg relative bg-white/10">
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
          Settings
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
                  className="w-full rounded-md border border-input bg-background px-3 py-2 mt-2"
                  disabled={!notificationsEnabled}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Quote Source
            </label>
            <RadioGroup
              value={quoteSource}
              onValueChange={setQuoteSource}
              className="grid gap-2"
            >
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
