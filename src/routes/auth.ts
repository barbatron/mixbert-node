import { finalizeLogin, init, initializeLogin } from "@tidal-music/auth";
import express from "express";
import SpotifyWebApi from "spotify-web-api-node";
import { SPOTIFY_CONFIG, TIDAL_CONFIG } from "../config";

const credentialsStorageKey = "mixbert";
const router = express.Router();

// Spotify API configuration
const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CONFIG.clientId,
  clientSecret: SPOTIFY_CONFIG.clientSecret,
  redirectUri: SPOTIFY_CONFIG.redirectUri,
});

// Spotify login
router.get("/spotify", (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
  ];
  const authorizeURL = spotifyApi.createAuthorizeURL(
    scopes,
    "spotify-auth-state"
  );
  res.redirect(authorizeURL);
});

// Spotify callback
router.get("/spotify/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const data = await spotifyApi.authorizationCodeGrant(code as string);

    // Save the access token and refresh token in session
    req.session.spotifyAccessToken = data.body.access_token;
    req.session.spotifyRefreshToken = data.body.refresh_token;

    // Set the access token on the Spotify API object
    spotifyApi.setAccessToken(data.body.access_token);
    spotifyApi.setRefreshToken(data.body.refresh_token);

    res.redirect("/");
  } catch (error) {
    console.error("Error during Spotify authentication:", error);
    res.redirect("/?error=spotify_auth_failed");
  }
});

// Tidal login
router.get("/tidal", async (req, res) => {
  const { clientId, redirectUri } = TIDAL_CONFIG;

  await init({
    clientId,
    credentialsStorageKey,
  });

  console.log("Tidal login initialized successfully");
  const loginUrl = await initializeLogin({
    redirectUri,
  });

  res.redirect(loginUrl);
});

// Tidal callback
router.get("/tidal/callback?code", async (req, res) => {
  const url = new URL(`http://${process.env.HOST ?? "localhost"}${req.url}`);

  if (!url.searchParams.has("code")) {
    return res.redirect("/?error=tidal_auth_failed");
  }
  const { clientId } = TIDAL_CONFIG;

  await init({
    clientId,
    credentialsStorageKey,
  });
  const queryStr = url.search;

  try {
    await finalizeLogin(queryStr);

    res.redirect("/");
  } catch (error) {
    console.error("Error during Tidal authentication:", error);
    res.redirect("/?error=tidal_auth_failed");
  }
});

// Logout
router.get("/logout", (req, res) => {
  // Clear session
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
    res.redirect("/");
  });
});

export default router;
