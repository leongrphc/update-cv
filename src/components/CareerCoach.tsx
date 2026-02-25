"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "CV'mi nasıl geliştirebilirim?",
  "ATS skoru nasıl artırılır?",
  "Mülakatta ne sorulur?",
  "Kariyer değiştirmek istiyorum",
];

export function CareerCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error("API hatası");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream okunamadı");

      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith('0:"')) {
            const textContent = line.slice(3, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
            fullContent += textContent;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m))
            );
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center group"
        aria-label="Kariyer Koçu"
      >
        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white dark:text-slate-900" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">CV Koç</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">AI Kariyer Danışmanı</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Merhaba! Ben CV Koç 👋
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Kariyer ve CV hakkında sorularınızı yanıtlayayım.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-br-md"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md"
                }`}
              >
                {msg.content || (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Bir soru sorun..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900/20 dark:focus:ring-white/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-30"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
