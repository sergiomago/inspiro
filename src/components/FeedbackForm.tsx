import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface FeedbackFormProps {
  onClose?: () => void;
}

export const FeedbackForm = ({ onClose }: FeedbackFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [features, setFeatures] = useState("");
  const [bugs, setBugs] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to submit feedback");
      return;
    }
    
    setSubmitting(true);

    try {
      const { error } = await supabase.from("feedback").insert({
        user_id: user.id,
        rating,
        feature_requests: features,
        bugs,
        price_willing_to_pay: price ? parseFloat(price) : null,
      });

      if (error) throw error;

      toast.success("Thank you for your feedback!");
      onClose?.();
    } catch (error) {
      toast.error("Failed to submit feedback");
      console.error("Error submitting feedback:", error);
    } finally {
      setSubmitting(false);
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
        <CardTitle className="text-white">Feedback</CardTitle>
        <CardDescription className="text-white/80">
          Help us improve your experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white mb-2">
              How would you rate your experience? (1-5)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full p-2 rounded bg-white/10 text-white border border-white/20"
              required
            />
          </div>

          <div>
            <label className="block text-white mb-2">
              What features would you like to see?
            </label>
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              className="w-full p-2 rounded bg-white/10 text-white border border-white/20"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-white mb-2">
              Have you encountered any bugs?
            </label>
            <textarea
              value={bugs}
              onChange={(e) => setBugs(e.target.value)}
              className="w-full p-2 rounded bg-white/10 text-white border border-white/20"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-white mb-2">
              How much would you be willing to pay for a premium version? ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2 rounded bg-white/10 text-white border border-white/20"
              placeholder="0.00"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary-light transition-colors"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};