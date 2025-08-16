import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Save() {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch saved Q&A from backend
  const fetchSaved = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/saved");
      setSavedItems(res.data);
    } catch (err) {
      console.error(err);
      setSavedItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  // Delete a saved Q&A
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/saved/${id}`);
      setSavedItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  if (loading) return <div className="text-center p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Saved Q&A</h1>
      {savedItems.length === 0 && (
        <div className="text-gray-500">No saved questions yet.</div>
      )}
      <ul>
        {savedItems.map((item) => (
          <li key={item.id} className="mb-3 p-3 border rounded-md bg-gray-50">
            <div>
              <strong>Q:</strong> {item.question}
            </div>
            <div>
              <strong>A:</strong> {item.answer}
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
