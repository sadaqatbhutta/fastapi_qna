import { useState } from "react";
import axios from "axios";

export default function SearchDocuments() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      // Make sure backend port matches your FastAPI server
      const res = await axios.get(`http://127.0.0.1:8000/search`, {
        params: { query: query.trim() }, // query param must match backend
      });

      if (res.data.length === 0) {
        setResults([]);
        setError(`No documents found for "${query}".`);
      } else {
        setResults(res.data);
        setError("");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching search results.");
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-2">Search Documents</h2>
      <div className="flex mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your search..."
          className="flex-1 border rounded-l px-3 py-2"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {results.length > 0 && (
        <ul className="space-y-4">
          {results.map((doc) => (
            <li key={doc.document_id} className="border p-3 rounded shadow-sm">
              <h3 className="font-semibold">{doc.name}</h3>
              <p className="text-sm text-gray-600">
                Type: {doc.type} | Status: {doc.status} | Uploaded:{" "}
                {new Date(doc.upload_date).toLocaleString()}
              </p>
              <p className="mt-2">{doc.snippet ? doc.snippet : "No preview available"}...</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
