import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { CleanedData } from '@/types/analytics';

interface DatePredictionsProps {
  data: CleanedData;
}

interface Prediction {
  timeframe: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: 'high' | 'medium' | 'low';
  direction: 'up' | 'down' | 'stable';
  explanation: string;
}

export function DatePredictions({ data }: DatePredictionsProps) {
  const predictions = generatePredictions(data);
  
  if (predictions.length === 0) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel-elevated p-6 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Future Predictions</h3>
          <p className="text-sm text-muted-foreground">Based on current trends, here's what to expect</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {predictions.map((pred, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-5 rounded-xl border ${
              pred.direction === 'up' 
                ? 'bg-green-500/5 border-green-500/20' 
                : pred.direction === 'down' 
                ? 'bg-red-500/5 border-red-500/20' 
                : 'bg-gray-500/5 border-gray-500/20'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{pred.timeframe}</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs ${
                pred.confidence === 'high' 
                  ? 'bg-green-500/20 text-green-400' 
                  : pred.confidence === 'medium' 
                  ? 'bg-yellow-500/20 text-yellow-400' 
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {pred.confidence} confidence
              </div>
            </div>
            
            {/* Metric */}
            <h4 className="font-semibold mb-3">{pred.metric}</h4>
            
            {/* Values */}
            <div className="flex items-center gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="text-lg font-bold">{formatValue(pred.currentValue)}</p>
              </div>
              
              <div className={`flex items-center gap-1 ${
                pred.direction === 'up' ? 'text-green-400' : 
                pred.direction === 'down' ? 'text-red-400' : 'text-gray-400'
              }`}>
                {pred.direction === 'up' ? (
                  <TrendingUp className="w-5 h-5" />
                ) : pred.direction === 'down' ? (
                  <TrendingDown className="w-5 h-5" />
                ) : (
                  <span className="w-5 h-5 flex items-center justify-center">→</span>
                )}
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground">Predicted</p>
                <p className={`text-lg font-bold ${
                  pred.direction === 'up' ? 'text-green-400' : 
                  pred.direction === 'down' ? 'text-red-400' : ''
                }`}>
                  {formatValue(pred.predictedValue)}
                </p>
              </div>
              
              <div className={`ml-auto px-3 py-1 rounded-lg text-sm font-medium ${
                pred.direction === 'up' ? 'bg-green-500/20 text-green-400' : 
                pred.direction === 'down' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20'
              }`}>
                {pred.direction === 'up' ? '+' : ''}{((pred.predictedValue - pred.currentValue) / pred.currentValue * 100).toFixed(1)}%
              </div>
            </div>
            
            {/* Explanation */}
            <p className="text-sm text-muted-foreground">{pred.explanation}</p>
          </motion.div>
        ))}
      </div>
      
      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
        <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          <strong className="text-yellow-500">Note:</strong> These predictions are based on historical patterns in your data. 
          Actual results may vary due to market conditions, business changes, or other factors not captured in this dataset.
        </p>
      </div>
    </motion.div>
  );
}

function generatePredictions(data: CleanedData): Prediction[] {
  const predictions: Prediction[] = [];
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  const hasTimeData = data.columns.some(c => c.type === 'datetime');
  
  numericColumns.slice(0, 3).forEach(col => {
    const stats = col.stats;
    if (!stats?.mean || !stats?.trend || stats.percentChange === undefined) return;
    
    const name = formatColumnName(col.name);
    const currentValue = stats.mean;
    const monthlyChange = stats.percentChange / 12; // Assume annual change, convert to monthly
    
    // Next month prediction
    const nextMonthValue = currentValue * (1 + monthlyChange / 100);
    const nextMonthDirection = monthlyChange > 2 ? 'up' : monthlyChange < -2 ? 'down' : 'stable';
    
    predictions.push({
      timeframe: 'Next Month',
      metric: name,
      currentValue,
      predictedValue: nextMonthValue,
      confidence: Math.abs(monthlyChange) > 5 ? 'medium' : 'high',
      direction: nextMonthDirection,
      explanation: nextMonthDirection === 'up' 
        ? `Based on the current upward trend, ${name.toLowerCase()} is expected to continue growing. This is good news for your business.`
        : nextMonthDirection === 'down'
        ? `The declining trend suggests ${name.toLowerCase()} may decrease further. Consider taking action to reverse this.`
        : `${name} is expected to remain relatively stable. This provides a predictable baseline for planning.`
    });
    
    // Next quarter prediction (3 months)
    if (hasTimeData && predictions.length < 4) {
      const quarterChange = monthlyChange * 3;
      const quarterValue = currentValue * (1 + quarterChange / 100);
      const quarterDirection = quarterChange > 5 ? 'up' : quarterChange < -5 ? 'down' : 'stable';
      
      predictions.push({
        timeframe: 'Next Quarter',
        metric: name,
        currentValue,
        predictedValue: quarterValue,
        confidence: 'medium',
        direction: quarterDirection,
        explanation: quarterDirection === 'up'
          ? `Over the next 3 months, ${name.toLowerCase()} could see significant gains if current momentum continues.`
          : quarterDirection === 'down'
          ? `Without intervention, ${name.toLowerCase()} may decline notably over the quarter. Early action is recommended.`
          : `Quarter-over-quarter, ${name.toLowerCase()} should remain in a stable range.`
      });
    }
  });
  
  // Add overall business prediction
  const growingMetrics = numericColumns.filter(c => c.stats?.trend === 'increasing').length;
  const decliningMetrics = numericColumns.filter(c => c.stats?.trend === 'decreasing').length;
  
  if (numericColumns.length > 0 && predictions.length < 6) {
    const overallTrend = growingMetrics > decliningMetrics ? 'up' : 
                        decliningMetrics > growingMetrics ? 'down' : 'stable';
    
    predictions.push({
      timeframe: 'Next 6 Months',
      metric: 'Overall Performance',
      currentValue: 100,
      predictedValue: overallTrend === 'up' ? 115 : overallTrend === 'down' ? 88 : 100,
      confidence: 'low',
      direction: overallTrend,
      explanation: overallTrend === 'up'
        ? 'With most metrics trending positively, your business is positioned for growth. Focus on maintaining this momentum.'
        : overallTrend === 'down'
        ? 'Several key indicators are declining. A strategic review and corrective actions are recommended.'
        : 'Your business metrics are balanced. This is a good time to experiment with improvements.'
    });
  }
  
  return predictions.slice(0, 4);
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(num: number): string {
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(num % 1 === 0 ? 0 : 1);
}
