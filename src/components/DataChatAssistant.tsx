import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Bot, User, Loader2, Sparkles, X, Maximize2, Minimize2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CleanedData, DataStory } from '@/types/analytics';
import { toast } from 'sonner';

interface DataChatAssistantProps {
  data: CleanedData;
  story: DataStory;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What's the most important finding?",
  "Are there any risks I should know about?",
  "What should I focus on first?",
  "Explain the trends in simple terms",
  "What does this mean for my business?",
];

// Markdown-like renderer for formatted responses
function FormattedMessage({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse and render formatted content
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];
    let listType: 'bullet' | 'number' | null = null;
    let key = 0;

    const flushList = () => {
      if (listItems.length > 0 && listType) {
        if (listType === 'number') {
          elements.push(
            <ol key={key++} className="list-decimal list-inside space-y-1 my-2 ml-2">
              {listItems.map((item, i) => (
                <li key={i} className="text-sm">{renderInlineFormatting(item)}</li>
              ))}
            </ol>
          );
        } else {
          elements.push(
            <ul key={key++} className="space-y-1 my-2 ml-2">
              {listItems.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{renderInlineFormatting(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        listItems = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Headers
      if (trimmedLine.startsWith('## ')) {
        flushList();
        elements.push(
          <h3 key={key++} className="text-sm font-semibold text-primary mt-4 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-primary rounded-full" />
            {trimmedLine.slice(3)}
          </h3>
        );
        return;
      }

      if (trimmedLine.startsWith('### ')) {
        flushList();
        elements.push(
          <h4 key={key++} className="text-sm font-medium mt-3 mb-1">
            {trimmedLine.slice(4)}
          </h4>
        );
        return;
      }

      // Bullet points
      if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (listType !== 'bullet') {
          flushList();
          listType = 'bullet';
        }
        listItems.push(trimmedLine.slice(2));
        return;
      }

      // Numbered lists
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        if (listType !== 'number') {
          flushList();
          listType = 'number';
        }
        listItems.push(numberedMatch[2]);
        return;
      }

      // Trend indicators with emojis
      if (trimmedLine.startsWith('📈') || trimmedLine.startsWith('📉') || trimmedLine.startsWith('➡️')) {
        flushList();
        const isUp = trimmedLine.startsWith('📈');
        const isDown = trimmedLine.startsWith('📉');
        elements.push(
          <div 
            key={key++} 
            className={`flex items-center gap-2 my-1 p-2 rounded-lg text-sm ${
              isUp ? 'bg-chart-1/10 text-chart-1' : 
              isDown ? 'bg-destructive/10 text-destructive' : 
              'bg-muted text-muted-foreground'
            }`}
          >
            {renderInlineFormatting(trimmedLine)}
          </div>
        );
        return;
      }

      // Empty lines
      if (trimmedLine === '') {
        flushList();
        elements.push(<div key={key++} className="h-2" />);
        return;
      }

      // Regular paragraphs
      flushList();
      elements.push(
        <p key={key++} className="text-sm my-1 leading-relaxed">
          {renderInlineFormatting(trimmedLine)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  // Render inline formatting (bold, etc.)
  const renderInlineFormatting = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold with **
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.slice(0, boldMatch.index));
        }
        parts.push(
          <strong key={key++} className="font-semibold text-foreground">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // No more matches, add rest
      parts.push(remaining);
      break;
    }

    return parts;
  };

  return (
    <div className="relative group">
      <div className="prose prose-sm max-w-none">
        {renderContent(content)}
      </div>
      <button
        onClick={copyToClipboard}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-secondary/80 hover:bg-secondary"
        title="Copy response"
      >
        {copied ? (
          <Check className="w-3 h-3 text-chart-1" />
        ) : (
          <Copy className="w-3 h-3 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

export function DataChatAssistant({ data, story }: DataChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Build data context for AI
  const dataContext = buildDataContext(data, story);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return;
    
    const userMessage: Message = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    let assistantContent = '';
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/data-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            question,
            dataContext,
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }
      
      if (!response.body) {
        throw new Error('No response body');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === 'assistant') {
                  lastMessage.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch {
            // Incomplete JSON, put back
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      // Remove the empty assistant message if there was an error
      setMessages(prev => prev.filter((_, i) => i !== prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([]);
  };
  
  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-chart-1 shadow-lg flex items-center justify-center z-50 ${isOpen ? 'hidden' : ''}`}
      >
        <Sparkles className="w-6 h-6 text-white" />
      </motion.button>
      
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={`fixed z-50 bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
              isExpanded 
                ? 'inset-4 md:inset-10' 
                : 'bottom-6 right-6 w-[420px] h-[650px] max-w-[calc(100vw-48px)] max-h-[calc(100vh-48px)]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-chart-1/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-1 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Data Assistant</h3>
                  <p className="text-xs text-muted-foreground">Ask anything about your data</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-chart-1/20 flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">Ask me about your data!</h4>
                    <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                      I can explain trends, answer questions, and help you understand what the numbers mean for your business.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center font-medium">Try asking:</p>
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        className="w-full text-left p-3 text-sm rounded-xl bg-secondary/50 hover:bg-secondary hover:border-primary/20 border border-transparent transition-all flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-primary/60" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-primary' 
                          : 'bg-gradient-to-br from-chart-1 to-chart-2'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-primary-foreground" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className={`flex-1 p-4 rounded-xl ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary/50 border border-border/50'
                      }`}>
                        {message.role === 'user' ? (
                          <p className="text-sm">{message.content}</p>
                        ) : (
                          <FormattedMessage content={message.content} />
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && messages[messages.length - 1]?.content === '' && (
                    <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-chart-1 to-chart-2 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Analyzing your data...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
            
            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card/50">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your data..."
                  disabled={isLoading}
                  className="flex-1 bg-background"
                />
                <Button type="submit" disabled={isLoading || !input.trim()} className="px-4">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Powered by AI • Responses are generated based on your data
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function buildDataContext(data: CleanedData, story: DataStory): string {
  const numericColumns = data.columns.filter(c => c.type === 'numeric');
  const categoricalColumns = data.columns.filter(c => c.type === 'categorical');
  
  let context = `DATASET OVERVIEW:
- Total records: ${data.rowCount.toLocaleString()}
- Number of columns: ${data.columnCount}

NUMERIC COLUMNS:
`;
  
  numericColumns.forEach(col => {
    const stats = col.stats;
    if (stats) {
      context += `
${col.name}:
  - Average: ${stats.mean?.toFixed(2) || 'N/A'}
  - Median: ${stats.median?.toFixed(2) || 'N/A'}
  - Min: ${stats.min?.toFixed(2) || 'N/A'}
  - Max: ${stats.max?.toFixed(2) || 'N/A'}
  - Trend: ${stats.trend || 'N/A'}
  - Change: ${stats.percentChange?.toFixed(2) || 'N/A'}%
  - Outliers: ${stats.outliers?.length || 0} unusual values
`;
    }
  });
  
  context += `\nCATEGORICAL COLUMNS:\n`;
  categoricalColumns.forEach(col => {
    const stats = col.stats;
    if (stats) {
      context += `
${col.name}:
  - Unique values: ${stats.unique}
  - Most common: ${stats.mode}
`;
    }
  });
  
  context += `\nANALYSIS SUMMARY:
${story.overview}

KEY TRENDS:
${story.keyTrends.join('\n')}

NOTABLE PATTERNS:
${story.anomalies.join('\n')}

INSIGHTS:
${story.insights.join('\n')}

CONCLUSION:
${story.conclusion}`;
  
  return context;
}
