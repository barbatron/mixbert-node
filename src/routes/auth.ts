import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import { TidalApi } from '@tidal-music/api';

const router = express.Router();

// Spotify API configuration
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// Spotify login
router.get('/spotify', (req, res) => {
  const scopes = ['user-read-private', 'user-read-email', 'playlist-read-private', 'playlist-read-collaborative'];
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'spotify-auth-state');
  res.redirect(authorizeURL);
});

// Spotify callback
router.get('/spotify/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const data = await spotifyApi.authorizationCodeGrant(code as string);
    
    // Save the access token and refresh token in session
    req.session.spotifyAccessToken = data.body.access_token;
    req.session.spotifyRefreshToken = data.body.refresh_token;
    
    // Set the access token on the Spotify API object
    spotifyApi.setAccessToken(data.body.access_token);
    spotifyApi.setRefreshToken(data.body.refresh_token);
    
    res.redirect('/');
  } catch (error) {
    console.error('Error during Spotify authentication:', error);
    res.redirect('/?error=spotify_auth_failed');
  }
});

// Tidal login
router.get('/tidal', (req, res) => {
  const tidalAuthUrl = `https://login.tidal.com/authorize?client_id=${process.env.TIDAL_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(process.env.TIDAL_REDIRECT_URI as string)}&scope=r_usr+w_usr+r_sub`;
  res.redirect(tidalAuthUrl);
});

// Tidal callback
router.get('/tidal/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect('/?error=tidal_auth_failed');
  }
  
  try {
    const tidalApi = new TidalApi({
      clientId: process.env.TIDAL_CLIENT_ID as string,
      clientSecret: process.env.TIDAL_CLIENT_SECRET as string,
    });
    
    const authResponse = await tidalApi.auth.getToken({
      code: code as string,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TIDAL_REDIRECT_URI as string,
    });
    
    // Save the access token in session
    req.session.tidalAccessToken = authResponse.access_token;
    req.session.tidalRefreshToken = authResponse.refresh_token;
    
    res.redirect('/');
  } catch (error) {
    console.error('Error during Tidal authentication:', error);
    res.redirect('/?error=tidal_auth_failed');
  }
});

// Logout
router.get('/logout', (req, res) => {
  // Clear session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

export default router;