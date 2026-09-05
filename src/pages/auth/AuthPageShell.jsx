import React from "react";

/** Centered shell for forgot / reset / verify pages. */
export default function AuthPageShell({ children }) {
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 bg-[#faf8f6]">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
