import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "./components/Navbar.jsx";
import Save from "./pages/Save.jsx";
import Upload from "./pages/Upload.jsx";
import Documents from "./pages/Documents.jsx";
import Search from "./pages/Search.jsx";
import Settings from "./pages/Settings.jsx";
import Auth from "./pages/Auth.jsx";
import Chat from "./pages/Chat.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const API_BASE = "http://127.0.0.1:8000";


  // --------- Verify token on mount ----------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get(`${API_BASE}/verify-token`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data.valid) {
            setLoggedIn(true);
          } else {
            localStorage.removeItem("token");
            setLoggedIn(false);
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
          setLoggedIn(false);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // --------- Handle login from Auth.jsx ----------
  const handleLogin = () => {
    setLoggedIn(true);
    navigate("/chat", { replace: true });
  };

  // --------- Handle logout ----------
  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedIn(false);
    navigate("/", { replace: true });
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      {!loggedIn ? (
        <Auth onAuth={handleLogin} />
      ) : (
        <>
          <Navbar onLogout={handleLogout} />
          <main className="mx-auto max-w-4xl p-4 sm:p-6">
            <Routes>
              {/* Redirect root to chat if logged in */}
              <Route path="/" element={<Navigate to="/chat" replace />} />

              {/* Protected pages */}
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/save"
                element={
                  <ProtectedRoute>
                    <Save />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <Upload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <Documents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <Search />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/setting"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all 404 */}
              <Route
                path="*"
                element={<div className="text-center text-slate-500">Page Not Found</div>}
              />
            </Routes>
          </main>
        </>
      )}
    </div>
  );
}
