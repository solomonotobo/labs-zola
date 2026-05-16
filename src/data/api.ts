import type { UserDataset } from './types';

const API_BASE_URL = import.meta.env.VITE_DATA_API_URL;

export async function listRemoteDatasets(): Promise<UserDataset[]> {
  if (!API_BASE_URL) return [];

  const response = await fetch(`${API_BASE_URL}/datasets`);
  if (!response.ok) {
    throw new Error(`Unable to load datasets: ${response.status}`);
  }

  return (await response.json()) as UserDataset[];
}

export async function uploadDataset(file: File): Promise<UserDataset> {
  if (!API_BASE_URL) {
    throw new Error('Set VITE_DATA_API_URL before uploading datasets to an API.');
  }

  const body = new FormData();
  body.append('file', file);

  const response = await fetch(`${API_BASE_URL}/datasets`, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    throw new Error(`Dataset upload failed: ${response.status}`);
  }

  return (await response.json()) as UserDataset;
}

