import { db } from "../src/db";
import { movies, tags, movieTags, featuredMovies } from "../src/db/schema";

async function seed() {
  const tagData = await db
    .insert(tags)
    .values([
      { name: "Action" },
      { name: "Sci-Fi" },
      { name: "Drama" },
      { name: "Comedy" },
      { name: "Thriller" },
      { name: "Horror" },
    ])
    .returning();

  const movieData = await db
    .insert(movies)
    .values([
      {
        title: "The Last Frontier",
        slug: "the-last-frontier",
        description:
          "A thrilling journey through uncharted space. When a distress signal is received from the edge of known space, a ragtag crew must embark on a perilous mission that could change the fate of humanity forever.",
        videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumbnailUrl: "https://picsum.photos/seed/frontier/640/360",
        durationSeconds: 596,
        releaseDate: "2025-01-15",
      },
      {
        title: "Cyber City",
        slug: "cyber-city",
        description:
          "In a neon-drenched metropolis, one hacker fights the system. When a mysterious AI begins manipulating the city's infrastructure, only a reclusive programmer can stop it.",
        videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        thumbnailUrl: "https://picsum.photos/seed/cyber/640/360",
        durationSeconds: 653,
        releaseDate: "2025-03-22",
      },
      {
        title: "The Deep Blue",
        slug: "the-deep-blue",
        description:
          "An oceanic expedition discovers something beneath the waves that challenges everything we know about life on Earth.",
        videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumbnailUrl: "https://picsum.photos/seed/deepblue/640/360",
        durationSeconds: 60,
        releaseDate: "2024-11-08",
      },
      {
        title: "Parallel Worlds",
        slug: "parallel-worlds",
        description:
          "A scientist accidentally opens a doorway to an alternate reality where a darker version of herself is hell-bent on crossing over.",
        videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        thumbnailUrl: "https://picsum.photos/seed/parallel/640/360",
        durationSeconds: 60,
        releaseDate: "2025-06-01",
      },
      {
        title: "Midnight Express",
        slug: "midnight-express",
        description:
          "A noir thriller set on the last train out of the city. When a passenger goes missing, a detective must solve the mystery before the train reaches its final destination.",
        videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        thumbnailUrl: "https://picsum.photos/seed/midnight/640/360",
        durationSeconds: 60,
        releaseDate: "2024-09-14",
      },
    ])
    .returning();

  await db.insert(movieTags).values([
    { movieId: movieData[0].id, tagId: tagData[0].id }, // Action
    { movieId: movieData[0].id, tagId: tagData[1].id }, // Sci-Fi
    { movieId: movieData[1].id, tagId: tagData[0].id }, // Action
    { movieId: movieData[1].id, tagId: tagData[1].id }, // Sci-Fi
    { movieId: movieData[2].id, tagId: tagData[2].id }, // Drama
    { movieId: movieData[3].id, tagId: tagData[1].id }, // Sci-Fi
    { movieId: movieData[3].id, tagId: tagData[2].id }, // Drama
    { movieId: movieData[4].id, tagId: tagData[4].id }, // Thriller
  ]);

  await db.insert(featuredMovies).values([
    { movieId: movieData[0].id, displayOrder: 0 },
    { movieId: movieData[1].id, displayOrder: 1 },
    { movieId: movieData[3].id, displayOrder: 2 },
  ]);

  console.log("Seed complete!");
}

seed().catch(console.error);
