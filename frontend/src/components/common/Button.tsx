import type { ButtonHTMLAttributes } from "react";

// The app's call-to-action button. Layout concerns (margins, widths) come in
// through className; the visual idiom lives here so every screen matches.
export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`border-2 border-cta bg-cta px-6 py-3.5 text-base font-bold text-white disabled:opacity-60 ${className ?? ""}`.trim()}
    />
  );
}
