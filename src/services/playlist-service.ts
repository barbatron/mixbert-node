import { components } from '@tidal-music/api';
import { createSpotifyApi, createTidalApi } from './auth-service';
import { SpotifyTrack, TidalApiClient, TidalTrackSearchResult } from "../types";

/**
 * Fetches all tracks from a Spotify playlist
 */
export const getSpotifyPlaylistTracks = async (
  playlistId: string,
  accessToken: string,
  refreshToken: string
): Promise<SpotifyTrack[]> => {
  const spotifyApi = createSpotifyApi(accessToken, refreshToken);

  let tracks: SpotifyTrack[] = [];
  let offset = 0;
  const limit = 100;
  let hasMoreTracks = true;

  while (hasMoreTracks) {
    const tracksData = await spotifyApi.getPlaylistTracks(playlistId, {
      offset,
      limit,
    });
    const fetchedTracks = tracksData.body.items
      .filter((item) => item.track) // Filter out null tracks
      .map((item) => item.track) as SpotifyTrack[];

    tracks = [...tracks, ...fetchedTracks];

    if (tracksData.body.next) {
      offset += limit;
    } else {
      hasMoreTracks = false;
    }
  }

  return tracks;
};

/**
 * Create a playlist on Tidal
 */
export const createTidalPlaylist = async (
  tidalApi: TidalApiClient,
  title: string,
  description: string
): Promise<components["schemas"]["Playlists_Single_Data_Document"]> => {
  const response = await tidalApi.POST("/playlists", {
    params: { query: { countryCode: "SE", locale: "en-US" } },
    body: {
      data: {
        type: "playlists",
        attributes: {
          name: title,
          description: description,
          privacy: "PUBLIC",
        },
      },
    },
  });

  if (response.error)
    throw Error(`Error creating Tidal playlist: ${response.error}`);
  if (!response.data)
    throw Error(`Error creating Tidal playlist: No data returned`);
  return response.data;
};

/**
 * Calculates a match score between a Spotify track and a Tidal track
 * Higher score means better match
 */
export const calculateMatchScore = (spotifyTrack: SpotifyApi.PlaylistTrackObject, tidalTrack: TidalTrackSearchResult): number => {
  console.log("Calculating match score for:", {spotifyTrack, tidalTrack});
  let score = 0;
  
  // Title match (weighted heavily)
  const spotifyTitle = spotifyTrack.track?.name || '';
  const tidalTitle = tidalTrack.attributes?.title || '';
  if (tidalTitle.toLowerCase() === spotifyTitle.toLowerCase()) {
    score += 100;
    console.log("Exact title match found", { score });
  } else if (tidalTitle.toLowerCase().includes(spotifyTitle.toLowerCase()) ||
    spotifyTitle.toLowerCase().includes(tidalTitle.toLowerCase())) {
    score += 50;
    console.log("Substring title match", { score });
  }
  
  // Artist match  
  const spotifyArtists = spotifyTrack.track?.artists?.map((a => a.name.toLowerCase())) ?? [];
  
  // @ts-ignore Solve this when we see dat in logs
  const tidalArtists = tidalTrack.relationships?.artists?.artists.map(a => a.name.toLowerCase());
  
  for (const spotifyArtist of spotifyArtists) {
    for (const tidalArtist of tidalArtists) {
      if (tidalArtist === spotifyArtist) {
        score += 50;
        console.log("Exact artist match", { score });
      } else if (tidalArtist.includes(spotifyArtist) || spotifyArtist.includes(tidalArtist)) {
        score += 25;
      }
    }
  }
  
  // // Album match if available
  // if (spotifyTrack.album && tidalTrack.album) {
  //   if (tidalTrack.album.title.toLowerCase() === spotifyTrack.album.name.toLowerCase()) {
  //     score += 50;
  //   } else if (tidalTrack.album.title.toLowerCase().includes(spotifyTrack.album.name.toLowerCase()) ||
  //              spotifyTrack.album.name.toLowerCase().includes(tidalTrack.album.title.toLowerCase())) {
  //     score += 25;
  //   }
  // }
  
  return score;
};

/**
 * Find the best match for a Spotify track in Tidal
 */
export const findBestTidalMatch = (spotifyTrack: SpotifyApi.PlaylistTrackObject, tidalTracks: TidalTrackSearchResult[]): TidalTrackSearchResult | null => {
  if (!tidalTracks || tidalTracks.length === 0) {
    return null;
  }
  
  // Calculate scores for each potential match
  const scoredTracks = tidalTracks.map(tidalTrack => ({
    track: tidalTrack,
    score: calculateMatchScore(spotifyTrack, tidalTrack)
  }));
  
  // Sort by score (highest first)
  scoredTracks.sort((a, b) => b.score - a.score);
  
  // Return the best match if it has a minimum acceptable score
  // Minimum score of 100 means at least the title matches exactly
  // or there's a good combination of partial matches
  return scoredTracks[0].score >= 100 ? scoredTracks[0].track : null;
};