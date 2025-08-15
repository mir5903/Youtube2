import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Share2,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useUser } from "@/utils/useUser";

// Check if URL is a YouTube URL
const isYouTubeVideo = (url) => {
  if (!url) return false;
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("youtube.com/shorts")
  );
};

// Convert any YouTube URL to embed format
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;

  let videoId = null;
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
      videoId = match[1];
      break;
    }
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&loop=1&playlist=${videoId}`;
  }

  if (url.includes("youtube.com/embed/")) {
    const baseUrl = url.split("?")[0];
    const videoIdMatch = baseUrl.match(/embed\/([^\/]+)/);
    const vid = videoIdMatch ? videoIdMatch[1] : "";
    return `${baseUrl}?autoplay=1&mute=0&controls=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&loop=1&playlist=${vid}`;
  }

  return url;
};

// Video Item Component
function VideoItem({ 
  item, 
  isActive, 
  onSave, 
  savedVideos, 
  onShare, 
  isMobile 
}) {
  const isYouTube = isYouTubeVideo(item.video_url);
  const isSaved = savedVideos.has(item.id);
  const [isLoading, setIsLoading] = useState(true);

  const embedUrl = isYouTube
    ? getYouTubeEmbedUrl(item.video_url)
    : item.video_url;

  const handleShare = async () => {
    const shareUrl = item.youtube_url || item.video_url;
    if (navigator.share && isMobile) {
      try {
        await navigator.share({
          title: item.title,
          text: `Check out this video: ${item.title}`,
          url: shareUrl,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareUrl);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleOpenYouTube = () => {
    if (item.youtube_url || item.video_url) {
      window.open(item.youtube_url || item.video_url, '_blank');
    }
  };

  return (
    <div className={`relative ${isMobile ? 'h-screen' : 'h-[80vh] max-h-[800px]'} w-full bg-black flex items-center justify-center`}>
      {/* Video Player */}
      <div className={`relative ${isMobile ? 'w-full h-full' : 'w-full max-w-[400px] h-full'}`}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        ) : (
          <video
            src={item.video_url}
            className="w-full h-full object-cover"
            autoPlay={isActive}
            loop
            muted={false}
            playsInline
            onLoadedData={() => setIsLoading(false)}
          />
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="text-white text-lg">Loading video...</div>
          </div>
        )}

        {/* Video overlay */}
        <div className="absolute inset-0 flex justify-between items-end p-4 pointer-events-none">
          {/* Video info */}
          <div className="flex-1 max-w-[70%] pointer-events-auto">
            <h3 className="text-white text-lg font-semibold mb-2 drop-shadow-lg">
              {item.title || "Untitled"}
            </h3>
            <p className="text-white text-sm drop-shadow-lg">
              {item.channel_name || "Unknown Channel"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col items-center space-y-6 pointer-events-auto">
            <button
              onClick={handleShare}
              className="flex flex-col items-center space-y-1 group"
            >
              <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center group-hover:bg-gray-600/50 transition-colors">
                <Share2 size={24} className="text-white" />
              </div>
              <span className="text-white text-xs">Share</span>
            </button>

            <button
              onClick={() => onSave(item.id)}
              className="flex flex-col items-center space-y-1 group"
            >
              <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center group-hover:bg-gray-600/50 transition-colors">
                {isSaved ? (
                  <BookmarkCheck size={24} className="text-yellow-400" />
                ) : (
                  <Bookmark size={24} className="text-white" />
                )}
              </div>
              <span className="text-white text-xs">{isSaved ? "Saved" : "Save"}</span>
            </button>

            {isYouTube && (
              <button
                onClick={handleOpenYouTube}
                className="flex flex-col items-center space-y-1 group"
              >
                <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center group-hover:bg-gray-600/50 transition-colors">
                  <ExternalLink size={20} className="text-white" />
                </div>
                <span className="text-white text-xs">YouTube</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShortsPage() {
  const { data: user } = useUser();
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedVideos, setSavedVideos] = useState(new Set());
  const [isMobile, setIsMobile] = useState(false);

  const currentUserId = user?.id || 1;

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/videos?type=short&limit=20&userId=${currentUserId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.status}`);
      }

      const data = await response.json();
      if (data.videos && data.videos.length > 0) {
        setVideos(data.videos);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const fetchSavedVideos = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${currentUserId}/watch-later`);
      if (response.ok) {
        const data = await response.json();
        const savedIds = new Set(data.watchLaterVideos.map((v) => v.video_id));
        setSavedVideos(savedIds);
      }
    } catch (error) {
      console.error("Error fetching saved videos:", error);
    }
  }, [currentUserId]);

  const addToWatchHistory = useCallback(
    async (videoId) => {
      try {
        await fetch(`/api/users/${currentUserId}/watch-history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId }),
        });
      } catch (error) {
        console.error("Error adding to watch history:", error);
      }
    },
    [currentUserId]
  );

  useEffect(() => {
    fetchVideos();
    fetchSavedVideos();
  }, [fetchVideos, fetchSavedVideos]);

  // Add current video to watch history
  useEffect(() => {
    if (videos[currentIndex]) {
      addToWatchHistory(videos[currentIndex].id);
    }
  }, [currentIndex, videos, addToWatchHistory]);

  const handleSave = useCallback(
    async (videoId) => {
      try {
        const isSaved = savedVideos.has(videoId);
        const method = isSaved ? "DELETE" : "POST";

        const response = await fetch(
          `/api/users/${currentUserId}/watch-later`,
          {
            method,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ videoId }),
          }
        );

        if (response.ok) {
          setSavedVideos((prev) => {
            const newSet = new Set(prev);
            if (isSaved) {
              newSet.delete(videoId);
            } else {
              newSet.add(videoId);
            }
            return newSet;
          });
        }
      } catch (error) {
        console.error("Error saving video:", error);
      }
    },
    [currentUserId, savedVideos]
  );

  // Navigation functions
  const goToNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, videos.length]);

  // Touch/swipe handling for mobile
  useEffect(() => {
    if (!isMobile) return;

    let startY = 0;
    let endY = 0;

    const handleTouchStart = (event) => {
      startY = event.touches[0].clientY;
    };

    const handleTouchEnd = (event) => {
      endY = event.changedTouches[0].clientY;
      const diffY = startY - endY;

      if (Math.abs(diffY) > 50) {
        if (diffY > 0) {
          goToNext();
        } else {
          goToPrevious();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, videos.length, isMobile]);

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading videos...</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-xl mb-2">No shorts available</div>
          <div className="text-gray-400">Add some shorts in the admin panel</div>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Video Player */}
      <VideoItem
        item={currentVideo}
        isActive={true}
        onSave={handleSave}
        savedVideos={savedVideos}
        isMobile={isMobile}
      />

      {/* Desktop Navigation */}
      {!isMobile && (
        <>
          {/* Previous button */}
          {currentIndex > 0 && (
            <button
              onClick={goToPrevious}
              className="absolute top-1/2 left-4 transform -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <ChevronUp size={24} className="text-white" />
            </button>
          )}

          {/* Next button */}
          {currentIndex < videos.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <ChevronDown size={24} className="text-white" />
            </button>
          )}

          {/* Video counter */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
            {currentIndex + 1} of {videos.length}
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs z-10">
            Use arrow keys or swipe to navigate
          </div>
        </>
      )}

      {/* Mobile swipe indicator */}
      {isMobile && (
        <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex flex-col space-y-2 z-10">
          {videos.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-8 rounded-full ${
                index === currentIndex ? 'bg-white' : 'bg-gray-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}