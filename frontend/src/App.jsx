import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar.jsx";

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
      const res = await axios.post("http://127.0.0.1:8000/ask", form);
      setAnswer(res.data.answer);
      setHistory((prev) => [{ q: question, a: res.data.answer }, ...prev]);
      saveQnA(question, res.data.answer); // Save automatically after getting answer
    } catch (err) {
      console.error(err);
      setAnswer("Error contacting server.");
    }
  };

  const saveQnA = async (q, a) => {
    try {
      await axios.post("http://127.0.0.1:8000/save", { question: q, answer: a });
    } catch (err) {
      console.error(err);
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

// -------------------- Save Page --------------------
function Save() {
  const [savedQnA, setSavedQnA] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/saved");
      setSavedQnA(res.data);
    } catch (err) {
      console.error(err);
      setSavedQnA([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteQnA = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/document/${id}`);
      setSavedQnA((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete Q&A.");
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (savedQnA.length === 0)
    return <div className="text-center p-6">No saved questions yet.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Saved Q&A</h1>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Question</th>
            <th className="border p-2">Answer</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {savedQnA.map((item) => (
            <tr key={item.id}>
              <td className="border p-2">{item.question}</td>
              <td className="border p-2">{item.answer}</td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => deleteQnA(item.id)}
                  className="bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/save" element={<Save />} />
          <Route
            path="*"
            element={<div className="text-center text-slate-500">Not Found</div>}
          />
        </Routes>
      </main>
    </div>
  );
}
