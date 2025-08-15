import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    const watchHistory = await sql`
      SELECT 
        wh.*,
        v.title,
        v.description,
        v.thumbnail_url,
        v.duration,
        v.video_type,
        v.category,
        v.view_count
      FROM watch_history wh
      JOIN videos v ON wh.video_id = v.id
      WHERE wh.user_id = ${userId}
      ORDER BY wh.watched_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return Response.json({ watchHistory });
  } catch (error) {
    console.error('Error fetching watch history:', error);
    return Response.json({ error: 'Failed to fetch watch history' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { userId } = params;
    const { video_id, progress = 0 } = await request.json();

    if (!video_id) {
      return Response.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Insert or update watch history
    const [watchEntry] = await sql`
      INSERT INTO watch_history (user_id, video_id, progress, watched_at)
      VALUES (${userId}, ${video_id}, ${progress}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, video_id) 
      DO UPDATE SET 
        progress = ${progress},
        watched_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    return Response.json({ watchEntry });
  } catch (error) {
    console.error('Error adding to watch history:', error);
    return Response.json({ error: 'Failed to add to watch history' }, { status: 500 });
  }
}