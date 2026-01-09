import { useState } from 'react';
import { 
  Download, 
  FileText, 
  Image, 
  Table, 
  ChevronDown,
  Check,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import { CleanedData, ChartConfig, DataStory, TrustLayer } from '@/types/analytics';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import { generateTrustLayer } from '@/lib/trustLayerGenerator';

interface ExportPanelProps {
  cleanedData: CleanedData;
  charts: ChartConfig[];
  dataStory: DataStory | null;
}

type ExportFormat = 'csv' | 'json' | 'pdf' | 'executive';

// Helper functions for PDF
function formatNumber(num: number): string {
  if (Math.abs(num) >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toFixed(num % 1 === 0 ? 0 : 1);
}

function formatColumnName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function cleanText(text: string): string {
  // Remove emojis and special characters that jsPDF can't handle
  return text.replace(/[📈📉➡️💡🚀⚠️🎯📏🔎🌟⚙️⚡✅🔍📊🗣️💼]/g, '').trim();
}

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
      downloadFile(csv, 'datalens_cleaned_data.csv', 'text/csv');
      setExportSuccess('csv');
    } finally {
      setIsExporting(null);
      setTimeout(() => setExportSuccess(null), 2000);
    }
  };

  const exportJSON = async () => {
    setIsExporting('json');
    try {
      const trustLayer = dataStory ? generateTrustLayer(cleanedData, dataStory, charts) : null;
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          generatedBy: 'DataLens AI',
          rowCount: cleanedData.rowCount,
          columnCount: cleanedData.columnCount,
          dataQuality: {
            completeness: ((1 - cleanedData.columns.reduce((sum, col) => sum + (col.stats?.missing || 0), 0) / (cleanedData.rowCount * cleanedData.columnCount)) * 100).toFixed(1) + '%',
            reliabilityScore: trustLayer?.reliabilityScore || null
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
          trustLayer: trustLayer
        }
      };
      downloadFile(JSON.stringify(exportData, null, 2), 'datalens_full_report.json', 'application/json');
      setExportSuccess('json');
    } finally {
      setIsExporting(null);
      setTimeout(() => setExportSuccess(null), 2000);
    }
  };

  const generatePredictions = () => {
    const numericColumns = cleanedData.columns.filter(c => c.type === 'numeric');
    const predictions: Array<{
      metric: string;
      current: number;
      nextMonth: number;
      nextQuarter: number;
      confidence: string;
      direction: string;
    }> = [];

    numericColumns.slice(0, 4).forEach(col => {
      const stats = col.stats;
      if (!stats?.mean || stats.percentChange === undefined) return;
      
      const monthlyChange = stats.percentChange / 12;
      const current = stats.mean;
      const nextMonth = current * (1 + monthlyChange / 100);
      const nextQuarter = current * (1 + (monthlyChange * 3) / 100);
      
      predictions.push({
        metric: formatColumnName(col.name),
        current,
        nextMonth,
        nextQuarter,
        confidence: Math.abs(monthlyChange) > 5 ? 'Medium' : 'High',
        direction: stats.trend === 'increasing' ? 'Up' : stats.trend === 'decreasing' ? 'Down' : 'Stable'
      });
    });

    return predictions;
  };

  const exportExecutiveSummary = async () => {
    setIsExporting('executive');
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let y = 0;

      // Generate trust layer
      const trustLayer = dataStory ? generateTrustLayer(cleanedData, dataStory, charts) : null;
      const predictions = generatePredictions();
      const numericColumns = cleanedData.columns.filter(c => c.type === 'numeric');

      // === COVER PAGE ===
      // Header gradient
      pdf.setFillColor(20, 184, 166);
      pdf.rect(0, 0, pageWidth, 80, 'F');
      pdf.setFillColor(16, 185, 129);
      pdf.rect(0, 60, pageWidth, 20, 'F');

      // Logo area
      pdf.setFillColor(255, 255, 255);
      pdf.circle(35, 40, 12, 'F');
      pdf.setFontSize(16);
      pdf.setTextColor(20, 184, 166);
      pdf.text('DL', 30, 44);

      // Title
      pdf.setFontSize(28);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Executive Summary', 55, 38);
      pdf.setFontSize(12);
      pdf.text('DataLens AI Analytics Report', 55, 50);

      // Subtitle box
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, 90, maxWidth, 40, 5, 5, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Report Generated:', margin + 10, 105);
      pdf.text('Data Analyzed:', margin + 10, 118);
      pdf.text('Reliability Score:', margin + 10, 131);
      
      pdf.setTextColor(30, 30, 30);
      pdf.text(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), margin + 60, 105);
      pdf.text(`${cleanedData.rowCount.toLocaleString()} records across ${cleanedData.columnCount} variables`, margin + 60, 118);
      
      // Reliability score with color
      const score = trustLayer?.reliabilityScore || 0;
      if (score >= 85) pdf.setTextColor(16, 185, 129);
      else if (score >= 70) pdf.setTextColor(245, 158, 11);
      else pdf.setTextColor(239, 68, 68);
      pdf.text(`${score}% - ${score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : 'Fair'}`, margin + 60, 131);

      y = 145;

      // Key Metrics Summary
      pdf.setFillColor(249, 250, 251);
      pdf.roundedRect(margin, y, maxWidth, 50, 5, 5, 'F');
      
      pdf.setFontSize(11);
      pdf.setTextColor(30, 30, 30);
      pdf.text('KEY METRICS AT A GLANCE', margin + 10, y + 12);
      
      const metricWidth = (maxWidth - 30) / 3;
      numericColumns.slice(0, 3).forEach((col, i) => {
        const x = margin + 10 + i * metricWidth;
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(formatColumnName(col.name).slice(0, 15), x, y + 25);
        
        pdf.setFontSize(16);
        pdf.setTextColor(30, 30, 30);
        pdf.text(formatNumber(col.stats?.mean || 0), x, y + 38);
        
        const trend = col.stats?.trend;
        const change = col.stats?.percentChange;
        if (trend && change !== undefined) {
          const arrow = trend === 'increasing' ? '+' : trend === 'decreasing' ? '' : '';
          if (trend === 'increasing') pdf.setTextColor(16, 185, 129);
          else if (trend === 'decreasing') pdf.setTextColor(239, 68, 68);
          else pdf.setTextColor(100, 100, 100);
          pdf.setFontSize(9);
          pdf.text(`${arrow}${change.toFixed(1)}%`, x + 35, y + 38);
        }
      });

      y += 60;

      // Overview Section
      if (dataStory) {
        pdf.setFillColor(20, 184, 166);
        pdf.roundedRect(margin, y, 4, 35, 2, 2, 'F');
        
        pdf.setFontSize(12);
        pdf.setTextColor(30, 30, 30);
        pdf.text('SITUATION OVERVIEW', margin + 12, y + 10);
        
        pdf.setFontSize(9);
        pdf.setTextColor(60, 60, 60);
        const overviewLines = pdf.splitTextToSize(cleanText(dataStory.overview), maxWidth - 20);
        pdf.text(overviewLines.slice(0, 4), margin + 12, y + 20);
        y += 45;
      }

      // Top Insights (3 boxes)
      if (dataStory && dataStory.keyTrends.length > 0) {
        pdf.setFontSize(11);
        pdf.setTextColor(30, 30, 30);
        pdf.text('TOP 3 INSIGHTS', margin, y + 5);
        y += 12;

        const insightColors = [
          [16, 185, 129],  // Green
          [59, 130, 246],  // Blue  
          [168, 85, 247]   // Purple
        ];

        dataStory.keyTrends.slice(0, 3).forEach((trend, i) => {
          const boxHeight = 25;
          pdf.setFillColor(insightColors[i][0], insightColors[i][1], insightColors[i][2]);
          pdf.roundedRect(margin, y, 4, boxHeight, 2, 2, 'F');
          pdf.setFillColor(249, 250, 251);
          pdf.roundedRect(margin + 4, y, maxWidth - 4, boxHeight, 0, 0, 'F');
          
          pdf.setFontSize(8);
          pdf.setTextColor(60, 60, 60);
          const trendText = cleanText(trend);
          const trendLines = pdf.splitTextToSize(trendText, maxWidth - 20);
          pdf.text(trendLines.slice(0, 3), margin + 12, y + 8);
          y += boxHeight + 5;
        });
      }

      // === PAGE 2: PREDICTIONS & TRUST ===
      pdf.addPage();
      y = margin;

      // Page 2 Header
      pdf.setFillColor(20, 184, 166);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Future Outlook & Trust Assessment', margin, 17);

      y = 35;

      // Predictions Section
      if (predictions.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(30, 30, 30);
        pdf.text('FORECASTED PERFORMANCE', margin, y);
        y += 10;

        // Predictions table header
        pdf.setFillColor(243, 244, 246);
        pdf.rect(margin, y, maxWidth, 10, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Metric', margin + 5, y + 7);
        pdf.text('Current', margin + 55, y + 7);
        pdf.text('Next Month', margin + 90, y + 7);
        pdf.text('Next Quarter', margin + 125, y + 7);
        pdf.text('Confidence', margin + 160, y + 7);
        y += 12;

        predictions.forEach((pred, i) => {
          if (i % 2 === 0) {
            pdf.setFillColor(249, 250, 251);
            pdf.rect(margin, y - 2, maxWidth, 10, 'F');
          }
          
          pdf.setFontSize(8);
          pdf.setTextColor(30, 30, 30);
          pdf.text(pred.metric.slice(0, 18), margin + 5, y + 5);
          pdf.text(formatNumber(pred.current), margin + 55, y + 5);
          
          // Next month with color
          if (pred.direction === 'Up') pdf.setTextColor(16, 185, 129);
          else if (pred.direction === 'Down') pdf.setTextColor(239, 68, 68);
          else pdf.setTextColor(100, 100, 100);
          pdf.text(formatNumber(pred.nextMonth), margin + 90, y + 5);
          pdf.text(formatNumber(pred.nextQuarter), margin + 125, y + 5);
          
          // Confidence badge
          pdf.setTextColor(pred.confidence === 'High' ? 16 : 245, pred.confidence === 'High' ? 185 : 158, pred.confidence === 'High' ? 129 : 11);
          pdf.text(pred.confidence, margin + 160, y + 5);
          
          y += 12;
        });
        y += 15;
      }

      // Trust & Reliability Section
      if (trustLayer) {
        pdf.setFillColor(16, 185, 129);
        pdf.roundedRect(margin, y, 4, 60, 2, 2, 'F');
        
        pdf.setFontSize(12);
        pdf.setTextColor(30, 30, 30);
        pdf.text('DATA RELIABILITY ASSESSMENT', margin + 12, y + 10);
        
        // Score circle
        pdf.setFillColor(score >= 85 ? 220 : score >= 70 ? 254 : 254, score >= 85 ? 252 : score >= 70 ? 243 : 226, score >= 85 ? 231 : score >= 70 ? 199 : 226);
        pdf.circle(margin + 150, y + 30, 18, 'F');
        pdf.setFontSize(18);
        pdf.setTextColor(score >= 85 ? 16 : score >= 70 ? 245 : 239, score >= 85 ? 185 : score >= 70 ? 158 : 68, score >= 85 ? 129 : score >= 70 ? 11 : 68);
        pdf.text(`${score}%`, margin + 141, y + 35);
        
        pdf.setFontSize(9);
        pdf.setTextColor(60, 60, 60);
        const reliabilityLines = pdf.splitTextToSize(trustLayer.reliabilityDetails, maxWidth - 80);
        pdf.text(reliabilityLines.slice(0, 4), margin + 12, y + 22);
        y += 70;

        // Safe Conclusions
        if (trustLayer.safeConclusions.length > 0) {
          pdf.setFontSize(10);
          pdf.setTextColor(16, 185, 129);
          pdf.text('SAFE TO CONCLUDE:', margin, y);
          y += 8;
          
          pdf.setFontSize(8);
          pdf.setTextColor(60, 60, 60);
          trustLayer.safeConclusions.slice(0, 2).forEach(conclusion => {
            const lines = pdf.splitTextToSize('• ' + cleanText(conclusion), maxWidth);
            pdf.text(lines.slice(0, 2), margin + 5, y);
            y += lines.slice(0, 2).length * 5 + 3;
          });
          y += 8;
        }

        // What-If Scenario
        if (trustLayer.whatIfScenario) {
          pdf.setFillColor(243, 232, 255);
          pdf.roundedRect(margin, y, maxWidth, 35, 3, 3, 'F');
          
          pdf.setFontSize(10);
          pdf.setTextColor(168, 85, 247);
          pdf.text('WHAT-IF SCENARIO', margin + 10, y + 10);
          
          pdf.setFontSize(8);
          pdf.setTextColor(60, 60, 60);
          const scenarioLines = pdf.splitTextToSize(trustLayer.whatIfScenario.explanation, maxWidth - 20);
          pdf.text(scenarioLines.slice(0, 3), margin + 10, y + 20);
          y += 45;
        }
      }

      // Questions to Explore
      if (trustLayer && trustLayer.nextQuestions.length > 0) {
        pdf.setFontSize(10);
        pdf.setTextColor(30, 30, 30);
        pdf.text('RECOMMENDED NEXT STEPS:', margin, y);
        y += 8;
        
        pdf.setFontSize(8);
        pdf.setTextColor(60, 60, 60);
        trustLayer.nextQuestions.slice(0, 4).forEach((q, i) => {
          pdf.text(`${i + 1}. ${q}`, margin + 5, y);
          y += 7;
        });
      }

      // Footer on all pages
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFillColor(243, 244, 246);
        pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
        pdf.text('DataLens AI - Confidential', margin, pageHeight - 6);
        pdf.text(new Date().toLocaleDateString(), pageWidth - margin - 30, pageHeight - 6);
      }

      pdf.save('DataLens_Executive_Summary.pdf');
      setExportSuccess('executive');
    } finally {
      setIsExporting(null);
      setTimeout(() => setExportSuccess(null), 2000);
    }
  };

  const exportFullPDF = async () => {
    setIsExporting('pdf');
    try {
      const pdf = new jsPDF();
      let y = 20;
      const lineHeight = 5;
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

      const addSectionHeader = (title: string, color: number[]) => {
        checkPageBreak(30);
        pdf.setFillColor(color[0], color[1], color[2]);
        pdf.roundedRect(margin, y, 4, 20, 2, 2, 'F');
        pdf.setFontSize(13);
        pdf.setTextColor(30, 30, 30);
        pdf.text(title, margin + 12, y + 12);
        y += 25;
      };

      // Generate trust layer and predictions
      const trustLayer = dataStory ? generateTrustLayer(cleanedData, dataStory, charts) : null;
      const predictions = generatePredictions();
      const numericColumns = cleanedData.columns.filter(c => c.type === 'numeric');

      // === COVER PAGE ===
      pdf.setFillColor(20, 184, 166);
      pdf.rect(0, 0, pageWidth, 100, 'F');
      
      // Decorative elements
      pdf.setFillColor(16, 185, 129);
      pdf.circle(pageWidth - 30, 30, 40, 'F');
      pdf.setFillColor(6, 182, 212);
      pdf.circle(30, 80, 25, 'F');

      pdf.setFontSize(32);
      pdf.setTextColor(255, 255, 255);
      pdf.text('DataLens AI', margin, 45);
      
      pdf.setFontSize(16);
      pdf.text('Comprehensive Analytics Report', margin, 60);
      
      pdf.setFontSize(10);
      pdf.text(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), margin, 80);

      y = 115;

      // Report metadata
      pdf.setFillColor(249, 250, 251);
      pdf.roundedRect(margin, y, maxWidth, 45, 5, 5, 'F');
      
      pdf.setFontSize(11);
      pdf.setTextColor(30, 30, 30);
      pdf.text('Report Summary', margin + 10, y + 15);
      
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Total Records: ${cleanedData.rowCount.toLocaleString()}`, margin + 10, y + 28);
      pdf.text(`Variables Analyzed: ${cleanedData.columnCount}`, margin + 80, y + 28);
      pdf.text(`Charts Generated: ${charts.length}`, margin + 10, y + 38);
      pdf.text(`Reliability Score: ${trustLayer?.reliabilityScore || 'N/A'}%`, margin + 80, y + 38);

      y += 60;

      // Key metrics preview
      if (numericColumns.length > 0) {
        pdf.setFontSize(11);
        pdf.setTextColor(30, 30, 30);
        pdf.text('Key Metrics Overview', margin, y);
        y += 10;

        const metricWidth = maxWidth / Math.min(numericColumns.length, 4);
        numericColumns.slice(0, 4).forEach((col, i) => {
          const x = margin + i * metricWidth;
          pdf.setFillColor(243, 244, 246);
          pdf.roundedRect(x, y, metricWidth - 5, 35, 3, 3, 'F');
          
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(formatColumnName(col.name).slice(0, 12), x + 5, y + 10);
          
          pdf.setFontSize(14);
          pdf.setTextColor(30, 30, 30);
          pdf.text(formatNumber(col.stats?.mean || 0), x + 5, y + 22);
          
          if (col.stats?.trend) {
            const trend = col.stats.trend;
            if (trend === 'increasing') pdf.setTextColor(16, 185, 129);
            else if (trend === 'decreasing') pdf.setTextColor(239, 68, 68);
            else pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(8);
            const arrow = trend === 'increasing' ? 'UP' : trend === 'decreasing' ? 'DOWN' : 'STABLE';
            pdf.text(arrow, x + 5, y + 30);
          }
        });
        y += 50;
      }

      // === PAGE 2: DATA STORY ===
      pdf.addPage();
      y = margin;

      // Page header
      pdf.setFillColor(20, 184, 166);
      pdf.rect(0, 0, pageWidth, 20, 'F');
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Data Story & Analysis', margin, 14);
      y = 30;

      if (dataStory) {
        // Executive Summary
        addSectionHeader('Executive Summary', [20, 184, 166]);
        pdf.setFontSize(9);
        pdf.setTextColor(60, 60, 60);
        const overviewLines = pdf.splitTextToSize(cleanText(dataStory.overview), maxWidth - 15);
        pdf.text(overviewLines, margin + 12, y);
        y += overviewLines.length * lineHeight + 15;

        // Key Trends
        if (dataStory.keyTrends.length > 0) {
          addSectionHeader('Key Trends & Findings', [99, 102, 241]);
          pdf.setFontSize(8);
          dataStory.keyTrends.forEach((trend, i) => {
            checkPageBreak(20);
            pdf.setFillColor(243, 244, 246);
            const trendText = cleanText(trend);
            const trendLines = pdf.splitTextToSize(trendText, maxWidth - 25);
            const boxHeight = Math.max(12, trendLines.length * lineHeight + 6);
            pdf.roundedRect(margin, y, maxWidth, boxHeight, 2, 2, 'F');
            pdf.setTextColor(99, 102, 241);
            pdf.text(`${i + 1}.`, margin + 5, y + 7);
            pdf.setTextColor(60, 60, 60);
            pdf.text(trendLines, margin + 15, y + 7);
            y += boxHeight + 5;
          });
          y += 10;
        }

        // Anomalies
        if (dataStory.anomalies.length > 0) {
          addSectionHeader('Areas of Concern', [239, 68, 68]);
          pdf.setFontSize(8);
          dataStory.anomalies.forEach((anomaly) => {
            checkPageBreak(15);
            pdf.setFillColor(254, 242, 242);
            const anomalyText = cleanText(anomaly);
            const anomalyLines = pdf.splitTextToSize(anomalyText, maxWidth - 20);
            const boxHeight = Math.max(10, anomalyLines.length * lineHeight + 4);
            pdf.roundedRect(margin, y, maxWidth, boxHeight, 2, 2, 'F');
            pdf.setTextColor(60, 60, 60);
            pdf.text(anomalyLines, margin + 8, y + 6);
            y += boxHeight + 4;
          });
          y += 10;
        }

        // Actionable Insights
        if (dataStory.insights.length > 0) {
          addSectionHeader('Actionable Insights', [245, 158, 11]);
          pdf.setFontSize(8);
          dataStory.insights.forEach((insight) => {
            checkPageBreak(15);
            pdf.setFillColor(254, 252, 232);
            const insightText = cleanText(insight);
            const insightLines = pdf.splitTextToSize(insightText, maxWidth - 20);
            const boxHeight = Math.max(10, insightLines.length * lineHeight + 4);
            pdf.roundedRect(margin, y, maxWidth, boxHeight, 2, 2, 'F');
            pdf.setTextColor(60, 60, 60);
            pdf.text(insightLines, margin + 8, y + 6);
            y += boxHeight + 4;
          });
        }
      }

      // === PAGE 3: PREDICTIONS ===
      pdf.addPage();
      y = margin;

      pdf.setFillColor(168, 85, 247);
      pdf.rect(0, 0, pageWidth, 20, 'F');
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Future Predictions', margin, 14);
      y = 30;

      addSectionHeader('Forecasted Performance', [168, 85, 247]);

      if (predictions.length > 0) {
        // Table header
        pdf.setFillColor(243, 244, 246);
        pdf.rect(margin, y, maxWidth, 12, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        pdf.text('Metric', margin + 5, y + 8);
        pdf.text('Current', margin + 50, y + 8);
        pdf.text('Next Month', margin + 85, y + 8);
        pdf.text('Next Quarter', margin + 120, y + 8);
        pdf.text('Trend', margin + 155, y + 8);
        y += 15;

        predictions.forEach((pred, i) => {
          if (i % 2 === 0) {
            pdf.setFillColor(249, 250, 251);
            pdf.rect(margin, y - 3, maxWidth, 12, 'F');
          }
          pdf.setFontSize(8);
          pdf.setTextColor(30, 30, 30);
          pdf.text(pred.metric.slice(0, 15), margin + 5, y + 5);
          pdf.text(formatNumber(pred.current), margin + 50, y + 5);
          
          // Colored predictions
          if (pred.direction === 'Up') pdf.setTextColor(16, 185, 129);
          else if (pred.direction === 'Down') pdf.setTextColor(239, 68, 68);
          else pdf.setTextColor(100, 100, 100);
          pdf.text(formatNumber(pred.nextMonth), margin + 85, y + 5);
          pdf.text(formatNumber(pred.nextQuarter), margin + 120, y + 5);
          pdf.text(pred.direction, margin + 155, y + 5);
          y += 12;
        });
        y += 20;
      }

      // Prediction disclaimer
      pdf.setFillColor(254, 249, 195);
      pdf.roundedRect(margin, y, maxWidth, 25, 3, 3, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(133, 77, 14);
      pdf.text('DISCLAIMER:', margin + 8, y + 10);
      pdf.setTextColor(80, 80, 80);
      const disclaimerText = 'These predictions are based on historical patterns. Actual results may vary due to market conditions, business changes, or factors not captured in this dataset.';
      const disclaimerLines = pdf.splitTextToSize(disclaimerText, maxWidth - 16);
      pdf.text(disclaimerLines, margin + 8, y + 18);

      // === PAGE 4: TRUST LAYER ===
      if (trustLayer) {
        pdf.addPage();
        y = margin;

        pdf.setFillColor(16, 185, 129);
        pdf.rect(0, 0, pageWidth, 20, 'F');
        pdf.setFontSize(11);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Trust & Reliability Assessment', margin, 14);
        y = 30;

        // Reliability score card
        pdf.setFillColor(240, 253, 244);
        pdf.roundedRect(margin, y, maxWidth, 50, 5, 5, 'F');
        
        pdf.setFontSize(12);
        pdf.setTextColor(30, 30, 30);
        pdf.text('Data Reliability Score', margin + 15, y + 15);
        
        // Score circle
        const score = trustLayer.reliabilityScore;
        pdf.setFillColor(score >= 85 ? 187 : score >= 70 ? 254 : 254, score >= 85 ? 247 : score >= 70 ? 215 : 202, score >= 85 ? 208 : score >= 70 ? 170 : 202);
        pdf.circle(margin + maxWidth - 35, y + 25, 20, 'F');
        pdf.setFontSize(16);
        pdf.setTextColor(score >= 85 ? 22 : score >= 70 ? 161 : 185, score >= 85 ? 163 : score >= 70 ? 98 : 28, score >= 85 ? 74 : score >= 70 ? 7 : 28);
        pdf.text(`${score}%`, margin + maxWidth - 47, y + 30);
        
        pdf.setFontSize(8);
        pdf.setTextColor(60, 60, 60);
        const reliabilityLines = pdf.splitTextToSize(trustLayer.reliabilityDetails, maxWidth - 80);
        pdf.text(reliabilityLines, margin + 15, y + 28);
        y += 60;

        // Safe conclusions
        addSectionHeader('Safe to Conclude', [16, 185, 129]);
        pdf.setFontSize(8);
        trustLayer.safeConclusions.forEach(conclusion => {
          checkPageBreak(12);
          pdf.setTextColor(60, 60, 60);
          const lines = pdf.splitTextToSize('• ' + cleanText(conclusion), maxWidth - 15);
          pdf.text(lines, margin + 12, y);
          y += lines.length * lineHeight + 3;
        });
        y += 10;

        // Uncertain areas
        if (trustLayer.uncertainConclusions.length > 0) {
          addSectionHeader('Areas of Uncertainty', [245, 158, 11]);
          pdf.setFontSize(8);
          trustLayer.uncertainConclusions.forEach(conclusion => {
            checkPageBreak(12);
            pdf.setTextColor(60, 60, 60);
            const lines = pdf.splitTextToSize('• ' + cleanText(conclusion), maxWidth - 15);
            pdf.text(lines, margin + 12, y);
            y += lines.length * lineHeight + 3;
          });
          y += 10;
        }

        // What-If Scenario
        checkPageBreak(50);
        addSectionHeader('What-If Scenario', [168, 85, 247]);
        pdf.setFillColor(243, 232, 255);
        pdf.roundedRect(margin, y, maxWidth, 40, 3, 3, 'F');
        
        pdf.setFontSize(9);
        pdf.setTextColor(88, 28, 135);
        pdf.text(trustLayer.whatIfScenario.scenario, margin + 10, y + 12);
        
        pdf.setFontSize(8);
        pdf.setTextColor(60, 60, 60);
        const scenarioLines = pdf.splitTextToSize(trustLayer.whatIfScenario.explanation, maxWidth - 20);
        pdf.text(scenarioLines.slice(0, 4), margin + 10, y + 22);
        y += 50;

        // Next questions
        checkPageBreak(60);
        addSectionHeader('Questions to Explore', [59, 130, 246]);
        pdf.setFontSize(8);
        trustLayer.nextQuestions.forEach((q, i) => {
          checkPageBreak(10);
          pdf.setTextColor(59, 130, 246);
          pdf.text(`${i + 1}.`, margin + 12, y);
          pdf.setTextColor(60, 60, 60);
          pdf.text(q, margin + 22, y);
          y += 8;
        });
        y += 15;

        // Trust Statement
        checkPageBreak(40);
        pdf.setFillColor(240, 253, 244);
        pdf.roundedRect(margin, y, maxWidth, 35, 5, 5, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(22, 163, 74);
        pdf.text('TRUST STATEMENT', margin + 10, y + 10);
        pdf.setFontSize(8);
        pdf.setTextColor(60, 60, 60);
        const trustLines = pdf.splitTextToSize(trustLayer.trustStatement, maxWidth - 20);
        pdf.text(trustLines.slice(0, 4), margin + 10, y + 20);
      }

      // === FINAL PAGE: CONCLUSION ===
      pdf.addPage();
      y = margin;

      pdf.setFillColor(20, 184, 166);
      pdf.rect(0, 0, pageWidth, 20, 'F');
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Conclusion', margin, 14);
      y = 30;

      if (dataStory) {
        pdf.setFillColor(240, 253, 244);
        pdf.roundedRect(margin, y, maxWidth, 60, 5, 5, 'F');
        
        pdf.setFontSize(12);
        pdf.setTextColor(30, 30, 30);
        pdf.text('Final Summary', margin + 15, y + 15);
        
        pdf.setFontSize(9);
        pdf.setTextColor(60, 60, 60);
        const conclusionLines = pdf.splitTextToSize(cleanText(dataStory.conclusion), maxWidth - 30);
        pdf.text(conclusionLines.slice(0, 8), margin + 15, y + 28);
      }

      // Footer on all pages
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFillColor(243, 244, 246);
        pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        pdf.text('DataLens AI Analytics Report', margin, pageHeight - 5);
        pdf.text(new Date().toLocaleDateString(), pageWidth - margin - 25, pageHeight - 5);
      }

      pdf.save('DataLens_Full_Report.pdf');
      setExportSuccess('pdf');
    } finally {
      setIsExporting(null);
      setTimeout(() => setExportSuccess(null), 2000);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-gradient-to-r from-primary/10 to-chart-2/10 border-primary/30 hover:border-primary/50">
          <Download className="w-4 h-4" />
          Export
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          PDF Reports
        </div>
        <DropdownMenuItem onClick={exportExecutiveSummary} disabled={isExporting !== null} className="gap-3">
          {isExporting === 'executive' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : exportSuccess === 'executive' ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          )}
          <div>
            <p className="font-medium">Executive Summary</p>
            <p className="text-xs text-muted-foreground">2-page overview</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportFullPDF} disabled={isExporting !== null} className="gap-3">
          {isExporting === 'pdf' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : exportSuccess === 'pdf' ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Image className="w-4 h-4 text-purple-500" />
          )}
          <div>
            <p className="font-medium">Full Report</p>
            <p className="text-xs text-muted-foreground">Complete analysis with predictions</p>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Data Export
        </div>
        <DropdownMenuItem onClick={exportCSV} disabled={isExporting !== null} className="gap-3">
          {isExporting === 'csv' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : exportSuccess === 'csv' ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Table className="w-4 h-4 text-blue-500" />
          )}
          <div>
            <p className="font-medium">Cleaned CSV</p>
            <p className="text-xs text-muted-foreground">Processed dataset</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJSON} disabled={isExporting !== null} className="gap-3">
          {isExporting === 'json' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : exportSuccess === 'json' ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <FileText className="w-4 h-4 text-orange-500" />
          )}
          <div>
            <p className="font-medium">Full JSON</p>
            <p className="text-xs text-muted-foreground">Complete data with metadata</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
