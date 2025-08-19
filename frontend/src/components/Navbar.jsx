import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  // -------- Dark/Light Mode Effect --------
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const links = [
    { to: "/chat", label: "Chat" },
    { to: "/save", label: "Save" },
    { to: "/upload", label: "Upload" },
    { to: "/documents", label: "Documents" },
    { to: "/search", label: "Search" },
    { to: "/setting", label: "Settings" },
  ];

  return (
    <nav className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white shadow-md transition">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="text-xl font-bold tracking-wide">⚡ FastAPI QnA</div>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-4 items-center">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md transition ${
                    isActive
                      ? "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900"
                      : "hover:bg-slate-800 dark:hover:bg-slate-100 text-slate-300 dark:text-slate-700"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="ml-4 px-3 py-2 rounded-md bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 hover:opacity-80 transition"
            >
              {darkMode ? "🌙 Dark" : "☀️ Light"}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded hover:bg-slate-800 dark:hover:bg-slate-200 focus:outline-none"
          >
            {open ? "✖" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="md:hidden bg-slate-800 dark:bg-slate-100 px-4 pb-3 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md ${
                  isActive
                    ? "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900"
                    : "hover:bg-slate-700 dark:hover:bg-slate-200 text-slate-300 dark:text-slate-700"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <button
            onClick={() => {
              setDarkMode(!darkMode);
              setOpen(false);
            }}
            className="w-full px-3 py-2 rounded-md bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900 hover:opacity-80 transition"
          >
            {darkMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      )}
    </nav>
  );
}
