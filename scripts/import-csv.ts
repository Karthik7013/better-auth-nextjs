import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../src/db";
import { movies, tags, movieTags } from "../src/db/schema";
import { eq, inArray } from "drizzle-orm";
import * as fs from "fs";
import * as readline from "readline";

const CHECKPOINT_FILE = "import-csv-checkpoint.txt";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-]+|[-]+$/g, "")
    .substring(0, 200);
}

function parseGenres(genresStr: string): string[] {
  if (!genresStr || genresStr === "''" || genresStr === '""') return [];
  return genresStr
    .replace(/^["']|["']$/g, "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}

async function ensureTags(genreNames: string[]): Promise<number[]> {
  if (genreNames.length === 0) return [];

  const existing = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(inArray(tags.name, genreNames));

  const existingMap = new Map(existing.map((t) => [t.name, t.id]));

  const missing = genreNames.filter((n) => !existingMap.has(n));

  for (const name of missing) {
    try {
      const [inserted] = await db
        .insert(tags)
        .values({ name })
        .returning({ id: tags.id });
      existingMap.set(name, inserted.id);
    } catch {
      const [found] = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.name, name))
        .limit(1);
      if (found) existingMap.set(name, found.id);
    }
  }

  const tagIds: number[] = [];
  for (const name of genreNames) {
    const id = existingMap.get(name);
    if (id) tagIds.push(id);
  }
  return tagIds;
}

async function movieExists(tmdbId: number): Promise<boolean> {
  const result = await db
    .select({ id: movies.id })
    .from(movies)
    .where(eq(movies.tmdbId, tmdbId))
    .limit(1);
  return result.length > 0;
}

async function generateUniqueSlug(title: string, tmdbId: number): Promise<string> {
  let slug = slugify(title);
  if (!slug) slug = `movie-${tmdbId}`;

  const existing = await db
    .select({ id: movies.id })
    .from(movies)
    .where(eq(movies.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    slug = `${slug}-${tmdbId}`;

    const retry = await db
      .select({ id: movies.id })
      .from(movies)
      .where(eq(movies.slug, slug))
      .limit(1);

    if (retry.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  return slug;
}

async function main() {
  const args = process.argv.slice(2);
  const csvPath = args[0] || "TMDB_movie_dataset_v11.csv";
  const resume = args.includes("--resume");

  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  let startLine = 1;
  if (resume && fs.existsSync(CHECKPOINT_FILE)) {
    startLine = parseInt(fs.readFileSync(CHECKPOINT_FILE, "utf-8").trim(), 10);
    console.log(`Resuming from line ${startLine}`);
  }

  const fileStream = fs.createReadStream(csvPath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  let imported = 0;
  let skipped = 0;
  let batch: MovieInsert[] = [];
  let batchTags: { movieSlug: string; genreNames: string[] }[] = [];

  const startTime = Date.now();

  for await (const line of rl) {
    lineNum++;

    if (lineNum === 1) continue;
    if (lineNum < startLine) continue;

    const cols = parseCsvLine(line);
    if (cols.length < 20) continue;

    const tmdbId = parseInt(cols[0].replace(/^"|"$/g, ""), 10);
    const title = cols[1].replace(/^"|"$/g, "");
    const status = cols[4].replace(/^"|"$/g, "");
    const adult = cols[8].replace(/^"|"$/g, "");
    const runtimeStr = cols[7].replace(/^"|"$/g, "");
    const genresStr = cols[19];
    const backdrop = cols[9].replace(/^"|"$/g, "");
    const poster = cols[17].replace(/^"|"$/g, "");

    if (status !== "Released") { skipped++; continue; }
    if (adult === "True") { skipped++; continue; }

    if (await movieExists(tmdbId)) { skipped++; continue; }

    const overview = cols[15].replace(/^"|"$/g, "").substring(0, 2000) || null;
    const releaseDate = cols[5].replace(/^"|"$/g, "") || null;
    const runtime = parseInt(runtimeStr, 10) || null;
    const lang = cols[13].replace(/^"|"$/g, "") || null;

    let thumbnailUrl: string | null = null;
    if (poster && !poster.startsWith("null") && poster.length > 5) {
      thumbnailUrl = `${TMDB_IMAGE_BASE}/w342${poster}`;
    }

    let backdropUrl: string | null = null;
    if (backdrop && !backdrop.startsWith("null") && backdrop.length > 5) {
      backdropUrl = `${TMDB_IMAGE_BASE}/original${backdrop}`;
    }

    if (!thumbnailUrl) { skipped++; continue; }

    const slug = await generateUniqueSlug(title, tmdbId);

    const genreNames = parseGenres(genresStr);

    batch.push({
      title,
      slug,
      description: overview,
      thumbnailUrl: thumbnailUrl!,
      backdropUrl,
      durationSeconds: runtime ? runtime * 60 : null,
      releaseDate,
      tmdbId,
      originalLanguage: lang,
    });

    batchTags.push({ movieSlug: slug, genreNames });

    if (batch.length >= 50) {
      await flushBatch(batch, batchTags);
      imported += batch.length;
      batch = [];
      batchTags = [];

      fs.writeFileSync(CHECKPOINT_FILE, String(lineNum));

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      process.stdout.write(`\r  Imported: ${imported} | Skipped: ${skipped} | Line: ${lineNum} | Elapsed: ${elapsed}s`);
    }
  }

  if (batch.length > 0) {
    await flushBatch(batch, batchTags);
    imported += batch.length;
    fs.writeFileSync(CHECKPOINT_FILE, String(lineNum));
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n\nDone! Imported: ${imported} | Skipped: ${skipped} | Time: ${totalTime}s`);

  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
  }

  process.exit(0);
}

interface MovieInsert {
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  durationSeconds: number | null;
  releaseDate: string | null;
  tmdbId: number;
  originalLanguage: string | null;
}

async function flushBatch(
  movieBatch: MovieInsert[],
  tagsBatch: { movieSlug: string; genreNames: string[] }[]
) {
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(movies)
      .values(movieBatch)
      .onConflictDoNothing({ target: movies.tmdbId })
      .returning({ id: movies.id, slug: movies.slug, tmdbId: movies.tmdbId });

    for (const { movieSlug, genreNames } of tagsBatch) {
      if (genreNames.length === 0) continue;

      const movieRow = inserted.find((m) => m.slug === movieSlug);
      if (!movieRow) continue;

      const tagIds = await ensureTags(genreNames);

      if (tagIds.length > 0) {
        await tx.insert(movieTags).values(
          tagIds.map((tagId) => ({ movieId: movieRow.id, tagId }))
        ).onConflictDoNothing();
      }
    }
  });
}

main();
