import { SpotifyHelper } from '../src/core/SpotifyHelper.js';
import { SpotifyConfiguration } from '../src/core/SpotifyConfiguration.js';
import { Album, Artist, SearchType, Track } from '../src/core/SpotifyTypes.js';
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

      const results = await spotifyHelper.search(
        'What is sounds like',
        SearchType.TRACK
      );
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

      const track: Track | null = await spotifyHelper.getTrack(
        '5sBDrrtLGbV64QJnEqfjer'
      );

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
      expect(albumObject.name).toBe(
        'KPop Demon Hunters (Soundtrack from the Netflix Film)'
      );
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
});
