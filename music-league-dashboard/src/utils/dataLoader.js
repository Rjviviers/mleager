import Papa from 'papaparse';
import { LeagueResponseSchema, CompetitorResponseSchema, RoundResponseSchema, SubmissionResponseSchema, VoteResponseSchema } from '../schemas/api';

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

export const fetchLeagues = async () => {
  const response = await fetch('/api/leagues');
  if (!response.ok) throw new Error('Failed to fetch leagues');
  return response.json();
};

export const fetchLeagueDetails = async (leagueId) => {
  const response = await fetch(`/api/leagues/${leagueId}`);
  if (!response.ok) throw new Error('Failed to fetch league details');
  return response.json();
};

export const fetchRoundDetails = async (roundId) => {
  const response = await fetch(`/api/rounds/${roundId}`);
  if (!response.ok) throw new Error('Failed to fetch round details');
  return response.json();
};

export const fetchOverviewStats = async () => {
  const response = await fetch('/api/stats/overview');
  if (!response.ok) throw new Error('Failed to fetch overview stats');
  return response.json();
};

export const fetchAllSongs = async () => {
  const response = await fetch('/api/songs');
  if (!response.ok) throw new Error('Failed to fetch songs');
  return response.json();
};

export const fetchLeagueAnalytics = async (leagueId) => {
  const response = await fetch(`/api/stats/league/${leagueId}`);
  if (!response.ok) throw new Error('Failed to fetch league analytics');
  return response.json();
};
