export interface Album {
  id: string;
  name: string;
  album_type: string;
  total_tracks: number;
  data: any;
}

export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: Album;
  data: any;
}

export interface Artist {
  id: string;
  name: string;
  data: any;
}

export interface ClientToken {
  access_token: string;
  token_type: string;
  expires_at: Date;
}

export interface UserToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: Date;
  scope: string;
}

export enum SearchType {
  ALBUM = 'album',
  ARTIST = 'artist',
  TRACK = 'track',
  PLAYLIST = 'playlist',
}

export enum SpotifyScope {
  // Images
  UGC_IMAGE_UPLOAD = 'ugc-image-upload',

  // Spotify Connect
  USER_READ_PLAYBACK_STATE = 'user-read-playback-state',
  USER_MODIFY_PLAYBACK_STATE = 'user-modify-playback-state',
  USER_READ_CURRENTLY_PLAYING = 'user-read-currently-playing',

  // Playback
  STREAMING = 'streaming',
  APP_REMOTE_CONTROL = 'app-remote-control',

  // Users
  USER_READ_EMAIL = 'user-read-email',
  USER_READ_PRIVATE = 'user-read-private',

  // Playlists
  PLAYLIST_READ_COLLABORATIVE = 'playlist-read-collaborative',
  PLAYLIST_MODIFY_PUBLIC = 'playlist-modify-public',
  PLAYLIST_READ_PRIVATE = 'playlist-read-private',
  PLAYLIST_MODIFY_PRIVATE = 'playlist-modify-private',

  // Library
  USER_LIBRARY_MODIFY = 'user-library-modify',
  USER_LIBRARY_READ = 'user-library-read',

  // Listening History
  USER_TOP_READ = 'user-top-read',
  USER_READ_RECENTLY_PLAYED = 'user-read-recently-played',
  USER_READ_PLAYBACK_POSITION = 'user-read-playback-position',

  // Follow
  USER_FOLLOW_READ = 'user-follow-read',
  USER_FOLLOW_MODIFY = 'user-follow-modify',
}
