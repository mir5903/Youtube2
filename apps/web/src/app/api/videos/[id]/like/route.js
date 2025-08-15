import sql from "@/app/api/utils/sql";

// Like a video (increment likes count)
export async function POST(request, { params }) {
  try {
    const { id } = params;

    const [video] = await sql`
      UPDATE videos 
      SET likes_count = likes_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (!video) {
      return Response.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      likes_count: video.likes_count
    });
  } catch (error) {
    console.error('Error liking video:', error);
    return Response.json(
      { success: false, error: 'Failed to like video' },
      { status: 500 }
    );
  }
}