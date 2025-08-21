import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar.jsx";
import Save from "./pages/Save.jsx";
import Upload from "./pages/Upload.jsx";
import Documents from "./pages/Documents.jsx";
import Search from "./pages/Search.jsx";
import Settings from "./pages/Settings.jsx";

// -------------------- Chat Page --------------------
function Chat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState([]);

  const askQuestion = async () => {
    if (!question) return;
    try {
      const form = new FormData();
      form.append("question", question);
      const res = await axios.post("http://16.171.55.12:8000/ask", form);
      setAnswer(res.data.answer);
      setHistory((prev) => [{ q: question, a: res.data.answer }, ...prev]);
      saveQnA(question, res.data.answer);
    } catch (err) {
      console.error(err);
      setAnswer("Error contacting server.");
    }
  };

  const saveQnA = async (q, a) => {
    try {
      await axios.post("http://127.0.0.1:8000/save", { question: q, answer: a });
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await askQuestion();
    setQuestion("");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">FastAPI QnA</h1>

      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question..."
          className="border p-2 w-full rounded-md"
        />
        <button
          type="submit"
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Ask
        </button>
      </form>

      {answer && (
        <div className="mb-4 p-4 border rounded-md bg-gray-50">
          <strong>Answer:</strong> {answer}
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-2">History:</h2>
        <ul>
          {history.map((item, idx) => (
            <li key={idx} className="mb-2 p-2 border rounded-md">
              <strong>Q:</strong> {item.q} <br />
              <strong>A:</strong> {item.a}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// -------------------- Main App --------------------
export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl p-4 sm:p-6">
        <Routes>
          {/* Default → Chat */}
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/save" element={<Save />} />
          <Route path="/upload" element={<Upload />} />

          {/* New Pages */}
          <Route path="/documents" element={<Documents />} />
          <Route path="/search" element={<Search />} />
          <Route path="/setting" element={<Settings />} />

          {/* Not Found */}
          <Route
            path="*"
            element={
              <div className="text-center text-slate-500">Not Found</div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
