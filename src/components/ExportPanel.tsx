import { useState } from 'react';
import { motion } from 'framer-motion';
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
          dataQuality: {
            completeness: ((1 - cleanedData.columns.reduce((sum, col) => sum + (col.stats?.missing || 0), 0) / (cleanedData.rowCount * cleanedData.columnCount)) * 100).toFixed(1) + '%',
          }
        },
        columns: cleanedData.columns.map(c => ({
          name: c.name,
          type: c.type,
          stats: c.stats,
        })),
        data: cleanedData.rows,
        analysis: {
          charts: charts.map(c => ({
            id: c.id,
            type: c.type,
            title: c.title,
            insights: c.insights,
          })),
          story: dataStory,
        }
      };
      downloadFile(JSON.stringify(exportData, null, 2), 'datalens_analysis_report.json', 'application/json');
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
      const lineHeight = 6;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;

      const checkPageBreak = (requiredSpace: number) => {
        if (y + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      // Header with gradient effect (simulated)
      pdf.setFillColor(0, 150, 136);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setFontSize(24);
      pdf.setTextColor(255, 255, 255);
      pdf.text('DataLens AI', margin, 25);
      
      pdf.setFontSize(10);
      pdf.text('Comprehensive Analytics Report', margin, 33);
      
      y = 55;

      // Report metadata box
      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(margin, y, maxWidth, 25, 3, 3, 'F');
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin + 5, y + 8);
      pdf.text(`Records Analyzed: ${cleanedData.rowCount.toLocaleString()}`, margin + 5, y + 15);
      pdf.text(`Variables: ${cleanedData.columnCount}`, margin + 80, y + 15);
      pdf.text(`Charts: ${charts.length}`, margin + 120, y + 15);
      
      y += 35;

      if (dataStory) {
        // Executive Summary Section
        pdf.setFillColor(0, 150, 136);
        pdf.rect(margin, y, 4, 20, 'F');
        
        pdf.setFontSize(14);
        pdf.setTextColor(30, 30, 30);
        pdf.text('Executive Summary', margin + 8, y + 7);
        
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        const overviewLines = pdf.splitTextToSize(dataStory.overview, maxWidth - 10);
        pdf.text(overviewLines, margin + 8, y + 15);
        y += 20 + overviewLines.length * lineHeight + 10;

        // Key Trends Section
        if (dataStory.keyTrends.length > 0) {
          checkPageBreak(60);
          
          pdf.setFillColor(98, 0, 238);
          pdf.rect(margin, y, 4, 15 + dataStory.keyTrends.length * 12, 'F');
          
          pdf.setFontSize(14);
          pdf.setTextColor(30, 30, 30);
          pdf.text('Key Trends', margin + 8, y + 7);
          y += 15;
          
          pdf.setFontSize(9);
          dataStory.keyTrends.forEach((trend, i) => {
            checkPageBreak(15);
            pdf.setTextColor(98, 0, 238);
            pdf.text(`${i + 1}.`, margin + 8, y);
            pdf.setTextColor(60, 60, 60);
            const trendLines = pdf.splitTextToSize(trend, maxWidth - 20);
            pdf.text(trendLines, margin + 18, y);
            y += trendLines.length * lineHeight + 4;
          });
          y += 10;
        }

        // Anomalies Section
        if (dataStory.anomalies.length > 0) {
          checkPageBreak(50);
          
          pdf.setFillColor(255, 87, 34);
          pdf.rect(margin, y, 4, 15 + dataStory.anomalies.length * 12, 'F');
          
          pdf.setFontSize(14);
          pdf.setTextColor(30, 30, 30);
          pdf.text('Notable Anomalies', margin + 8, y + 7);
          y += 15;
          
          pdf.setFontSize(9);
          dataStory.anomalies.forEach((anomaly, i) => {
            checkPageBreak(15);
            pdf.setFillColor(255, 243, 224);
            pdf.roundedRect(margin + 8, y - 3, maxWidth - 16, 10, 2, 2, 'F');
            pdf.setTextColor(255, 87, 34);
            pdf.text('⚠', margin + 10, y + 3);
            pdf.setTextColor(60, 60, 60);
            const anomalyLines = pdf.splitTextToSize(anomaly, maxWidth - 30);
            pdf.text(anomalyLines, margin + 18, y + 3);
            y += anomalyLines.length * lineHeight + 6;
          });
          y += 10;
        }

        // Insights Section
        if (dataStory.insights.length > 0) {
          checkPageBreak(50);
          
          pdf.setFillColor(255, 193, 7);
          pdf.rect(margin, y, 4, 15 + dataStory.insights.length * 12, 'F');
          
          pdf.setFontSize(14);
          pdf.setTextColor(30, 30, 30);
          pdf.text('Actionable Insights', margin + 8, y + 7);
          y += 15;
          
          pdf.setFontSize(9);
          dataStory.insights.forEach((insight, i) => {
            checkPageBreak(15);
            pdf.setTextColor(255, 193, 7);
            pdf.text('💡', margin + 8, y + 3);
            pdf.setTextColor(60, 60, 60);
            const insightLines = pdf.splitTextToSize(insight, maxWidth - 25);
            pdf.text(insightLines, margin + 18, y + 3);
            y += insightLines.length * lineHeight + 4;
          });
          y += 10;
        }

        // Statistical Summary Table
        checkPageBreak(80);
        
        pdf.setFillColor(33, 150, 243);
        pdf.rect(margin, y, 4, 20, 'F');
        
        pdf.setFontSize(14);
        pdf.setTextColor(30, 30, 30);
        pdf.text('Statistical Summary', margin + 8, y + 7);
        y += 20;

        const numericCols = cleanedData.columns.filter(c => c.type === 'numeric').slice(0, 5);
        if (numericCols.length > 0) {
          // Table header
          pdf.setFillColor(240, 240, 240);
          pdf.rect(margin, y, maxWidth, 8, 'F');
          pdf.setFontSize(8);
          pdf.setTextColor(80, 80, 80);
          pdf.text('Variable', margin + 3, y + 5);
          pdf.text('Mean', margin + 50, y + 5);
          pdf.text('Median', margin + 80, y + 5);
          pdf.text('Std Dev', margin + 110, y + 5);
          pdf.text('Trend', margin + 140, y + 5);
          y += 10;

          numericCols.forEach((col, i) => {
            if (i % 2 === 0) {
              pdf.setFillColor(250, 250, 250);
              pdf.rect(margin, y - 2, maxWidth, 8, 'F');
            }
            pdf.setTextColor(60, 60, 60);
            pdf.text(col.name.slice(0, 15), margin + 3, y + 3);
            pdf.text(col.stats?.mean?.toFixed(2) || '-', margin + 50, y + 3);
            pdf.text(col.stats?.median?.toFixed(2) || '-', margin + 80, y + 3);
            pdf.text(col.stats?.stdDev?.toFixed(2) || '-', margin + 110, y + 3);
            
            const trend = col.stats?.trend || '-';
            const trendColor = trend === 'increasing' ? [0, 150, 136] : trend === 'decreasing' ? [244, 67, 54] : [150, 150, 150];
            pdf.setTextColor(trendColor[0], trendColor[1], trendColor[2]);
            pdf.text(trend === 'increasing' ? '↑ Up' : trend === 'decreasing' ? '↓ Down' : '→ Stable', margin + 140, y + 3);
            y += 8;
          });
          y += 10;
        }

        // Conclusion
        checkPageBreak(40);
        
        pdf.setFillColor(0, 150, 136);
        pdf.roundedRect(margin, y, maxWidth, 30, 3, 3, 'F');
        
        pdf.setFontSize(11);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Conclusion', margin + 5, y + 8);
        
        pdf.setFontSize(9);
        const conclusionLines = pdf.splitTextToSize(dataStory.conclusion, maxWidth - 10);
        pdf.text(conclusionLines.slice(0, 3), margin + 5, y + 16);
      }

      // Footer on each page
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text('Generated by DataLens AI', margin, pageHeight - 10);
      }

      pdf.save('datalens_comprehensive_report.pdf');
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
