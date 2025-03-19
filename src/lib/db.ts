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

// Add to src/lib/db.ts
export function getGames(
    page: number = 1,
    limit: number = 20,
    filters: any = {},
    excludeIds: number[] = [],
    randomize: boolean = false
) {
    // Filter out excluded games
    let filteredGames = games.filter(game => !excludeIds.includes(game.id));

    // Apply search if provided
    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredGames = filteredGames.filter(game => {
            // Search in name
            const nameMatch = game.name.toLowerCase().includes(searchTerm);
            // Search in genres
            const genreMatch = game.genres?.some(genre =>
                genre.toLowerCase().includes(searchTerm)
            );
            // Search in description
            const descriptionMatch = game.game_description?.toLowerCase().includes(searchTerm);

            return nameMatch || genreMatch || descriptionMatch;
        });
    }

    // Apply other filters
    if (filters.genres?.length) {
        filteredGames = filteredGames.filter(game =>
            game.genres?.some(genre => filters.genres.includes(genre))
        );
    }

    // Randomize if requested
    if (randomize) {
        filteredGames = shuffleArray(filteredGames);
    }

    // Calculate total before pagination
    const total = filteredGames.length;

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedGames = filteredGames.slice(startIndex, endIndex);

    return {
        total,
        page,
        limit,
        games: paginatedGames
    };
}

export function getGameById(id: number): Game | undefined {
    return games.find(game => game.id === id);
}

export function getGamesByIds(ids: number[]): Game[] {
    return games.filter(game => ids.includes(game.id));
}