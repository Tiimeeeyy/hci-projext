// Make sure your API route properly returns the data structure
// src/app/api/games/route.ts or similar
import {NextRequest, NextResponse} from "next/server";
import {getGames} from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const {searchParams} = new URL(request.url);
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

    // Ensure result is not undefined and has the expected structure
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