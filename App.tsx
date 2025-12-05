import React, { useState, useEffect } from 'react';
import { BookOpen, History, Sparkles, Trash2, Search, Loader2, X, Plus } from 'lucide-react';
import { TranslationItem, TranslationRecord, ViewState, SuggestionItem } from './types';
import { translateToCantonese, getColloquialSuggestions } from './services/geminiService';
import { saveRecord, getHistory, deleteRecord, updateRecord } from './services/storageService';
import { ResultCard } from './components/ResultCard';
import { AudioButton } from './components/AudioButton';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.TRANSLATE);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentResults, setCurrentResults] = useState<TranslationItem[] | null>(null);
  const [historyItems, setHistoryItems] = useState<TranslationRecord[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [targetRecordId, setTargetRecordId] = useState<string | null>(null); // To know which history record to update

  // Load history on mount or view change
  useEffect(() => {
    if (view === ViewState.HISTORY) {
      setHistoryItems(getHistory());
      setHistorySearch(''); // Clear search when entering history view
    }
  }, [view]);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setCurrentResults(null);

    try {
      const items = await translateToCantonese(inputText);
      setCurrentResults(items);

      // Save to history
      const newRecord: TranslationRecord = {
        id: crypto.randomUUID(),
        originalText: inputText,
        results: items,
        timestamp: Date.now(),
      };
      saveRecord(newRecord);
    } catch (err) {
      setError("Failed to translate. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = (id: string) => {
    deleteRecord(id);
    setHistoryItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCardClick = async (word: string, recordId: string | null = null) => {
    setSelectedWord(word);
    setTargetRecordId(recordId);
    setIsModalOpen(true);
    setModalLoading(true);
    setSuggestions([]);

    try {
      const results = await getColloquialSuggestions(word);
      setSuggestions(results);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddSuggestion = (suggestion: SuggestionItem) => {
    const newItem: TranslationItem = {
      text: suggestion.text,
      jyutping: suggestion.jyutping,
      partOfSpeech: 'Colloquial'
    };

    if (view === ViewState.TRANSLATE && currentResults) {
      // Add to current view
      setCurrentResults([...currentResults, newItem]);
    } else if (view === ViewState.HISTORY && targetRecordId) {
      // Add to specific history record
      const updatedHistory = historyItems.map(record => {
        if (record.id === targetRecordId) {
          const updatedResults = [...record.results, newItem];
          // Persist to storage
          updateRecord(record.id, updatedResults);
          return { ...record, results: updatedResults };
        }
        return record;
      });
      setHistoryItems(updatedHistory);
    }
    
    setIsModalOpen(false);
  };

  // Helper to format date
  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('en-HK', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(ts));
  };

  // Filter history based on search query
  const filteredHistory = historyItems.filter(item => {
    const query = historySearch.toLowerCase().trim();
    if (!query) return true;
    
    const dateStr = formatDate(item.timestamp).toLowerCase();
    const text = item.originalText.toLowerCase();
    
    return text.includes(query) || dateStr.includes(query);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white">
              <span className="font-chinese font-bold text-lg">粵</span>
            </div>
            <h1 className="font-bold text-slate-800 text-lg tracking-tight">CantoLearn</h1>
          </div>
          
          <nav className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setView(ViewState.TRANSLATE)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === ViewState.TRANSLATE 
                  ? 'bg-white text-teal-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Translate
            </button>
            <button
              onClick={() => setView(ViewState.HISTORY)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === ViewState.HISTORY
                  ? 'bg-white text-teal-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              History
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 pb-20">
        
        {/* TRANSLATE VIEW */}
        {view === ViewState.TRANSLATE && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Input Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type Chinese text (e.g. 我想食飯) or space separated words..."
                className="w-full h-32 p-4 text-lg bg-transparent border-none resize-none focus:ring-0 placeholder:text-slate-300 font-chinese text-slate-700"
              />
              <div className="flex justify-between items-center px-4 pb-4">
                <div className="text-xs text-slate-400">
                  <span className="bg-slate-100 px-2 py-1 rounded">Tip</span> Use spaces to list words.
                </div>
                <button
                  onClick={handleTranslate}
                  disabled={loading || !inputText.trim()}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  Translate
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            {/* Results Grid */}
            {currentResults && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-slate-400 text-sm font-medium uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} />
                    <span>Vocabulary Breakdown</span>
                  </div>
                  <span className="text-xs normal-case text-slate-300">Click cards for slang</span>
                </div>
                
                {currentResults.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    No vocabulary found. Try entering a longer sentence.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {currentResults.map((item, idx) => (
                      <ResultCard 
                        key={idx} 
                        item={item} 
                        onClick={() => handleCardClick(item.text)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {!currentResults && !loading && (
              <div className="text-center py-20 opacity-50">
                 <div className="inline-flex justify-center items-center w-16 h-16 bg-slate-200 rounded-full mb-4 text-slate-400">
                    <Search size={32} />
                 </div>
                 <h3 className="text-slate-500 font-medium">Enter text to start learning</h3>
              </div>
            )}
          </div>
        )}

        {/* HISTORY VIEW */}
        {view === ViewState.HISTORY && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History size={20} className="text-teal-600" />
                Recent Translations
              </h2>
              <span className="text-sm text-slate-400">{historyItems.length} records</span>
            </div>

            {historyItems.length > 0 && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search by text or date..."
                  className="block w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            )}

            {historyItems.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400">No history yet.</p>
                <button 
                  onClick={() => setView(ViewState.TRANSLATE)}
                  className="mt-4 text-teal-600 font-medium hover:underline"
                >
                  Start translating
                </button>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 mb-2">No matching results found.</p>
                <button 
                  onClick={() => setHistorySearch('')}
                  className="text-teal-600 font-medium hover:underline text-sm"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((record) => (
                  <div key={record.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">{formatDate(record.timestamp)}</p>
                        <h3 className="text-lg font-chinese font-medium text-slate-800 line-clamp-2">
                          {record.originalText}
                        </h3>
                      </div>
                      <button 
                        onClick={() => handleDeleteHistory(record.id)}
                        className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex flex-wrap gap-2">
                        {record.results.map((item, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => handleCardClick(item.text, record.id)}
                            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:border-teal-300 hover:bg-teal-50 transition-colors"
                          >
                            <span className="font-chinese text-slate-700">{item.text}</span>
                            <span className="text-xs text-teal-600 font-bold">{item.jyutping}</span>
                            <div className="w-px h-3 bg-slate-200"></div>
                            <div className="-ml-1" onClick={(e) => e.stopPropagation()}>
                                <AudioButton text={item.text} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Suggestions Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-lg font-bold text-slate-800 mb-1">Local Expressions</h3>
            <p className="text-sm text-slate-500 mb-4">
              Colloquial ways to say <span className="font-chinese font-medium text-slate-800">"{selectedWord}"</span>
            </p>

            {modalLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-teal-600">
                <Loader2 className="animate-spin mb-2" size={32} />
                <span className="text-xs font-medium">Consulting local experts...</span>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-sm">
                No colloquial variations found for this word.
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                       <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-chinese font-bold text-slate-800 text-lg">{suggestion.text}</span>
                          <span className="text-sm font-medium text-teal-600">{suggestion.jyutping}</span>
                       </div>
                       <p className="text-xs text-slate-500">{suggestion.explanation}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="scale-75">
                         <AudioButton text={suggestion.text} />
                      </div>
                      <button
                        onClick={() => handleAddSuggestion(suggestion)}
                        className="bg-teal-100 text-teal-700 hover:bg-teal-200 p-2 rounded-full transition-colors"
                        title="Add to vocabulary list"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="py-6 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} CantoLearn AI. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;