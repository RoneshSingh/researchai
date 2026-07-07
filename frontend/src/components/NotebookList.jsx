import React from "react";
import { BookOpen, Calendar, HardDrive, ShieldCheck } from "lucide-react";

export default function NotebookList({ notebooks, activeNotebook, onSelectNotebook, loading }) {
  return (
    <div className="w-80 border-r border-border h-full flex flex-col glass">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-border flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg text-primary">
          <BookOpen size={22} className="animate-pulse" />
        </div>
        <div>
          <h2 className="font-bold text-lg tracking-tight text-white">Research AI</h2>
          <p className="text-xs text-slate-400">NotebookLM Workspace</p>
        </div>
      </div>

      {/* Notebooks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          // Loading Skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border/50 bg-panel/30 animate-pulse space-y-2">
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-800/60 rounded w-1/2"></div>
            </div>
          ))
        ) : notebooks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No notebooks found.
          </div>
        ) : (
          notebooks.map((nb) => {
            const isActive = activeNotebook?.id === nb.id;
            return (
              <button
                key={nb.id}
                onClick={() => onSelectNotebook(nb)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 border flex flex-col gap-2 ${
                  isActive
                    ? "bg-primary/10 border-primary text-white shadow-lg shadow-primary/5"
                    : "bg-panel/20 border-border/50 hover:bg-panel/50 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-sm truncate pr-2">
                    {nb.title || "Untitled Notebook"}
                  </span>
                  {nb.is_owner && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-border/50">
                      <ShieldCheck size={10} className="text-emerald-400" />
                      Owner
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <HardDrive size={12} />
                    {nb.sources_count || 0} sources
                  </span>
                  {nb.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(nb.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Sidebar Footer / User Profile */}
      <div className="p-4 border-t border-border bg-panel/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-sm border border-border">
          R
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-medium text-slate-200 truncate">Ronesh Singh</p>
          <p className="text-xs text-slate-500 truncate">roneshmsingh@gmail.com</p>
        </div>
      </div>
    </div>
  );
}
