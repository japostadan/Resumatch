import { HomeHowItWorks } from "./HomeHowItWorks";
import { HomeMainContent } from "./HomeMainContent";
import { MainLayout } from "../common/MainLayout";

export function Home() {
  return (
    <MainLayout>
      <div className="grid gap-0 md:grid-cols-[1.7fr_1fr]">
        <HomeMainContent />
        <HomeHowItWorks />
      </div>
    </MainLayout>
  );
}
