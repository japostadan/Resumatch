type StageStatus = 'Done' | 'Up next' | 'Later'

type Stage = {
  name: string
  detail: string
  status: StageStatus
}

const STAGES: Stage[] = [
  {
    name: 'Game engine',
    detail: 'Rules, scoring and the full game state machine — built and tested.',
    status: 'Done',
  },
  {
    name: 'Game API',
    detail: 'The bridge between the game engine and your browser.',
    status: 'Up next',
  },
  {
    name: 'Game screens',
    detail: "Create, join, lobby, voting and results — what you'll actually play.",
    status: 'Later',
  },
]

const REPO_URL = 'https://github.com/japostadan/Resumatch'

const stagePill: Record<StageStatus, string> = {
  Done: 'text-distinctive border-distinctive/40 bg-distinctive/10',
  'Up next': 'text-status border-status/45 bg-status/15',
  Later: 'text-muted border-line bg-muted/10',
}

const stageTick: Record<StageStatus, string> = {
  Done: 'bg-distinctive text-canvas',
  'Up next': 'bg-status text-canvas',
  Later: 'border border-line text-muted',
}

const stageMark: Record<StageStatus, string> = {
  Done: '✓',
  'Up next': '•',
  Later: '',
}

export function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-2 border-line">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-8 py-4">
          <span className="flex items-center gap-2.5 text-sm font-bold tracking-wide uppercase">
            <span className="size-4 -rotate-6 bg-violet" />
            Resumatch
          </span>
          <span className="ml-auto flex items-center gap-2 text-xs text-muted">
            <span className="size-2 rounded-full bg-status" />
            v0.1 · in development
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-8">
        <div className="grid gap-0 md:grid-cols-[1.7fr_1fr]">
          <section className="py-12 md:border-r md:border-hair md:pr-14">
            <p className="mb-6 text-xs font-bold tracking-[0.14em] text-violet uppercase">
              The CV matching game — built at MigraCode
            </p>
            <h1 className="font-display text-5xl leading-[0.98] font-black tracking-tight md:text-[4.3rem]">
              How <em className="text-violet italic">personal</em> is your personal statement?
            </h1>
            <p className="mt-7 max-w-[42ch] text-lg leading-relaxed text-muted">
              A trainer starts a game. Everyone drops in their CV personal statement. Then the room
              reads them one by one — anonymously — and votes on whose is whose. Guessed correctly,
              yours is <span className="font-bold text-distinctive">Distinctive</span>. Nobody could
              place it? <span className="font-bold text-generic">Generic</span>.
            </p>

            <div className="mt-10 flex flex-wrap gap-3.5">
              <button
                type="button"
                disabled
                className="cursor-not-allowed border-2 border-cta bg-cta px-6 py-3.5 text-base font-bold text-white opacity-60"
              >
                <span className="text-xs font-bold tracking-wider uppercase opacity-70">Host</span>{' '}
                Create a game
              </button>
              <button
                type="button"
                disabled
                className="cursor-not-allowed border-2 border-line px-6 py-3.5 text-base font-bold text-ink opacity-60"
              >
                <span className="text-xs font-bold tracking-wider uppercase opacity-70">
                  Player
                </span>{' '}
                Join a game
              </button>
            </div>
            <p className="mt-4 text-sm text-muted">
              Both open once the screens are built — follow along on the right.
            </p>
          </section>

          <aside className="py-12 md:pl-12">
            <div className="flex items-baseline justify-between border-b-2 border-line pb-3.5 text-xs font-bold tracking-widest text-muted uppercase">
              <span>Development status</span>
              <span className="text-ink">3 stages</span>
            </div>
            <ul>
              {STAGES.map((stage) => (
                <li
                  key={stage.name}
                  className="grid grid-cols-[auto_1fr] items-start gap-3.5 border-b border-hair py-4"
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full text-sm font-bold ${stageTick[stage.status]}`}
                  >
                    {stageMark[stage.status]}
                  </span>
                  <span>
                    <span className="block font-bold">{stage.name}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-muted">
                      {stage.detail}
                    </span>
                    <span
                      className={`mt-2.5 inline-block rounded-full border px-2.5 py-1 text-[0.68rem] font-bold tracking-wider uppercase ${stagePill[stage.status]}`}
                    >
                      {stage.status}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>

      <footer className="border-t-2 border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap justify-between gap-2 px-8 py-5 text-sm text-muted">
          <span>A MigraCode final project · built in the open</span>
          <a
            href={REPO_URL}
            className="font-bold text-ink underline decoration-violet decoration-2"
          >
            github.com/japostadan/Resumatch
          </a>
        </div>
      </footer>
    </div>
  )
}
