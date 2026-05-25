import React from "react";
import { MessageCircle } from "lucide-react";
import Avatar from "./ui/Avatar";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/Card";
import { cn } from "../lib/cn";

/** Responsive list card: avatar, meta, title, body, footer CTA + comments count. */
export default function ListItemCard({
  authorName,
  authorImage,
  dateLabel,
  tag,
  tagVariant = "info",
  title,
  description,
  commentsCount,
  onView,
  viewLabel = "View",
  headerActions,
  children,
  className,
}) {
  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start gap-3 !py-4">
        <Avatar src={authorImage} name={authorName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">{authorName}</p>
              {dateLabel && <p className="text-sm text-muted">{dateLabel}</p>}
            </div>
            <div className="flex items-center gap-2">
              {tag && <Badge variant={tagVariant}>{tag}</Badge>}
              {headerActions}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 !pt-0">
        {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
        {description && <p className="text-sm text-muted leading-relaxed line-clamp-3">{description}</p>}
        {children}
      </CardContent>
      {(commentsCount != null || onView) && (
        <CardFooter className="flex items-center justify-between gap-2 !py-3">
          {commentsCount != null && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <MessageCircle className="h-4 w-4" aria-hidden />
              {commentsCount}
            </span>
          )}
          {onView && (
            <Button variant="secondary" size="sm" onClick={onView}>
              {viewLabel}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
