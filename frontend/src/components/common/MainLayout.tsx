import { Header } from "../common/Header";
import { Main } from "../common/Main";
import { Footer } from "../common/Footer";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Main>{children}</Main>
      <Footer />
    </div>
  );
}
