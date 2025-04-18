import TidalAPI, { components } from '@tidal-music/api';
import { Session } from 'express-session';

// Extend the Express Session type to include our custom properties
declare module 'express-session' {
  interface Session {
    spotifyAccessToken?: string;
    spotifyRefreshToken?: string;
    lastSyncResults?: SyncResults;
    tidalPlaylistId?: string;
  }
}

// Sync result types
export interface SyncResults {
  total: number;
  matched: number;
  notFound: number;
  details: SyncResultDetail[];
}
export type SpotifyTrack = {
  id: string;
  name: string;
  artists: {
    id: string;
    name: string;
  }[];
  album: {
    id: string;
    name: string;
  };
}

export interface SyncResultDetail {
  spotifyTrack: SpotifyTrack;
  tidalTrack: TidalTrackSearchResult | null;
  status: 'matched' | 'not_found' | 'error';
  score: number;
  error?: string;
}

// Tidal types
export type TidalApiClient = ReturnType<typeof TidalAPI.createAPIClient>;
export type TidalTrackSearchResult = components["schemas"]["Tracks_Resource"];
export type TidalArtist = components["schemas"]["Artists_Resource"];

export interface TidalTrack {
  id: string;
  title: string;
  artists: {
    id: string;
    name: string;
  }[];
  album: {
    id: string;
    title: string;
  };
}