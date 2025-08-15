import sql from "@/app/api/utils/sql";

// Extract Video ID from various YouTube URL formats
function extractVideoId(url) {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#\/]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#\/]+)/,
    /(?:https?:\/\/)?(?:www\.)?m\.youtube\.com\/watch\?v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Generate YouTube thumbnail URLs with fallbacks
async function getYouTubeThumbnail(videoId) {
  const thumbnailFormats = [
    `http://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, // High quality
    `http://img.youtube.com/vi/${videoId}/hqdefault.jpg`, // Medium quality
    `http://img.youtube.com/vi/${videoId}/mqdefault.jpg`, // Lower quality
    `http://img.youtube.com/vi/${videoId}/default.jpg`, // Basic quality
  ];

  // Try each thumbnail format until we find one that works
  for (const thumbnailUrl of thumbnailFormats) {
    try {
      const response = await fetch(thumbnailUrl, { method: "HEAD" });
      if (response.ok) {
        return thumbnailUrl;
      }
    } catch (error) {
      console.log(`Thumbnail check failed for ${thumbnailUrl}:`, error);
      // Continue to next format
    }
  }

  // If all fail, return the maxresdefault URL anyway as fallback
  return thumbnailFormats[0];
}

// Get all videos with pagination and filtering
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 10;
    const offset = parseInt(searchParams.get("offset")) || 0;
    const type = searchParams.get("type"); // 'long' or 'short'
    const category = searchParams.get("category");
    const userId = searchParams.get("userId") || searchParams.get("user_id");

    let query = `
      SELECT DISTINCT v.* 
      FROM videos v
      LEFT JOIN video_assignments va ON v.id = va.video_id
      WHERE 1=1
    `;
    let params = [];

    // If userId provided, only show videos assigned to that user OR videos with no assignments (public)
    if (userId) {
      query += ` AND (va.user_id = $${params.length + 1} OR va.video_id IS NULL)`;
      params.push(parseInt(userId));
    }

    if (type) {
      query += ` AND v.video_type = $${params.length + 1}`;
      params.push(type);
    }

    if (category) {
      query += ` AND LOWER(v.category) = LOWER($${params.length + 1})`;
      params.push(category);
    }

    query += ` ORDER BY v.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const videos = await sql(query, params);

    // If user_id provided, also fetch user's saved videos to mark them
    let savedVideoIds = new Set();
    if (userId) {
      try {
        const savedVideos = await sql`
          SELECT video_id FROM saved_videos WHERE user_id = ${userId}
        `;
        savedVideoIds = new Set(savedVideos.map((sv) => sv.video_id));
      } catch (error) {
        console.error("Error fetching saved videos:", error);
      }
    }

    // Add isSaved flag to each video
    const videosWithSavedFlag = videos.map((video) => ({
      ...video,
      isSaved: savedVideoIds.has(video.id),
    }));

    return Response.json({
      success: true,
      videos: videosWithSavedFlag,
      pagination: {
        limit,
        offset,
        hasMore: videos.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return Response.json(
      { success: false, error: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}

// Create a new video with web scraping
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      video_url,
      youtube_url,
      video_type = "long",
      assigned_user_ids = [], // Array of user IDs to assign this video to
    } = body;

    const finalVideoUrl = video_url || youtube_url;

    if (!finalVideoUrl) {
      return Response.json(
        { success: false, error: "Video URL is required" },
        { status: 400 },
      );
    }

    // Extract Video ID from YouTube URL
    const videoId = extractVideoId(finalVideoUrl);
    if (!videoId) {
      return Response.json(
        { success: false, error: "Invalid YouTube URL" },
        { status: 400 },
      );
    }

    // Generate thumbnail URL using Video ID with fallback
    const thumbnailUrl = await getYouTubeThumbnail(videoId);

    // Use web scraping to extract video details from YouTube
    let videoData = {
      title: "Untitled Video",
      thumbnail_url: thumbnailUrl, // Use our generated thumbnail
      channel_name: "Unknown Channel",
      description: `Video ID: ${videoId}`,
    };

    try {
      const scrapingResponse = await fetch("/integrations/web-scraping/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: finalVideoUrl,
          getText: false, // Get HTML instead of text for better parsing
        }),
      });

      if (scrapingResponse.ok) {
        const htmlContent = await scrapingResponse.text();

        // Extract title
        const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          let title = titleMatch[1].trim();
          // Remove " - YouTube" suffix if present
          title = title.replace(/ - YouTube$/i, "");
          videoData.title = title;
        }

        // Extract description from og:description
        const descMatch = htmlContent.match(
          /<meta property="og:description" content="([^"]+)"/i,
        );
        if (descMatch) {
          videoData.description = descMatch[1];
        }

        // Extract channel name from various possible sources
        const channelPatterns = [
          /"author":"([^"]+)"/i,
          /"ownerChannelName":"([^"]+)"/i,
          /<link itemprop="name" content="([^"]+)"/i,
          /<meta name="author" content="([^"]+)"/i,
        ];

        for (const pattern of channelPatterns) {
          const channelMatch = htmlContent.match(pattern);
          if (channelMatch && channelMatch[1] !== "YouTube") {
            videoData.channel_name = channelMatch[1];
            break;
          }
        }
      }
    } catch (scrapingError) {
      console.error("Web scraping error:", scrapingError);
      // Continue with generated thumbnail and default values
    }

    const [video] = await sql`
      INSERT INTO videos (
        title, 
        description, 
        video_url, 
        youtube_url, 
        thumbnail_url, 
        video_type, 
        channel_name,
        created_at,
        updated_at
      ) VALUES (
        ${videoData.title},
        ${videoData.description},
        ${finalVideoUrl},
        ${youtube_url || finalVideoUrl},
        ${videoData.thumbnail_url},
        ${video_type},
        ${videoData.channel_name},
        NOW(),
        NOW()
      ) RETURNING *
    `;

    // Create user assignments if provided
    if (assigned_user_ids && assigned_user_ids.length > 0) {
      const assignmentPromises = assigned_user_ids.map(
        (userId) =>
          sql`INSERT INTO video_assignments (video_id, user_id) VALUES (${video.id}, ${userId}) ON CONFLICT DO NOTHING`,
      );
      await Promise.all(assignmentPromises);
    }

    return Response.json({
      success: true,
      video,
      scrapedData: videoData,
    });
  } catch (error) {
    console.error("Error creating video:", error);
    return Response.json(
      { success: false, error: "Failed to create video" },
      { status: 500 },
    );
  }
}
