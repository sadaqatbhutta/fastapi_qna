import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);

  async function uploadFile(endpoint) {
    const formData = new FormData();
    formData.append("file", file);
    await fetch(`http://127.0.0.1:8000/upload/${endpoint}`, {
      method: "POST",
      body: formData,
    });
    alert("Uploaded successfully!");
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Upload</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <div className="mt-3 flex gap-2">
        <button onClick={() => uploadFile("pdf")} className="bg-green-500 text-white px-3 py-1 rounded">
          Upload PDF
        </button>
        <button onClick={() => uploadFile("image")} className="bg-blue-500 text-white px-3 py-1 rounded">
          Upload Image
        </button>
        <button onClick={() => uploadFile("textfile")} className="bg-purple-500 text-white px-3 py-1 rounded">
          Upload TXT File
        </button>
      </div>
    </div>
  );
}
