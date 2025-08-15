import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const userId = searchParams.get('user_id');
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';

    if (!query) {
      return Response.json({ videos: [] });
    }

    let videos = [];
    const lowerQuery = query.toLowerCase();

    // Special handling for NEET queries
    if (lowerQuery === 'neet') {
      videos = await sql`
        SELECT * FROM videos 
        WHERE video_type = 'long' AND LOWER(category) = 'neet'
        ORDER BY view_count DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else if (lowerQuery === 'neet shorts') {
      videos = await sql`
        SELECT * FROM videos 
        WHERE video_type = 'short' AND LOWER(category) = 'neet'
        ORDER BY view_count DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      // General search
      videos = await sql`
        SELECT * FROM videos 
        WHERE 
          LOWER(title) LIKE LOWER(${'%' + query + '%'}) OR 
          LOWER(description) LIKE LOWER(${'%' + query + '%'}) OR
          LOWER(category) LIKE LOWER(${'%' + query + '%'})
        ORDER BY view_count DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    // Save search history if user_id provided
    if (userId) {
      try {
        await sql`
          INSERT INTO search_history (user_id, query)
          VALUES (${userId}, ${query})
        `;
      } catch (error) {
        console.error('Error saving search history:', error);
      }
    }

    return Response.json({ videos, query });
  } catch (error) {
    console.error('Error searching videos:', error);
    return Response.json({ error: 'Failed to search videos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user_id, query } = await request.json();

    if (!user_id || !query) {
      return Response.json({ error: 'User ID and query are required' }, { status: 400 });
    }

    await sql`
      INSERT INTO search_history (user_id, query)
      VALUES (${user_id}, ${query})
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving search history:', error);
    return Response.json({ error: 'Failed to save search history' }, { status: 500 });
  }
}