// Errors render in amber, not red: CONTEXT.md reserves green/red for verdicts
// and build status, and a red error beside the reveal would read as "Generic".
export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-5 text-sm font-bold text-status">
      {children}
    </p>
  );
}
