import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Plus, 
  X, 
  Send, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CleanedData, DataStory, TrustLayer } from '@/types/analytics';
import { generateTrustLayer } from '@/lib/trustLayerGenerator';

interface EmailSchedulerProps {
  cleanedData: CleanedData | null;
  dataStory: DataStory | null;
  charts: any[];
}

interface Recipient {
  email: string;
  name: string;
}

interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek: number;
  time: string;
}

const STORAGE_KEY = 'datalens_email_recipients';
const SCHEDULE_KEY = 'datalens_email_schedule';

export function EmailScheduler({ cleanedData, dataStory, charts }: EmailSchedulerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleConfig>({
    enabled: false,
    frequency: 'weekly',
    dayOfWeek: 1,
    time: '09:00'
  });

  // Load saved recipients and schedule
  useEffect(() => {
    const savedRecipients = localStorage.getItem(STORAGE_KEY);
    const savedSchedule = localStorage.getItem(SCHEDULE_KEY);
    
    if (savedRecipients) {
      try {
        setRecipients(JSON.parse(savedRecipients));
      } catch (e) {
        console.error('Failed to parse saved recipients');
      }
    }
    
    if (savedSchedule) {
      try {
        setSchedule(JSON.parse(savedSchedule));
      } catch (e) {
        console.error('Failed to parse saved schedule');
      }
    }
  }, []);

  // Save recipients when changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipients));
  }, [recipients]);

  // Save schedule when changed
  useEffect(() => {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
  }, [schedule]);

  const addRecipient = () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (recipients.some(r => r.email === newEmail)) {
      toast.error('This email is already in the list');
      return;
    }

    setRecipients([...recipients, { email: newEmail, name: newName || newEmail.split('@')[0] }]);
    setNewEmail('');
    setNewName('');
    toast.success('Recipient added');
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r.email !== email));
    toast.success('Recipient removed');
  };

  const formatNumber = (num: number): string => {
    if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(num % 1 === 0 ? 0 : 1);
  };

  const formatColumnName = (name: string): string => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const sendReport = async () => {
    if (!cleanedData || !dataStory) {
      toast.error('No data available to send');
      return;
    }

    if (recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    setIsSending(true);

    try {
      const trustLayer = generateTrustLayer(cleanedData, dataStory, charts);
      const numericColumns = cleanedData.columns.filter(c => c.type === 'numeric');

      // Prepare report data
      const reportData = {
        title: dataStory.title,
        overview: dataStory.overview,
        keyMetrics: numericColumns.slice(0, 4).map(col => ({
          name: formatColumnName(col.name),
          value: formatNumber(col.stats?.mean || 0),
          trend: col.stats?.trend || 'stable',
          change: col.stats?.percentChange || 0
        })),
        keyTrends: dataStory.keyTrends,
        anomalies: dataStory.anomalies,
        insights: dataStory.insights,
        reliabilityScore: trustLayer.reliabilityScore,
        predictions: numericColumns.slice(0, 4).map(col => {
          const stats = col.stats;
          const monthlyChange = (stats?.percentChange || 0) / 12;
          const current = stats?.mean || 0;
          return {
            metric: formatColumnName(col.name),
            current,
            predicted: current * (1 + monthlyChange / 100),
            direction: stats?.trend === 'increasing' ? 'up' : stats?.trend === 'decreasing' ? 'down' : 'stable'
          };
        })
      };

      const { data, error } = await supabase.functions.invoke('send-weekly-report', {
        body: {
          recipients: recipients.map(r => r.email),
          reportData,
          senderName: 'DataLens AI'
        }
      });

      if (error) throw error;

      toast.success(`Report sent to ${data.sent} recipient${data.sent !== 1 ? 's' : ''}`);
      setIsOpen(false);
    } catch (error: any) {
      console.error('Failed to send report:', error);
      toast.error(error.message || 'Failed to send report');
    } finally {
      setIsSending(false);
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Mail className="w-4 h-4" />
          Schedule Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Report Scheduler
          </DialogTitle>
          <DialogDescription>
            Send automated weekly reports to your stakeholders
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Recipients Section */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Recipients ({recipients.length})
            </Label>
            
            <div className="flex gap-2">
              <Input
                placeholder="Name (optional)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-1/3"
              />
              <Input
                placeholder="email@example.com"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                className="flex-1"
              />
              <Button onClick={addRecipient} size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {recipients.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {recipients.map((recipient) => (
                  <motion.div
                    key={recipient.email}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                  >
                    <div>
                      <p className="text-sm font-medium">{recipient.name}</p>
                      <p className="text-xs text-muted-foreground">{recipient.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeRecipient(recipient.email)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Section */}
          <div className="space-y-3 p-4 rounded-xl bg-secondary/20 border border-border/50">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Automatic Scheduling
              </Label>
              <Switch
                checked={schedule.enabled}
                onCheckedChange={(checked) => setSchedule({ ...schedule, enabled: checked })}
              />
            </div>

            {schedule.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Frequency</Label>
                    <Select
                      value={schedule.frequency}
                      onValueChange={(value: any) => setSchedule({ ...schedule, frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {schedule.frequency === 'weekly' && (
                    <div className="space-y-1">
                      <Label className="text-xs">Day</Label>
                      <Select
                        value={schedule.dayOfWeek.toString()}
                        onValueChange={(value) => setSchedule({ ...schedule, dayOfWeek: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dayNames.map((day, i) => (
                            <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs">Time</Label>
                    <Input
                      type="time"
                      value={schedule.time}
                      onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {schedule.frequency === 'daily' && `Daily at ${schedule.time}`}
                  {schedule.frequency === 'weekly' && `Every ${dayNames[schedule.dayOfWeek]} at ${schedule.time}`}
                  {schedule.frequency === 'monthly' && `Monthly on the 1st at ${schedule.time}`}
                </p>
              </motion.div>
            )}
          </div>

          {/* Status */}
          {!cleanedData || !dataStory ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-600">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">Load data first to send reports</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <p className="text-sm">Report ready with {cleanedData.rowCount.toLocaleString()} records</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={sendReport}
              disabled={isSending || !cleanedData || !dataStory || recipients.length === 0}
              className="flex-1 gap-2"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
