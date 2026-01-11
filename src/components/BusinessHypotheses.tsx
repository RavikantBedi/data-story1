import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, FlaskConical, Target, ChevronRight, Sparkles } from 'lucide-react';
import { CleanedData } from '@/types/analytics';
import { generateBusinessHypotheses, BusinessHypothesis } from '@/lib/advancedAnalytics';

interface BusinessHypothesesProps {
  data: CleanedData;
}

export function BusinessHypotheses({ data }: BusinessHypothesesProps) {
  const hypotheses = useMemo(() => {
    try {
      return generateBusinessHypotheses(data);
    } catch (error) {
      console.error('Error generating hypotheses:', error);
      return [];
    }
  }, [data]);
  
  if (hypotheses.length === 0) {
    return null;
  }
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };
  
  const getSupportColor = (support: string) => {
    switch (support) {
      case 'strong': return 'text-chart-1';
      case 'moderate': return 'text-chart-4';
      case 'weak': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-4 to-chart-5 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Auto-Generated Business Hypotheses</h3>
          <p className="text-sm text-muted-foreground">AI-suggested causes and testable theories</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {hypotheses.map((hypothesis, index) => (
          <HypothesisCard key={hypothesis.id} hypothesis={hypothesis} index={index} />
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-secondary/30 rounded-xl">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-chart-5 mt-0.5" />
          <div>
            <p className="text-sm font-medium">How to use these hypotheses</p>
            <p className="text-xs text-muted-foreground mt-1">
              Each hypothesis is testable using your existing data or through targeted research.
              Prioritize high-impact hypotheses and validate before making major decisions.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HypothesisCard({ hypothesis, index }: { hypothesis: BusinessHypothesis; index: number }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };
  
  const getSupportColor = (support: string) => {
    switch (support) {
      case 'strong': return 'text-chart-1';
      case 'moderate': return 'text-chart-4';
      case 'weak': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 bg-card/50 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{hypothesis.hypothesis}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(hypothesis.priority)}`}>
          {hypothesis.priority}
        </span>
      </div>
      
      <div className="ml-11 space-y-2">
        <div className="flex items-start gap-2">
          <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-muted-foreground">Possible cause: </span>
            <span className="text-xs">{hypothesis.possibleCause}</span>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 text-chart-1 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-muted-foreground">How to test: </span>
            <span className="text-xs">{hypothesis.testMethod}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 pt-2">
          <span className={`text-xs ${getSupportColor(hypothesis.dataSupport)}`}>
            Data support: {hypothesis.dataSupport}
          </span>
          {hypothesis.relatedColumns.length > 0 && (
            <div className="flex items-center gap-1">
              {hypothesis.relatedColumns.map(col => (
                <span key={col} className="px-2 py-0.5 bg-secondary rounded text-xs">
                  {col}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
