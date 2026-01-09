import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from '@/components/FileUpload';
import { StatsOverview } from '@/components/StatsOverview';
import { InteractiveCharts } from '@/components/InteractiveCharts';
import { DataStory } from '@/components/DataStory';
import { cleanAndPrepareData } from '@/lib/dataPreprocessing';
import { generateCharts } from '@/lib/analyticsEngine';
import { generateDataStory } from '@/lib/storyGenerator';
import { CleanedData, ChartConfig, DataStory as DataStoryType } from '@/types/analytics';
import { 
  BarChart3, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  Database,
  Zap,
  Brain
} from 'lucide-react';

export default function Index() {
  const [rawData, setRawData] = useState<Record<string, any>[] | null>(null);
  const [cleanedData, setCleanedData] = useState<CleanedData | null>(null);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [dataStory, setDataStory] = useState<DataStoryType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'charts' | 'story'>('stats');

  const handleDataLoaded = useCallback(async (data: Record<string, any>[]) => {
    setIsProcessing(true);
    setRawData(data);
    
    // Simulate slight delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Clean and prepare data
      const cleaned = cleanAndPrepareData(data);
      setCleanedData(cleaned);
      
      // Generate charts
      const generatedCharts = generateCharts(cleaned);
      setCharts(generatedCharts);
      
      // Generate data story
      const story = generateDataStory(cleaned, generatedCharts);
      setDataStory(story);
      
      setActiveTab('stats');
    } catch (error) {
      console.error('Error processing data:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleReset = () => {
    setRawData(null);
    setCleanedData(null);
    setCharts([]);
    setDataStory(null);
    setActiveTab('stats');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-5 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">DataLens AI</h1>
                <p className="text-xs text-muted-foreground">Intelligent Analytics Platform</p>
              </div>
            </div>
            
            {cleanedData && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {!cleanedData ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[80vh] flex flex-col items-center justify-center"
            >
              {/* Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12 max-w-2xl"
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  <span className="gradient-text">AI-Powered</span> Data Stories
                </h2>
                <p className="text-lg text-muted-foreground">
                  Upload your CSV data and get instant insights, interactive visualizations, 
                  and narrative explanations powered by intelligent analytics.
                </p>
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 w-full max-w-3xl"
              >
                {[
                  { icon: Database, label: 'Smart Data Cleaning', desc: 'Auto-fix missing values & duplicates' },
                  { icon: BarChart3, label: 'Auto Visualizations', desc: 'Charts generated from your data' },
                  { icon: Zap, label: 'Click to Explain', desc: 'Instant insights on any data point' },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="stat-card text-center"
                  >
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{feature.label}</h3>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Upload Zone */}
              <FileUpload onDataLoaded={handleDataLoaded} isProcessing={isProcessing} />

              {/* Sample Data Hint */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-muted-foreground mt-6"
              >
                Try with sales data, financial reports, or any structured CSV
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-xl w-fit">
                {[
                  { id: 'stats', label: 'Statistics', icon: Database },
                  { id: 'charts', label: 'Charts', icon: BarChart3 },
                  { id: 'story', label: 'Data Story', icon: FileText },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'stats' && cleanedData && (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <StatsOverview data={cleanedData} />
                  </motion.div>
                )}

                {activeTab === 'charts' && charts.length > 0 && (
                  <motion.div
                    key="charts"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <InteractiveCharts charts={charts} />
                  </motion.div>
                )}

                {activeTab === 'story' && dataStory && (
                  <motion.div
                    key="story"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <DataStory story={dataStory} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Navigation */}
              {activeTab !== 'story' && dataStory && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center pt-4"
                >
                  <button
                    onClick={() => setActiveTab(activeTab === 'stats' ? 'charts' : 'story')}
                    className="flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    {activeTab === 'stats' ? 'View Visualizations' : 'Read Data Story'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 mt-12">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>DataLens AI — Intelligent Analytics Platform</p>
        </div>
      </footer>
    </div>
  );
}
