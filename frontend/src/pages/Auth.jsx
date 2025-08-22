import { useState } from "react";

export default function Auth({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true); // toggle between Login & Register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Email and password are required.");
      }

      // Use same backend URL consistently
      const baseUrl = "http://127.0.0.1:8000"; // <-- Update your FastAPI backend IP/port here
      const url = isLogin ? `${baseUrl}/login` : `${baseUrl}/register`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || (isLogin ? "Login failed" : "Registration failed"));
      }

      if (isLogin) {
        localStorage.setItem("token", data.access_token);
        setError("");
        setSuccess("Login successful!");
        onAuth && onAuth(); // notify parent
      } else {
        setSuccess("Registration successful! Please log in.");
        setError("");
        setIsLogin(true); // switch to login after register
      }
    } catch (err) {
      setError(err.message);
      setSuccess("");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">
        {isLogin ? "Login" : "Register"}
      </h2>

      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-500 mb-2">{success}</div>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full mb-2 p-2 border rounded"
      />

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        {isLogin ? "Login" : "Register"}
      </button>

      <div className="mt-4 text-center">
        {isLogin ? (
          <p>
            Don’t have an account?{" "}
            <button
              onClick={() => {
                setIsLogin(false);
                setError("");
                setSuccess("");
              }}
              className="text-blue-600 underline"
            >
              Register here
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <button
              onClick={() => {
                setIsLogin(true);
                setError("");
                setSuccess("");
              }}
              className="text-blue-600 underline"
            >
              Login here
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
