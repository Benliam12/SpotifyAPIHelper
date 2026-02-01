# Spotify API Helper

A lightweight TypeScript wrapper for the Spotify Web API. Handles authentication, token management, and provides simple methods to access Spotify data.

## Features

- **Automatic token management** — Client Credentials tokens are fetched and refreshed automatically
- **User authentication support** — Authorization Code flow for user-scoped endpoints
- **Stateless user tokens** — User tokens are passed per-call, safe for multi-user / concurrent environments
- **No exceptions on API failures** — Methods return `null` on failure instead of throwing
- **Error monitoring** — Optional error callback and console logging
- **TypeScript first** — Full type definitions included

## Installation

```bash
npm install @benliam12/spotify-api-helper
```

## Prerequisites

You need a Spotify Developer application. Create one at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) to get your `Client ID`, `Client Secret`, and configure a `Redirect URI`.

## Quick Start

### Setup

```typescript
import { SpotifyHelper, SpotifyConfiguration } from '@benliam12/spotify-api-helper';

const config = new SpotifyConfiguration({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

const spotify = new SpotifyHelper(config, {
  logErrors: true, // optional: log errors to console
  onError: (error) => console.error(error), // optional: error callback
});

await spotify.initialize();
```

### Public Data (No User Login Required)

These methods use the Client Credentials token, managed automatically by the helper.

```typescript
import { SearchType } from '@benliam12/spotify-api-helper';

// Get a track
const track = await spotify.getTrack('TRACK_ID');
console.log(track?.name, track?.artists);

// Get an album
const album = await spotify.getAlbum('ALBUM_ID');

// Get multiple albums (max 20)
const albums = await spotify.getAlbums(['ALBUM_ID_1', 'ALBUM_ID_2']);

// Get tracks from an album (limit 1-50)
const tracks = await spotify.getAlbumTracks('ALBUM_ID', 20, 0);

// Search
const results = await spotify.search('Daft Punk', SearchType.ARTIST);

// Get a public playlist
const playlist = await spotify.getPlaylist('PLAYLIST_ID');

// Get available markets
const markets = await spotify.getAvailableMarkets();
```

### User-Scoped Data (User Login Required)

Some Spotify endpoints require a user to log in and grant permissions. The helper provides utilities to handle the Authorization Code flow, but **you manage the token storage** (database, session, etc.). This makes the helper safe for concurrent multi-user usage.

#### Step 1: Redirect the user to Spotify login

```typescript
import { SpotifyScope } from '@benliam12/spotify-api-helper';

const authUrl = spotify.getAuthorizationUrl(
  [SpotifyScope.USER_READ_PRIVATE, SpotifyScope.PLAYLIST_READ_PRIVATE],
  'optional-state-value'
);

// Redirect the user to authUrl (e.g. res.redirect(authUrl))
```

#### Step 2: Exchange the callback code for a token

```typescript
// In your callback route handler
const userToken = await spotify.exchangeAuthCode(code);

// Store userToken in your database / session — you own this token
```

#### Step 3: Use the token for user-scoped requests

```typescript
// Pass the stored token to any user-scoped method
const profile = await spotify.getCurrentUserProfile(userToken);
const playlists = await spotify.getUserPlaylists(userToken, 20, 0);
const topArtists = await spotify.getUserTopItems(userToken, 'artists', 10);
const savedTracks = await spotify.getUserSavedTracks(userToken, 50);
```

#### Refreshing an expired token

```typescript
// Check expiry and refresh when needed
if (new Date() >= userToken.expires_at) {
  const newToken = await spotify.refreshUserToken(userToken.refresh_token);
  // Update the stored token
}
```

## Configuration Options

```typescript
const spotify = new SpotifyHelper(config, {
  tokenRefreshBufferMs: 60000, // Refresh client token 60s before expiry (default)
  logErrors: false,            // Log errors to console (default: false)
  onError: (error) => {},      // Error callback for monitoring
});
```

## Available Scopes

The `SpotifyScope` enum provides all Spotify OAuth scopes:

| Scope | Description |
|---|---|
| `USER_READ_PRIVATE` | Read user profile |
| `USER_READ_EMAIL` | Read user email |
| `PLAYLIST_READ_PRIVATE` | Read private playlists |
| `PLAYLIST_MODIFY_PUBLIC` | Modify public playlists |
| `PLAYLIST_MODIFY_PRIVATE` | Modify private playlists |
| `USER_LIBRARY_READ` | Read saved tracks/albums |
| `USER_LIBRARY_MODIFY` | Modify saved tracks/albums |
| `USER_TOP_READ` | Read top artists/tracks |
| `USER_READ_RECENTLY_PLAYED` | Read recently played |
| `USER_READ_PLAYBACK_STATE` | Read playback state |
| `USER_MODIFY_PLAYBACK_STATE` | Control playback |
| `STREAMING` | Web Playback SDK |

See the full list in the [Spotify Scopes documentation](https://developer.spotify.com/documentation/web-api/concepts/scopes).

## API Reference

### Public Endpoints

| Method | Returns | Description |
|---|---|---|
| `getTrack(trackId)` | `Track \| null` | Get a track by ID |
| `getAlbum(albumId)` | `Album \| null` | Get an album by ID |
| `getAlbums(albumIds)` | `(Album \| null)[]` | Get up to 20 albums |
| `getAlbumTracks(albumId, limit?, offset?)` | `Track[] \| null` | Get an album's tracks |
| `getArtist(artistId)` | `Artist \| null` | Get an artist by ID |
| `getPlaylist(playlistId)` | `any \| null` | Get a public playlist |
| `search(query, type, limit?, offset?)` | `any \| null` | Search for content |
| `getAvailableMarkets()` | `string[]` | Get available markets |

### User-Scoped Endpoints

| Method | Returns | Description |
|---|---|---|
| `getCurrentUserProfile(userToken)` | `any \| null` | Get the user's profile |
| `getUserPlaylists(userToken, limit?, offset?)` | `any \| null` | Get the user's playlists |
| `getUserTopItems(userToken, type, limit?, offset?)` | `any \| null` | Get the user's top artists or tracks |
| `getUserSavedTracks(userToken, limit?, offset?)` | `any \| null` | Get the user's saved tracks |

### OAuth Utilities

| Method | Returns | Description |
|---|---|---|
| `getAuthorizationUrl(scopes, state?)` | `string` | Build the Spotify login URL |
| `exchangeAuthCode(code)` | `UserToken \| null` | Exchange auth code for a user token |
| `refreshUserToken(refreshToken)` | `UserToken \| null` | Refresh an expired user token |

### Helper Methods

| Method | Returns | Description |
|---|---|---|
| `initialize()` | `boolean` | Fetch the initial client token |
| `isAuthenticated()` | `boolean` | Check if client token is valid |
| `getTokenInfo()` | `object` | Debug info about the client token |
| `clearToken()` | `void` | Force clear the client token |

## Contributing

Please open issues for any feature request or bug report. Feel free to make pull requests to contribute directly to the project.

## License

MIT
