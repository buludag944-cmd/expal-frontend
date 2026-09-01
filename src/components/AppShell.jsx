import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  Compass,
  Home,
  LogOut,
  Map,
  MessageSquare,
  Search,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import AppLogo from "./AppLogo";
import ThemeToggle from "./ThemeToggle";
import AiChatWidget from "./AiChatWidget";
import Avatar from "./ui/Avatar";
import { isNativeApp, getNativePlatform } from "../lib/platform";
import { useNativeFormFactor } from "../hooks/useNativeFormFactor";
import MobileBottomTabBar from "./mobile/MobileBottomTabBar";
import { useRouteSwipe } from "../hooks/useSwipeNav";
import Walkthrough from "./Walkthrough";
import "../styles/mobile-app.css";

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/community", label: "Community", icon: Users },
  { to: "/journey", label: "Journey", icon: Map },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Alerts", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

const mobileTabs = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/community", label: "Community", icon: Users },
  { to: "/journey", label: "Journey", icon: Map },
  { to: "/profile", label: "Profile", icon: User },
];

function SidebarLink({ to, end, label, icon: Icon }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => (isActive ? "active" : undefined)}>
      <Icon className="h-5 w-5 shrink-0" style={{ color: "var(--ev-accent)" }} aria-hidden />
      {label}
    </NavLink>
  );
}

function MobileNavLink({ to, end, label, icon: Icon }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => (isActive ? "active" : undefined)}>
      <span className="nav-icon-wrap">
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </span>
      <span className="nav-label">{label}</span>
    </NavLink>
  );
}

/** Main tab pages: edge-only swipe between bottom tabs (see useRouteSwipe). */
function NativeShell({ children }) {
  const { user } = useAuth();
  const { onTouchStart, onTouchMove, onTouchEnd } = useRouteSwipe();
  const platform = getNativePlatform();
  const formFactor = useNativeFormFactor();
  const shellClass = [
    "mob-app",
    "mob-shell",
    platform === "ios" ? "mob-platform-ios" : "",
    platform === "android" ? "mob-platform-android" : "",
    formFactor === "tablet" ? "mob-form-factor-tablet" : "mob-form-factor-phone",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={shellClass}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <main className="mob-main">
        <div className="mob-route-root">{children}</div>
      </main>
      <MobileBottomTabBar />
      <AiChatWidget />
      <Walkthrough enabled={!!user?.onboardingComplete} />
    </div>
  );
}

export default function AppShell({ children, guest = false, guestSubtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const native = isNativeApp();
  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
    : "";

  if (native && !guest) {
    return <NativeShell>{children}</NativeShell>;
  }

  return (
    <div className="min-h-screen expal-screen">
      <header className="expal-header sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
        <div className="relative z-10 mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-5 py-4 md:px-6">
          <Link to="/" className="logo flex items-center gap-2.5 shrink-0 no-underline text-white" aria-label="Expal home">
            <AppLogo size={44} variant="header" />
            <div>
              <h1 className="font-display text-[22px] font-bold m-0 leading-tight tracking-tight">Expal</h1>
              <div className="expal-motto">
                {guest ? guestSubtitle || "Your friend away from home" : "Your friend away from home"}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            {!guest && (
              <button
                type="button"
                onClick={() => navigate("/search")}
                className="hidden md:inline-flex h-11 w-11 items-center justify-center rounded-xl text-white/90 hover:bg-white/15"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
            <ThemeToggle onHeader mode="cycle" />
            {!guest && user && (
              <>
                <Link
                  to="/notifications"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white/90 hover:bg-white/15"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </Link>
                <Link to="/profile" className="hidden sm:block rounded-full ring-2 ring-white/30" aria-label="Profile">
                  <Avatar src={user.profileImage} name={displayName} size="sm" />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-xl px-2.5 md:px-3 py-2 text-sm font-medium text-white/95 hover:bg-white/15 min-h-[44px] min-w-[44px] font-display justify-center"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-screen-2xl">
        {!guest && (
          <aside className="expal-sidebar" aria-label="Main">
            <nav className="flex flex-col gap-1">
              {navItems.map(({ to, label, icon, end }) => (
                <SidebarLink key={to} to={to} end={end} label={label} icon={icon} />
              ))}
            </nav>
          </aside>
        )}

        <main className="flex-1 min-w-0 page-container">{children}</main>
      </div>

      {!guest && (
        <nav className="expal-bottom-nav md:hidden" aria-label="Mobile">
          {mobileTabs.map(({ to, label, icon, end }) => (
            <MobileNavLink key={to} to={to} end={end} label={label} icon={icon} />
          ))}
        </nav>
      )}

      {!guest && <AiChatWidget />}
      {!guest && <Walkthrough enabled={!!user?.onboardingComplete} />}
    </div>
  );
}
