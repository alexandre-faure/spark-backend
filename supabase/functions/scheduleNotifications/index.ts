import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendNotification } from '../_shared/firebase.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    // Fetch notifications that need to be sent
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("sent", false)
      .lte("sendAt", new Date().toISOString());

    if (error) {
      console.error("Error fetching notifications:", error);
      return new Response("Failed to fetch notifications", { status: 500 });
    }

    if (!notifications || notifications.length === 0) {
      console.log("No pending notifications found");
      return new Response("No notifications to process", { status: 200 });
    }

    // Process each notification
    const promises = notifications.map(async (notification) => {
      try {
        await sendNotification(notification);
      } catch (err) {
        console.error(`Failed to send notification ${notification.id}:`, err);
        // You might choose to skip updating 'sent' for this one to retry later
      } finally {
        // Regardless of success, we can mark it as sent to avoid reprocessing
        const { error: updateError } = await supabase
          .from("notifications")
          .update({ sent: true })
          .eq("id", notification.id); 
        if (updateError) {
          console.error(`Failed to update notification ${notification.id} as sent:`, updateError);
        }
      }
    });

    await Promise.all(promises);

    return new Response(`Processed ${notifications.length} notifications`, {
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});