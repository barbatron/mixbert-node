import express from 'express';
import SpotifyWebApi from 'spotify-web-api-node';
import { TidalApi } from '@tidal-music/api';

const router = express.Router();

// Middleware to check if user is authenticated with both services
const checkAuthForBothServices = (req, res, next) => {
  if (!req.session.spotifyAccessToken) {
    return res.redirect('/auth/spotify');
  }
  if (!req.session.tidalAccessToken) {
    return res.redirect('/auth/tidal');
  }
  next();
};

// Route to start sync process for a specific playlist
router.get('/start/:playlistId', checkAuthForBothServices, async (req, res) => {
  const { playlistId } = req.params;
  
  try {
    // Initialize Spotify API
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    });
    
    spotifyApi.setAccessToken(req.session.spotifyAccessToken);
    spotifyApi.setRefreshToken(req.session.spotifyRefreshToken);
    
    // Initialize Tidal API
    const tidalApi = new TidalApi({
      clientId: process.env.TIDAL_CLIENT_ID as string,
      clientSecret: process.env.TIDAL_CLIENT_SECRET as string,
    });
    
    tidalApi.auth.setAccessToken(req.session.tidalAccessToken);
    
    // Get playlist details from Spotify
    const playlistData = await spotifyApi.getPlaylist(playlistId);
    const playlistName = playlistData.body.name;
    const playlistDescription = playlistData.body.description || `Synced from Spotify playlist: ${playlistData.body.name}`;
    
    // Get all tracks from the playlist
    let tracks = [];
    let offset = 0;
    const limit = 100;
    let hasMoreTracks = true;
    
    while (hasMoreTracks) {
      const tracksData = await spotifyApi.getPlaylistTracks(playlistId, { offset, limit });
      const fetchedTracks = tracksData.body.items.map(item => item.track);
      tracks = [...tracks, ...fetchedTracks];
      
      if (tracksData.body.next) {
        offset += limit;
      } else {
        hasMoreTracks = false;
      }
    }
    
    // Create new playlist on Tidal
    const createPlaylistResponse = await tidalApi.playlist.createPlaylist({
      title: `${playlistName} (Spotify Sync)`,
      description: playlistDescription,
    });
    
    const tidalPlaylistId = createPlaylistResponse.uuid;
    
    // Track matching and syncing status
    const syncResults = {
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
          const query = `${track.name} ${track.artists.map(a => a.name).join(' ')}`;
          const searchResults = await tidalApi.search.search({
            query,
            limit: 5,
            types: ['TRACKS'],
          });
          
          // Find best match
          let bestMatch = null;
          
          if (searchResults.tracks && searchResults.tracks.items.length > 0) {
            // Try to find exact match by title and artist
            bestMatch = searchResults.tracks.items.find(tidalTrack => {
              const titleMatch = tidalTrack.title.toLowerCase() === track.name.toLowerCase();
              const artistMatch = track.artists.some(spotifyArtist => 
                tidalTrack.artists.some(tidalArtist => 
                  tidalArtist.name.toLowerCase() === spotifyArtist.name.toLowerCase()
                )
              );
              
              return titleMatch && artistMatch;
            });
            
            // If no exact match, try a more lenient approach
            if (!bestMatch) {
              bestMatch = searchResults.tracks.items[0]; // Take first result
            }
          }
          
          if (bestMatch) {
            // Add track to Tidal playlist
            await tidalApi.playlist.addItems({
              playlistId: tidalPlaylistId,
              items: [{
                type: 'track',
                id: bestMatch.id
              }]
            });
            
            syncResults.matched++;
            syncResults.details.push({
              spotifyTrack: `${track.name} - ${track.artists.map(a => a.name).join(', ')}`,
              tidalTrack: `${bestMatch.title} - ${bestMatch.artists.map(a => a.name).join(', ')}`,
              status: 'matched'
            });
          } else {
            syncResults.notFound++;
            syncResults.details.push({
              spotifyTrack: `${track.name} - ${track.artists.map(a => a.name).join(', ')}`,
              tidalTrack: null,
              status: 'not_found'
            });
          }
          
          // Add small delay to avoid hitting rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (trackError) {
          console.error(`Error syncing track ${track.name}:`, trackError);
          syncResults.notFound++;
          syncResults.details.push({
            spotifyTrack: `${track.name} - ${track.artists.map(a => a.name).join(', ')}`,
            tidalTrack: null,
            status: 'error',
            error: trackError.message
          });
        }
      }
    }
    
    // Store sync results in session to display them
    req.session.lastSyncResults = syncResults;
    req.session.tidalPlaylistId = tidalPlaylistId;
    
    res.redirect('/sync/results');
    
  } catch (error) {
    console.error('Error during sync process:', error);
    res.status(500).render('error', { 
      message: 'Failed to sync playlist', 
      details: error.message 
    });
  }
});

// Route to display sync results
router.get('/results', checkAuthForBothServices, (req, res) => {
  const syncResults = req.session.lastSyncResults;
  const tidalPlaylistId = req.session.tidalPlaylistId;
  
  if (!syncResults) {
    return res.redirect('/playlists');
  }
  
  res.render('sync-results', { 
    syncResults,
    tidalPlaylistId,
    tidalPlaylistUrl: `https://listen.tidal.com/playlist/${tidalPlaylistId}`
  });
});

export default router;