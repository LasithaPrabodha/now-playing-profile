import fetch from "isomorphic-unfetch";
import { stringify } from "querystring";

const {
  SPOTIFY_CLIENT_ID: client_id,
  SPOTIFY_CLIENT_SECRET: client_secret,
  SPOTIFY_REFRESH_TOKEN: refresh_token,
} = process.env;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");
const Authorization = `Basic ${basic}`;
const BASE_URL = `https://api.spotify.com/v1`;

async function getAuthorizationToken() {
  const url = new URL("https://accounts.spotify.com/api/token");
  const body = stringify({
    grant_type: "refresh_token",
    refresh_token,
  });
  const response = await fetch(`${url}`, {
    method: "POST",
    headers: {
      Authorization,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  }).then((r) => r.json());

  if (!response.access_token) {
    console.error("Spotify token refresh failed:", JSON.stringify(response));
  }
  return `Bearer ${response.access_token}`;
}

const NOW_PLAYING_ENDPOINTS = [`/me/player`, `/me/player/currently-playing`];
export async function nowPlaying(): Promise<Partial<SpotifyApi.CurrentlyPlayingResponse>> {
  const Authorization = await getAuthorizationToken();
  for (const endpoint of NOW_PLAYING_ENDPOINTS) {
    const response = await fetch(`${BASE_URL}${endpoint}?additional_types=track,episode`, {
      headers: {
        Authorization,
      },
    });
    const { status } = response;

    if (status === 200) {
      const data = await response.json();
      if (data?.item) return data;
    } else if (status !== 204) {
      console.error(`Spotify ${endpoint} returned ${status}:`, await response.text());
    }
  }
  return {};
}

const RECENTLY_PLAYED_ENDPOINT = `/me/player/recently-played`;
export async function recentlyPlayed(): Promise<SpotifyApi.TrackObjectFull | null> {
  const Authorization = await getAuthorizationToken();
  const response = await fetch(`${BASE_URL}${RECENTLY_PLAYED_ENDPOINT}?limit=1`, {
    headers: { Authorization },
  });
  if (response.status !== 200) {
    console.error(`Spotify recently-played returned ${response.status}:`, await response.text());
    return null;
  }
  const data = await response.json() as SpotifyApi.UsersRecentlyPlayedTracksResponse;
  const track = data.items?.[0]?.track;
  if (!track) return null;

  // Fetch full track to get album art and preview_url
  const fullResponse = await fetch(`${BASE_URL}/tracks/${track.id}`, {
    headers: { Authorization },
  });
  if (fullResponse.status !== 200) return null;
  return fullResponse.json() as Promise<SpotifyApi.TrackObjectFull>;
}

const TOP_TRACKS_ENDPOINT = `/me/top/tracks`;
export async function topTrack({ index, timeRange = 'short_term' }: { index: number, timeRange?: 'long_term'|'medium_term'|'short_term' }): Promise<SpotifyApi.TrackObjectFull | null> {
  const Authorization = await getAuthorizationToken();
  const params = new URLSearchParams();
  params.set('limit', '1');
  params.set('offset', `${index}`);
  params.set('time_range', `${timeRange}`);
  const response = await fetch(`${BASE_URL}${TOP_TRACKS_ENDPOINT}?${params}`, {
    headers: {
      Authorization
    },
  });
  const { status } = response;
  if (status === 204) {
    return null;
  } else if (status === 200) {
    const data = await response.json() as SpotifyApi.UsersTopTracksResponse;
    return data.items[0];
  }
}
