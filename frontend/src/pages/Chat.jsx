import { useState, useRef, useEffect } from "react";
import Spinner from "../components/Spinner.jsx";
import Message from "../components/Message.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const token = localStorage.getItem("token");

  // Auto scroll when new message
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const ask = async () => {
    const q = input.trim();
    if (!q) return;

    if (!token) {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "You must be logged in to ask questions." },
      ]);
      return;
    }

    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);

    try {
      // Send JSON to match backend
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Server error");
      }

      const answer = data.answer || "No answer returned.";

      setMessages((m) => [...m, { role: "bot", text: answer }]);

      // Automatically save Q&A
      await fetch(`${API_BASE}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: q, answer }),
      });
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        { role: "bot", text: `Error: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Chat</h2>
      </div>
      <div
        ref={listRef}
        className="card-body space-y-3 max-h-[60vh] overflow-y-auto"
      >
        {messages.map((m, i) => (
          <Message key={i} role={m.role} text={m.text} />
        ))}
        {loading && <Spinner />}
      </div>
      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <textarea
            className="input-textarea h-24"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Type your question and press Enter..."
          />
          <button onClick={ask} className="btn-primary self-end">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
