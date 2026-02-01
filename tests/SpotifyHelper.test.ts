import { SpotifyHelper } from '../src/core/SpotifyHelper.js';
import { SpotifyConfiguration } from '../src/core/SpotifyConfiguration.js';
import { Album, Artist, SearchType, Track, UserToken, SpotifyScope } from '../src/core/SpotifyTypes.js';
import searchFixtures from './Fixtures/Seach.json';
import multipleAlbumsFixtures from './Fixtures/MultipleAlbums.json';
import singleTrackFixtures from './Fixtures/SingleTrack.json';
import { jest } from '@jest/globals';

describe('Spotify Helper Module', () => {
  let mockFetch: any;
  let spotifyHelper: SpotifyHelper;

  beforeEach(async () => {
    // 1. Create mockFetch FIRST
    mockFetch = jest.fn();
    global.fetch = mockFetch as any;

    // 2. Mock token response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'mock',
        token_type: 'Bearer',
        expires_in: 3600,
      }),
    });

    // 3. Create config and helper
    const config = new SpotifyConfiguration({
      clientId: process.env.SPOTIFY_CLIENT_ID || '',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
      redirectUri: process.env.SPOTIFY_REDIRECT_URI || '',
    });

    spotifyHelper = new SpotifyHelper(config);

    // 4. Initialize (this will use the mocked token)
    await spotifyHelper.initialize();

    // 5. Clear mock history for cleaner test assertions
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('Should initialize SpotifyHelper instance', () => {
      expect(spotifyHelper).toBeDefined();
    });

    test('Should have a valid SpotifyConfiguration instance', () => {
      expect(spotifyHelper.getConfig()).toBeDefined();
      expect(spotifyHelper.getConfig().isValid()).toBe(true);
    });
  });

  describe('Search Functionality', () => {
    test('Should perform a search for albums', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => searchFixtures,
      });

      const results = await spotifyHelper.search('What is sounds like', SearchType.TRACK);
      expect(results).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only the search call
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/search?q=What%20is%20sounds%20like&type=track&limit=20&offset=0',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('Album Retrieval', () => {
    test('Should retrieve multiple albums by IDs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => multipleAlbumsFixtures,
      });

      const albumIds = ['14JkAa6IiFaOh5s0nMyMU9', '14JkAa6IiFaOh5s0nMyMU9'];
      const r: (Album | null)[] = await spotifyHelper.getAlbums(albumIds);
      expect(r).toBeDefined();
      expect(r.length).toBe(albumIds.length);

      r.forEach((element: Album | null) => {
        expect(element).toBeDefined();
        expect(element).not.toBeNull();
        expect((element as Album).id).toBe('14JkAa6IiFaOh5s0nMyMU9');
      });
    });
  });

  describe('Track Retrieval', () => {
    test('Should retrieve a track by ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => singleTrackFixtures,
      });

      const track: Track | null = await spotifyHelper.getTrack('5sBDrrtLGbV64QJnEqfjer');

      expect(track).toBeDefined();
      expect(track).not.toBeNull();

      const trackObject: Track = track as Track;
      expect(trackObject.id).toBe('5sBDrrtLGbV64QJnEqfjer');
      expect(trackObject.name).toBe('What It Sounds Like');
      expect(trackObject.artists).toBeDefined();
      expect(trackObject.artists.length).toBeGreaterThan(0);
      expect(trackObject.album).toBeDefined();

      const albumObject = trackObject.album as Album;
      expect(albumObject.id).toBe('14JkAa6IiFaOh5s0nMyMU9');
      expect(albumObject.name).toBe('KPop Demon Hunters (Soundtrack from the Netflix Film)');
      expect(albumObject.album_type).toBe('album');
      expect(albumObject.total_tracks).toBe(12);

      const artistList = trackObject.artists as Artist[];
      expect(artistList).toBeDefined();
      expect(artistList.length).toBeGreaterThan(0);

      const firstArtist = artistList[0] as Artist;
      expect(firstArtist.id).toBe('2yNNYQBChuox9A5Ka93BIn');
      expect(firstArtist.name).toBe('HUNTR/X');

      artistList.forEach((artist: Artist) => {
        expect(artist).toBeDefined();
        expect(artist.id).toBeDefined();
        expect(artist.name).toBeDefined();
        expect(artist.name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Authorization URL', () => {
    test('Should build authorization URL with scopes', () => {
      const url = spotifyHelper.getAuthorizationUrl([SpotifyScope.USER_READ_PRIVATE, SpotifyScope.USER_READ_EMAIL]);

      expect(url).toContain('https://accounts.spotify.com/authorize');
      expect(url).toContain('response_type=code');
      expect(url).toContain(`client_id=${process.env.SPOTIFY_CLIENT_ID}`);
      expect(url).toContain('scope=user-read-private+user-read-email');
    });

    test('Should include state parameter when provided', () => {
      const url = spotifyHelper.getAuthorizationUrl([SpotifyScope.USER_READ_PRIVATE], 'my-state-123');

      expect(url).toContain('state=my-state-123');
    });

    test('Should not include state parameter when omitted', () => {
      const url = spotifyHelper.getAuthorizationUrl([SpotifyScope.USER_READ_PRIVATE]);

      expect(url).not.toContain('state=');
    });
  });

  describe('Exchange Auth Code', () => {
    test('Should exchange auth code for user token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'user-access-token',
          refresh_token: 'user-refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'user-read-private user-read-email',
        }),
      });

      const token = await spotifyHelper.exchangeAuthCode('auth-code-123');

      expect(token).not.toBeNull();
      expect(token!.access_token).toBe('user-access-token');
      expect(token!.refresh_token).toBe('user-refresh-token');
      expect(token!.scope).toBe('user-read-private user-read-email');
      expect(token!.expires_at).toBeInstanceOf(Date);
    });

    test('Should return null on failed exchange', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid authorization code',
      });

      const token = await spotifyHelper.exchangeAuthCode('bad-code');
      expect(token).toBeNull();
    });

    test('Should return null when response is missing required fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'token-only' }),
      });

      const token = await spotifyHelper.exchangeAuthCode('auth-code-123');
      expect(token).toBeNull();
    });
  });

  describe('Refresh User Token', () => {
    test('Should refresh a user token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'user-read-private',
        }),
      });

      const token = await spotifyHelper.refreshUserToken('old-refresh-token');

      expect(token).not.toBeNull();
      expect(token!.access_token).toBe('new-access-token');
      expect(token!.refresh_token).toBe('new-refresh-token');
    });

    test('Should keep old refresh token if none returned', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
      });

      const token = await spotifyHelper.refreshUserToken('original-refresh-token');

      expect(token).not.toBeNull();
      expect(token!.refresh_token).toBe('original-refresh-token');
    });

    test('Should return null on failed refresh', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid refresh token',
      });

      const token = await spotifyHelper.refreshUserToken('bad-refresh-token');
      expect(token).toBeNull();
    });
  });

  describe('User-Scoped API Methods', () => {
    const mockUserToken: UserToken = {
      access_token: 'user-token-abc',
      refresh_token: 'refresh-abc',
      token_type: 'Bearer',
      expires_at: new Date(Date.now() + 3600000),
      scope: 'user-read-private playlist-read-private user-top-read user-library-read',
    };

    test('Should get current user profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'user123', display_name: 'Test User' }),
      });

      const profile = await spotifyHelper.getCurrentUserProfile(mockUserToken);

      expect(profile).not.toBeNull();
      expect(profile.id).toBe('user123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer user-token-abc',
          }),
        })
      );
    });

    test('Should get user playlists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ id: 'playlist1', name: 'My Playlist' }], total: 1 }),
      });

      const playlists = await spotifyHelper.getUserPlaylists(mockUserToken, 10, 0);

      expect(playlists).not.toBeNull();
      expect(playlists.items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/playlists?limit=10&offset=0',
        expect.any(Object)
      );
    });

    test('Should get user top items', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ id: 'artist1', name: 'Top Artist' }], total: 1 }),
      });

      const topArtists = await spotifyHelper.getUserTopItems(mockUserToken, 'artists', 5);

      expect(topArtists).not.toBeNull();
      expect(topArtists.items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me/top/artists?limit=5&offset=0',
        expect.any(Object)
      );
    });

    test('Should get user saved tracks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ track: { id: 'track1', name: 'Saved Track' } }], total: 1 }),
      });

      const saved = await spotifyHelper.getUserSavedTracks(mockUserToken);

      expect(saved).not.toBeNull();
      expect(saved.items).toHaveLength(1);
    });

    test('Should return null on API failure for user methods', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Insufficient scope',
      });

      const profile = await spotifyHelper.getCurrentUserProfile(mockUserToken);
      expect(profile).toBeNull();
    });
  });
});
