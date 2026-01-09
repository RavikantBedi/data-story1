import { motion } from 'framer-motion';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts';
import { ScatterPlotData, getCorrelationLabel } from '@/lib/correlationAnalysis';

interface ScatterPlotsProps {
  plots: ScatterPlotData[];
}

const COLORS = [
  'hsl(173, 80%, 40%)',
  'hsl(262, 83%, 58%)',
  'hsl(38, 92%, 50%)',
  'hsl(340, 82%, 52%)',
];

export function ScatterPlots({ plots }: ScatterPlotsProps) {
  const formatColumnName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (plots.length === 0) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-muted-foreground">Not enough numeric variables for scatter plots</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg">Scatter Plots</h3>
        <p className="text-sm text-muted-foreground">Variable relationships (sorted by correlation strength)</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plots.map((plot, index) => (
          <motion.div
            key={plot.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="chart-container"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-medium text-sm">
                  {formatColumnName(plot.xColumn)} vs {formatColumnName(plot.yColumn)}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  r = {plot.correlation.toFixed(3)} • {getCorrelationLabel(plot.correlation)}
                </p>
              </div>
              <span 
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  plot.correlation > 0.5 
                    ? 'bg-chart-1/15 text-chart-1'
                    : plot.correlation > 0.2
                    ? 'bg-chart-3/15 text-chart-3'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {(plot.correlation * 100).toFixed(0)}%
              </span>
            </div>
            
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    name={plot.xColumn}
                    tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
                    stroke="hsl(222, 30%, 18%)"
                    label={{ 
                      value: formatColumnName(plot.xColumn), 
                      position: 'bottom', 
                      offset: 0,
                      style: { fontSize: 10, fill: 'hsl(215, 20%, 55%)' }
                    }}
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    name={plot.yColumn}
                    tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
                    stroke="hsl(222, 30%, 18%)"
                  />
                  <ZAxis range={[40, 40]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(222, 47%, 10%)',
                      border: '1px solid hsl(222, 30%, 18%)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => value.toFixed(2)}
                  />
                  <Scatter
                    data={plot.data}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
