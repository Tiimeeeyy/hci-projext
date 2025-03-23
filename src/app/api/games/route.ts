// src/app/api/games/route.ts
import {NextRequest, NextResponse} from "next/server";
import {getGames, getGamesByIds} from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);

    // Check if we're requesting specific game IDs
    const idsParam = searchParams.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',').map(id => parseInt(id));
      const gamesByIds = await getGamesByIds(ids);

      return NextResponse.json({
        games: gamesByIds,
        total: gamesByIds.length,
        hasMore: false
      });
    }

    // If not fetching by IDs, use the normal pagination/filtering logic
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const random = searchParams.get('random') === 'true';

    const excludeIdsParam = searchParams.get('excludeIds') || '';
    const excludeIds = excludeIdsParam ?
        excludeIdsParam.split(',').map(id => parseInt(id)) : [];

    const result = await getGames(
        page,
        limit,
        {search},
        excludeIds,
        random
    );

    if (!result || !result.games) {
      return NextResponse.json({
        games: [],
        total: 0,
        hasMore: false
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
        {error: 'Failed to fetch games', games: [], total: 0, hasMore: false},
        {status: 500}
    );
  }
}