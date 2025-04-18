# MixBert - Spotify to Tidal Playlist Sync

MixBert is a web application that allows users to synchronize their Spotify playlists to their Tidal account. The app matches songs between the two services based on artist name, song title, and album information.

## Features

- Connect to both Spotify and Tidal accounts securely
- Browse and select any of your Spotify playlists
- Sync selected playlists to your Tidal account with smart track matching
- View detailed sync results, including matched and unmatched tracks
- Clean, responsive interface with Bootstrap 5

## Technologies Used

- Node.js and Express for the backend
- TypeScript for type safety
- EJS for templating
- Spotify Web API Node for Spotify integration
- Tidal API for Tidal integration
- Bootstrap 5 for styling

## Prerequisites

- Node.js (v14 or higher)
- pnpm (v6 or higher)
- Spotify Developer account and registered application
- Tidal Developer account and registered application

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mixbert-node
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file based on the `.env.template`:
```bash
cp .env.template .env
```

4. Update the `.env` file with your Spotify and Tidal API credentials.

## Setting Up API Credentials

### Spotify API Setup

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)
2. Create a new application
3. Set the redirect URI to `http://localhost:3000/auth/spotify/callback`
4. Copy the Client ID and Client Secret to your `.env` file

### Tidal API Setup

1. Register at [Tidal Developer Portal](https://developer.tidal.com/)
2. Create a new application
3. Set the redirect URI to `http://localhost:3000/auth/tidal/callback`
4. Copy the Client ID and Client Secret to your `.env` file

## Development

1. Start the development server:
```bash
pnpm run dev
```

2. Open your browser and navigate to `http://localhost:3000`

## Production Build

1. Build the TypeScript code:
```bash
pnpm run build
```

2. Start the production server:
```bash
pnpm start
```

## How It Works

1. Users log in to both their Spotify and Tidal accounts
2. They select a playlist from their Spotify library
3. The app searches Tidal for matching tracks based on:
   - Exact title and artist name matches (highest priority)
   - Partial matches with album information
   - Fuzzy matching as a fallback
4. A new playlist is created in the user's Tidal account
5. Matched tracks are added to the playlist
6. Users are shown detailed results of the synchronization

## License

ISC License