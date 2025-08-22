import { useState } from "react";

export default function Auth({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true); // toggle between Login & Register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = email/pass, 2 = OTP verify
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const baseUrl = "http://13.53.168.33:8000"; // apni EC2 public IP ya domain


  // -------------------- REGISTER --------------------
  const handleRegister = async () => {
    try {
      if (!email || !password) throw new Error("Email and password are required.");

      const res = await fetch(`${baseUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");

      setSuccess("Registration successful! OTP sent to email.");
      setError("");
      setStep(2);
      setIsLogin(false);
    } catch (err) {
      setError(err.message);
      setSuccess("");
    }
  };

  // -------------------- VERIFY OTP --------------------
  const handleVerify = async () => {
    try {
      if (!otp) throw new Error("OTP is required.");

      const res = await fetch(`${baseUrl}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "OTP verification failed");

      // Auto login after OTP
      const loginRes = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.detail || "Login failed after OTP");

      localStorage.setItem("token", loginData.access_token);
      setSuccess("Account verified! Logged in.");
      setError("");
      setOtp("");
      setStep(1);
      setIsLogin(true);
      onAuth && onAuth(); // trigger App state
    } catch (err) {
      setError(err.message);
      setSuccess("");
    }
  };

  // -------------------- LOGIN --------------------
  const handleLogin = async () => {
    try {
      if (!email || !password) throw new Error("Email and password are required.");

      const res = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");

      // If OTP required
      if (data.otp_needed) {
        setStep(2);
        setIsLogin(false);
        setError("");
        setSuccess("OTP sent to your email. Verify to login.");
        return;
      }

      localStorage.setItem("token", data.access_token);
      setError("");
      setSuccess("Login successful!");
      onAuth && onAuth();
    } catch (err) {
      setError(err.message);
      setSuccess("");
    }
  };

  // -------------------- LOGOUT --------------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLogin(true);
    setStep(1);
    setEmail("");
    setPassword("");
    setOtp("");
    setError("");
    setSuccess("Logged out successfully!");
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">
        {isLogin ? "Login" : step === 1 ? "Register" : "Verify OTP"}
      </h2>

      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-500 mb-2">{success}</div>}

      {/* LOGIN FORM */}
      {isLogin && step === 1 && (
        <>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-2 p-2 border rounded" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mb-2 p-2 border rounded" />
          <button onClick={handleLogin} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Login</button>
        </>
      )}

      {/* REGISTER FORM */}
      {!isLogin && step === 1 && (
        <>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-2 p-2 border rounded" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mb-2 p-2 border rounded" />
          <button onClick={handleRegister} className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">Register</button>
        </>
      )}

      {/* OTP FORM */}
      {!isLogin && step === 2 && (
        <>
          <input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full mb-2 p-2 border rounded" />
          <button onClick={handleVerify} className="w-full bg-purple-600 text-white p-2 rounded hover:bg-purple-700">Verify OTP</button>
        </>
      )}

      <div className="mt-4 text-center">
        {isLogin ? (
          <p>
            Don’t have an account?{" "}
            <button onClick={() => { setIsLogin(false); setError(""); setSuccess(""); setStep(1); }} className="text-blue-600 underline">Register here</button>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <button onClick={() => { setIsLogin(true); setError(""); setSuccess(""); setStep(1); }} className="text-blue-600 underline">Login here</button>
          </p>
        )}
      </div>
    </div>
  );
}
