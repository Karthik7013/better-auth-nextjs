import { HomeContent } from "./home-content";

export default async function HomePage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-autospace-y-8">
        <HomeContent />
      </div>
    </div>
  );
}
