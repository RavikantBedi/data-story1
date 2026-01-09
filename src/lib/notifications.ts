import { supabase } from '@/integrations/supabase/client';

type NotificationType = 'analysis_saved' | 'anomaly_detected' | 'report_generated';

interface NotificationPayload {
  type: NotificationType;
  analysisName?: string;
  anomalyCount?: number;
  userName?: string;
  insights?: string[];
}

export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No session, skipping notification');
      return false;
    }

    const response = await supabase.functions.invoke('send-notification', {
      body: payload,
    });

    if (response.error) {
      console.error('Notification error:', response.error);
      return false;
    }

    console.log('Notification sent:', response.data);
    return true;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}

export async function notifyAnalysisSaved(analysisName: string, userName?: string): Promise<boolean> {
  return sendNotification({
    type: 'analysis_saved',
    analysisName,
    userName,
  });
}

export async function notifyAnomalyDetected(
  anomalyCount: number, 
  insights: string[],
  userName?: string
): Promise<boolean> {
  return sendNotification({
    type: 'anomaly_detected',
    anomalyCount,
    insights,
    userName,
  });
}

export async function notifyReportGenerated(insights: string[], userName?: string): Promise<boolean> {
  return sendNotification({
    type: 'report_generated',
    insights,
    userName,
  });
}
