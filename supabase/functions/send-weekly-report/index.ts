import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportEmailRequest {
  recipients: string[];
  reportData: {
    title: string;
    overview: string;
    keyMetrics: Array<{
      name: string;
      value: string;
      trend: string;
      change: number;
    }>;
    keyTrends: string[];
    anomalies: string[];
    insights: string[];
    reliabilityScore: number;
    predictions: Array<{
      metric: string;
      current: number;
      predicted: number;
      direction: string;
    }>;
  };
  senderName?: string;
}

function generateReportHTML(reportData: ReportEmailRequest['reportData']): string {
  const trendIcon = (trend: string) => {
    if (trend === 'increasing' || trend === 'up') return '📈';
    if (trend === 'decreasing' || trend === 'down') return '📉';
    return '➡️';
  };

  const trendColor = (trend: string) => {
    if (trend === 'increasing' || trend === 'up') return '#10b981';
    if (trend === 'decreasing' || trend === 'down') return '#ef4444';
    return '#6b7280';
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DataLens AI Weekly Report</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #14b8a6 0%, #10b981 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">DataLens AI</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Weekly Analytics Report</p>
        </div>

        <!-- Report Title -->
        <div style="padding: 30px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 22px;">${reportData.title}</h2>
          <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6;">${reportData.overview}</p>
        </div>

        <!-- Key Metrics -->
        <div style="padding: 30px; background-color: #f9fafb;">
          <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Key Metrics</h3>
          <div style="display: table; width: 100%;">
            ${reportData.keyMetrics.map(metric => `
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                  <span style="color: #374151; font-weight: 500;">${metric.name}</span>
                </div>
                <div style="display: table-cell; padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                  <span style="font-size: 18px; font-weight: 700; color: #1f2937;">${metric.value}</span>
                  <span style="color: ${trendColor(metric.trend)}; margin-left: 8px; font-size: 12px;">
                    ${trendIcon(metric.trend)} ${metric.change >= 0 ? '+' : ''}${metric.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Reliability Score -->
        <div style="padding: 20px 30px; background-color: #ecfdf5; border-left: 4px solid #10b981;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <p style="color: #065f46; margin: 0; font-weight: 600;">Data Reliability Score</p>
              <p style="color: #047857; margin: 5px 0 0 0; font-size: 12px;">Based on data completeness and consistency</p>
            </div>
            <div style="background-color: #10b981; color: white; padding: 10px 20px; border-radius: 50px; font-size: 20px; font-weight: 700;">
              ${reportData.reliabilityScore}%
            </div>
          </div>
        </div>

        <!-- Key Trends -->
        ${reportData.keyTrends.length > 0 ? `
        <div style="padding: 30px;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">📊 Key Trends</h3>
          ${reportData.keyTrends.slice(0, 3).map(trend => `
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
              <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5;">${trend.replace(/[📈📉➡️💡🚀⚠️🎯📏🔎🌟⚙️⚡✅🔍📊]/g, '')}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Predictions -->
        ${reportData.predictions.length > 0 ? `
        <div style="padding: 30px; background-color: #faf5ff;">
          <h3 style="color: #6b21a8; margin: 0 0 15px 0; font-size: 16px;">🔮 Future Predictions</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #e9d5ff;">
              <th style="padding: 10px; text-align: left; font-size: 12px; color: #6b21a8;">Metric</th>
              <th style="padding: 10px; text-align: right; font-size: 12px; color: #6b21a8;">Current</th>
              <th style="padding: 10px; text-align: right; font-size: 12px; color: #6b21a8;">Predicted</th>
              <th style="padding: 10px; text-align: center; font-size: 12px; color: #6b21a8;">Trend</th>
            </tr>
            ${reportData.predictions.slice(0, 4).map(pred => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e9d5ff; font-size: 13px; color: #374151;">${pred.metric}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e9d5ff; text-align: right; font-size: 13px; color: #374151;">${pred.current.toLocaleString()}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e9d5ff; text-align: right; font-size: 13px; color: ${trendColor(pred.direction)}; font-weight: 600;">${pred.predicted.toLocaleString()}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e9d5ff; text-align: center;">${trendIcon(pred.direction)}</td>
              </tr>
            `).join('')}
          </table>
        </div>
        ` : ''}

        <!-- Anomalies -->
        ${reportData.anomalies.length > 0 ? `
        <div style="padding: 30px;">
          <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 16px;">⚠️ Areas Needing Attention</h3>
          ${reportData.anomalies.slice(0, 3).map(anomaly => `
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #ef4444;">
              <p style="color: #7f1d1d; margin: 0; font-size: 14px; line-height: 1.5;">${anomaly.replace(/[📈📉➡️💡🚀⚠️🎯📏🔎🌟⚙️⚡✅🔍📊]/g, '')}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Insights -->
        ${reportData.insights.length > 0 ? `
        <div style="padding: 30px; background-color: #fffbeb;">
          <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 16px;">💡 Actionable Insights</h3>
          ${reportData.insights.slice(0, 3).map(insight => `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
              <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.5;">${insight.replace(/[📈📉➡️💡🚀⚠️🎯📏🔎🌟⚙️⚡✅🔍📊]/g, '')}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="padding: 30px; background-color: #1f2937; text-align: center;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">Generated by DataLens AI</p>
          <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 11px;">
            This is an automated weekly report. To manage your subscription, visit your DataLens dashboard.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-weekly-report function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, reportData, senderName }: ReportEmailRequest = await req.json();
    
    console.log(`Sending report to ${recipients.length} recipients`);

    if (!recipients || recipients.length === 0) {
      throw new Error("No recipients specified");
    }

    if (!reportData) {
      throw new Error("No report data provided");
    }

    const htmlContent = generateReportHTML(reportData);
    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const recipient of recipients) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: `${senderName || 'DataLens AI'} <onboarding@resend.dev>`,
            to: [recipient],
            subject: `Weekly Report: ${reportData.title}`,
            html: htmlContent,
          }),
        });

        const emailData = await emailResponse.json();

        console.log(`Email sent to ${recipient}:`, emailData);
        results.push({ email: recipient, success: emailResponse.ok });
      } catch (emailError: any) {
        console.error(`Failed to send to ${recipient}:`, emailError);
        results.push({ email: recipient, success: false, error: emailError.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Successfully sent ${successCount}/${recipients.length} emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: recipients.length,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-weekly-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
