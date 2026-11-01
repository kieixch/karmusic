export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface PlaylistWithTracks {
  playlist: Playlist;
  trackCount: number;
  totalDuration: number;
}
