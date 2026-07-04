function HomeContent() {
  return (
    <section className="py-12 md:border-r md:border-hair md:pr-14">
      <p className="mb-6 text-xs font-bold tracking-[0.14em] text-violet uppercase">
        The CV matching game — built at MigraCode
      </p>
      <h1 className="font-display text-5xl leading-[0.98] font-black tracking-tight md:text-[4.3rem]">
        How <em className="text-violet italic">personal</em> is your personal statement?
      </h1>
      <p className="mt-7 max-w-[42ch] text-lg leading-relaxed text-muted">
        A trainer starts a game. Everyone drops in their CV personal statement. Then the room reads
        them one by one — anonymously — and votes on whose is whose. Guessed correctly, yours is{' '}
        <span className="font-bold text-distinctive">Distinctive</span>. Nobody could place it?{' '}
        <span className="font-bold text-generic">Generic</span>.
      </p>

      <div className="mt-10 flex flex-wrap gap-3.5">
        <button
          type="button"
          disabled
          className="cursor-not-allowed border-2 border-cta bg-cta px-6 py-3.5 text-base font-bold text-white opacity-60"
        >
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">Host</span> Create
          a game
        </button>
        <button
          type="button"
          disabled
          className="cursor-not-allowed border-2 border-line px-6 py-3.5 text-base font-bold text-ink opacity-60"
        >
          <span className="text-xs font-bold tracking-wider uppercase opacity-70">Player</span> Join
          a game
        </button>
      </div>
      <p className="mt-4 text-sm text-muted">
        Both open once the screens are built — follow along on the right.
      </p>
    </section>
  )
}

export default HomeContent
