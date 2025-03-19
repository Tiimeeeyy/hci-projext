// scripts/process-csv.js
const fs = require('fs');
const path = require('path');
const {parse} = require('csv-parse/sync');

// Process CSV to JSON during build
function processCSV() {
    const csvPath = path.join(process.cwd(), 'data', 'steam_games.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');

    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
    });

    const processedData = records.map(record => ({
        id: parseInt(record.id || '0'),
        name: record.name || 'Unknown',
        // Process other fields
    }));

    const outputPath = path.join(process.cwd(), 'public', 'data', 'games.json');
    fs.mkdirSync(path.dirname(outputPath), {recursive: true});
    fs.writeFileSync(outputPath, JSON.stringify(processedData));

    console.log(`Processed ${processedData.length} games to JSON`);
}

processCSV();