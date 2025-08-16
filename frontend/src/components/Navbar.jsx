import React from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-slate-900 text-white p-4 flex justify-between items-center">
      <div className="text-xl font-bold">FastAPI QnA</div>
      <div className="space-x-4">
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `px-3 py-2 rounded-md ${isActive ? "bg-slate-700" : "hover:bg-slate-800"}`
          }
        >
          Chat
        </NavLink>
        <NavLink
          to="/save"
          className={({ isActive }) =>
            `px-3 py-2 rounded-md ${isActive ? "bg-slate-700" : "hover:bg-slate-800"}`
          }
        >
          Save
        </NavLink>
      </div>
    </nav>
  );
}
