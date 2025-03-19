// src/app/profile/page.tsx
"use client"

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';

export default function ProfilePage() {
    const [likedGames, setLikedGames] = useState<number[]>([]);
    const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [libraryGames, setLibraryGames] = useState<number[]>([]);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLibrary = localStorage.getItem('libraryGames');
            setLibraryGames(savedLibrary ? JSON.parse(savedLibrary) : []);
            const savedLikes = localStorage.getItem('likedGames');
            const savedViewed = localStorage.getItem('viewedGames');

            setLikedGames(savedLikes ? JSON.parse(savedLikes) : []);
            setRecentlyViewed(savedViewed ? JSON.parse(savedViewed) : []);
            setLoading(false);
        }
    }, []);

    const resetLikes = () => {
        if (confirm('Are you sure you want to reset all your liked games?')) {
            localStorage.removeItem('likedGames');
            setLikedGames([]);
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen p-4">
            <header className="flex items-center justify-between mb-6">
                <Link href="/" className="text-blue-500 hover:underline">
                    ← Back to Home
                </Link>
                <h1 className="text-2xl font-bold text-center">Your Profile</h1>
                <div className="w-20"></div>
                {/* Spacer for balance */}
            </header>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Profile Stats */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-4">Your Stats</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
                                <span className="block text-3xl font-bold">{likedGames.length}</span>
                                <span className="text-gray-600 dark:text-gray-300">Liked Games</span>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
                                <span className="block text-3xl font-bold">{recentlyViewed.length}</span>
                                <span className="text-gray-600 dark:text-gray-300">Recently Viewed</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                        <div className="flex flex-col space-y-3">
                            <Link href="/liked"
                                  className="px-4 py-3 bg-blue-500 text-white rounded-md text-center hover:bg-blue-600">
                                View Liked Games
                            </Link>
                            <Link href="/explore"
                                  className="px-4 py-3 bg-green-500 text-white rounded-md text-center hover:bg-green-600">
                                Discover New Games
                            </Link>
                            <button
                                onClick={resetLikes}
                                className="px-4 py-3 bg-red-500 text-white rounded-md hover:bg-red-600"
                            >
                                Reset All Likes
                            </button>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-4">Your Game Library</h2>
                        {libraryGames.length > 0 ? (
                            <p className="text-gray-600 dark:text-gray-300">
                                You have {libraryGames.length} games in your personal library.
                                <Link href="/library" className="text-blue-500 hover:underline ml-1">
                                    View and edit
                                </Link>
                            </p>
                        ) : (
                            <div className="text-center p-8">
                                <span className="block text-5xl mb-3">📚</span>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    Your personal game library is empty. Add games you own!
                                </p>
                                <Link href="/library" className="px-4 py-2 bg-blue-500 text-white rounded-md">
                                    Build Your Library
                                </Link>
                            </div>
                        )}
                    </div>
                    {/* Game Library (Placeholder) */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-4">Your Game Library</h2>
                        {likedGames.length > 0 ? (
                            <p className="text-gray-600 dark:text-gray-300">
                                You have {likedGames.length} games in likes.
                                <Link href="/liked" className="text-blue-500 hover:underline ml-1">
                                    View all
                                </Link>
                            </p>
                        ) : (
                            <div className="text-center p-8">
                                <span className="block text-5xl mb-3">📚</span>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    Your game library is empty. Start exploring and liking games!
                                </p>
                                <Link href="/explore" className="px-4 py-2 bg-blue-500 text-white rounded-md">
                                    Explore Games
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}