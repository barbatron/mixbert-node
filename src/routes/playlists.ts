import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';

const router = express.Router();

// Middleware to check Spotify authentication
const checkSpotifyAuth = (req, res, next) => {
  if (!req.session.spotifyAccessToken) {
    return res.redirect('/auth/spotify');
  }
  next();
};

// Get all user playlists from Spotify
router.get('/', checkSpotifyAuth, async (req, res) => {
  try {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    });
    
    spotifyApi.setAccessToken(req.session.spotifyAccessToken);
    spotifyApi.setRefreshToken(req.session.spotifyRefreshToken);
    
    const data = await spotifyApi.getUserPlaylists();
    const playlists = data.body.items;
    
    res.render('playlists', { playlists });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    
    // Check if token expired and refresh
    if (error.statusCode === 401) {
      try {
        const spotifyApi = new SpotifyWebApi({
          clientId: process.env.SPOTIFY_CLIENT_ID,
          clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
          redirectUri: process.env.SPOTIFY_REDIRECT_URI,
        });
        
        spotifyApi.setRefreshToken(req.session.spotifyRefreshToken);
        const data = await spotifyApi.refreshAccessToken();
        
        req.session.spotifyAccessToken = data.body.access_token;
        return res.redirect('/playlists');
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        return res.redirect('/auth/spotify');
      }
    }
    
    res.status(500).render('error', { message: 'Failed to fetch playlists' });
  }
});

// Get detailed information for a specific playlist
router.get('/:playlistId', checkSpotifyAuth, async (req, res) => {
  try {
    const { playlistId } = req.params;
    
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    });
    
    spotifyApi.setAccessToken(req.session.spotifyAccessToken);
    spotifyApi.setRefreshToken(req.session.spotifyRefreshToken);
    
    const playlistData = await spotifyApi.getPlaylist(playlistId);
    const tracksData = await spotifyApi.getPlaylistTracks(playlistId);
    
    const playlist = playlistData.body;
    const tracks = tracksData.body.items.map(item => item.track);
    
    res.render('playlist-detail', { playlist, tracks });
  } catch (error) {
    console.error('Error fetching playlist details:', error);
    
    if (error.statusCode === 401) {
      return res.redirect('/auth/spotify');
    }
    
    res.status(500).render('error', { message: 'Failed to fetch playlist details' });
  }
});

export default router;