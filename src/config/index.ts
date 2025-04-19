import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Server configuration
export const PORT = process.env.PORT || 3000;
export const SESSION_SECRET = process.env.SESSION_SECRET || 'default_secret';
export const NODE_ENV = process.env.NODE_ENV || 'development';

// Spotify API configuration
export const SPOTIFY_CONFIG = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
};

// Tidal API configuration
export const TIDAL_CONFIG = {
  clientId: process.env.TIDAL_CLIENT_ID!,
  clientSecret: process.env.TIDAL_CLIENT_SECRET,
  redirectUri: process.env.TIDAL_REDIRECT_URI!,
};

console.log("Config", { SPOTIFY_CONFIG, TIDAL_CONFIG });
// Validate required environment variables
export const validateConfig = (): boolean => {
  const requiredVars = [
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET',
    'SPOTIFY_REDIRECT_URI',
    'TIDAL_CLIENT_ID',
    'TIDAL_CLIENT_SECRET',
    'TIDAL_REDIRECT_URI',
    'SESSION_SECRET',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:');
    missingVars.forEach(varName => console.error(`- ${varName}`));
    console.error('Please check your .env file and try again.');
    return false;
  }

  return true;
};