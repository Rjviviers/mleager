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

// Helpers removed: extractGenreFromArtist, getMockPopularity
// These are no longer needed as the backend provides real data.

