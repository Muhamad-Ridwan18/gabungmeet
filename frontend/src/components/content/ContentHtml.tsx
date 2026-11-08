"use client";

import { cn } from "@/lib/utils";

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

type Props = {
  html: string;
  className?: string;
};

/** Renders rich-text HTML from the admin editor, with plain-text fallback. */
export function ContentHtml({ html, className }: Props) {
  if (!html.trim()) return null;

  if (!looksLikeHtml(html)) {
    return (
      <article
        className={cn(
          "whitespace-pre-wrap rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm leading-7 sm:p-8",
          className,
        )}
      >
        {html}
      </article>
    );
  }

  return (
    <article
      className={cn(
        "content-html rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm leading-7 sm:p-8",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
