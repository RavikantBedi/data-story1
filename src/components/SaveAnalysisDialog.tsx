import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CleanedData, ChartConfig, DataStory } from '@/types/analytics';
import { notifyAnalysisSaved, notifyAnomalyDetected } from '@/lib/notifications';
import { getNotificationPreferences } from '@/components/NotificationSettings';

interface SaveAnalysisDialogProps {
  cleanedData: CleanedData;
  charts: ChartConfig[];
  dataStory: DataStory | null;
}

export function SaveAnalysisDialog({ cleanedData, charts, dataStory }: SaveAnalysisDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('saved_analyses')
        .insert([{
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          data: cleanedData as any,
          charts: charts as any,
          story: dataStory as any,
        }]);

      if (error) throw error;
      
      toast.success('Analysis saved successfully!');
      setOpen(false);
      setName('');
      setDescription('');

      // Send notifications based on preferences
      const prefs = getNotificationPreferences();
      
      if (prefs.analysisSaved) {
        notifyAnalysisSaved(name.trim(), user.email || undefined);
      }
      
      // Check for anomalies and notify if enabled
      if (prefs.anomalyDetected && dataStory?.anomalies && dataStory.anomalies.length > 0) {
        notifyAnomalyDetected(
          dataStory.anomalies.length,
          dataStory.anomalies.slice(0, 3),
          user.email || undefined
        );
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
      toast.error('Failed to save analysis');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Save className="w-4 h-4" />
          Save
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Analysis</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My Analysis"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this analysis..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary resize-none"
              rows={3}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>This will save:</p>
            <ul className="list-disc list-inside mt-1">
              <li>{cleanedData.rowCount} cleaned records</li>
              <li>{charts.length} generated charts</li>
              <li>Full data story narrative</li>
            </ul>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Analysis
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
