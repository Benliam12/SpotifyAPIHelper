export interface Album {
    id: string;
    name: string;
    market: string;
    album_type: string;
    total_tracks: number;
    data?: any;
}

export interface Track{
    
}

export interface Artist {

}

export interface ClientToken{
    access_token: string;
    token_type: string;
    expires_at: Date;
}

export enum SearchType{
    ALBUM = "album",
    ARTIST = "artist",
    TRACK = "track",
    PLAYLIST = "playlist"
}