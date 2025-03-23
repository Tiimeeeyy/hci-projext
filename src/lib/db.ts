// src/lib/db.ts
import fs from 'fs';
import path from 'path';

export type Game = {
  id: number;
  name: string;
  game_description?: string;
  original_price?: string;
  all_reviews?: string;
  genres?: string[];
  types?: string[];
  url?: string;
  imageUrl?: string;
};

let games: Game[] = [];

export async function loadGames() {
  if (games.length > 0) return;

  try {
    // In development, use the public/data/games.json file
    const filePath = path.join(process.cwd(), 'public', 'data', 'games.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    games = JSON.parse(fileContent);

    console.log(`Loaded ${games.length} games from pre-processed JSON`);
  } catch (error) {
    console.error('Error loading games from JSON:', error);
    games = [];
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function getGames(
  page: number = 1,
  limit: number = 10,
  filters: { search?: string } = {},
  excludeIds: number[] = [],
  randomize: boolean = false
) {
  await loadGames();

  let filteredGames = [...games];

  if (excludeIds.length > 0) {
    filteredGames = filteredGames.filter(game => !excludeIds.includes(game.id));
  }
  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    filteredGames = filteredGames.filter(game =>
      searchRegex.test(game.name)
    );
  }

  const totalCount = filteredGames.length;

  if (randomize) {
    filteredGames = shuffleArray(filteredGames);
  }

  const skip = (page - 1) * limit;
  const paginatedGames = filteredGames.slice(skip, skip + limit);

  return {
    games: paginatedGames,
    total: totalCount,
    hasMore: skip + limit < totalCount
  };
}

export function getGameById(id: number): Game | undefined {
  return games.find(game => game.id === id);
}

export async function getGamesByIds(ids: number[]): Promise<Game[]> {
  await loadGames();
  return games.filter(game => ids.includes(game.id));
}