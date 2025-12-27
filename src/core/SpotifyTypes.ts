export interface Album {
    id: string;
    name: string;
    market: string;
    album_type: string;
    total_tracks: number;
    available_markets: string[];
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