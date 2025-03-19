// src/app/explore/page.tsx
"use client"

import {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import Link from 'next/link';
import {Game} from '@/lib/db';

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

export default function ExplorePage() {
    const [games, setGames] = useState<Game[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [noMoreGames, setNoMoreGames] = useState(false);
    const [page, setPage] = useState(1);
    const [likedGames, setLikedGames] = useState<number[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('likedGames');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    // Define currentGame early for TypeScript
    const currentGame = games[currentIndex];

    // Fetch games when page changes or liked games change
    useEffect(() => {
        fetchGames(page);
    }, [page, likedGames.length]);

    // Save liked games to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('likedGames', JSON.stringify(likedGames));
        }
    }, [likedGames]);

    // Save current game to recently viewed
    useEffect(() => {
        if (currentGame?.id && typeof window !== 'undefined') {
            const recentlyViewed = JSON.parse(localStorage.getItem('viewedGames') || '[]');
            if (!recentlyViewed.includes(currentGame.id)) {
                const updatedViewed = [currentGame.id, ...recentlyViewed].slice(0, 10);
                localStorage.setItem('viewedGames', JSON.stringify(updatedViewed));
            }
        }
    }, [currentGame?.id]);

    async function fetchGames(pageNum: number) {
        setLoading(true);
        try {
            // Exclude already liked games
            const likedIds = likedGames.length > 0 ? `&excludeIds=${likedGames.join(',')}` : '';

            // Request randomized games
            const response = await fetch(`/api/games?page=${pageNum}&limit=10${likedIds}&random=true`);
            const data = await response.json();

            if (data.games.length === 0) {
                setNoMoreGames(true);
            } else {
                setNoMoreGames(false);
            }

            if (pageNum === 1) {
                setGames(data.games);
                setCurrentIndex(0);
            } else {
                setGames(prev => [...prev, ...data.games]);
            }
        } catch (error) {
            console.error('Error fetching games:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleLike() {
        if (currentGame) {
            setLikedGames(prev => [...prev, currentGame.id]);
        }
        nextCard();
    }

    function handlePass() {
        nextCard();
    }

    function nextCard() {
        // If there are fewer than 3 cards left, load more
        if (currentIndex >= games.length - 3 && !loading && !noMoreGames) {
            setPage(p => p + 1);
        }

        setCurrentIndex(i => i + 1);

        // If we've run out of cards and there are no more to load
        if (currentIndex >= games.length - 1) {
            if (noMoreGames) {
                // Reset if we've gone through all available games
                setCurrentIndex(games.length); // Set to beyond the array to show "no more games" screen
            }
        }
    }

    function resetExplore() {
        setCurrentIndex(0);
        setPage(1);
        fetchGames(1);
    }

    return (
        <div className="min-h-screen p-4">
            <header className="flex items-center justify-between mb-6">
                <Link href="/" className="text-blue-500 hover:underline">
                    ← Back
                </Link>
                <h1 className="text-2xl font-bold text-center">Explore Games</h1>
                <Link href="/liked" className="text-blue-500 hover:underline">
                    Liked ({likedGames.length})
                </Link>
            </header>

            <div className="relative h-[60vh] w-full max-w-md mx-auto">
                {loading && games.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : currentGame ? (
                    <motion.div
                        className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                        drag="x"
                        dragConstraints={{left: 0, right: 0}}
                        onDragEnd={(_, info) => {
                            if (info.offset.x > 100) {
                                handleLike();
                            } else if (info.offset.x < -100) {
                                handlePass();
                            }
                        }}
                        animate={{
                            x: 0,
                            rotateZ: 0
                        }}
                        whileDrag={{
                            scale: 1.05
                        }}
                    >
                        {(() => {
                            const {steamId, imageUrl} = extractSteamIdAndImage(currentGame.url);

                            return (
                                <>
                                    <div
                                        className="h-1/2 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={currentGame.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback if image fails to load
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    e.currentTarget.parentElement!.innerHTML = '<span class="text-6xl">🎮</span>';
                                                }}
                                            />
                                        ) : (
                                            <span className="text-6xl">🎮</span>
                                        )}
                                    </div>

                                    <div className="p-6">
                                        <h2 className="text-xl font-bold mb-2">
                                            {steamId ? (
                                                <a
                                                    href={`https://store.steampowered.com/app/${steamId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                                    onClick={(e) => e.stopPropagation()} // Prevent card interaction when clicking link
                                                >
                                                    {currentGame.name}
                                                </a>
                                            ) : (
                                                currentGame.name
                                            )}
                                        </h2>

                                        {/* Price */}
                                        <div className="mb-2 text-blue-600 dark:text-blue-400 font-semibold">
                                            {currentGame.original_price || "Free"}
                                        </div>

                                        {/* Genres */}
                                        {currentGame.genres && currentGame.genres.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {currentGame.genres.slice(0, 3).map((genre) => (
                                                    <span key={genre}
                                                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                            {genre}
                          </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Description */}
                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-2">
                                            {currentGame.game_description || "No description available."}
                                        </p>

                                        {/* Reviews */}
                                        {currentGame.all_reviews && (
                                            <div className="mt-2 text-sm">
                                                <span
                                                    className="font-semibold">Reviews:</span> {currentGame.all_reviews}
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </motion.div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                        <span className="text-5xl mb-4">🎉</span>
                        <h3 className="text-xl font-bold mb-2">You've seen all games!</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Check out your liked games or start over.
                        </p>
                        <button
                            onClick={resetExplore}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md"
                        >
                            Start Over
                        </button>
                    </div>
                )}

                {/* Card behind current card (preview of next) */}
                {games[currentIndex + 1] && currentGame && (
                    <div
                        className="absolute inset-0 -z-10 bg-white dark:bg-gray-800 rounded-xl shadow-md"
                        style={{transform: 'translateY(10px) scale(0.95)'}}
                    />
                )}

                {/* Action buttons */}
                {currentGame && (
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-8 pb-6 z-20">
                        <button
                            onClick={handlePass}
                            className="bg-red-500 text-white p-4 rounded-full shadow-lg hover:bg-red-600"
                        >
                            ✕
                        </button>
                        <button
                            onClick={handleLike}
                            className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600"
                        >
                            ✓
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Swipe right to like, left to pass</p>
            </div>
        </div>
    );
}