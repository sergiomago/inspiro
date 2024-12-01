import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { NotificationSettings } from "./settings/NotificationSettings";
import { FrequencySettings } from "./settings/FrequencySettings";
import { TimeSettings } from "./settings/TimeSettings";
import { QuoteSourceSettings } from "./settings/QuoteSourceSettings";

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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: settings } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id);
          
          if (settings && settings.length > 0) {
            const userSettings = settings[0];
            setNotificationsEnabled(userSettings.notifications_enabled);
            setFrequency(userSettings.frequency);
            setTime1(userSettings.time1);
            setTime2(userSettings.time2);
            setQuoteSource(userSettings.quote_source);
          }
        }
      } catch (error) {
        toast.error('Error loading settings');
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          notifications_enabled: notificationsEnabled,
          frequency,
          time1,
          time2,
          quote_source: quoteSource
        });

      if (error) throw error;
      
      toast.success("Settings saved successfully!");
      onClose?.();
    } catch (error) {
      toast.error("Failed to save settings");
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="relative bg-[#2D1B4D]/85 border-none shadow-lg">
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 text-white hover:text-primary"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bell className="h-5 w-5" />
          Settings
        </CardTitle>
        <CardDescription className="text-white/80">Configure your inspirational quotes delivery</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <NotificationSettings 
          enabled={notificationsEnabled}
          onToggle={setNotificationsEnabled}
        />

        <FrequencySettings
          frequency={frequency}
          onChange={setFrequency}
          disabled={!notificationsEnabled}
        />

        <TimeSettings
          time1={time1}
          time2={time2}
          onTime1Change={setTime1}
          onTime2Change={setTime2}
          showSecondTime={frequency === "twice-daily"}
          disabled={!notificationsEnabled}
        />

        <QuoteSourceSettings
          value={quoteSource}
          onChange={setQuoteSource}
        />

        <Button 
          onClick={handleSaveSettings}
          className="w-full bg-primary hover:bg-primary-light transition-colors"
          disabled={loading}
        >
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
};