"use client";

import {
  MissionWorkspace,
  useArrivalWorkspace,
  WorkspaceGrid,
  WorkspacePanel,
} from "@/components/ui/mission-workspace";

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
  const [isOpen, setIsOpen] = useArrivalWorkspace(isVisible);

  if (!isVisible) {
    return null;
  }

  return (
    <MissionWorkspace
      accent="103 201 165"
      description="Two training soundtracks, ready without leaving the planet."
      eyebrow="Training audio · Spotify"
      isOpen={isOpen}
      launcherLabel="Listen"
      onOpenChange={setIsOpen}
      status="Daniel's Gym Playlists"
      surfaceId="gym-playlist"
      title="Daniel's Gym Playlists"
    >
      <WorkspaceGrid className="gym-playlist">
        {gymPlaylists.map((playlist) => (
          <WorkspacePanel
            actions={
              <a
                className="gym-playlist__link"
                href={playlist.spotifyUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Spotify <span aria-hidden="true">↗</span>
              </a>
            }
            eyebrow="Playlist"
            key={playlist.id}
            span={6}
            title={playlist.name}
          >
            <iframe
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              className="gym-playlist__embed"
              loading="lazy"
              src={playlist.embedUrl}
              title={`${playlist.name} on Spotify`}
            />
          </WorkspacePanel>
        ))}
      </WorkspaceGrid>
    </MissionWorkspace>
  );
}
