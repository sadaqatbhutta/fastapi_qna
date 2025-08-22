import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar.jsx";
import Save from "./pages/Save.jsx";
import Upload from "./pages/Upload.jsx";
import Documents from "./pages/Documents.jsx";
import Search from "./pages/Search.jsx";
import Settings from "./pages/Settings.jsx";
import Auth from "./pages/Auth.jsx";

// -------------------- Chat Page --------------------
function Chat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState([]);

  const token = localStorage.getItem("token");

  const askQuestion = async () => {
    if (!question) return;
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/ask",
        { question },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAnswer(res.data.answer);
      setHistory((prev) => [{ q: question, a: res.data.answer }, ...prev]);
      saveQnA(question, res.data.answer);
    } catch (err) {
      console.error(err);
      setAnswer(err.response?.data?.detail || "Error contacting server. Check your token.");
    }
  };

  const saveQnA = async (q, a) => {
    try {
      await axios.post(
        "http://127.0.0.1:8000/save",
        { question: q, answer: a },
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
  const [loggedIn, setLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Program restart ke baad hamesha login page dikhe
    setLoggedIn(false);
  }, []);

  const handleLogin = () => {
    setLoggedIn(true);
    navigate("/chat"); // Login success ke baad chat page
  };

  if (!loggedIn) return <Auth onAuth={handleLogin} />; // Auth me onAuth prop

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl p-4 sm:p-6">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/save" element={<Save />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/search" element={<Search />} />
          <Route path="/setting" element={<Settings />} />
          <Route path="*" element={<div className="text-center text-slate-500">Not Found</div>} />
        </Routes>
      </main>
    </div>
  );
}
