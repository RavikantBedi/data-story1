import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  FileText, 
  Image, 
  Table, 
  ChevronDown,
  Check,
  Loader2
} from 'lucide-react';
import { CleanedData, ChartConfig, DataStory } from '@/types/analytics';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';

interface ExportPanelProps {
  cleanedData: CleanedData;
  charts: ChartConfig[];
  dataStory: DataStory | null;
}

type ExportFormat = 'csv' | 'json' | 'pdf';

export function ExportPanel({ cleanedData, charts, dataStory }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const [exportSuccess, setExportSuccess] = useState<ExportFormat | null>(null);

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCSV = async () => {
    setIsExporting('csv');
    try {
      const headers = cleanedData.columns.map(c => c.name).join(',');
      const rows = cleanedData.rows.map(row => 
        cleanedData.columns.map(c => {
          const val = row[c.name];
          if (typeof val === 'string' && val.includes(',')) {
            return `"${val}"`;
          }
          return val ?? '';
        }).join(',')
      );
      const csv = [headers, ...rows].join('\n');
      downloadFile(csv, 'cleaned_data.csv', 'text/csv');
      setExportSuccess('csv');
    } finally {
      setIsExporting(null);
      setTimeout(() => setExportSuccess(null), 2000);
    }
  };

  const exportJSON = async () => {
    setIsExporting('json');
    try {
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          rowCount: cleanedData.rowCount,
          columnCount: cleanedData.columnCount,
        },
        columns: cleanedData.columns.map(c => ({
          name: c.name,
          type: c.type,
          stats: c.stats,
        })),
        data: cleanedData.rows,
        story: dataStory,
      };
      downloadFile(JSON.stringify(exportData, null, 2), 'analysis_report.json', 'application/json');
      setExportSuccess('json');
    } finally {
      setIsExporting(null);
      setTimeout(() => setExportSuccess(null), 2000);
    }
  };

  const exportPDF = async () => {
    setIsExporting('pdf');
    try {
      const pdf = new jsPDF();
      let y = 20;
      const lineHeight = 7;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;

      // Title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 150, 136);
      pdf.text('DataLens AI Report', margin, y);
      y += 15;

      // Metadata
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
      y += lineHeight;
      pdf.text(`Records: ${cleanedData.rowCount} | Variables: ${cleanedData.columnCount}`, margin, y);
      y += 15;

      if (dataStory) {
        // Overview
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Overview', margin, y);
        y += lineHeight + 2;
        
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        const overviewLines = pdf.splitTextToSize(dataStory.overview, maxWidth);
        pdf.text(overviewLines, margin, y);
        y += overviewLines.length * lineHeight + 10;

        // Key Trends
        if (dataStory.keyTrends.length > 0) {
          pdf.setFontSize(14);
          pdf.setTextColor(0, 0, 0);
          pdf.text('Key Trends', margin, y);
          y += lineHeight + 2;
          
          pdf.setFontSize(10);
          pdf.setTextColor(60, 60, 60);
          dataStory.keyTrends.forEach(trend => {
            const trendLines = pdf.splitTextToSize(`• ${trend}`, maxWidth);
            if (y + trendLines.length * lineHeight > pdf.internal.pageSize.getHeight() - margin) {
              pdf.addPage();
              y = margin;
            }
            pdf.text(trendLines, margin, y);
            y += trendLines.length * lineHeight + 2;
          });
          y += 10;
        }

        // Insights
        if (dataStory.insights.length > 0) {
          pdf.setFontSize(14);
          pdf.setTextColor(0, 0, 0);
          pdf.text('Insights', margin, y);
          y += lineHeight + 2;
          
          pdf.setFontSize(10);
          pdf.setTextColor(60, 60, 60);
          dataStory.insights.forEach(insight => {
            const insightLines = pdf.splitTextToSize(`• ${insight}`, maxWidth);
            if (y + insightLines.length * lineHeight > pdf.internal.pageSize.getHeight() - margin) {
              pdf.addPage();
              y = margin;
            }
            pdf.text(insightLines, margin, y);
            y += insightLines.length * lineHeight + 2;
          });
          y += 10;
        }

        // Conclusion
        if (y + 30 > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Conclusion', margin, y);
        y += lineHeight + 2;
        
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);
        const conclusionLines = pdf.splitTextToSize(dataStory.conclusion, maxWidth);
        pdf.text(conclusionLines, margin, y);
      }

      pdf.save('datalens_report.pdf');
      setExportSuccess('pdf');
    } finally {
      setIsExporting(null);
      setTimeout(() => setExportSuccess(null), 2000);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportCSV} disabled={isExporting !== null}>
          <div className="flex items-center gap-3 w-full">
            {isExporting === 'csv' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : exportSuccess === 'csv' ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Table className="w-4 h-4" />
            )}
            <span>Cleaned CSV</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJSON} disabled={isExporting !== null}>
          <div className="flex items-center gap-3 w-full">
            {isExporting === 'json' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : exportSuccess === 'json' ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>Full JSON Report</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPDF} disabled={isExporting !== null}>
          <div className="flex items-center gap-3 w-full">
            {isExporting === 'pdf' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : exportSuccess === 'pdf' ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Image className="w-4 h-4" />
            )}
            <span>PDF Report</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
