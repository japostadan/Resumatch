import type { ButtonHTMLAttributes } from "react";

// The app's call-to-action button. Layout concerns (margins, widths) come in
// through className; the visual idiom lives here so every screen matches.
export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`shape-cut border-2 border-cta bg-cta px-6 py-3.5 text-base font-bold text-white transition duration-150 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:brightness-95 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:brightness-100 ${className ?? ""}`.trim()}
    />
  );
}
