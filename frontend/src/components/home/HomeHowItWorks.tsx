type Step = {
  title: string;
  detail: string;
};

const STEPS: Step[] = [
  {
    title: "Open or join a game",
    detail: "A host starts a game; everyone else joins with the Game ID and password.",
  },
  {
    title: "Submit your statement",
    detail: "Every player writes one real line from their CV personal statement.",
  },
  {
    title: "Guess who wrote it",
    detail: "The room reads each statement anonymously and votes on its author.",
  },
  {
    title: "See your results",
    detail: "Verdicts are revealed, and each player gets a takeaway for their next CV edit.",
  },
];

function HomeHowItWorks() {
  return (
    <aside className="py-12 md:pl-12">
      <div className="flex items-baseline justify-between border-b-2 border-line pb-3.5 text-xs font-bold tracking-widest text-muted uppercase">
        <span>How it works</span>
        <span className="text-ink">{STEPS.length} steps</span>
      </div>
      <ol>
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="grid grid-cols-[auto_1fr] items-start gap-3.5 border-b border-hair py-4"
          >
            <span className="grid size-6 place-items-center rounded-full bg-violet text-sm font-bold text-canvas">
              {index + 1}
            </span>
            <span>
              <span className="block font-bold">{step.title}</span>
              <span className="mt-0.5 block text-sm leading-snug text-muted">{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

export { HomeHowItWorks };
