import sql from "@/app/api/utils/sql";

// Get a single video
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const [video] = await sql`
      SELECT * FROM videos WHERE id = ${id}
    `;

    if (!video) {
      return Response.json(
        { success: false, error: "Video not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    return Response.json(
      { success: false, error: "Failed to fetch video" },
      { status: 500 },
    );
  }
}

// Update a video
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(body)) {
      if (
        [
          "title",
          "description",
          "video_url",
          "thumbnail_url",
          "youtube_url",
          "duration",
          "likes_count",
        ].includes(key)
      ) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return Response.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 },
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE videos 
      SET ${updates.join(", ")} 
      WHERE id = $${paramCount} 
      RETURNING *
    `;

    values.push(id);

    const [video] = await sql(query, values);

    if (!video) {
      return Response.json(
        { success: false, error: "Video not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error("Error updating video:", error);
    return Response.json(
      { success: false, error: "Failed to update video" },
      { status: 500 },
    );
  }
}

// Delete a video with cascade cleanup
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Use a transaction to ensure all deletions succeed or none do
    const result = await sql.transaction([
      // Delete from watch history
      sql`DELETE FROM watch_history WHERE video_id = ${id}`,
      // Delete from watch later
      sql`DELETE FROM watch_later WHERE video_id = ${id}`,
      // Delete from saved videos
      sql`DELETE FROM saved_videos WHERE video_id = ${id}`,
      // Delete from video assignments
      sql`DELETE FROM video_assignments WHERE video_id = ${id}`,
      // Finally delete the video itself
      sql`DELETE FROM videos WHERE id = ${id} RETURNING *`,
    ]);

    const deletedVideo = result[4]; // The video deletion result

    if (!deletedVideo || deletedVideo.length === 0) {
      return Response.json(
        { success: false, error: "Video not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Video deleted successfully from all locations",
      video: deletedVideo[0],
    });
  } catch (error) {
    console.error("Error deleting video:", error);
    return Response.json(
      { success: false, error: "Failed to delete video" },
      { status: 500 },
    );
  }
}
