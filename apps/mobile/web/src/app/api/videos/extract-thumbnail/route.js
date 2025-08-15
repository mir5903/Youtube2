// Extract YouTube thumbnail from video URL
export async function POST(request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    let videoId = null;
    let thumbnailUrl = null;

    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#\/]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#\/]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#\/]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        videoId = match[1];
        break;
      }
    }

    if (videoId) {
      // Generate thumbnail URL
      thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      
      // Verify thumbnail exists by trying to fetch it
      try {
        const thumbResponse = await fetch(thumbnailUrl);
        if (!thumbResponse.ok) {
          // Fallback to standard quality if maxres doesn't exist
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      } catch (error) {
        // Use standard quality as fallback
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }

    return Response.json({ 
      videoId,
      thumbnailUrl,
      success: !!videoId 
    });

  } catch (error) {
    console.error('Error extracting thumbnail:', error);
    return Response.json(
      { error: 'Failed to extract thumbnail' },
      { status: 500 }
    );
  }
}