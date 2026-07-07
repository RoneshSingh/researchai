import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Send, ArrowLeft, BookOpen, Quote, Info, X } from "lucide-react";

export default function NotebookChat({ activeNotebook }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);
  
  const chatEndRef = useRef(null);

  // Clear messages when notebook changes
  useEffect(() => {
    setMessages([]);
    setActiveCitation(null);
  }, [activeNotebook]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!activeNotebook) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-slate-400 p-8">
        <BookOpen size={48} className="text-slate-600 mb-4 animate-bounce" />
        <h3 className="text-xl font-semibold text-slate-300">Select a Notebook</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm text-center">
          Choose a notebook from the sidebar to query your sources and generate research artifacts.
        </p>
      </div>
    );
  }

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setActiveCitation(null);

    try {
      const response = await axios.post(`http://localhost:8000/api/notebooks/${activeNotebook.id}/query`, {
        question: input,
      });

      const assistantMessage = {
        role: "assistant",
        text: response.data.answer,
        references: response.data.references,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error querying notebook:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I encountered an error while trying to query your notebook. Please ensure the backend is running and that your session is still active.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCitationClick = (citationNumber, messageReferences) => {
    if (!messageReferences) return;
    const matchedRef = messageReferences.find(
      (ref) => ref.citation_number === citationNumber
    );
    if (matchedRef) {
      setActiveCitation(matchedRef);
    }
  };

  const renderTextWithCitations = (text, references) => {
    if (!references || references.length === 0) return text;

    // Matches [1], [2], etc.
    const regex = /(\[\d+\])/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        const citationNumber = parseInt(part.replace(/[\[\]]/g, ""), 10);
        return (
          <button
            key={index}
            onClick={() => handleCitationClick(citationNumber, references)}
            className="inline-flex items-center justify-center w-5.5 h-5.5 mx-0.5 text-[10px] font-bold text-white bg-primary rounded-full hover:bg-primaryHover transition-colors cursor-pointer align-super"
            title="Click to view citation"
          >
            {citationNumber}
          </button>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex-1 flex bg-background overflow-hidden relative">
      {/* Main Conversation Window */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Active Notebook Header */}
        <div className="p-4 border-b border-border glass flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <h3 className="font-bold text-slate-100 text-base">{activeNotebook.title}</h3>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
              <Quote size={40} className="text-slate-700 mb-3 opacity-50" />
              <p className="text-sm">Ask a question to query your notebook sources.</p>
              <p className="text-xs text-slate-600 mt-1">E.g., "Summarize the key findings from these documents."</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl p-4 leading-relaxed text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : msg.isError
                      ? "bg-rose-500/10 border border-rose-500/20 text-rose-200"
                      : "bg-panel/40 border border-border text-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-line">
                    {msg.role === "assistant"
                      ? renderTextWithCitations(msg.text, msg.references)
                      : msg.text}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-panel/40 border border-border rounded-2xl p-4 flex items-center gap-3 text-slate-400 text-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
                <span>Querying RAG model...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-border bg-background/50">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about '${activeNotebook.title}'...`}
              disabled={loading}
              className="w-full bg-panel/30 border border-border focus:border-primary rounded-xl py-3 pl-4 pr-12 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-300"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 p-2 rounded-lg bg-primary hover:bg-primaryHover text-white disabled:opacity-30 disabled:hover:bg-primary transition-all duration-300 cursor-pointer"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Citation Detail Side Panel */}
      {activeCitation && (
        <div className="w-80 border-l border-border h-full flex flex-col glass animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-border flex items-center justify-between bg-panel/30">
            <span className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Info size={16} />
              Citation #{activeCitation.citation_number}
            </span>
            <button
              onClick={() => setActiveCitation(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="p-4 rounded-xl bg-panel/20 border border-border/50 text-xs text-slate-400 leading-relaxed font-mono">
              Source Segment context retrieved from NotebookLM grounding database.
            </div>
            <div className="text-sm text-slate-200 leading-relaxed italic border-l-2 border-primary pl-4 py-1">
              "{activeCitation.cited_text}"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
