import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [viewDoc, setViewDoc] = useState(null);

  // Fetch all documents
  async function loadDocs() {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      const data = await res.json();
      setDocs(data);
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  }

  // Delete document
  async function deleteDoc(id) {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await fetch(`${API_BASE}/document/${id}`, { method: "DELETE" });
      loadDocs();
    } catch (err) {
      console.error("Error deleting document:", err);
    }
  }

  // View document content
  async function viewDocument(id) {
    try {
      const res = await fetch(`${API_BASE}/document/${id}`);
      if (!res.ok) throw new Error("Document not found");
      const data = await res.json();
      setViewDoc(data);
    } catch (err) {
      console.error("Error fetching document:", err);
      alert("Failed to fetch document content.");
    }
  }

  useEffect(() => {
    loadDocs();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Documents</h2>

      {docs.length === 0 && <div>No documents found.</div>}

      <ul>
        {docs.map((d) => (
          <li key={d.id} className="mb-3 p-2 border rounded-md flex justify-between items-center">
            <div>
              <strong>{d.name}</strong> ({d.type})<br />
              Status: {d.status}, Uploaded: {new Date(d.upload_date).toLocaleString()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => viewDocument(d.id)}
                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View
              </button>
              <button
                onClick={() => deleteDoc(d.id)}
                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal to show document content */}
      {viewDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg max-w-3xl w-full overflow-auto max-h-[80vh]">
            <h3 className="text-lg font-bold mb-2">{viewDoc.name}</h3>
            <pre className="whitespace-pre-wrap">{viewDoc.content}</pre>
            <button
              onClick={() => setViewDoc(null)}
              className="mt-4 px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
