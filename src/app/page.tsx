// src/app/page.tsx
"use client"

import {useState} from "react";
import Link from "next/link";

export default function Home() {
    const [darkMode, setDarkMode] = useState(false);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header with app name and theme toggle */}
            <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
                <h1 className="text-2xl font-bold">GameFlex</h1>
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800"
                >
                    {darkMode ? "☀️" : "🌙"}
                </button>
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
                <h2 className="text-3xl font-bold text-center">
                    Rediscover your games library
                </h2>
                <p className="text-center max-w-md text-gray-600 dark:text-gray-300">
                    Find the perfect game based on your mood or discover new titles with our flexible game
                    recommendation system
                </p>

                {/* Main feature cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mt-4">
                    {/* Rediscover card */}
                    <Link href="/rediscover" className="group">
                        <div
                            className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 hover:shadow-lg transition-all h-full flex flex-col">
                            <div
                                className="bg-blue-500 text-white p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                                <span className="text-xl">🎮</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">Rediscover
                                Your Games</h3>
                            <p className="text-gray-600 dark:text-gray-300 flex-grow">
                                Find the perfect game from your library based on your current mood and preferences.
                            </p>
                            <span className="text-blue-600 dark:text-blue-400 mt-4 flex items-center">
                Get started <span className="ml-1">→</span>
              </span>
                        </div>
                    </Link>

                    {/* Explore card */}
                    <Link href="/explore" className="group">
                        <div
                            className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800 hover:shadow-lg transition-all h-full flex flex-col">
                            <div
                                className="bg-purple-500 text-white p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                                <span className="text-xl">🔍</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400">Explore
                                New Games</h3>
                            <p className="text-gray-600 dark:text-gray-300 flex-grow">
                                Discover new games with our Tinder-style swiping interface. Find your next favorite!
                            </p>
                            <span className="text-purple-600 dark:text-purple-400 mt-4 flex items-center">
                Start exploring <span className="ml-1">→</span>
              </span>
                        </div>
                    </Link>
                </div>

                {/* Additional options */}
                <div className="flex flex-wrap gap-4 mt-6 justify-center">
                    <Link href="/library"
                          className="text-sm text-gray-600 dark:text-gray-300 hover:underline flex items-center">
                        <span className="mr-1">📚</span> My Library
                    </Link>
                    <Link href="/settings"
                          className="text-sm text-gray-600 dark:text-gray-300 hover:underline flex items-center">
                        <span className="mr-1">⚙️</span> Settings
                    </Link>
                    <Link href="/profile"
                          className="block px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                        Your Profile
                    </Link>
                </div>
            </main>

            <footer className="p-4 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500">
                <p>GameFlex - Find the perfect game for your mood</p>
            </footer>
        </div>
    );
}