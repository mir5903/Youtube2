import sql from "@/app/api/utils/sql";

// Get user's watch later videos
export async function GET(request, { params }) {
  try {
    const { userId } = params;

    const watchLaterVideos = await sql`
      SELECT 
        wl.id,
        wl.added_at,
        v.id as video_id,
        v.title,
        v.description,
        v.video_url,
        v.thumbnail_url,
        v.youtube_url,
        v.duration,
        v.video_type,
        v.category,
        v.view_count,
        v.created_at
      FROM watch_later wl
      JOIN videos v ON wl.video_id = v.id
      WHERE wl.user_id = ${userId}
      ORDER BY wl.added_at DESC
    `;

    return Response.json({ watchLaterVideos });
  } catch (error) {
    console.error('Error fetching watch later videos:', error);
    return Response.json(
      { error: 'Failed to fetch watch later videos' },
      { status: 500 }
    );
  }
}

// Add video to watch later
export async function POST(request, { params }) {
  try {
    const { userId } = params;
    const { videoId } = await request.json();

    if (!videoId) {
      return Response.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Check if already in watch later
    const existing = await sql`
      SELECT id FROM watch_later 
      WHERE user_id = ${userId} AND video_id = ${videoId}
    `;

    if (existing.length > 0) {
      return Response.json({ message: 'Video already in watch later' });
    }

    // Add to watch later
    await sql`
      INSERT INTO watch_later (user_id, video_id, added_at)
      VALUES (${userId}, ${videoId}, CURRENT_TIMESTAMP)
    `;

    return Response.json({ message: 'Video added to watch later' });
  } catch (error) {
    console.error('Error adding to watch later:', error);
    return Response.json(
      { error: 'Failed to add video to watch later' },
      { status: 500 }
    );
  }
}

// Remove video from watch later
export async function DELETE(request, { params }) {
  try {
    const { userId } = params;
    const { videoId } = await request.json();

    if (!videoId) {
      return Response.json({ error: 'Video ID is required' }, { status: 400 });
    }

    await sql`
      DELETE FROM watch_later 
      WHERE user_id = ${userId} AND video_id = ${videoId}
    `;

    return Response.json({ message: 'Video removed from watch later' });
  } catch (error) {
    console.error('Error removing from watch later:', error);
    return Response.json(
      { error: 'Failed to remove video from watch later' },
      { status: 500 }
    );
  }
}