// src/app/liked/page.tsx
"use client"

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {Game} from '@/lib/db';

export default function LikedPage() {
    const [likedGames, setLikedGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('likedGames');
            if (saved) {
                const likedIds = JSON.parse(saved);
                if (likedIds.length > 0) {
                    fetchLikedGames(likedIds);
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        }
    }, []);

    async function fetchLikedGames(ids: number[]) {
        setLoading(true);
        try {
            const response = await fetch(`/api/games?ids=${ids.join(',')}`);
            if (!response.ok) {
                throw new Error('Failed to fetch liked games');
            }
            const data = await response.json();
            setLikedGames(data.games || []);
        } catch (error) {
            console.error('Error fetching liked games:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen p-4">
            <header className="flex items-center justify-between mb-6">
                <Link href="/" className="text-blue-500 hover:underline">
                    ← Back
                </Link>
                <h1 className="text-2xl font-bold text-center">Liked Games</h1>
                <Link href="/explore" className="text-blue-500 hover:underline">
                    Explore More
                </Link>
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : likedGames.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {likedGames.map((game) => (
                        <div key={game.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                            <div className="h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                {game.imageUrl ? (
                                    <img
                                        src={game.imageUrl}
                                        alt={game.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl">🎮</span>
                                )}
                            </div>
                            <div className="p-4">
                                <h2 className="text-xl font-bold mb-2">{game.name}</h2>

                                {/* Price */}
                                <div className="mb-2 text-blue-600 dark:text-blue-400 font-semibold">
                                    {game.original_price || "Free"}
                                </div>

                                {/* Genres */}
                                {game.genres && game.genres.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {game.genres.map((genre) => (
                                            <span key={genre}
                                                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                        {genre}
                      </span>
                                        ))}
                                    </div>
                                )}

                                {/* Description */}
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                    {game.game_description || "No description available."}
                                </p>

                                {/* Reviews */}
                                {game.all_reviews && (
                                    <div className="mt-2 text-sm border-t pt-2 border-gray-200 dark:border-gray-700">
                                        <span className="font-semibold">Reviews:</span> {game.all_reviews}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <span className="text-5xl mb-4">👀</span>
                    <h3 className="text-xl font-bold mb-2">No liked games yet</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Start exploring and liking games to see them here
                    </p>
                    <Link href="/explore" className="px-4 py-2 bg-blue-500 text-white rounded-md">
                        Start Exploring
                    </Link>
                </div>
            )}
        </div>
    );
}