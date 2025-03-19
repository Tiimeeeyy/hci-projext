// src/lib/db.ts
import fs from 'fs';
import path from 'path';
import {parse} from 'csv-parse/sync';

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
    // other game properties
};

let games: Game[] = [];

export async function loadGames() {
    // Only load once
    if (games.length > 0) return;

    try {
        const filePath = path.join(process.cwd(), 'data', 'steam_games.csv');
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true
        });

        // Filter records to only include those with type "app"
        const filteredRecords = records.filter((record: {
            types: {
                split: (arg0: string) => {
                    (): any;
                    new(): any;
                    map: { (arg0: (t: any) => any): never[]; new(): any; };
                };
            };
        }) => {
            const types = record.types?.split(',').map(t => t.trim()) || [];
            // @ts-ignore
            return types.includes('app');
        });

        // Assign IDs to each game (index + 1 as ID)
        // src/lib/db.ts
        // In the loadGames function, fix the mapping part:

        games = filteredRecords.map((record: {
            url: any;
            name: any;
            game_description: any;
            original_price: any;
            all_reviews: any;
            genres: string;
            types: string;
            header_image: any;
        }, index: number) => ({
            id: index + 1,
            name: record.name || '',
            game_description: record.game_description || '',
            original_price: record.original_price || '',
            all_reviews: record.all_reviews || '',
            // Handle genres correctly
            genres: record.genres?.split(',').map(g => g.trim()) || [],
            types: record.types?.split(',').map(t => t.trim()) || [],
            url: record.url || '' // Fixed the syntax error here
        }));

        console.log(`Loaded ${games.length} games of type 'app'`);

    } catch (error) {
        console.error('Error loading games:', error);
        games = [];
    }
}

// Add this to src/lib/db.ts
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
    // Make sure games are loaded
    await loadGames();

    // Filter games based on search and excludeIds
    let filteredGames = [...games];

    // Filter by excludeIds
    if (excludeIds.length > 0) {
        filteredGames = filteredGames.filter(game => !excludeIds.includes(game.id));
    }

    // Filter by search term
    if (filters.search) {
        const searchRegex = new RegExp(filters.search, 'i');
        filteredGames = filteredGames.filter(game =>
            searchRegex.test(game.name)
        );
    }

    // Get total count before pagination
    const totalCount = filteredGames.length;

    // Randomize if needed
    if (randomize) {
        filteredGames = shuffleArray(filteredGames);
    }

    // Apply pagination
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

export function getGamesByIds(ids: number[]): Game[] {
    return games.filter(game => ids.includes(game.id));
}