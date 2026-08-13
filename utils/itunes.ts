import fetch from "isomorphic-unfetch";

export async function getItunesPreviewUrl(track?: string, artist?: string): Promise<string | null> {
  if (!track) return null;

  const term = artist ? `${track} ${artist}` : track;
  const params = new URLSearchParams({ term, media: "music", entity: "song", limit: "1" });

  const response = await fetch(`https://itunes.apple.com/search?${params}`);
  if (!response.ok) return null;

  const data = await response.json();
  return data.results?.[0]?.previewUrl ?? null;
}
