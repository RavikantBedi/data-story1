import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  ArrowLeft, 
  GitCompareArrows, 
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  ArrowRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CleanedData } from '@/types/analytics';

interface SavedAnalysis {
  id: string;
  name: string;
  created_at: string;
  data: CleanedData;
}

interface ComparisonMetric {
  name: string;
  analysis1Value: number;
  analysis2Value: number;
  change: number;
  changePercent: number;
}

export default function Compare() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis1Id, setAnalysis1Id] = useState<string>('');
  const [analysis2Id, setAnalysis2Id] = useState<string>('');
  const [comparison, setComparison] = useState<ComparisonMetric[] | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    }
  }, [user]);

  useEffect(() => {
    if (analysis1Id && analysis2Id) {
      compareAnalyses();
    }
  }, [analysis1Id, analysis2Id]);

  const fetchAnalyses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('saved_analyses')
        .select('id, name, created_at, data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses((data || []) as unknown as SavedAnalysis[]);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const compareAnalyses = () => {
    const a1 = analyses.find(a => a.id === analysis1Id);
    const a2 = analyses.find(a => a.id === analysis2Id);
    
    if (!a1?.data || !a2?.data) return;

    const metrics: ComparisonMetric[] = [];
    
    // Compare common numeric columns
    const data1 = a1.data as CleanedData;
    const data2 = a2.data as CleanedData;
    
    const numericCols1 = data1.columns?.filter(c => c.type === 'numeric') || [];
    const numericCols2 = data2.columns?.filter(c => c.type === 'numeric') || [];
    
    numericCols1.forEach(col1 => {
      const col2 = numericCols2.find(c => c.name === col1.name);
      if (col2 && col1.stats?.mean !== undefined && col2.stats?.mean !== undefined) {
        const val1 = col1.stats.mean;
        const val2 = col2.stats.mean;
        const change = val2 - val1;
        const changePercent = val1 !== 0 ? (change / Math.abs(val1)) * 100 : 0;
        
        metrics.push({
          name: col1.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          analysis1Value: val1,
          analysis2Value: val2,
          change,
          changePercent,
        });
      }
    });

    // Add row count comparison
    if (data1.rowCount && data2.rowCount) {
      const change = data2.rowCount - data1.rowCount;
      const changePercent = data1.rowCount !== 0 ? (change / data1.rowCount) * 100 : 0;
      metrics.unshift({
        name: 'Total Records',
        analysis1Value: data1.rowCount,
        analysis2Value: data2.rowCount,
        change,
        changePercent,
      });
    }

    setComparison(metrics);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-2 to-chart-4 flex items-center justify-center">
                <GitCompareArrows className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Compare Analyses</h1>
                <p className="text-xs text-muted-foreground">Side-by-side comparison</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Selection */}
          <div className="glass-panel-elevated p-6">
            <h3 className="font-semibold mb-4">Select Analyses to Compare</h3>
            
            {analyses.length < 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GitCompareArrows className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>You need at least 2 saved analyses to compare</p>
                <Button 
                  onClick={() => navigate('/')} 
                  className="mt-4"
                  variant="outline"
                >
                  Create Analysis
                </Button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                  <label className="text-sm text-muted-foreground mb-2 block">Baseline (Before)</label>
                  <Select value={analysis1Id} onValueChange={setAnalysis1Id}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Select first analysis" />
                    </SelectTrigger>
                    <SelectContent>
                      {analyses.map(a => (
                        <SelectItem key={a.id} value={a.id} disabled={a.id === analysis2Id}>
                          {a.name} ({new Date(a.created_at).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
                
                <div className="flex-1 w-full">
                  <label className="text-sm text-muted-foreground mb-2 block">Comparison (After)</label>
                  <Select value={analysis2Id} onValueChange={setAnalysis2Id}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Select second analysis" />
                    </SelectTrigger>
                    <SelectContent>
                      {analyses.map(a => (
                        <SelectItem key={a.id} value={a.id} disabled={a.id === analysis1Id}>
                          {a.name} ({new Date(a.created_at).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Comparison Results */}
          {comparison && comparison.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="font-semibold">Comparison Results</h3>
              
              <div className="grid gap-4">
                {comparison.map((metric, i) => (
                  <motion.div
                    key={metric.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-panel p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{metric.name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">
                            Before: <span className="text-foreground font-mono">{metric.analysis1Value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          </span>
                          <span className="text-muted-foreground">
                            After: <span className="text-foreground font-mono">{metric.analysis2Value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                        metric.changePercent > 5 
                          ? 'bg-chart-1/15 text-chart-1' 
                          : metric.changePercent < -5 
                          ? 'bg-destructive/15 text-destructive'
                          : 'bg-secondary text-muted-foreground'
                      }`}>
                        {metric.changePercent > 5 ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : metric.changePercent < -5 ? (
                          <TrendingDown className="w-5 h-5" />
                        ) : (
                          <Minus className="w-5 h-5" />
                        )}
                        <span className="font-bold">
                          {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress bar visualization */}
                    <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-muted-foreground/30"
                        style={{ 
                          width: `${Math.min(50, (metric.analysis1Value / Math.max(metric.analysis1Value, metric.analysis2Value)) * 50)}%` 
                        }}
                      />
                      <div 
                        className={`h-full ${metric.changePercent >= 0 ? 'bg-chart-1' : 'bg-destructive'}`}
                        style={{ 
                          width: `${Math.min(50, (metric.analysis2Value / Math.max(metric.analysis1Value, metric.analysis2Value)) * 50)}%` 
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-panel-elevated p-6"
              >
                <h4 className="font-semibold mb-3">Summary</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {(() => {
                    const improved = comparison.filter(m => m.changePercent > 5).length;
                    const declined = comparison.filter(m => m.changePercent < -5).length;
                    const stable = comparison.length - improved - declined;
                    
                    if (improved > declined) {
                      return `Overall positive trend detected. ${improved} metric${improved > 1 ? 's' : ''} showed improvement, ${declined} declined, and ${stable} remained stable. This suggests progress in your key performance indicators.`;
                    } else if (declined > improved) {
                      return `Some areas need attention. ${declined} metric${declined > 1 ? 's' : ''} showed decline, while ${improved} improved and ${stable} remained stable. Consider investigating the declining areas.`;
                    } else {
                      return `Mixed results observed. ${improved} metric${improved > 1 ? 's' : ''} improved, ${declined} declined, and ${stable} remained stable. A balanced review of each area is recommended.`;
                    }
                  })()}
                </p>
              </motion.div>
            </motion.div>
          )}

          {comparison && comparison.length === 0 && analysis1Id && analysis2Id && (
            <div className="glass-panel p-8 text-center">
              <p className="text-muted-foreground">No common metrics found between these analyses</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try comparing analyses with similar data structures
              </p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
