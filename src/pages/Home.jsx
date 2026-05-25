import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  House,
  Lightbulb,
  MessageSquare,
  Share2,
  User,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";

const features = [
  { to: "/events", title: "Events", desc: "Discover and join gatherings near you.", icon: Calendar, iconClass: "icon-ev", tint: "bg-[color-mix(in_oklab,var(--ev-tint)_45%,transparent)]" },
  { to: "/housing", title: "Housing", desc: "Listings and tips for settling in.", icon: House, iconClass: "icon-ho", tint: "bg-[color-mix(in_oklab,var(--ho-tint)_45%,transparent)]" },
  { to: "/referrals", title: "Referrals", desc: "Ask the community for referrals.", icon: Share2, iconClass: "icon-rf", tint: "bg-[color-mix(in_oklab,var(--rf-tint)_45%,transparent)]" },
  { to: "/essentials", title: "Expat Essentials", desc: "Practical guides: visa, tax, banking, and more.", icon: BookOpen, iconClass: "icon-es", tint: "bg-[color-mix(in_oklab,var(--es-tint)_45%,transparent)]" },
  { to: "/knowhow", title: "Local Know-How", desc: "Everyday tips and local Q&A.", icon: Lightbulb, iconClass: "icon-kh", tint: "bg-[color-mix(in_oklab,var(--kh-tint)_45%,transparent)]" },
  { to: "/messages", title: "Messages", desc: "Chat with members you've connected with.", icon: MessageSquare, iconClass: "icon-ms", tint: "bg-[color-mix(in_oklab,var(--ms-tint)_45%,transparent)]" },
  { to: "/profile", title: "Profile", desc: "Update your story and interests.", icon: User, iconClass: "text-muted", tint: "bg-surface" },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="max-w-3xl">
        <h1 className="page-title">Welcome to EXPal</h1>
        <p className="page-lead">
          Your friend away from home — find community, housing, events, and messages in one place.
        </p>
      </section>

      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        role="navigation"
        aria-label="Feature shortcuts"
      >
        {features.map(({ to, title, desc, icon: Icon, iconClass, tint }) => (
          <Link key={to} to={to} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
            <Card className="h-full transition ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg group-focus-visible:shadow-lg">
              <CardContent className="flex flex-col gap-3 pt-6">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${tint}`}>
                  <Icon className={`h-6 w-6 ${iconClass}`} aria-hidden />
                </span>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <p className="text-sm text-muted">
        Looking for someone specific?{" "}
        <Link to="/search" className="font-medium text-primary underline-offset-2 hover:underline">
          Search Profiles
        </Link>
      </p>
    </div>
  );
}
