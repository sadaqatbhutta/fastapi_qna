import { useState, useEffect } from "react";

export default function Settings() {
  const [settings, setSettings] = useState({ prompt: "", temperature: 0.7, top_k: 10 });

  async function loadSettings() {
    const res = await fetch("http://16.171.55.12:8000/settings");
    const data = await res.json();
    setSettings(data);
  }

  async function saveSettings() {
    await fetch("http://16.171.55.12:8000/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    alert("Settings updated!");
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Settings</h2>
      <div>
        <label>Prompt: </label>
        <input
          className="border p-1 ml-2"
          value={settings.prompt}
          onChange={(e) => setSettings({ ...settings, prompt: e.target.value })}
        />
      </div>
      <div>
        <label>Temperature: </label>
        <input
          type="number"
          step="0.1"
          className="border p-1 ml-2"
          value={settings.temperature}
          onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
        />
      </div>
      <div>
        <label>Top K: </label>
        <input
          type="number"
          className="border p-1 ml-2"
          value={settings.top_k}
          onChange={(e) => setSettings({ ...settings, top_k: parseInt(e.target.value) })}
        />
      </div>
      <button onClick={saveSettings} className="mt-3 bg-green-500 text-white px-3 py-1 rounded">
        Save
      </button>
    </div>
  );
}
