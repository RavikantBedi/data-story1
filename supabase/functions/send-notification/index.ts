import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "analysis_saved" | "anomaly_detected" | "report_generated";
  analysisName?: string;
  anomalyCount?: number;
  userName?: string;
  insights?: string[];
}

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "DataLens AI <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
  
  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send notification function invoked");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client and verify user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData.user) {
      console.log("User verification failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = claimsData.user.email;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, analysisName, anomalyCount, userName, insights }: NotificationRequest = await req.json();
    console.log("Notification request:", { type, analysisName, userEmail });

    let subject = "";
    let htmlContent = "";
    const displayName = userName || userEmail.split("@")[0];

    switch (type) {
      case "analysis_saved":
        subject = `Analysis Saved: ${analysisName || "Your Analysis"}`;
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #00897b 0%, #00acc1 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">DataLens AI</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
              <h2 style="color: #333; margin-top: 0;">Your Analysis Has Been Saved!</h2>
              <p style="color: #666; font-size: 16px;">Hi ${displayName},</p>
              <p style="color: #666; font-size: 16px;">Great news! Your analysis <strong>"${analysisName}"</strong> has been successfully saved to your account.</p>
              <p style="color: #666; font-size: 16px;">You can access it anytime from your dashboard to review insights, export reports, or continue your analysis.</p>
              <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #2e7d32; margin: 0; font-size: 14px;"><strong>Tip:</strong> Use the comparison feature to analyze changes over time!</p>
              </div>
              <p style="color: #999; font-size: 14px; margin-top: 30px;">Best regards,<br>The DataLens AI Team</p>
            </div>
          </div>
        `;
        break;

      case "anomaly_detected":
        subject = `Anomalies Detected in Your Data`;
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ff6f00 0%, #ff8f00 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">DataLens AI Alert</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
              <h2 style="color: #333; margin-top: 0;">Anomalies Detected in Your Analysis</h2>
              <p style="color: #666; font-size: 16px;">Hi ${displayName},</p>
              <p style="color: #666; font-size: 16px;">Our analysis has identified <strong>${anomalyCount || "several"} anomalies</strong> in your data that may require attention.</p>
              ${insights && insights.length > 0 ? `
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
                  <p style="color: #e65100; margin: 0 0 10px 0; font-weight: bold;">Key Findings:</p>
                  <ul style="color: #666; margin: 0; padding-left: 20px;">
                    ${insights.slice(0, 3).map(i => `<li style="margin-bottom: 8px;">${i}</li>`).join("")}
                  </ul>
                </div>
              ` : ""}
              <p style="color: #666; font-size: 16px;">We recommend reviewing these findings in your dashboard to understand the root causes.</p>
              <p style="color: #999; font-size: 14px; margin-top: 30px;">Best regards,<br>The DataLens AI Team</p>
            </div>
          </div>
        `;
        break;

      case "report_generated":
        subject = `Your Data Report is Ready`;
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #5e35b1 0%, #7e57c2 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">DataLens AI Report</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
              <h2 style="color: #333; margin-top: 0;">Your Data Report is Ready!</h2>
              <p style="color: #666; font-size: 16px;">Hi ${displayName},</p>
              <p style="color: #666; font-size: 16px;">Your comprehensive data analysis report has been generated and is ready for review.</p>
              ${insights && insights.length > 0 ? `
                <div style="background: #ede7f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7e57c2;">
                  <p style="color: #5e35b1; margin: 0 0 10px 0; font-weight: bold;">Report Highlights:</p>
                  <ul style="color: #666; margin: 0; padding-left: 20px;">
                    ${insights.slice(0, 3).map(i => `<li style="margin-bottom: 8px;">${i}</li>`).join("")}
                  </ul>
                </div>
              ` : ""}
              <p style="color: #666; font-size: 16px;">Access your full interactive report in the DataLens dashboard.</p>
              <p style="color: #999; font-size: 14px; margin-top: 30px;">Best regards,<br>The DataLens AI Team</p>
            </div>
          </div>
        `;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid notification type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log("Sending email to:", userEmail);
    
    const emailResponse = await sendEmail(userEmail, subject, htmlContent);
    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResponse.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
