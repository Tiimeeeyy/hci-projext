// src/app/api/games/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {getGames, getGamesByIds, loadGames} from '@/lib/db';

export async function GET(request: NextRequest) {
    await loadGames();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const ids = searchParams.get('ids');
    const excludeIds = searchParams.get('excludeIds');
    const randomize = searchParams.get('random') === 'true';
    const search = searchParams.get('search') || '';

    // Handle specific game IDs request
    if (ids) {
        const gameIds = ids.split(',').map(id => parseInt(id));
        const games = getGamesByIds(gameIds);
        return NextResponse.json({games});
    }

    // Convert excludeIds to array if provided
    const excludeGameIds = excludeIds
        ? excludeIds.split(',').map(id => parseInt(id))
        : [];

    // Add search filter
    const filters = {
        search: undefined
    };
    if (search) {
        // @ts-ignore
        filters.search = search;
    }

    const result = getGames(page, limit, filters, excludeGameIds, randomize);
    return NextResponse.json(result);
}