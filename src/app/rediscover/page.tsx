// src/app/rediscover/page.tsx
"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Game } from '@/lib/db';

// Define types for MOOD_MAPPINGS
type MoodType = 'adventurous' | 'relaxed' | 'strategic' | 'competitive' | 'creative' | 'nostalgic' | 'social';
type MoodMappings = Record<MoodType, string[]>;

// Type for scored game
interface ScoredGame {
  game: Game;
  score: number;
  moodMatches: number;
}

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
    if (!url) return { steamId: null, imageUrl: null };

    const match = url.match(/\/app\/(\d+)/);
    const steamId = match ? match[1] : null;

    // Construct Steam CDN image URL if we have a Steam ID
    const imageUrl = steamId ? `https://cdn.akamai.steamstatic.com/steam/apps/${steamId}/header.jpg` : null;

    return { steamId, imageUrl };
  };

  // Load library and liked games
  useEffect(() => {
    async function fetchUserGames() {
      setLoading(true);
      try {
        // Get library games from localStorage
        const libraryIds = localStorage.getItem('libraryGames');
        const parsedLibraryIds = libraryIds ? JSON.parse(libraryIds) : [];

        // Get liked games from localStorage
        const likedIds = localStorage.getItem('likedGames');
        const parsedLikedIds = likedIds ? JSON.parse(likedIds) : [];

        if (parsedLibraryIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch games from API
        const libraryResponse = await fetch(`/api/games?ids=${parsedLibraryIds.join(',')}`);
        const libraryData = await libraryResponse.json();
        setLibraryGames(libraryData.games || []);

        if (parsedLikedIds.length > 0) {
          const likedResponse = await fetch(`/api/games?ids=${parsedLikedIds.join(',')}`);
          const likedData = await likedResponse.json();
          setLikedGames(likedData.games || []);
          analyzeFavoriteGenres(likedData.games || []);
        }
      } catch (error) {
        console.error('Error fetching user games:', error);
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
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 5);

    setFavoriteGenres(sortedGenres);
  };

  // Helper function to get random games from a pool
  const getRandomGames = (pool: ScoredGame[], count: number): Game[] => {
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

  // Generate recommendations based on mood and favorite genres
  const generateRecommendations = (mood: MoodType) => {
    setSelectedMood(mood);

    // Get genres that match the selected mood
    const moodGenres = MOOD_MAPPINGS[mood];

    // Extract genres from liked games for influence
    const likedGameGenres = new Set<string>();
    likedGames.forEach(game => {
      if (game.genres) {
        game.genres.forEach(genre => likedGameGenres.add(genre));
      }
    });

    // Score each library game
    const scoredGames: ScoredGame[] = libraryGames.map(game => {
      let score = 0;
      const gameGenres = game.genres || [];
      let moodMatches = 0;

      // Primary factor: Mood match (significant weight)
      gameGenres.forEach(genre => {
        if (moodGenres.includes(genre)) {
          score += 10; // Strong weight for mood match
          moodMatches++;
        }
      });

      // Extra points for multiple mood matches
      if (moodMatches > 1) {
        score += moodMatches * 5; // Bonus for multiple mood matches
      }

      // Secondary factor: Match with liked games' genres
      gameGenres.forEach(genre => {
        if (likedGameGenres.has(genre)) {
          score += 3; // Secondary weight for liked genres
        }
      });

      // If the game has NO mood matches at all, severely penalize it
      if (moodMatches === 0) {
        score -= 30; // Strong penalty for no mood matches
      }

      return { game, score, moodMatches };
    });

    // Filter to ONLY include games with at least one mood match
    const moodMatchedGames = scoredGames
      .filter(item => item.moodMatches > 0)
      .sort((a, b) => b.score - a.score);

    let selectedGames: Game[] = [];

    if (moodMatchedGames.length >= 6) {
      // Get top 3 games for quality recommendations
      const topGames = moodMatchedGames.slice(0, 3).map(item => item.game);

      // Get random selection from next 12 games
      const candidatePool = moodMatchedGames.slice(3, Math.min(15, moodMatchedGames.length));
      const randomSelections = getRandomGames(candidatePool, 3);

      selectedGames = [...topGames, ...randomSelections];
    } else if (moodMatchedGames.length > 0) {
      // If we have some but not enough mood matches, use all of them
      selectedGames = moodMatchedGames.map(item => item.game);

      // Only if we absolutely need to, fill with other games
      if (selectedGames.length < 3) {
        const remainingCount = 3 - selectedGames.length;

        // Get games with highest scores even if no mood match
        const otherCandidates = scoredGames
          .filter(item => !moodMatchedGames.includes(item))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        const randomSelections = getRandomGames(otherCandidates, remainingCount);
        selectedGames = [...selectedGames, ...randomSelections];
      }
    } else {
      // No mood matches at all, just get random games from the library
      // This should rarely happen with the enhanced scoring system
      selectedGames = getRandomGames(scoredGames, 6);
    }

    setRecommendations(selectedGames);
  };

  // Get recommendation reason for display
  const getRecommendationReason = (game: Game): string => {
    if (!selectedMood) return "From your library";

    const gameGenres = game.genres || [];
    const moodGenres = MOOD_MAPPINGS[selectedMood];

    // Find matching genres between game and selected mood
    const matchingMoodGenres = gameGenres.filter(genre => moodGenres.includes(genre));

    // Find matching genres between game and liked games
    const matchingLikedGenres = gameGenres.filter(genre => favoriteGenres.includes(genre));

    if (matchingMoodGenres.length > 0) {
      return `Matches your ${selectedMood} mood with ${matchingMoodGenres.join(", ")}`;
    } else if (matchingLikedGenres.length > 0) {
      return `Similar to games you like (${matchingLikedGenres.join(", ")})`;
    } else {
      return "From your library";
    }
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : libraryGames.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center max-w-md mx-auto">
          <span className="block text-5xl mb-4">📚</span>
          <h3 className="text-xl font-bold mb-2">Your library is empty</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Add games to your library to get personalized recommendations
          </p>
          <Link href="/library" className="px-4 py-2 bg-blue-500 text-white rounded-md">
            Build Your Library
          </Link>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {!selectedMood ? (
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-6">How are you feeling today?</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {(Object.keys(MOOD_MAPPINGS) as MoodType[]).map((mood) => (
                    <button
                      key={mood}
                      onClick={() => generateRecommendations(mood)}
                      className="px-4 py-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-all text-center"
                    >
                      <div className="text-2xl mb-2">
                        {mood === 'adventurous' && '🌍'}
                        {mood === 'relaxed' && '☕'}
                        {mood === 'strategic' && '♟️'}
                        {mood === 'competitive' && '🏆'}
                        {mood === 'creative' && '🎨'}
                        {mood === 'nostalgic' && '🕹️'}
                        {mood === 'social' && '👥'}
                      </div>
                      <div className="font-medium capitalize">{mood}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  Your <span className="capitalize">{selectedMood}</span> Game Picks
                </h2>
                <button
                  onClick={() => setSelectedMood(null)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Choose Another Mood
                </button>
              </div>

              {recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map(game => {
                    const { steamId, imageUrl } = extractSteamIdAndImage(game.url);
                    const reason = getRecommendationReason(game);

                    return (
                      <div key={game.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                        <div className="h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={game.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
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

                          {/* Recommendation reason */}
                          <div className="text-sm text-green-600 dark:text-green-400 mb-2">
                            {reason}
                          </div>

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
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-300">
                    No matching games found for this mood. Try a different mood!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}