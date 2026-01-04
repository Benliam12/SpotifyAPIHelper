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

export enum SearchType {
  ALBUM = 'album',
  ARTIST = 'artist',
  TRACK = 'track',
  PLAYLIST = 'playlist',
}
