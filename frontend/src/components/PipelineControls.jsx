import React, { useState, useEffect } from "react";
import axios from "axios";
import { Sparkles, Music, Loader2, RefreshCw, FileText, CheckCircle2, AlertCircle, Play, FileCode, Check } from "lucide-react";

export default function PipelineControls({ activeNotebook }) {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [taskInfo, setTaskInfo] = useState(null);

  const fetchArtifacts = async () => {
    if (!activeNotebook) return;
    setLoading(true);
    try {
      const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:8000"
        : "";
      const response = await axios.get(`${API_BASE}/api/notebooks/${activeNotebook.id}/artifacts`);
      setArtifacts(response.data);
    } catch (error) {
      console.error("Error fetching artifacts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch artifacts when notebook changes
  useEffect(() => {
    setArtifacts([]);
    setTaskInfo(null);
    setGenerating(false);
    if (activeNotebook) {
      fetchArtifacts();
    }
  }, [activeNotebook]);

  // Polling logic when a task is running
  useEffect(() => {
    if (!taskInfo || !activeNotebook) return;

    const interval = setInterval(async () => {
      try {
        const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
          ? "http://localhost:8000"
          : "";
        const response = await axios.get(
          `${API_BASE}/api/notebooks/${activeNotebook.id}/tasks/${taskInfo.task_id}`
        );
        const data = response.data;
        
        setTaskInfo(data);

        if (data.status === "completed") {
          clearInterval(interval);
          setGenerating(false);
          setTaskInfo(null);
          fetchArtifacts(); // Refresh list to see new audio file
        } else if (data.status === "failed" || data.status === "removed") {
          clearInterval(interval);
          setGenerating(false);
        }
      } catch (error) {
        console.error("Error polling task status:", error);
      }
    }, 15000); // Poll every 15 seconds as generation takes time

    return () => clearInterval(interval);
  }, [taskInfo, activeNotebook]);

  if (!activeNotebook) return null;

  const handleGeneratePodcast = async () => {
    if (generating) return;
    setGenerating(true);
    setTaskInfo(null);
    try {
      const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:8000"
        : "";
      const response = await axios.post(`${API_BASE}/api/notebooks/${activeNotebook.id}/podcast`, {
        language: "en",
      });
      setTaskInfo(response.data);
    } catch (error) {
      console.error("Error generating podcast:", error);
      setGenerating(false);
      alert("Failed to initiate podcast generation.");
    }
  };

  const audioArtifacts = artifacts.filter((a) => a.kind === "audio");
  const docArtifacts = artifacts.filter((a) => a.kind !== "audio");

  return (
    <div className="w-80 border-l border-border h-full flex flex-col glass overflow-y-auto p-6 space-y-8">
      {/* Media Studio Trigger */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          Media Studio
        </h3>
        
        <div className="p-4 rounded-xl border border-border/50 bg-panel/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Music size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-xs text-slate-200">Audio Overview</h4>
              <p className="text-[10px] text-slate-500">2-host AI podcast summary</p>
            </div>
          </div>

          {generating ? (
            <div className="space-y-2 py-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-primary" />
                  Generating Audio...
                </span>
                <span className="text-primary font-semibold">
                  {taskInfo?.status || "Starting"}
                </span>
              </div>
              <p className="text-[9px] text-slate-500 leading-normal">
                This takes 5-15 minutes on Google servers. You can query your notebook while it runs.
              </p>
            </div>
          ) : (
            <button
              onClick={handleGeneratePodcast}
              disabled={generating}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primaryHover disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/10 transition-all duration-300 cursor-pointer glow-btn"
            >
              Generate Podcast
            </button>
          )}

          {taskInfo?.status === "failed" && (
            <div className="text-[10px] text-rose-400 flex items-center gap-1 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              <AlertCircle size={12} />
              Generation failed: Rate limit or daily quota.
            </div>
          )}
        </div>
      </div>

      {/* Generated Audio Artifacts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Music size={16} className="text-primary" />
            Audio Artifacts
          </h3>
          <button 
            onClick={fetchArtifacts}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-panel transition-colors"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="space-y-3">
          {loading && audioArtifacts.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
              <Loader2 size={12} className="animate-spin" />
              Loading audio tracks...
            </div>
          ) : audioArtifacts.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic py-2">
              No audio overviews generated yet.
            </div>
          ) : (
            audioArtifacts.map((art) => (
              <div key={art.id} className="p-3 rounded-xl bg-panel/30 border border-border/40 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Play size={14} className="text-primary mt-0.5" />
                  <div className="flex-1 overflow-hidden">
                    <h5 className="font-semibold text-xs text-slate-200 truncate">{art.title}</h5>
                    <p className="text-[10px] text-slate-500">Status: {art.status}</p>
                  </div>
                </div>
                {art.url && (
                  <audio controls className="w-full h-8 mt-1 rounded bg-transparent opacity-80 scale-95 origin-left">
                    <source src={art.url} type="audio/mp4" />
                    Your browser does not support the audio element.
                  </audio>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* General Study Artifacts */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
          <FileText size={16} className="text-primary" />
          Study Artifacts
        </h3>

        <div className="space-y-3">
          {loading && docArtifacts.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
              <Loader2 size={12} className="animate-spin" />
              Loading artifacts...
            </div>
          ) : docArtifacts.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic py-2">
              No study guides or reports found.
            </div>
          ) : (
            docArtifacts.map((art) => (
              <div key={art.id} className="p-3 rounded-xl bg-panel/10 border border-border/30 hover:border-slate-700 transition-colors flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <FileText size={14} className="text-emerald-400 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <h5 className="font-semibold text-xs text-slate-200 truncate">{art.title}</h5>
                    <p className="text-[9px] text-slate-500 capitalize">{art.kind.replace("_", " ")}</p>
                  </div>
                </div>
                <span className="flex-shrink-0 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-0.5">
                  <Check size={8} />
                  Ready
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
