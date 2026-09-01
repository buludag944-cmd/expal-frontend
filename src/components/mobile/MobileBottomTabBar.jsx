import React from "react";
import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", label: "Home", icon: "🏠", end: true },
  { to: "/explore", label: "Explore", icon: "🧭" },
  { to: "/community", label: "Community", icon: "👥" },
  { to: "/journey", label: "Journey", icon: "🪪" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function MobileBottomTabBar() {
  return (
    <nav className="mob-tab-bar" aria-label="Main">
      {TABS.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `mob-tab-item${isActive ? " mob-tab-item--active" : ""}`}
        >
          <span className="mob-tab-icon" aria-hidden>
            {icon}
          </span>
          <span className="mob-tab-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
