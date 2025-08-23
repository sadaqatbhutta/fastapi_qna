import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);

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
    </div>
  );
}
