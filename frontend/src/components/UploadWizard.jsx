import React, { useState } from 'react';
import { Upload, FileText, X, Sparkles, FileUp } from 'lucide-react';
import axios from 'axios';

const UploadWizard = ({ onGenerated, apiBase }) => {
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim() && !file) return;

        setIsGenerating(true);
        const formData = new FormData();
        if (text) formData.append('text', text);
        if (file) formData.append('document', file);

        try {
            const res = await axios.post(`${apiBase}/algorithms/generate-from-file`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onGenerated(res.data);
        } catch (error) {
            console.error("Error generating from document:", error);
            alert("Failed to generate from document. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden transform transition-all hover:shadow-2xl">
                <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold flex items-center gap-3">
                            <Sparkles className="w-8 h-8" />
                            Turn Context into Vision
                        </h2>
                        <p className="mt-2 text-primary-100 font-medium">
                            Upload a PDF, paste text, or describe a complex concept.
                            Our AI will architect a custom visualization timeline for you.
                        </p>
                    </div>
                    <Sparkles className="absolute top-[-20%] right-[-10%] w-64 h-64 text-white/10 rotate-12" />
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Text Input Row */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary-500" />
                            Source Text / Concept
                        </label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste algorithm description, pseudocode, or a complex CS concept here..."
                            className="w-full h-40 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-slate-700 placeholder-slate-400 resize-none font-medium text-sm"
                        />
                    </div>

                    {/* Divider */}
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-4 text-slate-400 font-bold tracking-[0.2em]">OR UPLOAD DOCUMENT</span>
                        </div>
                    </div>

                    {/* File Upload Row */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center ${dragActive ? 'border-primary-500 bg-primary-50/50 shadow-inner' :
                                file ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 hover:border-primary-400 hover:bg-slate-50'
                            }`}
                        onClick={() => document.getElementById('file-upload').click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.txt"
                            onChange={handleFileChange}
                        />

                        {file ? (
                            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-emerald-100 animate-in fade-in zoom-in duration-300">
                                <FileUp className="w-10 h-10 text-emerald-500" />
                                <div className="text-left">
                                    <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{file.name}</p>
                                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-slate-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-primary-500" />
                                </div>
                                <p className="mt-4 text-sm font-bold text-slate-600">
                                    Drop your PDF or TXT here, or <span className="text-primary-600">browse</span>
                                </p>
                                <p className="mt-1 text-xs text-slate-400 font-medium tracking-wide">
                                    Supports .pdf and .txt (max 10MB)
                                </p>
                            </>
                        )}
                    </div>

                    {/* Action Button */}
                    <button
                        type="submit"
                        disabled={isGenerating || (!text.trim() && !file)}
                        className="w-full py-5 bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-primary-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                    >
                        {isGenerating ? (
                            <>
                                <Sparkles className="w-6 h-6 animate-spin" />
                                <span className="animate-pulse">Synthesizing Visualization...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-6 h-6" />
                                Generate Intelligence
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UploadWizard;
