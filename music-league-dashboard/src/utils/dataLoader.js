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

// New granular fetch functions with validation

export const fetchLeagues = async () => {
  const response = await fetch('/api/leagues');
  if (!response.ok) throw new Error('Failed to fetch leagues');
  const data = await response.json();
  return LeagueResponseSchema.parse(data);
};

export const fetchCompetitors = async (leagueId) => {
  const response = await fetch(`/api/competitors/${leagueId}`);
  if (!response.ok) throw new Error('Failed to fetch competitors');
  const data = await response.json();
  return CompetitorResponseSchema.parse(data);
};

export const fetchRounds = async (leagueId) => {
  const response = await fetch(`/api/rounds/${leagueId}`);
  if (!response.ok) throw new Error('Failed to fetch rounds');
  const data = await response.json();
  return RoundResponseSchema.parse(data);
};

export const fetchSubmissions = async (roundId) => {
  const response = await fetch(`/api/submissions/${roundId}`);
  if (!response.ok) throw new Error('Failed to fetch submissions');
  const data = await response.json();
  // Note: Validation might fail if backend returns extra fields not in schema and schema is strict.
  // Zod default is to strip unknown keys.
  return SubmissionResponseSchema.parse(data);
};

export const fetchVotes = async (roundId) => {
  const response = await fetch(`/api/votes/${roundId}`);
  if (!response.ok) throw new Error('Failed to fetch votes');
  const data = await response.json();
  return VoteResponseSchema.parse(data);
};
