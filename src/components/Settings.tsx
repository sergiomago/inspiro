import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Clock } from "lucide-react";

export const Settings = () => {
  return (
    <div className="space-y-4 w-full max-w-md animate-fade-in">
      <Card className="bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure your daily quotes delivery</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div>Daily Notifications</div>
              <div className="text-sm text-gray-500">Receive quotes every day</div>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Delivery Time
              </div>
              <div className="text-sm text-gray-500">Set when to receive quotes</div>
            </div>
            <Button variant="outline">8:00 AM</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};