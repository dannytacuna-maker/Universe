"use client";

const spotifyEmbedUrl =
  "https://open.spotify.com/embed/playlist/1qDWhMGDtEs58cT4sPNVt6?utm_source=generator&theme=0";
const spotifyPlaylistUrl =
  "https://open.spotify.com/playlist/1qDWhMGDtEs58cT4sPNVt6";

type GymPlaylistPlayerProps = Readonly<{
  isVisible: boolean;
}>;

export function GymPlaylistPlayer({ isVisible }: GymPlaylistPlayerProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Daniel's gym playlist"
      className="destination-panel gym-playlist"
      data-open="true"
    >
      <header className="destination-panel__summary">
        <div>
          <span>Training audio · Spotify</span>
          <strong>Daniel&apos;s Gym Playlist</strong>
          <p>Music stays separate from programming and progress records.</p>
        </div>
      </header>
      <div className="destination-panel__body">
        <iframe
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          className="gym-playlist__embed"
          loading="lazy"
          src={spotifyEmbedUrl}
          title="Daniel's Spotify gym playlist"
        />
        <a
          className="destination-panel__link"
          href={spotifyPlaylistUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Open in Spotify
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </aside>
  );
}
