import { VercelRequest, VercelResponse } from "@vercel/node";
import { renderToString } from "react-dom/server";
import { PlayableNowPlaying, PlayableStyles } from "../components/PlayableNowPlaying";
import { nowPlaying, recentlyPlayed } from "../utils/spotify";
import { getItunesPreviewUrl } from "../utils/itunes";

const ALLOWED_THEME_ORIGINS = ["https://www.lasitha.dev", "https://lasitha.dev"];

const FADE_IN_MS = 1200;
const FADE_OUT_LEAD_MS = 1600;

const PLAYER_SCRIPT = `
(function () {
  var audio = document.getElementById("preview-audio");
  var btn = document.getElementById("play-btn");
  if (btn) {
    if (!audio) {
      btn.disabled = true;
    } else {
      var fadingOut = false;
      var fadedIn = false;

      function fade(from, to, duration) {
        var start = null;
        function step(ts) {
          if (audio.paused) return;
          if (start === null) start = ts;
          var t = Math.min((ts - start) / duration, 1);
          audio.volume = from + (to - from) * t;
          if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }

      btn.addEventListener("click", function () {
        if (audio.paused) {
          fadingOut = false;
          fadedIn = false;
          audio.volume = 0;
          audio.play();
          btn.classList.add("playing");
        } else {
          audio.pause();
          btn.classList.remove("playing");
        }
      });

      audio.addEventListener("playing", function () {
        if (fadedIn) return;
        fadedIn = true;
        fade(0, 1, ${FADE_IN_MS});
      });

      audio.addEventListener("timeupdate", function () {
        if (fadingOut || !isFinite(audio.duration)) return;
        var remainingMs = (audio.duration - audio.currentTime) * 1000;
        if (remainingMs <= ${FADE_OUT_LEAD_MS}) {
          fadingOut = true;
          fade(audio.volume, 0, Math.max(remainingMs, 50));
        }
      });

      audio.addEventListener("ended", function () {
        btn.classList.remove("playing");
        fadingOut = false;
        audio.volume = 1;
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
