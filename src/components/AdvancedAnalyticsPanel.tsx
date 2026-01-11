import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Shuffle, 
  BarChart3, 
  Grid3X3, 
  Timer, 
  Workflow,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { CleanedData } from '@/types/analytics';
import {
  performRegression,
  calculateMutualInformation,
  performANOVA,
  performChiSquare,
  performLeadLagAnalysis,
  findAssociationRules,
  RegressionResult,
  MutualInformationResult,
  ANOVAResult,
  ChiSquareResult,
  LeadLagResult,
  AssociationRule
} from '@/lib/advancedAnalytics';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdvancedAnalyticsPanelProps {
  data: CleanedData;
}

type AnalysisMethod = 'regression' | 'mutual-info' | 'anova' | 'chi-square' | 'lead-lag' | 'association';

interface MethodInfo {
  id: AnalysisMethod;
  name: string;
  icon: React.ElementType;
  description: string;
  bestFor: string;
  replacesCorrelation: boolean;
}

const METHODS: MethodInfo[] = [
  {
    id: 'regression',
    name: 'Regression',
    icon: TrendingUp,
    description: 'Linear regression for quantitative impact measurement',
    bestFor: 'Quantitative impact',
    replacesCorrelation: true
  },
  {
    id: 'mutual-info',
    name: 'Mutual Information',
    icon: Shuffle,
    description: 'Detect non-linear relationships between variables',
    bestFor: 'Non-linear relations',
    replacesCorrelation: true
  },
  {
    id: 'anova',
    name: 'ANOVA',
    icon: BarChart3,
    description: 'Test if groups have significantly different means',
    bestFor: 'Group differences',
    replacesCorrelation: true
  },
  {
    id: 'chi-square',
    name: 'Chi-Square',
    icon: Grid3X3,
    description: 'Test association between categorical variables',
    bestFor: 'Categorical data',
    replacesCorrelation: true
  },
  {
    id: 'lead-lag',
    name: 'Lead-Lag',
    icon: Timer,
    description: 'Find time-shifted correlations in time-series data',
    bestFor: 'Time-series',
    replacesCorrelation: true
  },
  {
    id: 'association',
    name: 'Association Rules',
    icon: Workflow,
    description: 'Discover patterns and co-occurrences in data',
    bestFor: 'Pattern discovery',
    replacesCorrelation: true
  }
];

export function AdvancedAnalyticsPanel({ data }: AdvancedAnalyticsPanelProps) {
  const [activeMethod, setActiveMethod] = useState<AnalysisMethod>('regression');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Lazy compute results only for the active method using useMemo
  const results = useMemo(() => {
    try {
      switch (activeMethod) {
        case 'regression': return performRegression(data);
        case 'mutual-info': return calculateMutualInformation(data);
        case 'anova': return performANOVA(data);
        case 'chi-square': return performChiSquare(data);
        case 'lead-lag': return performLeadLagAnalysis(data);
        case 'association': return findAssociationRules(data);
        default: return [];
      }
    } catch (error) {
      console.error(`Error computing ${activeMethod}:`, error);
      return [];
    }
  }, [activeMethod, data]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-3 to-chart-1 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Advanced Analytics</h3>
            <p className="text-sm text-muted-foreground">Beyond correlation analysis</p>
          </div>
        </div>
      </div>
      
      {/* Method Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
        {METHODS.map((method) => (
          <TooltipProvider key={method.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveMethod(method.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    activeMethod === method.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary/50 hover:bg-secondary'
                  }`}
                >
                  <method.icon className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">{method.name}</p>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium">{method.name}</p>
                <p className="text-xs text-muted-foreground">{method.description}</p>
                <p className="text-xs mt-1">
                  <span className="text-chart-1">Best for:</span> {method.bestFor}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      
      {/* Method Legend */}
      <div className="mb-6 p-4 bg-secondary/30 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {METHODS.find(m => m.id === activeMethod)?.name} Analysis
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {METHODS.find(m => m.id === activeMethod)?.description}
        </p>
      </div>
      
      {/* Results */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMethod}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >
          {results.length === 0 ? (
            <div className="p-6 bg-muted/30 rounded-xl text-center">
              <p className="text-muted-foreground">
                Not enough data for {METHODS.find(m => m.id === activeMethod)?.name} analysis.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try a different method or add more data.
              </p>
            </div>
          ) : (
            <>
              {activeMethod === 'regression' && (
                <RegressionResults results={results as RegressionResult[]} />
              )}
              {activeMethod === 'mutual-info' && (
                <MutualInfoResults results={results as MutualInformationResult[]} />
              )}
              {activeMethod === 'anova' && (
                <ANOVAResults results={results as ANOVAResult[]} />
              )}
              {activeMethod === 'chi-square' && (
                <ChiSquareResults results={results as ChiSquareResult[]} />
              )}
              {activeMethod === 'lead-lag' && (
                <LeadLagResults results={results as LeadLagResult[]} />
              )}
              {activeMethod === 'association' && (
                <AssociationResults results={results as AssociationRule[]} />
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function RegressionResults({ results }: { results: RegressionResult[] }) {
  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <div key={i} className="p-4 bg-card/50 rounded-xl border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">
              {formatColumnName(r.column1)} → {formatColumnName(r.column2)}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              r.rSquared > 0.7 ? 'bg-chart-1/20 text-chart-1' :
              r.rSquared > 0.4 ? 'bg-chart-4/20 text-chart-4' :
              'bg-muted text-muted-foreground'
            }`}>
              R² = {r.rSquared.toFixed(3)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Slope: {r.slope.toFixed(4)} | Intercept: {r.intercept.toFixed(4)}
          </p>
          <p className="text-xs">{r.interpretation}</p>
        </div>
      ))}
    </div>
  );
}

function MutualInfoResults({ results }: { results: MutualInformationResult[] }) {
  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <div key={i} className="p-4 bg-card/50 rounded-xl border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">
              {formatColumnName(r.column1)} ↔ {formatColumnName(r.column2)}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              r.strength === 'strong' ? 'bg-chart-1/20 text-chart-1' :
              r.strength === 'moderate' ? 'bg-chart-4/20 text-chart-4' :
              'bg-muted text-muted-foreground'
            }`}>
              {r.strength} ({(r.score * 100).toFixed(0)}%)
            </span>
          </div>
          <p className="text-xs">{r.interpretation}</p>
        </div>
      ))}
    </div>
  );
}

function ANOVAResults({ results }: { results: ANOVAResult[] }) {
  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <div key={i} className="p-4 bg-card/50 rounded-xl border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">
              {formatColumnName(r.numericColumn)} by {formatColumnName(r.categoricalColumn)}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              r.significant ? 'bg-chart-1/20 text-chart-1' : 'bg-muted text-muted-foreground'
            }`}>
              F = {r.fStatistic.toFixed(2)} {r.significant ? '(significant)' : ''}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{r.interpretation}</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(r.groupMeans).slice(0, 5).map(([group, mean]) => (
              <span key={group} className="px-2 py-1 bg-secondary rounded text-xs">
                {group}: {mean.toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChiSquareResults({ results }: { results: ChiSquareResult[] }) {
  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <div key={i} className="p-4 bg-card/50 rounded-xl border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">
              {formatColumnName(r.column1)} × {formatColumnName(r.column2)}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              r.significant ? 'bg-chart-1/20 text-chart-1' : 'bg-muted text-muted-foreground'
            }`}>
              χ² = {r.chiSquare.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">df = {r.degreesOfFreedom}</p>
          <p className="text-xs mt-1">{r.interpretation}</p>
        </div>
      ))}
    </div>
  );
}

function LeadLagResults({ results }: { results: LeadLagResult[] }) {
  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <div key={i} className="p-4 bg-card/50 rounded-xl border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">
              {formatColumnName(r.column1)} {r.direction === 'leads' ? '→' : r.direction === 'lags' ? '←' : '↔'} {formatColumnName(r.column2)}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              r.correlation > 0.7 ? 'bg-chart-1/20 text-chart-1' :
              r.correlation > 0.4 ? 'bg-chart-4/20 text-chart-4' :
              'bg-muted text-muted-foreground'
            }`}>
              lag: {r.optimalLag} periods
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Correlation: {r.correlation.toFixed(3)}</p>
          <p className="text-xs mt-1">{r.interpretation}</p>
        </div>
      ))}
    </div>
  );
}

function AssociationResults({ results }: { results: AssociationRule[] }) {
  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <div key={i} className="p-4 bg-card/50 rounded-xl border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-primary/10 rounded text-xs">
              {r.antecedent.join(', ')}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="px-2 py-1 bg-chart-1/10 rounded text-xs">
              {r.consequent.join(', ')}
            </span>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground mb-2">
            <span>Support: {(r.support * 100).toFixed(1)}%</span>
            <span>Confidence: {(r.confidence * 100).toFixed(1)}%</span>
            <span className={r.lift > 1.5 ? 'text-chart-1' : ''}>
              Lift: {r.lift.toFixed(2)}
            </span>
          </div>
          <p className="text-xs">{r.interpretation}</p>
        </div>
      ))}
    </div>
  );
}

function formatColumnName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
