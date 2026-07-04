import Header from '../common/Header'
import Footer from '../common/Footer'
import SideBar from '../common/SideBar'
import Main from '../common/Main'
import HomeContent from './HomeContent'

export function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <Main>
        <HomeContent />
        <SideBar />
      </Main>

      <Footer />
    </div>
  )
}
