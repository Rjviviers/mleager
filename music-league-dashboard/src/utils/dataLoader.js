import Papa from 'papaparse';

export const loadCSV = async (filePath) => {
  const response = await fetch(filePath);
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error),
    });
  });
};

export const loadAllData = async () => {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const data = await response.json();

    // Convert metadata object back to Map for compatibility with existing components
    if (data.metadata) {
      data.metadata = new Map(Object.entries(data.metadata));
    }

    return data;
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
};

// Extract genre from Spotify URI (simplified - in real app would use Spotify API)
export const extractGenreFromArtist = (artist) => {
  const genreMap = {
    'Kanye West': 'Hip Hop',
    'Survivor': 'Rock',
    'Limp Bizkit': 'Nu Metal',
    'Rage Against The Machine': 'Rock',
    'Avenged Sevenfold': 'Metal',
    'Justice': 'Electronic',
    'Mötley Crüe': 'Rock',
    'Far East Movement': 'Electronic',
    'P.O.D.': 'Nu Metal',
    'DJ Snake': 'Electronic',
    'LL COOL J': 'Hip Hop',
    'Ram Jam': 'Rock',
    'Drowning Pool': 'Nu Metal',
    'Pantera': 'Metal',
    'Foo Fighters': 'Rock',
  };

  return genreMap[artist] || 'Other';
};

// Mock popularity data (in real app would fetch from Spotify API)
export const getMockPopularity = (title) => {
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 30 + (hash % 70); // Returns a number between 30-100
};

