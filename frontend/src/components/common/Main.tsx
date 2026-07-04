import type { PropsWithChildren } from 'react'

function Main({ children }: PropsWithChildren) {
  return <main className="mx-auto w-full max-w-5xl flex-1 px-8">{children}</main>
}

export { Main }
