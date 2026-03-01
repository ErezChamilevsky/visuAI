import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Layers, Clock, ArrowRight } from 'lucide-react';

const Library = ({ onSelect, apiBase }) => {
  const [algorithms, setAlgorithms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlgorithms = async () => {
      try {
        const res = await axios.get(`${apiBase}/algorithms`);
        setAlgorithms(res.data);
      } catch (err) {
        console.error('Error fetching library:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlgorithms();
  }, [apiBase]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (algorithms.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-16">
        <Layers className="w-16 h-16 text-slate-200 mb-4" />
        <h3 className="text-xl font-medium text-slate-700">Your library is empty</h3>
        <p className="mt-2 text-slate-400 max-w-sm text-center">
          Generate your first algorithm visualization using the prompt above.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Layers className="text-primary-500 w-6 h-6" />
          Algorithm Library
        </h2>
        <span className="bg-slate-100 text-slate-600 text-sm font-medium px-3 py-1 rounded-full">
          {algorithms.length} {algorithms.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {algorithms.map((algo) => (
          <div
            key={algo._id}
            onClick={() => onSelect(algo._id)}
            className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary-100 cursor-pointer transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-full -z-10 group-hover:bg-primary-100 transition-colors"></div>

            <h3 className="text-xl font-semibold text-slate-800 mb-3 group-hover:text-primary-700 transition-colors">
              {algo.title}
            </h3>

            <p className="text-slate-600 line-clamp-2 text-sm leading-relaxed mb-6">
              {algo.description}
            </p>

            <div className="flex items-center justify-between mt-auto">
              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5" />
                {new Date(algo.createdAt).toLocaleDateString()}
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors text-slate-400">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;
