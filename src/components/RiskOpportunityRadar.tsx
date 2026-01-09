import { motion } from 'framer-motion';
import { Radar, TrendingUp, TrendingDown, Minus, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';
import { CleanedData } from '@/types/analytics';
import { generateRiskOpportunityRadar, RiskOpportunity } from '@/lib/advancedAnalytics';

interface RiskOpportunityRadarProps {
  data: CleanedData;
}

export function RiskOpportunityRadar({ data }: RiskOpportunityRadarProps) {
  const items = generateRiskOpportunityRadar(data);
  
  const risks = items.filter(i => i.type === 'risk');
  const opportunities = items.filter(i => i.type === 'opportunity');
  const neutrals = items.filter(i => i.type === 'neutral');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-1 to-chart-5 flex items-center justify-center">
          <Radar className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Risk & Opportunity Radar</h3>
          <p className="text-sm text-muted-foreground">Data-driven strategic assessment</p>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-destructive/10 rounded-xl text-center">
          <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
          <p className="text-2xl font-bold text-destructive">{risks.length}</p>
          <p className="text-xs text-muted-foreground">Risks</p>
        </div>
        <div className="p-4 bg-chart-1/10 rounded-xl text-center">
          <TrendingUp className="w-6 h-6 text-chart-1 mx-auto mb-2" />
          <p className="text-2xl font-bold text-chart-1">{opportunities.length}</p>
          <p className="text-xs text-muted-foreground">Opportunities</p>
        </div>
        <div className="p-4 bg-muted/50 rounded-xl text-center">
          <Minus className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-2xl font-bold">{neutrals.length}</p>
          <p className="text-xs text-muted-foreground">Stable</p>
        </div>
      </div>
      
      {/* Risk Section */}
      {risks.length > 0 && (
        <div className="mb-6">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-destructive mb-3">
            <AlertTriangle className="w-4 h-4" />
            Risks to Monitor
          </h4>
          <div className="space-y-3">
            {risks.map((item, index) => (
              <RadarItem key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>
      )}
      
      {/* Opportunity Section */}
      {opportunities.length > 0 && (
        <div className="mb-6">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-chart-1 mb-3">
            <TrendingUp className="w-4 h-4" />
            Opportunities to Pursue
          </h4>
          <div className="space-y-3">
            {opportunities.map((item, index) => (
              <RadarItem key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>
      )}
      
      {/* Neutral Section */}
      {neutrals.length > 0 && (
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
            <Minus className="w-4 h-4" />
            Stable Indicators
          </h4>
          <div className="space-y-3">
            {neutrals.map((item, index) => (
              <RadarItem key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function RadarItem({ item, index }: { item: RiskOpportunity; index: number }) {
  const getTypeStyles = () => {
    switch (item.type) {
      case 'risk':
        return {
          bg: 'bg-destructive/5 border-destructive/20',
          icon: <TrendingDown className="w-4 h-4 text-destructive" />,
          impactBg: item.impact === 'high' ? 'bg-destructive/20 text-destructive' : 'bg-destructive/10 text-destructive/70'
        };
      case 'opportunity':
        return {
          bg: 'bg-chart-1/5 border-chart-1/20',
          icon: <TrendingUp className="w-4 h-4 text-chart-1" />,
          impactBg: item.impact === 'high' ? 'bg-chart-1/20 text-chart-1' : 'bg-chart-1/10 text-chart-1/70'
        };
      default:
        return {
          bg: 'bg-muted/30 border-border',
          icon: <Minus className="w-4 h-4 text-muted-foreground" />,
          impactBg: 'bg-muted text-muted-foreground'
        };
    }
  };
  
  const styles = getTypeStyles();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-4 rounded-xl border ${styles.bg} hover:shadow-md transition-all`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{styles.icon}</div>
          <div className="flex-1">
            <p className="font-medium text-sm">{item.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
            
            {item.suggestedAction && (
              <div className="flex items-center gap-2 mt-2 text-xs">
                <ArrowRight className="w-3 h-3 text-primary" />
                <span className="text-primary">{item.suggestedAction}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles.impactBg}`}>
            {item.impact} impact
          </span>
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full"
                style={{ width: `${item.confidence}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{item.confidence}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
