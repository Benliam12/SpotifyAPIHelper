# Spotify API Helper
Help you use the Spotify API without having to implement everything. 


## Installation

1. Install this helper using `npm install @benliam12/spotify-api-helper`
2. Add the helper to your project.

Here is a quick example using NodeJS, and NodeJS, using Module type project. 
```javascript
import express from 'express'
import dotenv from 'dotenv'
import {SpotifyHelper, SpotifyConfiguration} from '@benliam12/spotify-api-helper'

dotenv.config();

const spotifyConfig = new SpotifyConfiguration({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

const spotifyHelperInstance = new SpotifyHelper(spotifyConfig, {onError: (error) => {
  console.error('Spotify API Error:', error);
}});

app.get('/', async (req, res) => {
  const trackData = await instance.getTrack("YOUR FAVORITE TRACK ID")
  res.send('Hello World!');
});

instance.initialize().then(() => {
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
})

```


## Contribution
Please open issues for any feature request or bug report. As for contributing directly to the project, feel free to make pull requests. 