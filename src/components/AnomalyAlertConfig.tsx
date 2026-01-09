import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellRing, Mail, Plus, X, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CleanedData } from '@/types/analytics';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnomalyAlertConfigProps {
  data: CleanedData;
}

interface AlertConfig {
  enabled: boolean;
  recipients: string[];
  thresholds: {
    highSeverity: number; // Standard deviations
    mediumSeverity: number;
  };
}

interface DetectedAnomaly {
  metric: string;
  value: number;
  expectedRange: { min: number; max: number };
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export function AnomalyAlertConfig({ data }: AnomalyAlertConfigProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<AlertConfig>(() => {
    const saved = localStorage.getItem('anomalyAlertConfig');
    return saved ? JSON.parse(saved) : {
      enabled: false,
      recipients: [],
      thresholds: { highSeverity: 3, mediumSeverity: 2 }
    };
  });
  const [newEmail, setNewEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [anomalies, setAnomalies] = useState<DetectedAnomaly[]>([]);

  useEffect(() => {
    localStorage.setItem('anomalyAlertConfig', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    // Detect anomalies when data changes
    const detected = detectAnomalies(data, config.thresholds);
    setAnomalies(detected);
  }, [data, config.thresholds]);

  const detectAnomalies = (data: CleanedData, thresholds: AlertConfig['thresholds']): DetectedAnomaly[] => {
    const anomalies: DetectedAnomaly[] = [];
    const numericCols = data.columns.filter(c => c.type === 'numeric');

    numericCols.forEach(col => {
      if (!col.stats || !col.stats.mean || !col.stats.stdDev) return;

      const mean = col.stats.mean;
      const stdDev = col.stats.stdDev;
      const min = mean - thresholds.mediumSeverity * stdDev;
      const max = mean + thresholds.mediumSeverity * stdDev;

      col.values.forEach((val) => {
        if (typeof val !== 'number') return;
        
        const deviation = Math.abs(val - mean) / stdDev;
        
        if (deviation >= thresholds.highSeverity) {
          anomalies.push({
            metric: col.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            value: val,
            expectedRange: { min: mean - thresholds.highSeverity * stdDev, max: mean + thresholds.highSeverity * stdDev },
            severity: 'high',
            description: `Value is ${deviation.toFixed(1)} standard deviations from mean`
          });
        } else if (deviation >= thresholds.mediumSeverity) {
          anomalies.push({
            metric: col.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            value: val,
            expectedRange: { min, max },
            severity: 'medium',
            description: `Value is ${deviation.toFixed(1)} standard deviations from mean`
          });
        }
      });
    });

    // Deduplicate and limit to top anomalies
    const uniqueAnomalies = anomalies.reduce((acc, curr) => {
      const existing = acc.find(a => a.metric === curr.metric && a.severity === curr.severity);
      if (!existing || Math.abs(curr.value) > Math.abs(existing.value)) {
        return [...acc.filter(a => !(a.metric === curr.metric && a.severity === curr.severity)), curr];
      }
      return acc;
    }, [] as DetectedAnomaly[]);

    return uniqueAnomalies.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }).slice(0, 10);
  };

  const addRecipient = () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({ title: 'Invalid email', variant: 'destructive' });
      return;
    }
    if (config.recipients.includes(newEmail)) {
      toast({ title: 'Email already added', variant: 'destructive' });
      return;
    }
    setConfig(prev => ({
      ...prev,
      recipients: [...prev.recipients, newEmail]
    }));
    setNewEmail('');
  };

  const removeRecipient = (email: string) => {
    setConfig(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  const sendAlertNow = async () => {
    if (config.recipients.length === 0) {
      toast({ title: 'Add recipients first', variant: 'destructive' });
      return;
    }
    if (anomalies.length === 0) {
      toast({ title: 'No anomalies detected', description: 'Adjust thresholds or check data' });
      return;
    }

    setIsSending(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('send-anomaly-alert', {
        body: {
          recipients: config.recipients,
          datasetName: 'Current Analysis',
          anomalies: anomalies,
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;

      toast({
        title: 'Alert sent!',
        description: `Anomaly alert sent to ${config.recipients.length} recipient(s)`
      });
    } catch (error: any) {
      console.error('Failed to send alert:', error);
      toast({
        title: 'Failed to send alert',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
      case 'low': return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive to-chart-4 flex items-center justify-center">
            <BellRing className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Anomaly Alerts</h3>
            <p className="text-sm text-muted-foreground">Auto-notify when anomalies are detected</p>
          </div>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
        />
      </div>

      {/* Detected Anomalies */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-chart-4" />
          Detected Anomalies ({anomalies.length})
        </h4>
        {anomalies.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {anomalies.map((anomaly, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${getSeverityColor(anomaly.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{anomaly.metric}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-background/50">
                    {anomaly.severity}
                  </span>
                </div>
                <p className="text-xs mt-1 opacity-80">
                  Value: {anomaly.value.toLocaleString()} | Expected: {anomaly.expectedRange.min.toFixed(0)} - {anomaly.expectedRange.max.toFixed(0)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-chart-1/10 rounded-lg text-center">
            <Check className="w-6 h-6 text-chart-1 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No anomalies detected with current thresholds</p>
          </div>
        )}
      </div>

      {/* Recipients */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Alert Recipients
        </h4>
        <div className="flex gap-2 mb-3">
          <Input
            type="email"
            placeholder="email@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
            className="flex-1"
          />
          <Button onClick={addRecipient} size="sm" variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.recipients.map(email => (
            <span
              key={email}
              className="px-3 py-1 bg-secondary rounded-full text-sm flex items-center gap-2"
            >
              {email}
              <button onClick={() => removeRecipient(email)} className="hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {config.recipients.length === 0 && (
            <p className="text-sm text-muted-foreground">No recipients added</p>
          )}
        </div>
      </div>

      {/* Threshold Settings */}
      <div className="mb-6 p-4 bg-secondary/30 rounded-xl">
        <h4 className="text-sm font-medium mb-3">Detection Thresholds (Standard Deviations)</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">High Severity</label>
            <Input
              type="number"
              value={config.thresholds.highSeverity}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                thresholds: { ...prev.thresholds, highSeverity: Number(e.target.value) }
              }))}
              min={1}
              max={5}
              step={0.5}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Medium Severity</label>
            <Input
              type="number"
              value={config.thresholds.mediumSeverity}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                thresholds: { ...prev.thresholds, mediumSeverity: Number(e.target.value) }
              }))}
              min={1}
              max={4}
              step={0.5}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Send Now Button */}
      <Button
        onClick={sendAlertNow}
        disabled={isSending || config.recipients.length === 0 || anomalies.length === 0}
        className="w-full gap-2"
      >
        {isSending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending Alert...
          </>
        ) : (
          <>
            <Bell className="w-4 h-4" />
            Send Alert Now ({anomalies.length} anomalies)
          </>
        )}
      </Button>
    </motion.div>
  );
}
