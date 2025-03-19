// src/app/library/page.tsx
"use client"

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {Game} from '@/lib/db';

export default function LibraryPage() {
    const [libraryGames, setLibraryGames] = useState<number[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('libraryGames');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);

    // For edit mode
    const [allGames, setAllGames] = useState<Game[]>([]);
    const [filteredGames, setFilteredGames] = useState<Game[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalGames, setTotalGames] = useState(0);
    const [editModeLoading, setEditModeLoading] = useState(false);

    // Load library games
    useEffect(() => {
        async function fetchLibraryGames() {
            setLoading(true);
            if (libraryGames.length === 0) {
                setGames([]);
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/games?ids=${libraryGames.join(',')}`);
                const data = await response.json();
                setGames(data.games);
            } catch (error) {
                console.error('Error fetching library games:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchLibraryGames();
    }, [libraryGames]);

    // Load games for edit mode with search
    useEffect(() => {
        if (isEditMode) {
            setPage(1);
            fetchGamesList();
        }
    }, [isEditMode, searchQuery]);

    // Save library to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('libraryGames', JSON.stringify(libraryGames));
        }
    }, [libraryGames]);

    // Fetch games with server-side search
    async function fetchGamesList() {
        try {
            setEditModeLoading(true);
            const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
            const response = await fetch(`/api/games?page=1&limit=50${searchParam}`);
            const data = await response.json();

            setFilteredGames(data.games);
            setAllGames(data.games);
            setTotalGames(data.total);
        } catch (error) {
            console.error('Error fetching games:', error);
        } finally {
            setEditModeLoading(false);
        }
    }

    // Load more games function
    const loadMoreGames = async () => {
        if (editModeLoading) return;

        try {
            const nextPage = page + 1;
            setEditModeLoading(true);
            const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
            const response = await fetch(`/api/games?page=${nextPage}&limit=50${searchParam}`);
            const data = await response.json();

            setFilteredGames(prev => [...prev, ...data.games]);
            setAllGames(prev => [...prev, ...data.games]);
            setPage(nextPage);
        } catch (error) {
            console.error('Error loading more games:', error);
        } finally {
            setEditModeLoading(false);
        }
    };

    // Toggle game selection
    const toggleGameInLibrary = (gameId: number) => {
        setLibraryGames(prev => {
            if (prev.includes(gameId)) {
                return prev.filter(id => id !== gameId);
            } else {
                return [...prev, gameId];
            }
        });
    };

    const resetLibrary = () => {
        if (confirm('Are you sure you want to clear your game library?')) {
            setLibraryGames([]);
        }
    };

    return (
        <div className="min-h-screen p-4">
            <header className="flex items-center justify-between mb-6">
                <Link href="/" className="text-blue-500 hover:underline">
                    ← Back
                </Link>
                <h1 className="text-2xl font-bold text-center">Your Game Library</h1>
                <Link href="/profile" className="text-blue-500 hover:underline">
                    Profile
                </Link>
            </header>

            <div className="max-w-4xl mx-auto">
                {/* Mode toggle and actions */}
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                        {isEditMode ? "View Library" : "Edit Library"}
                    </button>

                    <div className="text-sm font-medium">
                        {libraryGames.length} games in your library
                    </div>

                    <button
                        onClick={resetLibrary}
                        className="px-4 py-2 bg-red-500 text-white rounded-md disabled:opacity-50"
                        disabled={libraryGames.length === 0}
                    >
                        Clear Library
                    </button>
                </div>

                {/* Main content based on mode */}
                {isEditMode ? (
                    // Edit Mode - Selection with checkboxes
                    <>
                        <div className="relative w-full mb-6">
                            <input
                                type="text"
                                placeholder="Search games by name or genre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                            {editModeLoading && filteredGames.length === 0 ? (
                                <div className="flex justify-center items-center h-40">
                                    <div
                                        className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-y-auto max-h-[70vh]">
                                        {filteredGames.length > 0 ? (
                                            filteredGames.map((game) => (
                                                <div
                                                    key={game.id}
                                                    className={`flex items-center p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                                                        libraryGames.includes(game.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={libraryGames.includes(game.id)}
                                                        onChange={() => toggleGameInLibrary(game.id)}
                                                        className="w-5 h-5 mr-3 accent-blue-500"
                                                    />

                                                    <div className="flex-1">
                                                        <h3 className="font-medium">{game.name}</h3>

                                                        <div
                                                            className="flex items-center text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                            <span
                                                                className="mr-3">{game.original_price || "Free"}</span>

                                                            {game.genres && game.genres.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {game.genres.slice(0, 2).map(genre => (
                                                                        <span key={genre}
                                                                              className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                                      {genre}
                                    </span>
                                                                    ))}
                                                                    {game.genres.length > 2 && (
                                                                        <span
                                                                            className="text-xs text-gray-500 dark:text-gray-400">
                                      +{game.genres.length - 2} more
                                    </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center p-8">
                                                <p className="text-gray-600 dark:text-gray-300">
                                                    No games match your search query
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Load more button */}
                                    {filteredGames.length > 0 && filteredGames.length < totalGames && (
                                        <div className="text-center py-4">
                                            <button
                                                onClick={loadMoreGames}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-md"
                                                disabled={editModeLoading}
                                            >
                                                {editModeLoading ? "Loading..." : "Load More Games"}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    // View Mode - Similar to liked games list
                    <>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div
                                    className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : games.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {games.map(game => (
                                    <div key={game.id}
                                         className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                                        <div
                                            className="h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
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
                                            <h3 className="font-bold text-lg truncate">{game.name}</h3>
                                            <div className="text-blue-600 dark:text-blue-400 text-sm mb-2">
                                                {game.original_price || "Free"}
                                            </div>

                                            {/* Genres */}
                                            {game.genres && game.genres.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {game.genres.slice(0, 3).map(genre => (
                                                        <span key={genre}
                                                              className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                              {genre}
                            </span>
                                                    ))}
                                                </div>
                                            )}

                                            <button
                                                onClick={() => toggleGameInLibrary(game.id)}
                                                className="mt-2 text-sm text-red-500 hover:text-red-700"
                                            >
                                                Remove from library
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                                <span className="block text-5xl mb-4">📚</span>
                                <h3 className="text-xl font-bold mb-2">Your library is empty</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    Add games to your library to keep track of games you own
                                </p>
                                <button
                                    onClick={() => setIsEditMode(true)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                                >
                                    Add Games to Library
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}