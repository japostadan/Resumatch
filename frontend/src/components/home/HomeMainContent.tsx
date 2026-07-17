import { LogoMark } from "../common/motifs";

function HomeMainContent() {
  return (
    <section className="py-7 text-center">
      <LogoMark className="glow mx-auto mb-4 h-10 w-10 text-violet" />
      <p className="mb-6 text-xs font-bold tracking-[0.14em] text-violet uppercase">
        The CV matching game — built at MigraCode
      </p>
      <h1 className="font-display text-4xl leading-[1.02] font-black tracking-tight md:text-5xl">
        How <em className="text-violet italic">personal</em> is your personal statement?
      </h1>
      <p className="mx-auto mt-5 max-w-[42ch] text-lg leading-relaxed text-muted">
        A trainer starts a game. Everyone drops in their CV personal statement. Then the room reads
        them one by one — anonymously — and votes on whose is whose. Guessed correctly, yours is{" "}
        <span className="font-bold text-distinctive">Distinctive</span>. Nobody could place it?{" "}
        <span className="font-bold text-generic">Generic</span>.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3.5">
        <a
          href="/host"
          className="shape-cut border-2 border-cta bg-cta px-6 py-3.5 text-base font-bold text-white transition duration-150 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:brightness-95"
        >
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">Host</span> Create
          a game
        </a>
        <a
          href="/join"
          className="shape-cut border-2 border-line px-6 py-3.5 text-base font-bold text-ink transition duration-150 hover:-translate-y-0.5 hover:border-violet hover:bg-surface active:translate-y-0"
        >
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">Player</span> Join
          a game
        </a>
      </div>
    </section>
  );
}

export { HomeMainContent };
