"use client";

const gymPlaylists = [
  {
    id: "primary",
    name: "Gym Playlist I",
    embedUrl:
      "https://open.spotify.com/embed/playlist/1qDWhMGDtEs58cT4sPNVt6?utm_source=generator&theme=0",
    spotifyUrl: "https://open.spotify.com/playlist/1qDWhMGDtEs58cT4sPNVt6",
  },
  {
    id: "secondary",
    name: "Gym Playlist II",
    embedUrl:
      "https://open.spotify.com/embed/playlist/1T8OB5xrKn516Bnf9pqCfl?utm_source=generator&theme=0",
    spotifyUrl: "https://open.spotify.com/playlist/1T8OB5xrKn516Bnf9pqCfl",
  },
] as const;

type GymPlaylistPlayerProps = Readonly<{
  isVisible: boolean;
}>;

export function GymPlaylistPlayer({ isVisible }: GymPlaylistPlayerProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Daniel's gym playlists"
      className="destination-panel destination-panel--workspace gym-playlist"
      data-open="true"
    >
      <header className="destination-panel__summary">
        <div>
          <span>Training audio · Spotify</span>
          <strong>Daniel&apos;s Gym Playlists</strong>
          <p>Two training soundtracks, ready without leaving the planet.</p>
        </div>
      </header>
      <div className="destination-panel__body">
        <div className="gym-playlist__grid">
          {gymPlaylists.map((playlist) => (
            <section className="gym-playlist__item" key={playlist.id}>
              <h2>{playlist.name}</h2>
              <iframe
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                className="gym-playlist__embed"
                loading="lazy"
                src={playlist.embedUrl}
                title={`${playlist.name} on Spotify`}
              />
              <a
                className="destination-panel__link"
                href={playlist.spotifyUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open {playlist.name} in Spotify
                <span aria-hidden="true">↗</span>
              </a>
            </section>
          ))}
        </div>
      </div>
    </aside>
  );
}
