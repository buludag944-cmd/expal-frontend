import React from "react";

export default function MobilePageHeader({ title, subtitle, action }) {
  return (
    <header className="mob-page-header">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="mob-page-sub">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
