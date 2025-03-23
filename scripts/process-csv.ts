// scripts/process-csv.ts
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Define Game type for TypeScript support
type Game = {
  id: number;
  name: string;
  game_description?: string;
  original_price?: string;
  all_reviews?: string;
  genres?: string[];
  types?: string[];
  url?: string;
};

// Process CSV to JSON during build
function processCSV() {
  try {
    const csvPath = path.join(process.cwd(), 'data', 'steam_games.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');

    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    // Filter and process records like in db.ts
    const filteredRecords = records.filter((record: any) => {
      const types = record.types?.split(',').map((t: string) => t.trim()) || [];
      return types.includes('app');
    });

    const processedGames = filteredRecords.map((record: any, index: number) => ({
      id: index + 1,
      name: record.name || '',
      game_description: record.game_description || '',
      original_price: record.original_price || '',
      all_reviews: record.all_reviews || '',
      genres: record.genres?.split(',').map((g: string) => g.trim()) || [],
      types: record.types?.split(',').map((t: string) => t.trim()) || [],
      url: record.url || ''
    }));

    // Create public/data directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the processed data to a JSON file
    const outputPath = path.join(outputDir, 'games.json');
    fs.writeFileSync(outputPath, JSON.stringify(processedGames));

    console.log(`Processed ${processedGames.length} games to JSON`);
  } catch (error) {
    console.error('Error processing CSV:', error);
    process.exit(1);
  }
}

processCSV();