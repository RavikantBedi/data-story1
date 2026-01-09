import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
  Clock, 
  Trash2, 
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SavedAnalysis {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  data: any;
  charts: any;
  story: any;
}

interface SavedAnalysesListProps {
  onLoad: (analysis: SavedAnalysis) => void;
}

export function SavedAnalysesList({ onLoad }: SavedAnalysesListProps) {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('saved-analyses-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'saved_analyses',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchAnalyses();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchAnalyses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('saved_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from('saved_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Analysis deleted');
    } catch (error) {
      toast.error('Failed to delete analysis');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center p-8">
        <Folder className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No saved analyses yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Upload data and save your analysis to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {analyses.map((analysis) => (
          <motion.div
            key={analysis.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-4 flex items-center gap-4 group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{analysis.name}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {new Date(analysis.created_at).toLocaleDateString()}
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onLoad(analysis)}
              >
                Load
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(analysis.id)}
                disabled={deleting === analysis.id}
                className="text-destructive hover:text-destructive"
              >
                {deleting === analysis.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
