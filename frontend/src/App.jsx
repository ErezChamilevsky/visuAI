import React, { useState } from 'react';
import { Sparkles, Library as LibraryIcon, Code2, FileUp } from 'lucide-react';
import Library from './components/Library';
import Visualizer from './components/Visualizer';
import UploadWizard from './components/UploadWizard';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [view, setView] = useState('library'); // 'library' or 'visualizer'
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAlgorithm, setCurrentAlgorithm] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await axios.post(`${API_BASE}/algorithms/generate`, { prompt });
      setCurrentAlgorithm(res.data);
      setView('visualizer');
      setPrompt('');
    } catch (error) {
      console.error("Error generating algorithm:", error);
      alert("Failed to generate. Check console and make sure backend has Gemini API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAlgorithm = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/algorithms/${id}`);
      setCurrentAlgorithm(res.data);
      setView('visualizer');
    } catch (error) {
      console.error("Error fetching algorithm:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm shrink-0">
        <div className="w-full px-6 h-16 flex items-center justify-between gap-8">
          <div
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            onClick={() => setView('library')}
          >
            <div className="bg-primary-500 p-2 rounded-xl group-hover:scale-105 transition-transform duration-300">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600 hidden md:block">
              VisuAI
            </h1>
          </div>

          <form onSubmit={handleGenerate} className="flex-1 max-w-3xl relative group">
            <div className="relative flex items-center bg-slate-50 rounded-xl px-2 py-1 focus-within:ring-2 focus-within:ring-primary-500 border border-slate-200 group-hover:border-primary-300 transition-colors">
              <input
                type="text"
                placeholder="e.g., Visualize 3SAT to Independent Set..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                className="w-full px-4 py-2 bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm"
              />
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="ml-2 flex flex-shrink-0 items-center justify-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium rounded-lg hover:from-primary-500 hover:to-primary-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </form>

          <nav className="flex gap-4 shrink-0">
            <button
              onClick={() => setView('library')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${view === 'library' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <LibraryIcon className="w-4 h-4" />
              Library
            </button>
            <button
              onClick={() => setView('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${view === 'upload' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <FileUp className="w-4 h-4 text-primary-500" />
              Upload
            </button>
          </nav>
        </div>
      </header>

      <main className={`flex-1 mx-auto w-full flex flex-col relative overflow-hidden ${view === 'visualizer' ? 'max-w-[1920px] p-0' : 'max-w-7xl p-6'}`}>
        <div className={`flex-1 w-full flex flex-col shadow-2xl border-slate-100 overflow-hidden ${view === 'visualizer' ? 'bg-transparent border-0 rounded-none' : 'bg-white rounded-3xl border min-h-[600px]'}`}>
          {view === 'library' && (
            <Library onSelect={handleSelectAlgorithm} apiBase={API_BASE} />
          )}
          {view === 'upload' && (
            <UploadWizard
              apiBase={API_BASE}
              onGenerated={(algo) => {
                setCurrentAlgorithm(algo);
                setView('visualizer');
              }}
            />
          )}
          {view === 'visualizer' && currentAlgorithm && (
            <Visualizer algorithm={currentAlgorithm} />
          )}
          {view === 'visualizer' && !currentAlgorithm && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500 bg-white">
              <Sparkles className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-xl font-medium">Generate or select an algorithm to visualize</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
