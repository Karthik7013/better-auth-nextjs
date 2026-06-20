import FeaturedMovies from "./featured-movies";
import WatchMovies from "./watch-movies";
import RecentMovies from "./recent-movies";

export function HomeContent() {
  return (
    <>
      <section className="pb-6">
        <FeaturedMovies />
      </section>
      <WatchMovies />
      <RecentMovies />
    </>
  );
}
