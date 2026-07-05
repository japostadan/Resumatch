const REPO_URL = "https://github.com/japostadan/Resumatch";

function Footer() {
  return (
    <footer className="border-t-2 border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap justify-between gap-2 px-8 py-5 text-sm text-muted">
        <span>A MigraCode final project · built in the open</span>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-ink underline decoration-violet decoration-2"
        >
          View the project on GitHub
        </a>
      </div>
    </footer>
  );
}

export { Footer };
