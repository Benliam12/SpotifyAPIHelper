import { SpotifyConfiguration } from './SpotifyConfiguration.js';
import { Album, Track, Artist, ClientToken, UserToken, SearchType, SpotifyScope } from './SpotifyTypes.js';

/**
 * Result wrapper for operations that can fail
 */
export type SpotifyResult<T> = { success: true; data: T } | { success: false; error: string; statusCode?: number };

/**
 * Options for configuring the SpotifyHelper
 */
export interface SpotifyHelperOptions {
  /**
   * How long before token expiry to refresh (in milliseconds)
   * Default: 60000 (60 seconds)
   */
  tokenRefreshBufferMs?: number;

  /**
   * Callback for when errors occur (for logging/monitoring)
   */
  onError?: (error: SpotifyError) => void;

  /**
   * Whether to log errors to console
   * Default: false
   */
  logErrors?: boolean;
}

export interface SpotifyError {
  message: string;
  statusCode?: number;
  operation: string;
  timestamp: Date;
}

export class SpotifyHelper {
  config: SpotifyConfiguration;
  private clientToken: ClientToken | null = null;
  private tokenRefreshPromise: Promise<ClientToken | null> | null = null;
  private readonly options: Required<SpotifyHelperOptions>;

  constructor(config: SpotifyConfiguration, options: SpotifyHelperOptions = {}) {
    this.config = config;
    this.options = {
      tokenRefreshBufferMs: options.tokenRefreshBufferMs ?? 60000,
      onError: options.onError ?? (() => {}),
      logErrors: options.logErrors ?? false,
    };
  }

  /**
   * Initialize the helper by fetching the first token.
   * Returns true if successful, false otherwise.
   */
  async initialize(): Promise<boolean> {
    const token = await this.ensureValidToken();
    return token !== null;
  }

  /**
   * Ensures we have a valid token, refreshing if necessary.
   * Returns null if token fetch fails (instead of throwing).
   */
  private async ensureValidToken(): Promise<ClientToken | null> {
    // If there's already a refresh in progress, wait for it
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    // Check if we need to refresh
    const needsRefresh = !this.clientToken || this.isTokenExpiringSoon();

    if (needsRefresh) {
      // Start the refresh and store the promise
      this.tokenRefreshPromise = this.fetchNewToken();

      try {
        this.clientToken = await this.tokenRefreshPromise;
        return this.clientToken;
      } finally {
        // Clear the promise once done (success or failure)
        this.tokenRefreshPromise = null;
      }
    }

    // Token is still valid, return it
    return this.clientToken!;
  }

  /**
   * Checks if the token is expired or about to expire soon
   */
  private isTokenExpiringSoon(): boolean {
    if (!this.clientToken) {
      return true;
    }

    const now = new Date();
    const expiryTime = this.clientToken.expires_at.getTime();
    const currentTime = now.getTime();

    return currentTime >= expiryTime - this.options.tokenRefreshBufferMs;
  }

  /**
   * Fetches a new token from Spotify.
   * Returns null if fetch fails (instead of throwing).
   */
  private async fetchNewToken(): Promise<ClientToken | null> {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' + Buffer.from(this.config.clientId + ':' + this.config.clientSecret).toString('base64'),
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.handleError({
          message: `Failed to get token: ${response.status} ${response.statusText} - ${errorText}`,
          statusCode: response.status,
          operation: 'fetchNewToken',
          timestamp: new Date(),
        });
        return null;
      }

      const data: any = await response.json();

      if (!data.access_token || !data.expires_in) {
        this.handleError({
          message: 'Invalid token response from Spotify - missing access_token or expires_in',
          operation: 'fetchNewToken',
          timestamp: new Date(),
        });
        return null;
      }

      const token: ClientToken = {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_at: new Date(Date.now() + data.expires_in * 1000),
      };

      return token;
    } catch (error) {
      this.handleError({
        message: `Network error fetching token: ${error instanceof Error ? error.message : String(error)}`,
        operation: 'fetchNewToken',
        timestamp: new Date(),
      });
      return null;
    }
  }

  /**
   * Makes an authenticated request to the Spotify API.
   * Returns a result object instead of throwing.
   */
  private async makeAuthenticatedRequest<T>(
    url: string,
    operation: string,
    options: RequestInit = {}
  ): Promise<SpotifyResult<T>> {
    const token = await this.ensureValidToken();

    if (!token) {
      return {
        success: false,
        error: 'Failed to obtain valid authentication token',
      };
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token.access_token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.handleError({
          message: `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
          statusCode: response.status,
          operation,
          timestamp: new Date(),
        });

        return {
          success: false,
          error: `Request failed: ${response.status} ${response.statusText}`,
          statusCode: response.status,
        };
      }

      const data: any = await response.json();
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.handleError({
        message: `Network error during ${operation}: ${errorMessage}`,
        operation,
        timestamp: new Date(),
      });

      return {
        success: false,
        error: `Network error: ${errorMessage}`,
      };
    }
  }

  /**
   * Handle errors consistently - log and/or call callback
   */
  private handleError(error: SpotifyError): void {
    if (this.options.logErrors) {
      console.error(`[SpotifyHelper] ${error.operation}:`, error.message);
    }
    this.options.onError(error);
  }

  /**
   * Get an album by ID.
   * Returns null if the request fails.
   */
  async getAlbum(albumId: string): Promise<Album | null> {
    const result = await this.makeAuthenticatedRequest<any>(
      `https://api.spotify.com/v1/albums/${albumId}`,
      'getAlbum',
      { method: 'GET' }
    );

    if (!result.success) {
      return null;
    }

    const data = result.data;
    const album: Album = {
      id: data.id,
      name: data.name,
      album_type: data.album_type,
      total_tracks: data.total_tracks,
      data: data.data,
    };

    return album;
  }

  /**
   * Get a list of albums by their IDs.
   * @param albumIds
   * @returns
   * @throws Error if more than 20 IDs are provided (Spotify API limit)
   */
  async getAlbums(albumIds: string[]): Promise<(Album | null)[]> {
    const idsParam = albumIds.join(',');
    if (albumIds.length === 0) {
      return [];
    }

    if (albumIds.length > 20) {
      throw new Error('Spotify API allows a maximum of 20 album IDs per request.');
    }

    const result = await this.makeAuthenticatedRequest<any>(
      `https://api.spotify.com/v1/albums?ids=${idsParam}`,
      'getAlbums',
      { method: 'GET' }
    );

    if (result.success) {
      return result.data.map((data: any) => {
        if (!data) {
          return null;
        }
        const album: Album = {
          id: data.id,
          name: data.name,
          album_type: data.album_type,
          total_tracks: data.total_tracks,
          data: data.data,
        };
        return album;
      });
    }
    return [];
  }

  async getAlbumTracks(albumId: string, limit: number = 50, offset: number = 0): Promise<Track[] | null> {
    if (limit < 1 || limit > 50) {
      throw new Error('Limit must be between 1 and 50');
    }

    const result = await this.makeAuthenticatedRequest<any>(
      `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=${limit}&offset=${offset}`,
      'getAlbumTracks',
      { method: 'GET' }
    );
    if (!result.success) {
      return null;
    }

    const tracks: Track[] = result.data.items.map((item: any) => {
      const track: Track = {
        id: item.id,
        name: item.name,
        artists: item.artists.map((artistData: any) => {
          const { id, name, ...data } = artistData;
          const artist: Artist = {
            id: id,
            name: name,
            data: data,
          };
          return artist;
        }),
        album: {
          id: albumId,
          name: '',
          album_type: '',
          total_tracks: 0,
          data: {},
        },
        data: item,
      };
      return track;
    });

    return tracks;
  }

  /**
   * Get a track by ID.
   * Returns null if the request fails.
   */
  async getTrack(trackId: string): Promise<Track | null> {
    const result = await this.makeAuthenticatedRequest<any>(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      'getTrack',
      { method: 'GET' }
    );

    if (!result.success) {
      return null;
    } else {
      const { id, name, album_type, total_tracks, ...data } = result.data.album;
      const trackAlbumData: Album = {
        id: id,
        name: name,
        album_type: album_type,
        total_tracks: total_tracks,
        data: data,
      };

      const trackArtistData: Artist[] = result.data.artists.map((artistData: any) => {
        const { id, name, ...data } = artistData;
        const artist: Artist = {
          id: id,
          name: name,
          data: data,
        };
        return artist;
      });

      const trackData: Track = {
        id: result.data.id,
        name: result.data.name,
        artists: trackArtistData,
        album: trackAlbumData,
        data: result.data,
      };
      return trackData;
    }
  }

  /**
   * Get an artist by ID.
   * Returns null if the request fails.
   */
  async getArtist(artistId: string): Promise<Artist | null> {
    const result = await this.makeAuthenticatedRequest<any>(
      `https://api.spotify.com/v1/artists/${artistId}`,
      'getArtist',
      { method: 'GET' }
    );

    if (!result.success) {
      return null;
    }

    // Map to your Artist type based on your type definition
    // For now returning null as placeholder
    return null;
  }

  /**
   * Get a playlist by ID.
   * Returns null if the request fails.
   */
  async getPlaylist(playlistId: string): Promise<any | null> {
    const result = await this.makeAuthenticatedRequest<any>(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      'getPlaylist',
      { method: 'GET' }
    );

    if (!result.success) {
      return null;
    }

    return result.data;
  }

  /**
   * Get available markets.
   * Returns empty array if the request fails.
   */
  async getAvailableMarkets(): Promise<string[]> {
    const result = await this.makeAuthenticatedRequest<any>(
      `https://api.spotify.com/v1/markets`,
      'getAvailableMarkets',
      { method: 'GET' }
    );

    if (!result.success) {
      return [];
    }

    return result.data.markets || [];
  }

  async search(query: string, type: SearchType, limit: number = 20, offset: number = 0): Promise<any | null> {
    const result = await this.makeAuthenticatedRequest<any>(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}&offset=${offset}`,
      'search',
      { method: 'GET' }
    );

    if (!result.success) {
      return null;
    }

    return result.data;
  }

  // ─── Authorization Code Flow (User Token) ───

  /** Builds the Spotify authorization URL for user login. */
  getAuthorizationUrl(scopes: SpotifyScope[], state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(' '),
    });

    if (state) {
      params.set('state', state);
    }

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  /** Exchanges an authorization code for a UserToken. */
  async exchangeAuthCode(code: string): Promise<UserToken | null> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
    });

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' + Buffer.from(this.config.clientId + ':' + this.config.clientSecret).toString('base64'),
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.handleError({
          message: `Failed to exchange auth code: ${response.status} ${response.statusText} - ${errorText}`,
          statusCode: response.status,
          operation: 'exchangeAuthCode',
          timestamp: new Date(),
        });
        return null;
      }

      const data: any = await response.json();

      if (!data.access_token || !data.refresh_token) {
        this.handleError({
          message: 'Invalid token response - missing access_token or refresh_token',
          operation: 'exchangeAuthCode',
          timestamp: new Date(),
        });
        return null;
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type,
        expires_at: new Date(Date.now() + data.expires_in * 1000),
        scope: data.scope ?? '',
      };
    } catch (error) {
      this.handleError({
        message: `Network error exchanging auth code: ${error instanceof Error ? error.message : String(error)}`,
        operation: 'exchangeAuthCode',
        timestamp: new Date(),
      });
      return null;
    }
  }

  /** Refreshes an expired user token using its refresh token. */
  async refreshUserToken(refreshToken: string): Promise<UserToken | null> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' + Buffer.from(this.config.clientId + ':' + this.config.clientSecret).toString('base64'),
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.handleError({
          message: `Failed to refresh user token: ${response.status} ${response.statusText} - ${errorText}`,
          statusCode: response.status,
          operation: 'refreshUserToken',
          timestamp: new Date(),
        });
        return null;
      }

      const data: any = await response.json();

      if (!data.access_token) {
        this.handleError({
          message: 'Invalid refresh response - missing access_token',
          operation: 'refreshUserToken',
          timestamp: new Date(),
        });
        return null;
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token ?? refreshToken,
        token_type: data.token_type,
        expires_at: new Date(Date.now() + data.expires_in * 1000),
        scope: data.scope ?? '',
      };
    } catch (error) {
      this.handleError({
        message: `Network error refreshing user token: ${error instanceof Error ? error.message : String(error)}`,
        operation: 'refreshUserToken',
        timestamp: new Date(),
      });
      return null;
    }
  }

  // ─── User-Scoped API Methods ───

  /** Makes an API request using a user-provided token. */
  private async makeUserRequest<T>(
    url: string,
    userToken: UserToken,
    operation: string,
    options: RequestInit = {}
  ): Promise<SpotifyResult<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${userToken.access_token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.handleError({
          message: `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
          statusCode: response.status,
          operation,
          timestamp: new Date(),
        });

        return {
          success: false,
          error: `Request failed: ${response.status} ${response.statusText}`,
          statusCode: response.status,
        };
      }

      const data: any = await response.json();
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.handleError({
        message: `Network error during ${operation}: ${errorMessage}`,
        operation,
        timestamp: new Date(),
      });

      return {
        success: false,
        error: `Network error: ${errorMessage}`,
      };
    }
  }

  /** Get the current user's profile. Requires `user-read-private` scope. */
  async getCurrentUserProfile(userToken: UserToken): Promise<any | null> {
    const result = await this.makeUserRequest<any>('https://api.spotify.com/v1/me', userToken, 'getCurrentUserProfile');

    return result.success ? result.data : null;
  }

  /** Get the current user's playlists. Requires `playlist-read-private` scope. */
  async getUserPlaylists(userToken: UserToken, limit: number = 20, offset: number = 0): Promise<any | null> {
    const result = await this.makeUserRequest<any>(
      `https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`,
      userToken,
      'getUserPlaylists'
    );

    return result.success ? result.data : null;
  }

  /** Get the current user's top artists or tracks. Requires `user-top-read` scope. */
  async getUserTopItems(
    userToken: UserToken,
    type: 'artists' | 'tracks',
    limit: number = 20,
    offset: number = 0
  ): Promise<any | null> {
    const result = await this.makeUserRequest<any>(
      `https://api.spotify.com/v1/me/top/${type}?limit=${limit}&offset=${offset}`,
      userToken,
      'getUserTopItems'
    );

    return result.success ? result.data : null;
  }

  /** Get the current user's saved tracks. Requires `user-library-read` scope. */
  async getUserSavedTracks(userToken: UserToken, limit: number = 20, offset: number = 0): Promise<any | null> {
    const result = await this.makeUserRequest<any>(
      `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`,
      userToken,
      'getUserSavedTracks'
    );

    return result.success ? result.data : null;
  }

  /**
   * Check if the helper is properly authenticated.
   * Useful for health checks.
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.ensureValidToken();
    return token !== null;
  }

  /**
   * Manually clear the token (useful for testing or forcing a refresh).
   */
  clearToken(): void {
    this.clientToken = null;
  }

  /**
   * Get the current configuration.
   */
  getConfig(): SpotifyConfiguration {
    return this.config;
  }

  /**
   * Get token info for debugging (without exposing the actual token).
   */
  getTokenInfo(): {
    hasToken: boolean;
    expiresAt: Date | null;
    isExpiringSoon: boolean;
  } {
    return {
      hasToken: this.clientToken !== null,
      expiresAt: this.clientToken?.expires_at || null,
      isExpiringSoon: this.isTokenExpiringSoon(),
    };
  }
}
