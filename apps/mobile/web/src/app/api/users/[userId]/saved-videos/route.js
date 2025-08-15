import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    const savedVideos = await sql`
      SELECT 
        sv.*,
        v.title,
        v.description,
        v.thumbnail_url,
        v.duration,
        v.video_type,
        v.category,
        v.view_count
      FROM saved_videos sv
      JOIN videos v ON sv.video_id = v.id
      WHERE sv.user_id = ${userId}
      ORDER BY sv.saved_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return Response.json({ savedVideos });
  } catch (error) {
    console.error('Error fetching saved videos:', error);
    return Response.json({ error: 'Failed to fetch saved videos' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { userId } = params;
    const { video_id } = await request.json();

    if (!video_id) {
      return Response.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const [savedVideo] = await sql`
      INSERT INTO saved_videos (user_id, video_id)
      VALUES (${userId}, ${video_id})
      ON CONFLICT (user_id, video_id) DO NOTHING
      RETURNING *
    `;

    return Response.json({ savedVideo });
  } catch (error) {
    console.error('Error saving video:', error);
    return Response.json({ error: 'Failed to save video' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('video_id');

    if (!videoId) {
      return Response.json({ error: 'Video ID is required' }, { status: 400 });
    }

    await sql`
      DELETE FROM saved_videos 
      WHERE user_id = ${userId} AND video_id = ${videoId}
    `;

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error removing saved video:', error);
    return Response.json({ error: 'Failed to remove saved video' }, { status: 500 });
  }
}