// Content container for results screens that live inside MainLayout. Unlike
// Shell it does not force a viewport height (the chrome already fills the
// screen) and it allows a wider column so the projected reveal is readable.
export function ResultsPane({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl py-10">{children}</div>;
}
