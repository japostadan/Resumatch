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

function HomeDevelopmentStatus() {
  return (
    <aside className="py-12 md:pl-12">
      <div className="flex items-baseline justify-between border-b-2 border-line pb-3.5 text-xs font-bold tracking-widest text-muted uppercase">
        <span>Development status</span>
        <span className="text-ink">{STAGES.length} stages</span>
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
              <span className="mt-0.5 block text-sm leading-snug text-muted">{stage.detail}</span>
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
  )
}

export { HomeDevelopmentStatus }
