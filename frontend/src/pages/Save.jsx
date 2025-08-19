import { useEffect, useState } from "react";
import axios from "axios";

export default function Save() {
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      const res = await axios.get("http://16.171.55.12:8000/saved");
      console.log("Saved API Response:", res.data); // Debugging ke liye

      // Ensure hamesha array hi set ho
      setSavedItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching saved items:", err);
      setSavedItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://16.171.55.12:8000/saved/${id}`);
      setSavedItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 text-slate-500">
        Loading saved questions...
      </div>
    );
  }

  return (
    <div className="card max-w-3xl mx-auto">
      <div className="card-header">
        <h2 className="card-title">Saved Q&A</h2>
      </div>
      <div className="card-body space-y-4">
        {savedItems.length === 0 ? (
          <div className="text-slate-500">No saved questions yet.</div>
        ) : (
          savedItems.map((item) => (
            <div
              key={item.id}
              className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm"
            >
              <p className="mb-2">
                <strong>Q:</strong> {item.question}
              </p>
              <p>
                <strong>A:</strong> {item.answer}
              </p>
              <button
                onClick={() => handleDelete(item.id)}
                className="mt-3 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
