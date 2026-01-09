import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Mail, AlertTriangle, FileText, Loader2, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NotificationPreferences {
  analysisSaved: boolean;
  anomalyDetected: boolean;
  reportGenerated: boolean;
}

const STORAGE_KEY = 'datalens_notification_preferences';

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    analysisSaved: true,
    anomalyDetected: true,
    reportGenerated: false,
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialPrefs, setInitialPrefs] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
        setInitialPrefs(parsed);
      } catch (e) {
        console.error('Failed to parse notification preferences:', e);
      }
    } else {
      setInitialPrefs(preferences);
    }
  }, []);

  useEffect(() => {
    if (initialPrefs) {
      const changed = 
        preferences.analysisSaved !== initialPrefs.analysisSaved ||
        preferences.anomalyDetected !== initialPrefs.anomalyDetected ||
        preferences.reportGenerated !== initialPrefs.reportGenerated;
      setHasChanges(changed);
    }
  }, [preferences, initialPrefs]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      setInitialPrefs(preferences);
      setHasChanges(false);
      toast.success('Notification preferences saved!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const allEnabled = preferences.analysisSaved && preferences.anomalyDetected && preferences.reportGenerated;
  const allDisabled = !preferences.analysisSaved && !preferences.anomalyDetected && !preferences.reportGenerated;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-elevated p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {allDisabled ? (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          ) : (
            <Bell className="w-5 h-5 text-primary" />
          )}
          <h2 className="text-lg font-semibold">Email Notifications</h2>
        </div>
        {allEnabled && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            All enabled
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Choose which email notifications you would like to receive. These help you stay informed about your analyses and data insights.
      </p>

      <div className="space-y-4">
        {/* Analysis Saved */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-chart-1/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-chart-1" />
            </div>
            <div>
              <Label htmlFor="analysisSaved" className="font-medium cursor-pointer">
                Analysis Saved
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get notified when you save a new analysis
              </p>
            </div>
          </div>
          <Switch
            id="analysisSaved"
            checked={preferences.analysisSaved}
            onCheckedChange={() => handleToggle('analysisSaved')}
          />
        </div>

        {/* Anomaly Detected */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <Label htmlFor="anomalyDetected" className="font-medium cursor-pointer">
                Anomaly Detected
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receive alerts when unusual patterns are found
              </p>
            </div>
          </div>
          <Switch
            id="anomalyDetected"
            checked={preferences.anomalyDetected}
            onCheckedChange={() => handleToggle('anomalyDetected')}
          />
        </div>

        {/* Report Generated */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <Label htmlFor="reportGenerated" className="font-medium cursor-pointer">
                Report Summary
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receive email summaries of generated reports
              </p>
            </div>
          </div>
          <Switch
            id="reportGenerated"
            checked={preferences.reportGenerated}
            onCheckedChange={() => handleToggle('reportGenerated')}
          />
        </div>
      </div>

      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6"
        >
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

export function getNotificationPreferences(): NotificationPreferences {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { analysisSaved: true, anomalyDetected: true, reportGenerated: false };
    }
  }
  return { analysisSaved: true, anomalyDetected: true, reportGenerated: false };
}
