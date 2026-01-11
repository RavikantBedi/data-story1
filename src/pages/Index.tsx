import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FileUpload } from '@/components/FileUpload';
import { StatsOverview } from '@/components/StatsOverview';
import { InteractiveCharts } from '@/components/InteractiveCharts';
import { DataStory } from '@/components/DataStory';
import { CorrelationMatrix } from '@/components/CorrelationMatrix';
import { ScatterPlots } from '@/components/ScatterPlots';
import { SampleDatasetSelector } from '@/components/SampleDatasetSelector';
import { ExportPanel } from '@/components/ExportPanel';
import { SaveAnalysisDialog } from '@/components/SaveAnalysisDialog';
import { SavedAnalysesList } from '@/components/SavedAnalysesList';
import { MetricSummaryCards } from '@/components/MetricSummaryCards';
import { DatePredictions } from '@/components/DatePredictions';
import { TeamDiscussionPrompts } from '@/components/TeamDiscussionPrompts';
import { DataChatAssistant } from '@/components/DataChatAssistant';
import { EmailScheduler } from '@/components/EmailScheduler';
import { BusinessHypotheses } from '@/components/BusinessHypotheses';
import { RiskOpportunityRadar } from '@/components/RiskOpportunityRadar';
import { AdvancedAnalyticsPanel } from '@/components/AdvancedAnalyticsPanel';
import { AnomalyAlertConfig } from '@/components/AnomalyAlertConfig';
import { ForecastingCharts } from '@/components/ForecastingCharts';
import { DataProcessingVisualizer } from '@/components/DataProcessingVisualizer';
import { cleanAndPrepareData } from '@/lib/dataPreprocessing';
import { generateCharts } from '@/lib/analyticsEngine';
import { generateDataStory } from '@/lib/storyGenerator';
import { generateTrustLayer } from '@/lib/trustLayerGenerator';
import { calculateCorrelationMatrix, generateScatterPlots, CorrelationMatrix as CorrelationMatrixType, ScatterPlotData } from '@/lib/correlationAnalysis';
import { CleanedData, ChartConfig, DataStory as DataStoryType, TrustLayer } from '@/types/analytics';
import { TrustLayerDisplay } from '@/components/TrustLayerDisplay';
import {
  BarChart3, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  Database,
  Zap,
  Brain,
  LogOut,
  User,
  GitCompare,
  Folder,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export default function Index() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [rawData, setRawData] = useState<Record<string, any>[] | null>(null);
  const [cleanedData, setCleanedData] = useState<CleanedData | null>(null);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [dataStory, setDataStory] = useState<DataStoryType | null>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationMatrixType | null>(null);
  const [scatterPlots, setScatterPlots] = useState<ScatterPlotData[]>([]);
  const [trustLayer, setTrustLayer] = useState<TrustLayer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'charts' | 'correlations' | 'story' | 'trust' | 'insights' | 'saved'>('stats');

  const handleDataLoaded = useCallback(async (data: Record<string, any>[]) => {
    setIsProcessing(true);
    setRawData(data);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const cleaned = cleanAndPrepareData(data);
      setCleanedData(cleaned);
      
      const generatedCharts = generateCharts(cleaned);
      setCharts(generatedCharts);
      
      const story = generateDataStory(cleaned, generatedCharts);
      setDataStory(story);
      
      // Generate trust layer
      const trust = generateTrustLayer(cleaned, story, generatedCharts);
      setTrustLayer(trust);
      
      // Calculate correlations
      const matrix = calculateCorrelationMatrix(cleaned);
      setCorrelationMatrix(matrix);
      
      const scatters = generateScatterPlots(cleaned);
      setScatterPlots(scatters);
      
      setActiveTab('stats');
    } catch (error) {
      console.error('Error processing data:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleLoadSavedAnalysis = (analysis: any) => {
    setCleanedData(analysis.data);
    setCharts(analysis.charts || []);
    setDataStory(analysis.story);
    
    if (analysis.data && analysis.story) {
      const matrix = calculateCorrelationMatrix(analysis.data);
      setCorrelationMatrix(matrix);
      const scatters = generateScatterPlots(analysis.data);
      setScatterPlots(scatters);
      const trust = generateTrustLayer(analysis.data, analysis.story, analysis.charts || []);
      setTrustLayer(trust);
    }
    
    setActiveTab('stats');
  };

  const handleReset = () => {
    setRawData(null);
    setCleanedData(null);
    setCharts([]);
    setDataStory(null);
    setCorrelationMatrix(null);
    setScatterPlots([]);
    setTrustLayer(null);
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
            
            <div className="flex items-center gap-3">
              {cleanedData && (
                <>
                  <ExportPanel cleanedData={cleanedData} charts={charts} dataStory={dataStory} />
                  <EmailScheduler cleanedData={cleanedData} dataStory={dataStory} charts={charts} />
                  {user && <SaveAnalysisDialog cleanedData={cleanedData} charts={charts} dataStory={dataStory} />}
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    New
                  </Button>
                </>
              )}
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {user.email}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate('/auth')} variant="outline" className="gap-2">
                  <User className="w-4 h-4" />
                  Sign In
                </Button>
              )}
            </div>
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
                  correlation analysis, and narrative explanations.
                </p>
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 w-full max-w-4xl"
              >
                {[
                  { icon: Database, label: 'Smart Cleaning', desc: 'Auto-fix data issues' },
                  { icon: BarChart3, label: 'Auto Charts', desc: 'Instant visualizations' },
                  { icon: GitCompare, label: 'Correlations', desc: 'Find relationships' },
                  { icon: Zap, label: 'Click to Explain', desc: 'Instant insights' },
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
              
              {/* Sample Datasets */}
              <SampleDatasetSelector onSelect={handleDataLoaded} isProcessing={isProcessing} />

              {/* Data Processing Visualizer */}
              <DataProcessingVisualizer isProcessing={isProcessing} />

              {/* Saved Analyses (if logged in) */}
              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="w-full max-w-2xl mt-12"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Folder className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">Your Saved Analyses</h3>
                  </div>
                  <div className="glass-panel p-4">
                    <SavedAnalysesList onLoad={handleLoadSavedAnalysis} />
                  </div>
                </motion.div>
              )}
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
                  { id: 'correlations', label: 'Correlations', icon: GitCompare },
                  { id: 'story', label: 'Data Story', icon: FileText },
                  { id: 'trust', label: 'Trust Layer', icon: Sparkles },
                  { id: 'insights', label: 'Insights', icon: Brain },
                  ...(user ? [{ id: 'saved', label: 'Saved', icon: Folder }] : []),
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

                {activeTab === 'correlations' && (
                  <motion.div
                    key="correlations"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-8"
                  >
                    {correlationMatrix && correlationMatrix.columns.length > 1 && (
                      <CorrelationMatrix matrix={correlationMatrix} />
                    )}
                    {scatterPlots.length > 0 && (
                      <ScatterPlots plots={scatterPlots} />
                    )}
                    {(!correlationMatrix || correlationMatrix.columns.length <= 1) && scatterPlots.length === 0 && (
                      <div className="glass-panel p-8 text-center">
                        <p className="text-muted-foreground">
                          Need at least 2 numeric columns for correlation analysis
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'story' && dataStory && cleanedData && (
                  <motion.div
                    key="story"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-8"
                  >
                    {/* Visual Summary Cards */}
                    <MetricSummaryCards data={cleanedData} />
                    
                    {/* Main Data Story */}
                    <DataStory story={dataStory} />
                    
                    {/* Date-based Predictions */}
                    <DatePredictions data={cleanedData} />
                    
                    {/* Team Discussion Prompts */}
                    <TeamDiscussionPrompts data={cleanedData} story={dataStory} />
                  </motion.div>
                )}

                {activeTab === 'trust' && trustLayer && (
                  <motion.div
                    key="trust"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <TrustLayerDisplay trustLayer={trustLayer} />
                  </motion.div>
                )}

                {activeTab === 'insights' && cleanedData && (
                  <motion.div
                    key="insights"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-8"
                  >
                    {/* Forecasting Charts */}
                    <ForecastingCharts data={cleanedData} />
                    
                    {/* Risk & Opportunity Radar */}
                    <RiskOpportunityRadar data={cleanedData} />
                    
                    {/* Business Hypotheses */}
                    <BusinessHypotheses data={cleanedData} />
                    
                    {/* Anomaly Alerts */}
                    <AnomalyAlertConfig data={cleanedData} />
                    
                    {/* Advanced Analytics Methods */}
                    <AdvancedAnalyticsPanel data={cleanedData} />
                  </motion.div>
                )}

                {activeTab === 'saved' && user && (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="glass-panel p-6">
                      <h3 className="font-semibold text-lg mb-4">Your Saved Analyses</h3>
                      <SavedAnalysesList onLoad={handleLoadSavedAnalysis} />
                    </div>
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
                    onClick={() => {
                      const tabs = ['stats', 'charts', 'correlations', 'story'];
                      const currentIdx = tabs.indexOf(activeTab);
                      const nextTab = tabs[currentIdx + 1] || 'story';
                      setActiveTab(nextTab as any);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    {activeTab === 'stats' && 'View Charts'}
                    {activeTab === 'charts' && 'Explore Correlations'}
                    {activeTab === 'correlations' && 'Read Data Story'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* AI Chat Assistant - only show when data is loaded */}
        {cleanedData && dataStory && (
          <DataChatAssistant data={cleanedData} story={dataStory} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 mt-12">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>DataLens AI — Intelligent Analytics Platform with Real-time Sync</p>
        </div>
      </footer>
    </div>
  );
}
