import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const currentTime = new Date();
    const currentHour = `${currentTime.getHours().toString().padStart(2, '0')}:00`;
    
    // Get all users with notifications enabled for the current hour
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id, frequency, time1, time2, quote_source')
      .eq('notifications_enabled', true)
      .or(`time1.eq.${currentHour},time2.eq.${currentHour}`);

    if (settingsError) {
      throw settingsError;
    }

    console.log(`Found ${settings?.length || 0} users to send emails to at ${currentHour}`);

    // For each user with matching settings, generate and send a quote
    for (const setting of settings || []) {
      try {
        // Call the generate-quote function
        const quoteResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-quote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            quoteSource: setting.quote_source,
          }),
        });

        if (!quoteResponse.ok) {
          throw new Error('Failed to generate quote');
        }

        const quote = await quoteResponse.json();

        // Send the email
        await fetch(`${SUPABASE_URL}/functions/v1/send-quote-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            userId: setting.user_id,
            quote: quote.content,
            author: quote.author,
          }),
        });

        console.log(`Successfully sent email to user ${setting.user_id}`);
      } catch (error) {
        console.error(`Failed to process user ${setting.user_id}:`, error);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in schedule-quote-emails:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);