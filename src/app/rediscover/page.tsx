// src/app/rediscover/page.tsx
"use client"

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {Game} from '@/lib/db';

// Define types for MOOD_MAPPINGS
type MoodType = 'adventurous' | 'relaxed' | 'strategic' | 'competitive' | 'creative' | 'nostalgic' | 'social';
type MoodMappings = Record<MoodType, string[]>;

// Mood options with matching genres
const MOOD_MAPPINGS: MoodMappings = {
    adventurous: ['Action', 'Adventure', 'Open World'],
    relaxed: ['Casual', 'Simulation', 'Puzzle'],
    strategic: ['Strategy', 'Puzzle', 'RPG'],
    competitive: ['Sports', 'Racing', 'Fighting'],
    creative: ['Simulation', 'Building', 'Sandbox'],
    nostalgic: ['Retro', 'Platformer', 'Classic'],
    social: ['Multiplayer', 'Co-op', 'Massively Multiplayer'],
};

export default function RediscoverPage() {
    const [libraryGames, setLibraryGames] = useState<Game[]>([]);
    const [likedGames, setLikedGames] = useState<Game[]>([]);
    const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
    const [recommendations, setRecommendations] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);

    // Helper function to extract Steam ID and generate image URL
    const extractSteamIdAndImage = (url: string | undefined): { steamId: string | null, imageUrl: string | null } => {
        if (!url) return {steamId: null, imageUrl: null};

        // Match Steam store URLs like https://store.steampowered.com/app/123456/
        const match = url.match(/\/app\/(\d+)/);
        const steamId = match ? match[1] : null;

        // Construct Steam CDN image URL if we have a Steam ID
        const imageUrl = steamId ? `https://cdn.akamai.steamstatic.com/steam/apps/${steamId}/header.jpg` : null;

        return {steamId, imageUrl};
    };

    // Load library and liked games
    useEffect(() => {
        async function fetchUserGames() {
            setLoading(true);
            try {
                // Get library game IDs from localStorage
                const libraryIds = JSON.parse(localStorage.getItem('libraryGames') || '[]');
                // Get liked game IDs from localStorage
                const likedIds = JSON.parse(localStorage.getItem('likedGames') || '[]');

                if (libraryIds.length === 0) {
                    setLoading(false);
                    return;
                }

                // Fetch library games
                const libraryResponse = await fetch(`/api/games?ids=${libraryIds.join(',')}`);
                const libraryData = await libraryResponse.json();
                setLibraryGames(libraryData.games);

                // Fetch liked games if any
                if (likedIds.length > 0) {
                    const likedResponse = await fetch(`/api/games?ids=${likedIds.join(',')}`);
                    const likedData = await likedResponse.json();
                    setLikedGames(likedData.games);

                    // Extract favorite genres from liked games
                    analyzeFavoriteGenres(likedData.games);
                }
            } catch (error) {
                console.error('Error fetching games:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchUserGames();
    }, []);

    // Analyze liked games to find favorite genres
    const analyzeFavoriteGenres = (games: Game[]) => {
        const genreCounts: Record<string, number> = {};

        games.forEach(game => {
            if (game.genres) {
                game.genres.forEach(genre => {
                    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                });
            }
        });

        // Sort genres by frequency and take the top 5
        const sortedGenres = Object.entries(genreCounts)
            .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
            .slice(0, 5)
            .map(entry => entry[0]);

        setFavoriteGenres(sortedGenres);
    };

    // Generate recommendations based on mood and favorite genres
    const generateRecommendations = (mood: MoodType) => {
        setSelectedMood(mood);

        // Get genres that match the selected mood
        const moodGenres = MOOD_MAPPINGS[mood];

        // Score each library game
        const scoredGames = libraryGames.map(game => {
            let score = 0;
            const gameGenres = game.genres || [];
            let moodMatches = 0;

            // Score based on mood match
            gameGenres.forEach(genre => {
                if (moodGenres.includes(genre)) {
                    score += 3;
                    moodMatches++;
                }
            });

            // Extra points for multiple matches
            if (moodMatches > 1) {
                score += moodMatches * 2;
            }

            // Score based on favorite genres (secondary factor)
            gameGenres.forEach(genre => {
                if (favoriteGenres.includes(genre)) {
                    score += 1;
                }
            });

            return {game, score, moodMatches};
        });

        // Filter games with at least some mood match
        const moodMatchedGames = scoredGames
            .filter(item => item.moodMatches > 0)
            .sort((a, b) => b.score - a.score);

        let selectedGames: Game[] = [];

        if (moodMatchedGames.length >= 6) {
            // Get top 2 games for quality
            const topGames = moodMatchedGames.slice(0, 2).map(item => item.game);

            // Get random selection from next 15 games
            const candidatePool = moodMatchedGames.slice(2, Math.min(17, moodMatchedGames.length));
            const randomSelections = getRandomGames(candidatePool, 4);

            selectedGames = [...topGames, ...randomSelections];
        } else if (moodMatchedGames.length > 0) {
            // If we have some but not enough mood matches, use all of them
            // and fill the rest with random top-scored games
            const topGames = moodMatchedGames.map(item => item.game);
            const remainingCount = 6 - topGames.length;

            const otherCandidates = scoredGames
                .filter(item => item.moodMatches === 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, Math.min(15, scoredGames.length));

            const randomSelections = getRandomGames(otherCandidates, remainingCount);

            selectedGames = [...topGames, ...randomSelections];
        } else {
            // No mood matches at all, just get random games from the library
            selectedGames = getRandomGames(scoredGames, 6);
        }

        setRecommendations(selectedGames);
    };

    // Helper function to get random games from a pool
    const getRandomGames = (pool: { game: Game, score: number, moodMatches: number }[], count: number): Game[] => {
        const result: Game[] = [];

        // Clone the pool to avoid modifying the original
        const availableGames = [...pool];

        // Select random games
        for (let i = 0; i < count && availableGames.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * availableGames.length);
            result.push(availableGames[randomIndex].game);
            availableGames.splice(randomIndex, 1);
        }

        return result;
    };

    return (
        <div className="min-h-screen p-4">
            <header className="flex items-center justify-between mb-6">
                <Link href="/" className="text-blue-500 hover:underline">
                    ← Back
                </Link>
                <h1 className="text-2xl font-bold text-center">Rediscover Your Games</h1>
                <Link href="/library" className="text-blue-500 hover:underline">
                    Library
                </Link>
            </header>

            <div className="max-w-4xl mx-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : libraryGames.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                        <span className="block text-5xl mb-4">📚</span>
                        <h3 className="text-xl font-bold mb-2">Your library is empty</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Add games to your library first to get personalized recommendations
                        </p>
                        <Link href="/library" className="px-4 py-2 bg-blue-500 text-white rounded-md inline-block">
                            Go to Library
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                            <h2 className="text-xl font-bold mb-4">How are you feeling today?</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {(Object.keys(MOOD_MAPPINGS) as MoodType[]).map(mood => (
                                    <button
                                        key={mood}
                                        onClick={() => generateRecommendations(mood)}
                                        className={`px-4 py-3 rounded-lg capitalize transition-colors ${
                                            selectedMood === mood
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {mood}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedMood && (
                            <div className="mt-6">
                                <h2 className="text-xl font-bold mb-4">
                                    Recommended for your {selectedMood} mood
                                </h2>

                                {recommendations.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {recommendations.map(game => {
                                            const {steamId, imageUrl} = extractSteamIdAndImage(game.url);

                                            return (
                                                <div key={game.id}
                                                     className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                                                    <div
                                                        className="h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                        {imageUrl ? (
                                                            <img
                                                                src={imageUrl}
                                                                alt={game.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    // Fallback if image fails to load
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                    e.currentTarget.parentElement!.innerHTML = '<span class="text-4xl">🎮</span>';
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-4xl">🎮</span>
                                                        )}
                                                    </div>
                                                    <div className="p-4">
                                                        <h3 className="font-bold text-lg truncate">
                                                            {steamId ? (
                                                                <a
                                                                    href={`https://store.steampowered.com/app/${steamId}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                                                >
                                                                    {game.name}
                                                                </a>
                                                            ) : (
                                                                game.name
                                                            )}
                                                        </h3>
                                                        <div className="text-blue-600 dark:text-blue-400 text-sm mb-2">
                                                            {game.original_price || "Free"}
                                                        </div>

                                                        {/* Genres */}
                                                        {game.genres && game.genres.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mb-2">
                                                                {game.genres.slice(0, 3).map(genre => (
                                                                    <span
                                                                        key={genre}
                                                                        className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded-full"
                                                                    >
                                    {genre}
                                  </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
                                        <p>No games match your current mood. Try selecting a different mood or adding
                                            more games to your library.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}