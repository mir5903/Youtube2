import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';

    const searchHistory = await sql`
      SELECT DISTINCT query, MAX(searched_at) as last_searched
      FROM search_history
      WHERE user_id = ${userId}
      GROUP BY query
      ORDER BY last_searched DESC
      LIMIT ${limit}
    `;

    return Response.json({ searchHistory });
  } catch (error) {
    console.error('Error fetching search history:', error);
    return Response.json({ error: 'Failed to fetch search history' }, { status: 500 });
  }
}