import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token"); // simple token check

  if (!token) {
    return <Navigate to="/" replace />; // Redirect to login if not logged in
  }

  return children;
}
