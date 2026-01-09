import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { InsightEvidence } from '@/types/analytics';

interface InteractiveTrustExplanationsProps {
  evidence: InsightEvidence[];
}

export function InteractiveTrustExplanations({ evidence }: InteractiveTrustExplanationsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-400';
    if (confidence >= 60) return 'text-blue-400';
    if (confidence >= 40) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 80) return 'bg-emerald-500/20';
    if (confidence >= 60) return 'bg-blue-500/20';
    if (confidence >= 40) return 'bg-yellow-500/20';
    return 'bg-orange-500/20';
  };

  const getEvidenceIcon = (strength: 'weak' | 'moderate' | 'strong') => {
    switch (strength) {
      case 'strong':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'moderate':
        return <Info className="w-4 h-4 text-blue-400" />;
      case 'weak':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getConfidenceBreakdown = (evidence: InsightEvidence) => {
    const factors: Array<{ label: string; value: number; description: string }> = [];
    
    // Data volume factor
    const dataFactor = Math.min(evidence.dataPointsSupporting / 100, 1) * 30;
    factors.push({
      label: 'Data Volume',
      value: dataFactor,
      description: `${evidence.dataPointsSupporting.toLocaleString()} data points analyzed`
    });

    // Consistency factor
    const consistencyFactor = evidence.isRepeated ? 25 : 10;
    factors.push({
      label: 'Pattern Consistency',
      value: consistencyFactor,
      description: evidence.isRepeated ? 'Pattern repeats across the dataset' : 'Pattern appears occasionally'
    });

    // Evidence strength factor
    const strengthFactor = evidence.evidenceStrength === 'strong' ? 30 : 
                           evidence.evidenceStrength === 'moderate' ? 20 : 10;
    factors.push({
      label: 'Evidence Quality',
      value: strengthFactor,
      description: `${evidence.evidenceStrength.charAt(0).toUpperCase() + evidence.evidenceStrength.slice(1)} statistical significance`
    });

    // Assumptions factor (negative)
    const assumptionPenalty = Math.min(evidence.assumptions.length * 5, 15);
    factors.push({
      label: 'Assumption Risk',
      value: -assumptionPenalty,
      description: `${evidence.assumptions.length} assumptions required`
    });

    return factors;
  };

  return (
    <div className="space-y-4">
      {evidence.map((item, index) => {
        const isExpanded = expandedIndex === index;
        const breakdown = getConfidenceBreakdown(item);

        return (
          <motion.div
            key={index}
            layout
            className="rounded-xl border border-border/50 overflow-hidden bg-card/50"
          >
            {/* Header - Always visible */}
            <button
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
              className="w-full p-4 flex items-start gap-4 hover:bg-secondary/30 transition-colors text-left"
            >
              {/* Confidence Circle */}
              <div className={`relative w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${getConfidenceBg(item.confidence)}`}>
                <span className={`text-lg font-bold ${getConfidenceColor(item.confidence)}`}>
                  {item.confidence}%
                </span>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-current opacity-30"
                  style={{
                    borderColor: item.confidence >= 80 ? '#34d399' : item.confidence >= 60 ? '#60a5fa' : '#fbbf24'
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getEvidenceIcon(item.evidenceStrength)}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.evidenceStrength === 'strong' ? 'bg-emerald-500/20 text-emerald-400' :
                    item.evidenceStrength === 'moderate' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {item.evidenceStrength.toUpperCase()} EVIDENCE
                  </span>
                  {item.isRepeated && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                      REPEATED PATTERN
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground line-clamp-2">{item.insight}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {item.dataPointsSupporting.toLocaleString()} data points
                </p>
              </div>

              {/* Expand icon */}
              <div className="shrink-0 text-muted-foreground">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 border-t border-border/30">
                    {/* How Confidence is Calculated */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-primary" />
                        How This Confidence Score Was Calculated
                      </h4>
                      
                      <div className="space-y-3">
                        {breakdown.map((factor, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-28 text-xs text-muted-foreground shrink-0">
                              {factor.label}
                            </div>
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(0, factor.value / 30 * 100)}%` }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className={`h-full rounded-full ${
                                  factor.value >= 0 ? 'bg-primary' : 'bg-red-400'
                                }`}
                              />
                            </div>
                            <div className={`w-12 text-xs font-medium text-right ${
                              factor.value >= 0 ? 'text-primary' : 'text-red-400'
                            }`}>
                              {factor.value >= 0 ? '+' : ''}{factor.value.toFixed(0)}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Confidence Score</span>
                        <span className={`text-lg font-bold ${getConfidenceColor(item.confidence)}`}>
                          {item.confidence}%
                        </span>
                      </div>
                    </div>

                    {/* Assumptions */}
                    {item.assumptions.length > 0 && (
                      <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                        <h5 className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3" />
                          Assumptions Made
                        </h5>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {item.assumptions.map((assumption, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-yellow-400/70">•</span>
                              {assumption}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Interpretation Guide */}
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <h5 className="text-xs font-semibold text-primary mb-2">What This Means</h5>
                      <p className="text-xs text-muted-foreground">
                        {item.confidence >= 80 
                          ? 'This finding is highly reliable. You can confidently use this insight for decision-making.'
                          : item.confidence >= 60
                          ? 'This finding is reasonably reliable. Consider it alongside other evidence when making decisions.'
                          : item.confidence >= 40
                          ? 'This finding has moderate certainty. Treat it as a hypothesis worth investigating further.'
                          : 'This finding has lower certainty. Additional data would help validate this pattern.'
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
