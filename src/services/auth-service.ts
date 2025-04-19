import { finalizeLogin, init, initializeLogin } from "@tidal-music/auth";
import SpotifyWebApi from "spotify-web-api-node";
import { createAPIClient } from "@tidal-music/api";
import { SPOTIFY_CONFIG, TIDAL_CONFIG } from "../config";
import { credentialsProvider } from "@tidal-music/auth";
import { TidalApiClient } from "../types";

/**
 * Creates a Spotify API instance with the given access and refresh tokens
 */
export const createSpotifyApi = (
  accessToken?: string,
  refreshToken?: string
): SpotifyWebApi => {
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
export const refreshSpotifyToken = async (
  refreshToken: string
): Promise<string> => {
  try {
    const spotifyApi = createSpotifyApi(undefined, refreshToken);
    const data = await spotifyApi.refreshAccessToken();
    return data.body.access_token;
  } catch (error) {
    console.error("Error refreshing Spotify token:", error);
    throw error;
  }
};

export const credentialsStorageKey = "mixbert";
/**
 * Creates a Tidal API instance with the given access token
 */
export const createTidalApi = async (
  doInit = true
): Promise<TidalApiClient> => {
  if (doInit) {
    const { clientId } = TIDAL_CONFIG;
    await init({
      clientId,
      credentialsStorageKey,
    });
  }
  const tidalApi = createAPIClient(credentialsProvider);
  return tidalApi;
};
