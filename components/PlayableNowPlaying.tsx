import React from "react";
import Text from "./Text";

export interface PlayableProps {
  cover?: string;
  track: string;
  artist: string;
  progress: number;
  duration: number;
  isPlaying: boolean;
  isLastPlayed?: boolean;
  previewUrl?: string | null;
  spotifyUrl?: string | null;
}

export const PlayableStyles = `
  :root {
    --np-fg: #333333;
    --np-border: #afb8c1;
    --np-cover-fallback-bg: #fff;
    --np-progress-fill: #333333;
    --np-progress-paused: #eee;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --np-fg: #bdbddd;
      --np-border: #7f7f9f;
      --np-cover-fallback-bg: #2a2f4c;
      --np-progress-fill: #bdbddd;
      --np-progress-paused: #404051;
    }
  }

  :root[data-theme="dark"] {
    --np-fg: #bdbddd;
    --np-border: #7f7f9f;
    --np-cover-fallback-bg: #2a2f4c;
    --np-progress-fill: #bdbddd;
    --np-progress-paused: #404051;
  }

  * {
    margin: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    background: transparent;
  }

  body {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Quicksand", sans-serif;
    color: var(--np-fg);
  }

  p {
    color: inherit !important;
    font-family: inherit !important;
  }

  .widget {
    width: 430px;
    max-width: calc(100vw - 32px);
  }

  #spotify-icon {
    width: 20px;
    height: 20px;
    fill: var(--np-fg);
    margin-right: 4px;
    flex-shrink: 0;
  }

  #cover-wrap {
    position: relative;
    width: 48px;
    height: 48px;
    flex-shrink: 0;
  }

  #cover {
    border-radius: 3px;
    display: block;
  }

  #cover:not([src]) {
    background: var(--np-cover-fallback-bg);
    border: 1px solid var(--np-border);
  }

  #play-btn {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    border: none;
    border-radius: 3px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 150ms ease-out;
    padding: 0;
  }

  #cover-wrap:hover #play-btn,
  #play-btn:focus-visible,
  #play-btn.playing {
    opacity: 1;
  }

  #play-btn:disabled {
    cursor: not-allowed;
  }

  #play-btn svg {
    width: 20px;
    height: 20px;
    fill: #ffffff;
  }

  #play-btn .icon-pause {
    display: none;
  }

  #play-btn.playing .icon-play {
    display: none;
  }

  #play-btn.playing .icon-pause {
    display: block;
  }

  .progress-bar {
    position: relative;
    width: 100%;
    max-width: 360px;
    height: 4px;
    margin-top: 4px;
    border: 1px solid var(--np-border);
    border-radius: 4px;
    overflow: hidden;
    padding: 2px;
  }

  #progress {
    position: absolute;
    top: -1px;
    left: 0;
    width: 100%;
    height: 6px;
    transform-origin: left center;
    background-color: var(--np-progress-fill);
    animation-name: progress;
    animation-timing-function: linear;
  }

  #progress.paused {
    background: var(--np-progress-paused);
    animation-play-state: paused !important;
  }

  @keyframes progress {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
  }
`;

export const PlayableNowPlaying: React.FC<PlayableProps> = ({
  cover,
  track,
  artist,
  progress,
  duration,
  isPlaying,
  isLastPlayed,
  previewUrl,
  spotifyUrl,
}) => {
  return (
    <div className="widget">
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", paddingBottom: 2 }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" id="spotify-icon">
          <path
            fillRule="evenodd"
            d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8Z M406.6 231.1c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3zm-31 76.2c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm-26.9 65.6c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4z"
          />
        </svg>
        <Text id="nowplaying">
          {artist
            ? isLastPlayed
              ? "Last song I played..."
              : "The song I'm spinning right now..."
            : "I'm taking a break from music for now. \nIf I'm spinning something, it'll be back up here."}
        </Text>
      </div>
      {artist && (
        <div style={{ display: "flex", alignItems: "center", paddingTop: 8 }}>
          <div id="cover-wrap">
            <img id="cover" src={cover ?? undefined} width="48" height="48" />
            <button id="play-btn" aria-label="Play preview" disabled={!previewUrl}>
              <svg className="icon-play" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <svg className="icon-pause" viewBox="0 0 24 24">
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            </button>
          </div>
          <div style={{ display: "flex", flex: 1, flexDirection: "column", marginLeft: 8, minWidth: 0 }}>
            <Text id="track" weight="bold">
              {spotifyUrl ? (
                <a href={spotifyUrl} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                  {`${track ?? ""} `.trim()}
                </a>
              ) : (
                `${track ?? ""} `.trim()
              )}
            </Text>
            <Text id="artist" color={!track ? "gray" : undefined}>
              {artist}
            </Text>
            {track && (
              <div className="progress-bar">
                <div
                  id="progress"
                  className={!isPlaying ? "paused" : ""}
                  style={{ animationDuration: `${duration}ms`, animationDelay: `-${progress}ms` }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {previewUrl && <audio id="preview-audio" src={previewUrl} preload="none" />}
    </div>
  );
};
