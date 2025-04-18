import express, { Request, Response } from "express";
import {
  createSpotifyApi,
  refreshSpotifyToken,
} from "../services/auth-service";
import { SpotifyTrack } from "../types";

const router = express.Router();

// Middleware to check Spotify authentication
const checkSpotifyAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session.spotifyAccessToken) {
    return res.redirect("/auth/spotify");
  }
  next();
};

// Get all user playlists from Spotify
router.get("/", checkSpotifyAuth, async (req: Request, res: Response) => {
  try {
    const spotifyApi = createSpotifyApi(
      req.session.spotifyAccessToken,
      req.session.spotifyRefreshToken
    );

    const data = await spotifyApi.getUserPlaylists();
    const playlists = data.body.items;

    res.render("playlists", { playlists });
  } catch (error) {
    console.error("Error fetching playlists:", error);

    // Check if token expired and refresh
    const statusCode = (error as any).statusCode;
    if (statusCode === 401) {
      try {
        console.log(
          "401 on get Spotify playlist - try refresh token",
          req.session.spotifyRefreshToken
        );
        const newAccessToken = await refreshSpotifyToken(
          req.session.spotifyRefreshToken!
        );
        req.session.spotifyAccessToken = newAccessToken;
        return res.redirect("/playlists");
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        return res.redirect("/auth/spotify");
      }
    }

    res.status(500).render("error", { message: "Failed to fetch playlists" });
  }
});

// Get detailed information for a specific playlist
router.get(
  "/:playlistId",
  checkSpotifyAuth,
  async (req: Request, res: Response) => {
    try {
      const { playlistId } = req.params;

      const spotifyApi = createSpotifyApi(
        req.session.spotifyAccessToken,
        req.session.spotifyRefreshToken
      );

      const playlistData = await spotifyApi.getPlaylist(playlistId);
      const tracksData = await spotifyApi.getPlaylistTracks(playlistId);

      const playlist = playlistData.body;
      const tracks = tracksData.body.items.map(
        (item) => item.track
      ) as SpotifyTrack[];

      res.render("playlist-detail", { playlist, tracks });
    } catch (error) {
      console.error("Error fetching playlist details:", error);
      const statusCode = (error as any).statusCode;

      if (statusCode === 401) {
        try {
          const newAccessToken = await refreshSpotifyToken(
            req.session.spotifyRefreshToken!
          );
          req.session.spotifyAccessToken = newAccessToken;
          return res.redirect(`/playlists/${req.params.playlistId}`);
        } catch (refreshError) {
          console.error("Error refreshing token:", refreshError);
          return res.redirect("/auth/spotify");
        }
      }

      res
        .status(500)
        .render("error", { message: "Failed to fetch playlist details" });
    }
  }
);

export default router;
