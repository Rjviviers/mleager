import axios from 'axios';

// Spotify API Configuration
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';

// Rate limiting configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_TRACKS_PER_REQUEST = 100;

class SpotifyClient {
  constructor() {
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Get credentials (lazy loading to allow env vars to be set after import)
   */
  getCredentials() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId.includes('your_spotify_client')) {
      throw new Error('Spotify credentials not configured. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env file');
    }

    return { clientId, clientSecret };
  }

  /**
   * Authenticate with Spotify using Client Credentials flow
   */
  async authenticate() {
    // Check if token is still valid
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const { clientId, clientSecret } = this.getCredentials();

    try {
      const response = await axios.post(
        SPOTIFY_TOKEN_URL,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiration 5 minutes before actual expiration for safety
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;

      console.log('✅ Spotify authentication successful');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Spotify authentication failed:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Spotify API');
    }
  }

  /**
   * Make a request to Spotify API with retry logic
   */
  async makeRequest(url, retryCount = 0) {
    try {
      const token = await this.authenticate();

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      // Handle rate limiting (429)
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '1');
        console.warn(`⚠️  Rate limited. Retrying after ${retryAfter} seconds...`);

        if (retryCount < MAX_RETRIES) {
          await this.sleep(retryAfter * 1000);
          return this.makeRequest(url, retryCount + 1);
        }
      }

      // Handle token expiration (401)
      if (error.response?.status === 401 && retryCount < MAX_RETRIES) {
        console.warn('⚠️  Token expired, re-authenticating...');
        this.accessToken = null;
        return this.makeRequest(url, retryCount + 1);
      }

      // Handle server errors with exponential backoff
      if (error.response?.status >= 500 && retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.warn(`⚠️  Server error (${error.response.status}). Retrying in ${delay}ms...`);
        await this.sleep(delay);
        return this.makeRequest(url, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Convert Spotify URI to track ID
   */
  uriToId(spotifyUri) {
    // spotify:track:2gZUPNdnz5Y45eiGxpHGSc -> 2gZUPNdnz5Y45eiGxpHGSc
    return spotifyUri.split(':').pop();
  }

  /**
   * Fetch audio features for a single track
   */
  async getAudioFeatures(spotifyUri) {
    const trackId = this.uriToId(spotifyUri);
    const url = `${SPOTIFY_API_BASE_URL}/audio-features/${trackId}`;

    try {
      const data = await this.makeRequest(url);
      return this.formatAudioFeatures(data, spotifyUri);
    } catch (error) {
      console.error(`❌ Failed to fetch audio features for ${spotifyUri}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch audio features for multiple tracks in batch
   */
  async getBatchAudioFeatures(spotifyUris) {
    const trackIds = spotifyUris.map(uri => this.uriToId(uri)).join(',');
    const url = `${SPOTIFY_API_BASE_URL}/audio-features?ids=${trackIds}`;

    try {
      const data = await this.makeRequest(url);
      return data.audio_features
        .map((features, index) => {
          if (!features) {
            console.warn(`⚠️  No audio features found for ${spotifyUris[index]}`);
            return null;
          }
          return this.formatAudioFeatures(features, spotifyUris[index]);
        })
        .filter(Boolean);
    } catch (error) {
      console.error('❌ Failed to fetch batch audio features:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Response:', JSON.stringify(error.response.data, null, 2));
      }
      return [];
    }
  }

  /**
   * Fetch audio features for all tracks with batching
   */
  async getAllAudioFeatures(spotifyUris, onProgress = null) {
    const allFeatures = [];
    const batches = this.chunkArray(spotifyUris, MAX_TRACKS_PER_REQUEST);

    console.log(`📊 Fetching audio features for ${spotifyUris.length} tracks in ${batches.length} batches...`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} tracks)...`);

      const features = await this.getBatchAudioFeatures(batch);
      allFeatures.push(...features);

      if (onProgress) {
        onProgress({
          current: (i + 1) * MAX_TRACKS_PER_REQUEST,
          total: spotifyUris.length,
          percentage: Math.round(((i + 1) / batches.length) * 100)
        });
      }

      // Small delay between batches to be nice to the API
      if (i < batches.length - 1) {
        await this.sleep(100);
      }
    }

    console.log(`✅ Successfully fetched ${allFeatures.length}/${spotifyUris.length} audio features`);
    return allFeatures;
  }

  /**
   * Format audio features for database storage
   */
  formatAudioFeatures(rawFeatures, spotifyUri) {
    return {
      spotifyUri,
      // Audio features (0.0 to 1.0)
      energy: rawFeatures.energy,
      danceability: rawFeatures.danceability,
      valence: rawFeatures.valence,
      acousticness: rawFeatures.acousticness,
      instrumentalness: rawFeatures.instrumentalness,
      liveness: rawFeatures.liveness,
      speechiness: rawFeatures.speechiness,
      // Musical attributes
      tempo: rawFeatures.tempo,
      key: rawFeatures.key,
      mode: rawFeatures.mode,
      time_signature: rawFeatures.time_signature,
      loudness: rawFeatures.loudness,
      // Track info
      duration_ms: rawFeatures.duration_ms,
      // Metadata
      fetchedAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * Utility: Split array into chunks
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Utility: Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const spotifyClient = new SpotifyClient();

// Export convenience functions
export async function fetchAudioFeatures(spotifyUri) {
  return spotifyClient.getAudioFeatures(spotifyUri);
}

export async function fetchBatchAudioFeatures(spotifyUris) {
  return spotifyClient.getBatchAudioFeatures(spotifyUris);
}

export async function fetchAllAudioFeatures(spotifyUris, onProgress = null) {
  return spotifyClient.getAllAudioFeatures(spotifyUris, onProgress);
}

