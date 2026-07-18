import { HomeHowItWorks } from "./HomeHowItWorks";
import { HomeMainContent } from "./HomeMainContent";
import { MainLayout } from "../common/MainLayout";

export function Home() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl">
        <HomeMainContent />
        <HomeHowItWorks />
      </div>
    </MainLayout>
  );
}
