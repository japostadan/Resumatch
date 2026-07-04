import type { PropsWithChildren } from 'react'

function Main({ children }: PropsWithChildren) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-8">
      <div className="grid gap-0 md:grid-cols-[1.7fr_1fr]">{children}</div>
    </main>
  )
}

export default Main
