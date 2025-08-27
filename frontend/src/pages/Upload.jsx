import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [plainText, setPlainText] = useState("");   // ✅ new state for plain text
  const [updateId, setUpdateId] = useState("");     // ✅ state for update text id
  const [updateText, setUpdateText] = useState(""); // ✅ state for updated text

  async function uploadFile(endpoint) {
    const token = localStorage.getItem("token"); // get user token

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
      const res = await fetch(`http://127.0.0.1:8000/upload/${endpoint}`, {
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

      alert("Uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  }

  // ✅ Add Plain Text
  async function addPlainText() {
    const token = localStorage.getItem("token");
    if (!plainText.trim()) {
      alert("Enter some text first.");
      return;
    }
    try {
      const res = await fetch("http://127.0.0.1:8000/text/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: plainText, document_name: "free_text" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to add text");
      }
      alert("Plain text added successfully!");
      setPlainText("");
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  // ✅ Update Text by ID
  async function updateTextById() {
    const token = localStorage.getItem("token");
    if (!updateId || !updateText.trim()) {
      alert("Enter ID and new text.");
      return;
    }
    try {
      const res = await fetch(`http://127.0.0.1:8000/text/${updateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_content: updateText }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to update text");
      }
      alert("Text updated successfully!");
      setUpdateId("");
      setUpdateText("");
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

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

      {/* ✅ Add Free / Plain Text */}
      <div className="mt-5">
        <h3 className="font-semibold">Add Plain Text</h3>
        <textarea
          value={plainText}
          onChange={(e) => setPlainText(e.target.value)}
          className="border w-full p-2 rounded"
          placeholder="Write something..."
        />
        <button
          onClick={addPlainText}
          className="bg-indigo-500 text-white px-3 py-1 mt-2 rounded"
        >
          Add Text
        </button>
      </div>

      {/* ✅ Update Text by ID */}
      <div className="mt-5">
        <h3 className="font-semibold">Update Text</h3>
        <input
          type="number"
          value={updateId}
          onChange={(e) => setUpdateId(e.target.value)}
          className="border p-1 mr-2 rounded"
          placeholder="Text ID"
        />
        <input
          type="text"
          value={updateText}
          onChange={(e) => setUpdateText(e.target.value)}
          className="border p-1 mr-2 rounded"
          placeholder="New Content"
        />
        <button
          onClick={updateTextById}
          className="bg-orange-500 text-white px-3 py-1 rounded"
        >
          Update
        </button>
      </div>
    </div>
  );
}
