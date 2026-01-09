import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  ArrowLeft, 
  BarChart3, 
  FileText, 
  TrendingUp, 
  Clock,
  Database,
  Zap,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface AnalyticsData {
  totalAnalyses: number;
  totalRecordsAnalyzed: number;
  recentAnalyses: { name: string; created_at: string; rowCount: number }[];
  activityByDay: { date: string; count: number }[];
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    try {
      const { data: analyses, error } = await supabase
        .from('saved_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalAnalyses = analyses?.length || 0;
      const totalRecordsAnalyzed = analyses?.reduce((sum, a) => {
        const data = a.data as any;
        return sum + (data?.rowCount || 0);
      }, 0) || 0;

      const recentAnalyses = (analyses || []).slice(0, 5).map(a => ({
        name: a.name,
        created_at: a.created_at,
        rowCount: (a.data as any)?.rowCount || 0,
      }));

      // Group by day for activity chart
      const activityMap = new Map<string, number>();
      (analyses || []).forEach(a => {
        const date = new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
      });

      const activityByDay = Array.from(activityMap.entries())
        .slice(0, 7)
        .map(([date, count]) => ({ date, count }))
        .reverse();

      setAnalytics({
        totalAnalyses,
        totalRecordsAnalyzed,
        recentAnalyses,
        activityByDay,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-5 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Analytics Dashboard</h1>
                <p className="text-xs text-muted-foreground">Your analysis overview</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { 
                icon: FileText, 
                label: 'Total Analyses', 
                value: analytics?.totalAnalyses || 0,
                color: 'chart-1'
              },
              { 
                icon: Database, 
                label: 'Records Analyzed', 
                value: analytics?.totalRecordsAnalyzed?.toLocaleString() || '0',
                color: 'chart-2'
              },
              { 
                icon: TrendingUp, 
                label: 'This Week', 
                value: analytics?.activityByDay.reduce((s, d) => s + d.count, 0) || 0,
                color: 'chart-3'
              },
              { 
                icon: Zap, 
                label: 'Insights Generated', 
                value: (analytics?.totalAnalyses || 0) * 5,
                color: 'chart-4'
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="stat-card"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-${stat.color}/15 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-6"
            >
              <h3 className="font-semibold mb-4">Analysis Activity</h3>
              <div className="h-[200px]">
                {analytics?.activityByDay && analytics.activityByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.activityByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                      <XAxis 
                        dataKey="date" 
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
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(173, 80%, 40%)" 
                        fill="hsl(173, 80%, 40%)"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>No activity data yet</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Records by Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel p-6"
            >
              <h3 className="font-semibold mb-4">Records per Analysis</h3>
              <div className="h-[200px]">
                {analytics?.recentAnalyses && analytics.recentAnalyses.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.recentAnalyses.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }}
                        stroke="hsl(222, 30%, 18%)"
                        tickFormatter={(v) => v.slice(0, 10)}
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
                        }}
                      />
                      <Bar dataKey="rowCount" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>No analyses yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Recent Analyses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Analyses</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                View All
              </Button>
            </div>
            
            {analytics?.recentAnalyses && analytics.recentAnalyses.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentAnalyses.map((analysis, i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{analysis.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {analysis.rowCount.toLocaleString()} records
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No analyses yet</p>
                <p className="text-sm mt-1">Upload your first dataset to get started!</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
