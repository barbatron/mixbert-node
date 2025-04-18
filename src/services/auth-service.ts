import SpotifyWebApi from 'spotify-web-api-node';
import {createAPIClient} from '@tidal-music/api';
import { SPOTIFY_CONFIG, TIDAL_CONFIG } from '../config';
import { credentialsProvider } from '@tidal-music/auth';

/**
 * Creates a Spotify API instance with the given access and refresh tokens
 */
export const createSpotifyApi = (accessToken?: string, refreshToken?: string): SpotifyWebApi => {
  const spotifyApi = new SpotifyWebApi({
    clientId: SPOTIFY_CONFIG.clientId,
    clientSecret: SPOTIFY_CONFIG.clientSecret,
    redirectUri: SPOTIFY_CONFIG.redirectUri,
  });
  
  if (accessToken) {
    spotifyApi.setAccessToken(accessToken);
  }
  
  if (refreshToken) {
    spotifyApi.setRefreshToken(refreshToken);
  }
  
  return spotifyApi;
};

/**
 * Refreshes a Spotify access token
 */
export const refreshSpotifyToken = async (refreshToken: string): Promise<string> => {
  try {
    const spotifyApi = createSpotifyApi(undefined, refreshToken);
    const data = await spotifyApi.refreshAccessToken();
    return data.body.access_token;
  } catch (error) {
    console.error('Error refreshing Spotify token:', error);
    throw error;
  }
};

/**
 * Creates a Tidal API instance with the given access token
 */
export const createTidalApi = (): ReturnType<typeof createAPIClient> => {
  const tidalApi = createAPIClient(credentialsProvider);
  return tidalApi;
};