import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Play,
  ArrowLeft,
  Menu,
  Grid,
  List,
} from "lucide-react";
import { useUser } from "@/utils/useUser";

const YouTubeLogo = ({ size = 24 }) => (
  <div className="flex items-center">
    <div className={`w-6 h-6 bg-red-600 rounded-sm flex items-center justify-center mr-2`}>
      <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5" />
    </div>
    <span className="text-xl font-bold text-gray-900">YouTube</span>
  </div>
);

function VideoCard({ video, onSave, isSaved, onPress, layout = "grid" }) {
  return (
    <div 
      className={`${
        layout === "grid" 
          ? "w-full cursor-pointer hover:bg-gray-50 transition-colors" 
          : "flex space-x-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer"
      }`}
      onClick={() => onPress(video)}
    >
      {/* Thumbnail */}
      <div className={`${
        layout === "grid" 
          ? "w-full aspect-video rounded-xl mb-3" 
          : "w-40 aspect-video rounded-lg flex-shrink-0"
      } bg-gray-200 overflow-hidden`}>
        <img
          src={video.thumbnail_url || "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"}
          alt={video.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Video info */}
      <div className={`${layout === "grid" ? "px-3 pb-4" : "flex-1 min-w-0"}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={`${
              layout === "grid" ? "text-base" : "text-sm"
            } font-medium text-gray-900 line-clamp-2 mb-1`}>
              {video.title}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {video.channel_name || "Unknown Channel"}
            </p>
            {layout === "list" && video.view_count && (
              <p className="text-xs text-gray-500">
                {video.view_count.toLocaleString()} views
              </p>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave(video.id, video.video_type);
            }}
            className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {isSaved ? (
              <BookmarkCheck size={20} className="text-red-600" />
            ) : (
              <Bookmark size={20} className="text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShortsCard({ video, onPress }) {
  return (
    <div 
      className="cursor-pointer hover:scale-105 transition-transform"
      onClick={onPress}
    >
      <div className="w-full aspect-[9/16] rounded-xl bg-gray-200 overflow-hidden mb-2">
        <img
          src={video.thumbnail_url || "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"}
          alt={video.title}
          className="w-full h-full object-cover"
        />
      </div>
      <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
        {video.title}
      </h4>
    </div>
  );
}

function ShortsSection({ shorts, onShortsPress }) {
  return (
    <div className="bg-gray-50 py-6 my-6 rounded-xl">
      <div className="px-6">
        <div className="flex items-center mb-4">
          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center mr-3">
            <Play size={12} className="text-white ml-0.5" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Shorts</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {shorts.slice(0, 6).map((short) => (
            <ShortsCard
              key={short.id}
              video={short}
              onPress={() => onShortsPress(short)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoPlayer({ video, onBack, recommendedVideos, onVideoSelect }) {
  const getYouTubeEmbedUrl = (url) => {
    let videoId = null;
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#\/]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#\/]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        videoId = match[1];
        break;
      }
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&fs=1&cc_load_policy=1&iv_load_policy=3&showinfo=1&controls=1&playsinline=0&enablejsapi=1`;
    }
    return url;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Video Player */}
      <div className="w-full bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="aspect-video">
            <iframe
              src={getYouTubeEmbedUrl(video.video_url || video.youtube_url)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
          {video.title}
        </h1>
        <p className="text-gray-600 mb-6">
          {video.channel_name || "Unknown Channel"}
        </p>

        {/* Recommended Videos */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommended</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recommendedVideos.map((recVideo) => (
              <VideoCard
                key={recVideo.id}
                video={recVideo}
                onSave={() => {}}
                isSaved={false}
                onPress={onVideoSelect}
                layout="grid"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const { data: user } = useUser();
  const [videos, setVideos] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [savedVideos, setSavedVideos] = useState(new Set());
  const [watchLaterVideos, setWatchLaterVideos] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [viewLayout, setViewLayout] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const currentUserId = 1;

  // Shuffle array function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchVideos = useCallback(async () => {
    try {
      const longVideosResponse = await fetch(
        `/api/videos?type=long&limit=50&orderBy=created_at&order=DESC`
      );
      if (longVideosResponse.ok) {
        const longVideosData = await longVideosResponse.json();
        const fetchedVideos = longVideosData.videos || [];
        setVideos(fetchedVideos);
      }

      const shortsResponse = await fetch(
        `/api/videos?type=short&limit=10&orderBy=created_at&order=DESC`
      );
      if (shortsResponse.ok) {
        const shortsData = await shortsResponse.json();
        const fetchedShorts = shortsData.videos || [];
        setShorts(fetchedShorts);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchSavedVideos = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${currentUserId}/saved-videos`);
      if (response.ok) {
        const data = await response.json();
        const savedIds = new Set(data.savedVideos.map((v) => v.video_id));
        setSavedVideos(savedIds);
      }
    } catch (error) {
      console.error("Error fetching saved videos:", error);
    }
  }, [currentUserId]);

  const fetchWatchLaterVideos = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${currentUserId}/watch-later`);
      if (response.ok) {
        const data = await response.json();
        const watchLaterIds = new Set(
          data.watchLaterVideos.map((v) => v.video_id)
        );
        setWatchLaterVideos(watchLaterIds);
      }
    } catch (error) {
      console.error("Error fetching watch later videos:", error);
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
  }, [fetchVideos]);

  useEffect(() => {
    fetchSavedVideos();
    fetchWatchLaterVideos();
  }, [fetchSavedVideos, fetchWatchLaterVideos]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchVideos(), fetchSavedVideos(), fetchWatchLaterVideos()]);
  }, [fetchVideos, fetchSavedVideos, fetchWatchLaterVideos]);

  const handleSaveVideo = useCallback(
    async (videoId, videoType) => {
      try {
        const isInWatchLater = watchLaterVideos.has(videoId);
        const method = isInWatchLater ? "DELETE" : "POST";

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
          setWatchLaterVideos((prev) => {
            const newSet = new Set(prev);
            if (isInWatchLater) {
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
    [currentUserId, watchLaterVideos]
  );

  const handleVideoPress = useCallback(
    (video) => {
      addToWatchHistory(video.id);
      setSelectedVideo(video);
      const otherVideos = videos.filter((v) => v.id !== video.id);
      const recommended = shuffleArray(otherVideos).slice(0, 8);
      setRecommendedVideos(recommended);
    },
    [videos, addToWatchHistory]
  );

  const handleVideoSelect = useCallback(
    (video) => {
      addToWatchHistory(video.id);
      setSelectedVideo(video);
      const otherVideos = videos.filter((v) => v.id !== video.id);
      const recommended = shuffleArray(otherVideos).slice(0, 8);
      setRecommendedVideos(recommended);
    },
    [videos, addToWatchHistory]
  );

  const handleShortsPress = () => {
    window.location.href = "/shorts";
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleBack = () => {
    setSelectedVideo(null);
    setRecommendedVideos([]);
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (video.channel_name && video.channel_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (selectedVideo) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={handleBack}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <YouTubeLogo size={28} />
              </div>
            </div>
          </div>
        </header>

        <VideoPlayer
          video={selectedVideo}
          onBack={handleBack}
          recommendedVideos={recommendedVideos}
          onVideoSelect={handleVideoSelect}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Menu size={24} className="text-gray-600" />
              </button>
              <YouTubeLogo size={28} />
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8 hidden sm:block">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search videos..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-full hover:bg-gray-200 transition-colors"
                >
                  <Search size={20} className="text-gray-600" />
                </button>
              </form>
            </div>

            {/* Desktop Controls */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => setViewLayout(viewLayout === "grid" ? "list" : "grid")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title={`Switch to ${viewLayout === "grid" ? "list" : "grid"} view`}
              >
                {viewLayout === "grid" ? (
                  <List size={24} className="text-gray-600" />
                ) : (
                  <Grid size={24} className="text-gray-600" />
                )}
              </button>
            </div>

            {/* Mobile Search */}
            <div className="sm:hidden">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Search size={24} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="sm:hidden pb-4">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-full hover:bg-gray-200 transition-colors"
              >
                <Search size={20} className="text-gray-600" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Shorts Section */}
        {shorts.length > 0 && (
          <ShortsSection shorts={shorts} onShortsPress={handleShortsPress} />
        )}

        {/* Videos Grid/List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {searchQuery ? `Search results for "${searchQuery}"` : "Videos"}
            </h2>
            <div className="md:hidden">
              <button
                onClick={() => setViewLayout(viewLayout === "grid" ? "list" : "grid")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                {viewLayout === "grid" ? (
                  <List size={20} className="text-gray-600" />
                ) : (
                  <Grid size={20} className="text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {viewLayout === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map((video, index) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onSave={handleSaveVideo}
                  isSaved={watchLaterVideos.has(video.id)}
                  onPress={handleVideoPress}
                  layout="grid"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onSave={handleSaveVideo}
                  isSaved={watchLaterVideos.has(video.id)}
                  onPress={handleVideoPress}
                  layout="list"
                />
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {!loading && videos.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos available</h3>
            <p className="text-gray-600">Add some videos in the admin panel</p>
          </div>
        )}

        {/* No Search Results */}
        {searchQuery && filteredVideos.length === 0 && videos.length > 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try searching for something else</p>
          </div>
        )}
      </main>
    </div>
  );
}