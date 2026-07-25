import { useState, useEffect } from 'react';
import { Activity, Search, AlertCircle, CheckCircle2, Download, Clock, Image as ImageIcon, Type, Globe, Tag } from 'lucide-react';

interface AnalysisResult {
  url: string;
  statusCode: number;
  responseTime: number;
  title: string;
  metaDescription: string;
  h1Count: number;
  imagesMissingAlt: number;
  wordCount: number;
  score: number;
  suggestions: string[];
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // System preference based dark mode
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze URL');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.url) return;
    window.open(`/api/download-report?url=${encodeURIComponent(result.url)}`, '_blank');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`border-b ${isDarkMode ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-white'} px-6 py-4 sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            <h1 className="text-xl font-bold tracking-tight">Page Pulse AI</h1>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            title="Toggle Theme"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Search Section */}
        <section className={`mb-12 p-8 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Website Health & SEO Analyzer</h2>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-lg`}>
              Enter any URL to get instant technical and SEO insights, powered by intelligent rules.
            </p>
          </div>

          <form onSubmit={handleAnalyze} className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className={`w-full pl-12 pr-4 py-4 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors disabled:opacity-70 flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze URL
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="max-w-3xl mx-auto mt-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </section>

        {/* Results Section */}
        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Score */}
            <div className={`p-8 rounded-2xl shadow-sm border flex flex-col md:flex-row items-center justify-between gap-8 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'}`}>
              <div>
                <h3 className="text-sm uppercase tracking-wider font-semibold text-gray-500 mb-1">Analysis Complete</h3>
                <p className="text-xl font-medium break-all">{result.url}</p>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className={`text-6xl font-bold tracking-tighter ${getScoreColor(result.score)}`}>
                    {result.score}
                  </div>
                  <div className="text-sm font-medium uppercase tracking-widest text-gray-500 mt-1">Health Score</div>
                </div>
                <button
                  onClick={handleDownload}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium border transition-colors ${
                    isDarkMode 
                      ? 'border-gray-700 hover:bg-gray-800' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  PDF Report
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Main Metrics */}
              <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
                <MetricCard 
                  isDark={isDarkMode} 
                  icon={<Globe />} 
                  title="Status Code" 
                  value={result.statusCode.toString()} 
                  status={result.statusCode === 200 ? 'good' : 'warning'}
                />
                <MetricCard 
                  isDark={isDarkMode} 
                  icon={<Clock />} 
                  title="Response Time" 
                  value={`${result.responseTime} ms`} 
                  status={result.responseTime < 800 ? 'good' : result.responseTime < 2000 ? 'warning' : 'danger'}
                />
                <MetricCard 
                  isDark={isDarkMode} 
                  icon={<Type />} 
                  title="Word Count" 
                  value={`~${result.wordCount}`} 
                  status={result.wordCount >= 300 ? 'good' : 'danger'}
                />
                <MetricCard 
                  isDark={isDarkMode} 
                  icon={<ImageIcon />} 
                  title="Missing Alt Text" 
                  value={result.imagesMissingAlt.toString()} 
                  status={result.imagesMissingAlt === 0 ? 'good' : 'danger'}
                />
                <MetricCard 
                  isDark={isDarkMode} 
                  icon={<Tag />} 
                  title="H1 Count" 
                  value={result.h1Count.toString()} 
                  status={result.h1Count === 1 ? 'good' : 'warning'}
                />
                
                {/* Spanning details */}
                <div className={`sm:col-span-2 p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-500 mb-1">Page Title</div>
                    <div className={`font-medium ${!result.title ? 'text-red-500' : ''}`}>
                      {result.title || 'Missing Title'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Meta Description</div>
                    <div className={`text-sm ${!result.metaDescription ? 'text-red-500' : isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {result.metaDescription || 'Missing Meta Description'}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Suggestions */}
              <div className={`p-6 rounded-2xl border flex flex-col ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                    <Activity className="h-4 w-4" />
                  </span>
                  AI Suggestions
                </h3>
                
                <div className="flex-1">
                  {result.suggestions.length > 0 ? (
                    <ul className="space-y-4">
                      {result.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex gap-3 text-sm">
                          <AlertCircle className="h-5 w-5 shrink-0 text-yellow-500" />
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-70">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                      <p className="font-medium">Excellent!</p>
                      <p className="text-sm mt-1">No critical technical or SEO issues found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({ isDark, icon, title, value, status }: { isDark: boolean, icon: React.ReactNode, title: string, value: string, status: 'good' | 'warning' | 'danger' }) {
  const getStatusColor = () => {
    switch(status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'danger': return 'text-red-500';
    }
  };
  
  return (
    <div className={`p-5 rounded-2xl border flex flex-col gap-3 ${isDark ? 'bg-gray-800/30 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className="flex items-center gap-2 text-gray-500">
        <div className="h-4 w-4">{icon}</div>
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className={`text-2xl font-bold ${getStatusColor()}`}>
        {value}
      </div>
    </div>
  );
}
