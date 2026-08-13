import { VercelRequest, VercelResponse } from "@vercel/node";
import { renderToString } from "react-dom/server";
import { PlayableNowPlaying, PlayableStyles } from "../components/PlayableNowPlaying";
import { nowPlaying, recentlyPlayed } from "../utils/spotify";
import { getItunesPreviewUrl } from "../utils/itunes";

const PLAYER_SCRIPT = `
(function () {
  var audio = document.getElementById("preview-audio");
  var btn = document.getElementById("play-btn");
  if (!btn) return;
  if (!audio) {
    btn.disabled = true;
    return;
  }
  btn.addEventListener("click", function () {
    if (audio.paused) {
      audio.play();
      btn.classList.add("playing");
    } else {
      audio.pause();
      btn.classList.remove("playing");
    }
  });
  audio.addEventListener("ended", function () {
    btn.classList.remove("playing");
  });
})();
`;

export default async function (req: VercelRequest, res: VercelResponse) {
  const {
    item: currentItem = ({} as any),
    is_playing: isPlaying = false,
  } = await nowPlaying();

  const isLastPlayed = !currentItem?.name;
  const item = isLastPlayed ? await recentlyPlayed() : currentItem;

  const { name: track, preview_url: spotifyPreviewUrl } = item || {};
  const { images = [] } = item?.album || {};
  const cover = images[images.length - 1]?.url ?? null;
  const artist = (item?.artists || []).map(({ name }) => name).join(", ");
  const spotifyUrl = item?.external_urls?.spotify ?? null;

  const previewUrl = spotifyPreviewUrl || (await getItunesPreviewUrl(track, artist));

  const requestedTheme = req.query?.theme;
  const theme = requestedTheme === "dark" || requestedTheme === "light" ? requestedTheme : null;

  const body = renderToString(
    PlayableNowPlaying({
      cover,
      artist,
      track,
      isPlaying: !isLastPlayed && isPlaying,
      progress: 0,
      duration: 0,
      isLastPlayed,
      previewUrl,
      spotifyUrl,
    })
  );

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(`<!DOCTYPE html>
<html lang="en"${theme ? ` data-theme="${theme}"` : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Now Playing</title>
<style>${PlayableStyles}</style>
</head>
<body>
${body}
<script>${PLAYER_SCRIPT}</script>
</body>
</html>`);
}
