import express, { Request, Response } from "express";
import { createSpotifyApi, createTidalApi } from "../services/auth-service";
import {
  createTidalPlaylist,
  findBestTidalMatch,
} from "../services/playlist-service";
import { searchTidalTrack } from "../services/tidal-client";
import { SyncResults } from "../types";
import { init } from "@tidal-music/auth";

const router = express.Router();

// Middleware to check if user is authenticated with both services
const checkAuthForBothServices = async (
  req: Request,
  res: Response,
  next: Function
) => {
  if (!req.session.spotifyAccessToken) {
    return res.redirect("/auth/spotify");
  }
  const tidalApi = await createTidalApi();
  tidalApi.GET("/users/me").catch((error) => {
    console.error("Error checking Tidal authentication:", error);
    if (error.statusCode === 401) {
      return res.redirect("/auth/tidal");
    }
  });
  next();
};

// Route to start sync process for a specific playlist
router.get(
  "/start/:playlistId",
  checkAuthForBothServices,
  async (req: Request, res: Response) => {
    const { playlistId } = req.params;

    try {
      // Initialize Spotify API
      const spotifyApi = createSpotifyApi(
        req.session.spotifyAccessToken,
        req.session.spotifyRefreshToken
      );

      // Get playlist details from Spotify
      const playlistData = await spotifyApi.getPlaylist(playlistId);
      const playlistName = playlistData.body.name;
      const playlistDescription =
        playlistData.body.description ||
        `Synced from Spotify playlist: ${playlistData.body.name}`;

      // Get all tracks from the playlist
      const response = await spotifyApi.getPlaylistTracks(playlistId, {
        limit: 100,
      });
      const trackResponse = response.body as SpotifyApi.PlaylistTrackResponse;
      const tracks = trackResponse.items as SpotifyApi.PlaylistTrackObject[];

      // Initialize Tidal API
      const tidalApi = await createTidalApi(true);

      // Create new playlist on Tidal
      const tidalPlaylist = await createTidalPlaylist(
        tidalApi,
        playlistName,
        playlistDescription
      );

      // Track matching and syncing status
      const syncResults: SyncResults = {
        total: tracks.length,
        matched: 0,
        notFound: 0,
        details: [],
      };

      // Process tracks in batches to avoid rate limiting
      const batchSize = 10;
      const batches = Math.ceil(tracks.length / batchSize);

      for (let i = 0; i < batches; i++) {
        const batchTracks = tracks.slice(i * batchSize, (i + 1) * batchSize);

        for (const track of batchTracks) {
          try {
            // Search for track on Tidal
            const trackName = track.track?.name;
            if (!trackName) {
              console.warn(`Track name is missing for track:`, track);
              throw new Error("Track name is missing");
            }
            const tidalTracks = await searchTidalTrack(tidalApi, trackName);

            // Find best match using our scoring algorithm
            const bestMatch =
              tidalTracks && tidalTracks.length > 0
                ? findBestTidalMatch(track, tidalTracks)
                : null;

            if (bestMatch) {
              // Add track to Tidal playlist
              // await tidalApi.PUTplaylist.addItems({
              //   playlistId: tidalPlaylistId,
              //   items: [
              //     {
              //       type: "track",
              //       id: bestMatch.id,
              //     },
              //   ],
              // });
              console.log("TODO: Add track to Tidal playlist:", {
                tidalPlaylist,
                bestMatch,
              });

              syncResults.matched++;
              syncResults.details.push({
                spotifyTrack: track,
                tidalTrack: bestMatch,
                // `${bestMatch.attributes?.title} - ${(bestMatch.relationships?.artists?.data as TidalArtist[])
                //   .map((a) => a.attributes?.name)
                //   .join(", ")}`,
                status: "matched",
              });
            } else {
              syncResults.notFound++;
              syncResults.details.push({
                spotifyTrack: `${track.name} - ${track.artists
                  .map((a) => a.name)
                  .join(", ")}`,
                tidalTrack: null,
                status: "not_found",
              });
            }

            // Add small delay to avoid hitting rate limits
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (trackError) {
            console.error(`Error syncing track ${track.name}:`, trackError);
            syncResults.notFound++;
            syncResults.details.push({
              spotifyTrack: `${track.name} - ${track.artists
                .map((a) => a.name)
                .join(", ")}`,
              tidalTrack: null,
              status: "error",
              error: trackError.message,
            });
          }
        }
      }

      // Store sync results in session to display them
      req.session.lastSyncResults = syncResults;
      req.session.tidalPlaylistId = tidalPlaylistId;

      res.redirect("/sync/results");
    } catch (error) {
      console.error("Error during sync process:", error);
      res.status(500).render("error", {
        message: "Failed to sync playlist",
        details: error.message,
      });
    }
  }
);

// Route to display sync results
router.get(
  "/results",
  checkAuthForBothServices,
  (req: Request, res: Response) => {
    const syncResults = req.session.lastSyncResults;
    const tidalPlaylistId = req.session.tidalPlaylistId;

    if (!syncResults) {
      return res.redirect("/playlists");
    }

    res.render("sync-results", {
      syncResults,
      tidalPlaylistId,
      tidalPlaylistUrl: `https://listen.tidal.com/playlist/${tidalPlaylistId}`,
    });
  }
);

export default router;
