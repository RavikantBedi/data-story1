import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartConfig, ClickExplanation } from '@/types/analytics';
import { generateExplanation } from '@/lib/analyticsEngine';
import { Info, X, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface InteractiveChartsProps {
  charts: ChartConfig[];
}

const CHART_COLORS = [
  'hsl(173, 80%, 40%)',
  'hsl(262, 83%, 58%)',
  'hsl(38, 92%, 50%)',
  'hsl(340, 82%, 52%)',
  'hsl(200, 95%, 48%)',
];

export function InteractiveCharts({ charts }: InteractiveChartsProps) {
  const [selectedExplanation, setSelectedExplanation] = useState<ClickExplanation | null>(null);

  const handleChartClick = (chart: ChartConfig, data: any) => {
    if (!data || !data.activePayload?.[0]) return;
    
    const payload = data.activePayload[0].payload;
    const dataPoint = {
      x: payload[chart.xAxis] || payload.x || payload.name,
      y: payload[chart.yAxis] || payload.y || payload.value,
    };
    
    const explanation = generateExplanation(chart, dataPoint);
    
    setSelectedExplanation({
      chartId: chart.id,
      dataPoint,
      explanation,
      context: chart.title,
      relatedInsights: chart.insights.map(i => i.description).slice(0, 2),
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map((chart, index) => (
          <motion.div
            key={chart.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="chart-container"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm">{chart.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click any point for explanation
                </p>
              </div>
              {chart.insights.length > 0 && (
                <div className="flex gap-1">
                  {chart.insights.slice(0, 2).map((insight, i) => (
                    <span
                      key={i}
                      className={getInsightBadgeClass(insight.type)}
                      title={insight.description}
                    >
                      {getInsightIcon(insight.type)}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart(chart, handleChartClick)}
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Explanation Panel */}
      <AnimatePresence>
        {selectedExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-panel-elevated p-6 relative"
          >
            <button
              onClick={() => setSelectedExplanation(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Info className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">Data Point Explanation</h4>
                  <span className="text-xs text-muted-foreground">
                    {selectedExplanation.context}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mb-3 text-sm">
                  <span className="px-2 py-1 bg-secondary rounded font-mono text-xs">
                    X: {String(selectedExplanation.dataPoint.x)}
                  </span>
                  <span className="px-2 py-1 bg-secondary rounded font-mono text-xs">
                    Y: {typeof selectedExplanation.dataPoint.y === 'number' 
                      ? selectedExplanation.dataPoint.y.toFixed(2) 
                      : selectedExplanation.dataPoint.y}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedExplanation.explanation}
                </p>
                
                {selectedExplanation.relatedInsights.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Related Insights:</p>
                    <div className="space-y-1">
                      {selectedExplanation.relatedInsights.map((insight, i) => (
                        <p key={i} className="text-sm text-muted-foreground">• {insight}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function renderChart(chart: ChartConfig, onClick: (chart: ChartConfig, data: any) => void) {
  const commonProps = {
    onClick: (data: any) => onClick(chart, data),
  };

  switch (chart.type) {
    case 'line':
      return (
        <LineChart data={chart.data} {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
          <XAxis 
            dataKey={chart.xAxis} 
            tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
            tickFormatter={(value) => formatAxisValue(value)}
            stroke="hsl(222, 30%, 18%)"
          />
          <YAxis 
            tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
            stroke="hsl(222, 30%, 18%)"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(222, 47%, 10%)',
              border: '1px solid hsl(222, 30%, 18%)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Line
            type="monotone"
            dataKey={chart.yAxis}
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS[0], strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: CHART_COLORS[0], stroke: 'white', strokeWidth: 2 }}
          />
        </LineChart>
      );

    case 'bar':
      return (
        <BarChart data={chart.data} {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
          <XAxis 
            dataKey={chart.xAxis} 
            tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
            tickFormatter={(value) => formatAxisValue(value)}
            stroke="hsl(222, 30%, 18%)"
          />
          <YAxis 
            tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
            stroke="hsl(222, 30%, 18%)"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(222, 47%, 10%)',
              border: '1px solid hsl(222, 30%, 18%)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Bar dataKey={chart.yAxis} radius={[4, 4, 0, 0]}>
            {chart.data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      );

    case 'pie':
      return (
        <PieChart {...commonProps}>
          <Pie
            data={chart.data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={50}
            paddingAngle={2}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: 'hsl(215, 20%, 55%)', strokeWidth: 1 }}
          >
            {chart.data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(222, 47%, 10%)',
              border: '1px solid hsl(222, 30%, 18%)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
        </PieChart>
      );

    case 'area':
      return (
        <AreaChart data={chart.data} {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
          <XAxis 
            dataKey="x" 
            tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
            stroke="hsl(222, 30%, 18%)"
          />
          <YAxis 
            tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
            stroke="hsl(222, 30%, 18%)"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(222, 47%, 10%)',
              border: '1px solid hsl(222, 30%, 18%)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          {Object.keys(chart.data[0] || {})
            .filter(k => k !== 'x')
            .slice(0, 2)
            .map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[i]}
                fill={CHART_COLORS[i]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ))}
        </AreaChart>
      );

    default:
      return (
        <LineChart data={chart.data} {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
          <XAxis dataKey={chart.xAxis} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey={chart.yAxis} stroke={CHART_COLORS[0]} />
        </LineChart>
      );
  }
}

function formatAxisValue(value: any): string {
  if (typeof value === 'string' && value.length > 12) {
    return value.slice(0, 10) + '...';
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}

function getInsightBadgeClass(type: string): string {
  const base = 'w-6 h-6 rounded-full flex items-center justify-center cursor-help';
  switch (type) {
    case 'spike':
    case 'trend':
      return `${base} bg-chart-1/15 text-chart-1`;
    case 'drop':
      return `${base} bg-chart-4/15 text-chart-4`;
    case 'anomaly':
      return `${base} bg-chart-3/15 text-chart-3`;
    default:
      return `${base} bg-secondary text-muted-foreground`;
  }
}

function getInsightIcon(type: string) {
  switch (type) {
    case 'spike':
    case 'trend':
      return <TrendingUp className="w-3 h-3" />;
    case 'drop':
      return <TrendingDown className="w-3 h-3" />;
    case 'anomaly':
      return <AlertCircle className="w-3 h-3" />;
    default:
      return <Info className="w-3 h-3" />;
  }
}
