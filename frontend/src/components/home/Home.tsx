import { Header } from '../common/Header'
import { Footer } from '../common/Footer'
import { HomeDevelopmentStatus } from './HomeDevelopmentStatus'
import { Main } from '../common/Main'
import { HomeMainContent } from './HomeMainContent'

export function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <Main>
        <div className="grid gap-0 md:grid-cols-[1.7fr_1fr]">
          <HomeMainContent />
          <HomeDevelopmentStatus />
        </div>
      </Main>

      <Footer />
    </div>
  )
}
