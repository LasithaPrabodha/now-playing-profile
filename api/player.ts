import { VercelRequest, VercelResponse } from "@vercel/node";
import { renderToString } from "react-dom/server";
import { PlayableNowPlaying, PlayableStyles } from "../components/PlayableNowPlaying";
import { nowPlaying, recentlyPlayed } from "../utils/spotify";
import { getItunesPreviewUrl } from "../utils/itunes";

const ALLOWED_THEME_ORIGINS = ["https://www.lasitha.dev", "https://lasitha.dev"];

const PLAYER_SCRIPT = `
(function () {
  var audio = document.getElementById("preview-audio");
  var btn = document.getElementById("play-btn");
  if (btn) {
    if (!audio) {
      btn.disabled = true;
    } else {
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
    }
  }

  var allowedOrigins = ${JSON.stringify(ALLOWED_THEME_ORIGINS)};
  window.addEventListener("message", function (event) {
    var isAllowed = allowedOrigins.indexOf(event.origin) !== -1 || event.origin.indexOf("http://localhost:") === 0;
    if (!isAllowed) return;
    var theme = event.data && event.data.theme;
    if (theme !== "dark" && theme !== "light") return;
    document.documentElement.setAttribute("data-theme", theme);
  });
})();
`;

export default async function (req: VercelRequest, res: VercelResponse) {
  const {
    item: currentItem = ({} as any),
    is_playing: isPlaying = false,
    progress_ms: progress = 0,
  } = await nowPlaying();

  const isLastPlayed = !currentItem?.name;
  const item = isLastPlayed ? await recentlyPlayed() : currentItem;

  const { name: track, duration_ms: duration, preview_url: spotifyPreviewUrl } = item || {};
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
      progress: isLastPlayed ? 0 : progress,
      duration,
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
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet" />
<style>${PlayableStyles}</style>
</head>
<body>
${body}
<script>${PLAYER_SCRIPT}</script>
</body>
</html>`);
}
