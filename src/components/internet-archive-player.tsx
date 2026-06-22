"use client";

const BASE_PATH = "streamflix-s3-media/movies/test-movie/";

interface InternetArchivePlayerProps {
  identifier: string
  className?: string
}

export function InternetArchivePlayer({ identifier, className }: InternetArchivePlayerProps) {
  if (!identifier) return null;

  const filename = identifier.split("/").pop();
  const embedSrc = `https://archive.org/embed/${BASE_PATH}${filename}?autoplay=1`;

  return (
    <iframe
      src={embedSrc}
      className={`${className} border-0`}
      allowFullScreen
      allow="autoplay; fullscreen"
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  )
}
