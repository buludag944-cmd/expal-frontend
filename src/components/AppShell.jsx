import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  Home,
  House,
  Lightbulb,
  LogOut,
  MessageSquare,
  Search,
  Share2,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import AppLogo from "./AppLogo";
import ThemeToggle from "./ThemeToggle";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import { cn } from "../lib/cn";

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/housing", label: "Housing", icon: House },
  { to: "/referrals", label: "Referrals", icon: Share2 },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/essentials", label: "Essentials", icon: BookOpen },
  { to: "/knowhow", label: "Know-How", icon: Lightbulb },
  { to: "/profile", label: "Profile", icon: User },
];

const mobileTabs = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/housing", label: "Housing", icon: House },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/profile", label: "Profile", icon: User },
];

const navIconClass = {
  "/": "icon-ev",
  "/events": "icon-ev",
  "/housing": "icon-ho",
  "/referrals": "icon-rf",
  "/messages": "icon-ms",
  "/essentials": "icon-es",
  "/knowhow": "icon-kh",
  "/profile": "",
};

function navClass({ isActive }) {
  return cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ease-out min-h-[44px]",
    isActive
      ? "bg-surface text-foreground shadow-sm"
      : "text-muted hover:bg-surface hover:text-foreground"
  );
}

const mobileIconClass = {
  "/": "icon-ev",
  "/events": "icon-ev",
  "/housing": "icon-ho",
  "/messages": "icon-ms",
  "/profile": "",
};

function mobileTabClass({ isActive }, to) {
  const accent =
    to === "/housing"
      ? "border-ho text-ho"
      : to === "/messages"
        ? "border-ms text-ms"
        : to === "/events" || to === "/"
          ? "border-ev text-ev"
          : "border-primary text-primary";
  return cn(
    "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition ease-out min-h-[44px]",
    isActive ? `border-t-2 ${accent}` : "text-muted"
  );
}

export default function AppShell({ children, guest = false, guestSubtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
    : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-4 md:h-16 md:px-6">
          <Link to="/" className="font-semibold text-foreground shrink-0" aria-label="EXPal home">
            <AppLogo size={36} showText />
          </Link>
          <p className="hidden flex-1 truncate text-sm text-muted lg:block">
            {guest ? guestSubtitle : `Welcome, ${displayName}`}
          </p>
          <div className="ml-auto flex items-center gap-1">
            {!guest && (
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => navigate("/search")}
                aria-label="Search profiles"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
            <ThemeToggle />
            {!guest && user && (
              <>
                <Link to="/profile" className="hidden sm:block" aria-label="Profile">
                  <Avatar
                    src={user.profileImage}
                    name={displayName}
                    size="sm"
                  />
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} className="hidden md:inline-flex gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-screen-2xl">
        {!guest && (
          <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-card p-4 lg:w-60">
            <nav className="flex flex-col gap-1" aria-label="Main">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={navClass}>
                  <Icon className={cn("h-5 w-5 shrink-0", navIconClass[to])} aria-hidden />
                  {label}
                </NavLink>
              ))}
              <NavLink to="/search" className={navClass}>
                <Users className="h-5 w-5 shrink-0" aria-hidden />
                Search
              </NavLink>
              <NavLink to="/users" className={navClass}>
                <Users className="h-5 w-5 shrink-0" aria-hidden />
                Users
              </NavLink>
            </nav>
          </aside>
        )}

        <main className={cn("flex-1 min-w-0 page-container", !guest && "pb-20 md:pb-8")}>
          {children}
        </main>
      </div>

      {!guest && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card md:hidden"
          aria-label="Mobile"
        >
          {mobileTabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={(state) => mobileTabClass(state, to)}>
              <Icon className={cn("h-5 w-5", mobileIconClass[to])} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
