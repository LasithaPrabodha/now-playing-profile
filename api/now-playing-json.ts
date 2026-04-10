import { VercelRequest, VercelResponse } from "@vercel/node";
import { nowPlaying, recentlyPlayed } from "../utils/spotify";

export default async function (req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  const {
    item = ({} as any),
    is_playing: isPlaying = false,
    progress_ms: progress = 0,
  } = await nowPlaying();

  if (item?.name) {
    const { duration_ms: duration, name: track, preview_url: previewUrl } = item;
    const { images = [] } = item.album || {};
    const cover = images[images.length - 1]?.url;
    const artist = (item.artists || []).map(({ name }) => name).join(", ");
    const spotifyUrl = item.external_urls?.spotify ?? null;

    return res.status(200).json({
      isPlaying,
      track,
      artist,
      cover,
      duration,
      progress,
      previewUrl,
      spotifyUrl,
    });
  }

  // Nothing playing — fall back to last played track
  const last = await recentlyPlayed();
  if (!last) {
    return res.status(200).json({ isPlaying: false });
  }

  const { duration_ms: duration, name: track, preview_url: previewUrl } = last;
  const { images = [] } = last.album || {};
  const cover = images[images.length - 1]?.url ?? null;
  const artist = (last.artists || []).map(({ name }) => name).join(", ");
  const spotifyUrl = last.external_urls?.spotify ?? null;

  return res.status(200).json({
    isPlaying: false,
    track,
    artist,
    cover,
    duration,
    progress: 0,
    previewUrl,
    spotifyUrl,
  });
}
