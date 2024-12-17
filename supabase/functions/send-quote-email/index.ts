import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailData {
  userId: string;
  quote: string;
  author: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const emailData: EmailData = await req.json();
    
    // Get user's email from auth.users
    const { data: userData, error: userError } = await supabase.auth
      .admin.getUserById(emailData.userId);

    if (userError || !userData.user) {
      throw new Error('User not found');
    }

    const userEmail = userData.user.email;
    if (!userEmail) {
      throw new Error('User email not found');
    }

    // Create HTML template for the email
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #6366f1; margin-bottom: 30px;">Your Daily Quote from Inspiro</h1>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="font-size: 18px; line-height: 1.6; color: #374151; margin-bottom: 10px;">
            "${emailData.quote}"
          </p>
          <p style="font-size: 16px; color: #6366f1; text-align: right;">
            - ${emailData.author}
          </p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          You received this email because you enabled quote notifications in your Inspiro settings.
        </p>
      </div>
    `;

    // Send email using Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Inspiro <quotes@yourdomain.com>", // Replace with your verified domain
        to: [userEmail],
        subject: "Your Daily Inspiration from Inspiro",
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);