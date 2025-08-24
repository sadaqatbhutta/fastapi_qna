import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [textName, setTextName] = useState("");
  const [textContent, setTextContent] = useState("");
  const [updateId, setUpdateId] = useState(""); // For updating documents
  const [updateName, setUpdateName] = useState(""); // Optional: update by name
  const [updateContent, setUpdateContent] = useState("");

  const API_BASE = "http://127.0.0.1:8000"; // Change to your backend IP if needed

  // ----------------- File Upload -----------------
  async function uploadFile(endpoint) {
    const token = localStorage.getItem("token");

    if (!file) {
      alert("Please select a file first.");
      return;
    }

    if (!token) {
      alert("You are not logged in. Please login first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload/${endpoint}`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Upload failed");
      }

      const data = await res.json();
      alert(`Uploaded successfully! Document ID: ${data.document_id}`);
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  }

  // ----------------- Direct Text Upload -----------------
  async function uploadText() {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You are not logged in. Please login first.");
      return;
    }

    if (!textName || !textContent) {
      alert("Please provide both name and content.");
      return;
    }

    const formData = new FormData();
    formData.append("name", textName);
    formData.append("content", textContent);

    try {
      const res = await fetch(`${API_BASE}/upload/text`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Upload failed");
      }

      const data = await res.json();
      alert("Text uploaded successfully! ID: " + data.document_id);

      setTextName("");
      setTextContent("");
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  }

  // ----------------- Update Existing Document -----------------
  async function updateDocument() {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("You are not logged in. Please login first.");
      return;
    }

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
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  }

  // ----------------- JSX -----------------
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Upload</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => uploadFile("pdf")}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          Upload PDF
        </button>
        <button
          onClick={() => uploadFile("image")}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Upload Image
        </button>
        <button
          onClick={() => uploadFile("textfile")}
          className="bg-purple-500 text-white px-3 py-1 rounded"
        >
          Upload TXT File
        </button>
      </div>

      {/* Direct Text Upload */}
      <div className="mt-6 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">Upload Text</h3>
        <input
          type="text"
          placeholder="Enter text title"
          value={textName}
          onChange={(e) => setTextName(e.target.value)}
          className="w-full border rounded p-2 mb-2"
        />
        <textarea
          placeholder="Write your text here..."
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="w-full border rounded p-2 h-28 mb-2"
        ></textarea>
        <button
          onClick={uploadText}
          className="bg-indigo-600 text-white px-3 py-1 rounded"
        >
          Submit Text
        </button>
      </div>

      {/* Update Document Section */}
      <div className="mt-6 p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">Update Existing Document</h3>
        <input
          type="text"
          placeholder="Enter Document ID (optional)"
          value={updateId}
          onChange={(e) => setUpdateId(e.target.value)}
          className="w-full border rounded p-2 mb-2"
        />
        <input
          type="text"
          placeholder="Enter Document Name (optional)"
          value={updateName}
          onChange={(e) => setUpdateName(e.target.value)}
          className="w-full border rounded p-2 mb-2"
        />
        <textarea
          placeholder="Write new content here..."
          value={updateContent}
          onChange={(e) => setUpdateContent(e.target.value)}
          className="w-full border rounded p-2 h-28 mb-2"
        ></textarea>
        <button
          onClick={updateDocument}
          className="bg-yellow-500 text-white px-3 py-1 rounded"
        >
          Update Document
        </button>
      </div>
    </div>
  );
}
