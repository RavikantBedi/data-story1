import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnomalyAlert {
  recipients: string[];
  datasetName: string;
  anomalies: Array<{
    metric: string;
    value: number;
    expectedRange: { min: number; max: number };
    severity: 'high' | 'medium' | 'low';
    description: string;
  }>;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, datasetName, anomalies, timestamp }: AnomalyAlert = await req.json();

    if (!recipients || recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients specified" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!anomalies || anomalies.length === 0) {
      return new Response(
        JSON.stringify({ error: "No anomalies to report" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const highSeverity = anomalies.filter(a => a.severity === 'high');
    const mediumSeverity = anomalies.filter(a => a.severity === 'medium');
    const lowSeverity = anomalies.filter(a => a.severity === 'low');

    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'high': return '#ef4444';
        case 'medium': return '#f59e0b';
        case 'low': return '#3b82f6';
        default: return '#6b7280';
      }
    };

    const anomalyRows = anomalies.map(a => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; font-weight: 500;">${a.metric}</td>
        <td style="padding: 12px; color: ${getSeverityColor(a.severity)}; font-weight: bold;">${a.value.toLocaleString()}</td>
        <td style="padding: 12px; color: #6b7280;">${a.expectedRange.min.toLocaleString()} - ${a.expectedRange.max.toLocaleString()}</td>
        <td style="padding: 12px;">
          <span style="background: ${getSeverityColor(a.severity)}20; color: ${getSeverityColor(a.severity)}; padding: 4px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500;">
            ${a.severity.toUpperCase()}
          </span>
        </td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Anomaly Alert</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Significant data anomalies detected</p>
            </div>
            
            <!-- Content -->
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Summary Cards -->
              <div style="display: flex; gap: 10px; margin-bottom: 25px;">
                <div style="flex: 1; background: #fef2f2; padding: 15px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold; color: #ef4444;">${highSeverity.length}</div>
                  <div style="font-size: 12px; color: #991b1b;">High Severity</div>
                </div>
                <div style="flex: 1; background: #fffbeb; padding: 15px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${mediumSeverity.length}</div>
                  <div style="font-size: 12px; color: #92400e;">Medium Severity</div>
                </div>
                <div style="flex: 1; background: #eff6ff; padding: 15px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${lowSeverity.length}</div>
                  <div style="font-size: 12px; color: #1e40af;">Low Severity</div>
                </div>
              </div>
              
              <p style="color: #374151; margin-bottom: 20px;">
                <strong>Dataset:</strong> ${datasetName || 'Unnamed Dataset'}<br>
                <strong>Detected at:</strong> ${new Date(timestamp).toLocaleString()}
              </p>
              
              <!-- Anomaly Table -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Metric</th>
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Value</th>
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Expected</th>
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase;">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  ${anomalyRows}
                </tbody>
              </table>
              
              <!-- Action Items -->
              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px; color: #92400e; font-size: 14px;">Recommended Actions</h3>
                <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px;">
                  <li>Review the affected metrics in your DataLens dashboard</li>
                  <li>Investigate potential causes for the anomalies</li>
                  <li>Consider adjusting alert thresholds if these values are expected</li>
                </ul>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; text-align: center;">
                This alert was generated automatically by DataLens AI.<br>
                <a href="#" style="color: #14b8a6;">View Full Report</a> | <a href="#" style="color: #6b7280;">Manage Alert Settings</a>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              DataLens AI - Intelligent Analytics Platform
            </div>
          </div>
        </body>
      </html>
    `;

    console.log(`Sending anomaly alert to ${recipients.length} recipients`);

    const emailResponse = await resend.emails.send({
      from: "DataLens AI <onboarding@resend.dev>",
      to: recipients,
      subject: `[ALERT] ${highSeverity.length > 0 ? 'HIGH PRIORITY: ' : ''}${anomalies.length} Anomal${anomalies.length === 1 ? 'y' : 'ies'} Detected - ${datasetName || 'Your Data'}`,
      html: emailHtml,
    });

    console.log("Anomaly alert sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending anomaly alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
