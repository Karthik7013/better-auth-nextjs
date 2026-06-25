CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_movies_title_trgm ON movies USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_movie_tags_movie_id ON movie_tags (movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_tags_tag_id_movie_id ON movie_tags (tag_id, movie_id);
