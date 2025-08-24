import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [viewDoc, setViewDoc] = useState(null);
  const [updateContent, setUpdateContent] = useState("");
  const [updateId, setUpdateId] = useState(""); // Optional: update by ID
  const [updateName, setUpdateName] = useState(""); // Optional: update by Name

  const token = localStorage.getItem("token");

  // Fetch all documents
  async function loadDocs() {
    try {
      const res = await fetch(`${API_BASE}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch documents");
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
      const res = await fetch(`${API_BASE}/document/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete document");
      loadDocs();
    } catch (err) {
      console.error("Error deleting document:", err);
    }
  }

  // View document content
  async function viewDocument(id) {
    try {
      const res = await fetch(`${API_BASE}/document/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Document not found");
      const data = await res.json();
      setViewDoc(data);
    } catch (err) {
      console.error("Error fetching document:", err);
      alert("Failed to fetch document content.");
    }
  }

  // Update document content by ID or Name
  async function updateDocument() {
    if (!updateContent || (!updateId && !updateName)) {
      alert("Provide either Document ID or Name and new content.");
      return;
    }

    const params = new URLSearchParams();
    if (updateId) params.append("document_id", updateId);
    if (updateName) params.append("name", updateName);

    try {
      const res = await fetch(`${API_BASE}/update/text/?${params.toString()}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: updateContent }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Update failed");
      }

      const data = await res.json();
      alert("Document updated successfully! Document ID: " + data.document_id);
      setUpdateId("");
      setUpdateName("");
      setUpdateContent("");
      loadDocs();
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
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
          <li
            key={d.id}
            className="mb-3 p-2 border rounded-md flex justify-between items-center"
          >
            <div>
              <strong>{d.name}</strong> ({d.type})<br />
              Status: {d.status}, Uploaded:{" "}
              {new Date(d.upload_date).toLocaleString()}
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

            <div className="mt-4">
              <input
                type="text"
                placeholder="Update by Document ID (optional)"
                value={updateId}
                onChange={(e) => setUpdateId(e.target.value)}
                className="w-full border rounded p-2 mb-2"
              />
              <input
                type="text"
                placeholder="Update by Document Name (optional)"
                value={updateName}
                onChange={(e) => setUpdateName(e.target.value)}
                className="w-full border rounded p-2 mb-2"
              />
              <textarea
                placeholder="Enter new content..."
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
                className="w-full border rounded p-2 h-28 mb-2"
              />
              <button
                onClick={updateDocument}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                Update Document
              </button>
            </div>

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
