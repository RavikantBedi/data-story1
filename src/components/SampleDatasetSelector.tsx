import { motion } from 'framer-motion';
import { SAMPLE_DATASETS, SampleDatasetKey } from '@/data/sampleDatasets';
import { Database, TrendingUp, Cloud, Users } from 'lucide-react';

interface SampleDatasetSelectorProps {
  onSelect: (data: Record<string, any>[]) => void;
  isProcessing: boolean;
}

const DATASET_ICONS = {
  sales: TrendingUp,
  stocks: Database,
  weather: Cloud,
  hr: Users,
};

export function SampleDatasetSelector({ onSelect, isProcessing }: SampleDatasetSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-2xl mx-auto mt-8"
    >
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">Or try with sample data:</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(SAMPLE_DATASETS) as SampleDatasetKey[]).map((key, index) => {
          const dataset = SAMPLE_DATASETS[key];
          const Icon = DATASET_ICONS[key];
          
          return (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              onClick={() => onSelect(dataset.data)}
              disabled={isProcessing}
              className="stat-card text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium text-sm truncate">{dataset.name}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{dataset.description}</p>
              <p className="text-xs text-primary mt-2">{dataset.data.length} rows</p>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
