import { useState, useRef, useEffect } from "react";
import Spinner from "../components/Spinner.jsx";
import Message from "../components/Message.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://13.53.168.33:8000";

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [references, setReferences] = useState([]); // References / stories
  const listRef = useRef(null);
  const token = localStorage.getItem("token");

  // Auto scroll jab new message add ho
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, references]);

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
    setReferences([]); // Clear previous references

    try {
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
      const qid = data.question_id;

      // Bot ka jawab aur "View Sources" button add karna
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: answer,
          question_id: qid,
        },
      ]);

      // Save QnA
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

  // References load karna by question_id
  const loadReferences = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/question/${id}/references`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        // Ensure snippets array exists
        const refs = (data.references || []).map((ref) => ({
          document_id: ref.document_id,
          document_name: ref.document_name || "Document",
          snippets: ref.snippets || [],
        }));
        setReferences(refs);
      } else {
        console.error("Error:", data.detail);
      }
    } catch (err) {
      console.error("Error fetching references:", err);
    }
  };

  // Stories load karna by clicked source
  const loadStoriesBySource = async (sourceName) => {
    try {
      const res = await fetch(
        `${API_BASE}/stories-by-source?source=${encodeURIComponent(sourceName)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        // Ensure snippets array exists
        const stories = (data.stories || []).map((s) => ({
          document_id: s.document_id,
          document_name: s.document_name || "Document",
          snippets: s.snippets || [],
        }));
        setReferences(stories);
      } else {
        console.error("Error fetching stories:", data.detail);
      }
    } catch (err) {
      console.error("Error fetching stories:", err);
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
          <div key={i}>
            <Message role={m.role} text={m.text} />
            {m.role === "bot" && m.question_id && (
              <button
                onClick={() => loadReferences(m.question_id)}
                className="text-sm text-blue-600 mt-1 underline"
              >
                View Sources
              </button>
            )}
          </div>
        ))}

        {/* References & stories display */}
        {references.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">References / Stories:</h3>
            {references.map((ref, i) => (
              <div key={i} className="border p-2 rounded bg-gray-50">
                {ref.document_name && (
                  <p
                    className="font-medium cursor-pointer text-blue-600 underline"
                    onClick={() => loadStoriesBySource(ref.document_name)}
                  >
                    {ref.document_name}
                  </p>
                )}
                {ref.snippets.map((s, j) => (
                  <p key={j} className="text-sm text-gray-700">{s}</p>
                ))}
              </div>
            ))}
          </div>
        )}

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
