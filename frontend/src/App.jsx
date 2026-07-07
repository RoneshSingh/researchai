import React, { useState, useEffect } from "react";
import axios from "axios";
import NotebookList from "./components/NotebookList";
import NotebookChat from "./components/NotebookChat";
import PipelineControls from "./components/PipelineControls";
import { Sparkles, Info } from "lucide-react";

export default function App() {
  const [notebooks, setNotebooks] = useState([]);
  const [activeNotebook, setActiveNotebook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotebooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:8000/api/notebooks");
      setNotebooks(response.data);
      if (response.data.length > 0 && !activeNotebook) {
        // Automatically select first notebook as default
        setActiveNotebook(response.data[0]);
      }
    } catch (err) {
      console.error("Error fetching notebooks:", err);
      setError("Could not load notebooks. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden font-sans">
      {/* Sidebar - Notebook List */}
      <NotebookList
        notebooks={notebooks}
        activeNotebook={activeNotebook}
        onSelectNotebook={setActiveNotebook}
        loading={loading}
      />

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col h-full">
        {error && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 p-3 text-xs text-rose-400 flex items-center justify-between px-6">
            <span className="flex items-center gap-2">
              <Info size={14} />
              {error}
            </span>
            <button
              onClick={fetchNotebooks}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-white font-semibold transition-all duration-300"
            >
              Retry
            </button>
          </div>
        )}
        <NotebookChat activeNotebook={activeNotebook} />
      </div>

      {/* Right Side - Pipeline / Media Controls */}
      <PipelineControls activeNotebook={activeNotebook} />
    </div>
  );
}
