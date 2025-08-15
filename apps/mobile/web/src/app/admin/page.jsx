import { useState, useEffect } from "react";
import {
  Smartphone,
  Monitor,
  Tablet,
  Plus,
  Trash2,
  ExternalLink,
  Upload,
} from "lucide-react";
import useUser from "@/utils/useUser";

const DevicePreview = ({ currentDevice, onDeviceChange }) => (
  <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
    <span className="text-sm font-medium text-gray-700 hidden sm:inline">
      Preview:
    </span>
    <button
      onClick={() => onDeviceChange("mobile")}
      className={`p-2 rounded ${currentDevice === "mobile" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-200"}`}
      title="Mobile View"
    >
      <Smartphone size={16} />
    </button>
    <button
      onClick={() => onDeviceChange("tablet")}
      className={`p-2 rounded ${currentDevice === "tablet" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-200"}`}
      title="Tablet View"
    >
      <Tablet size={16} />
    </button>
    <button
      onClick={() => onDeviceChange("desktop")}
      className={`p-2 rounded ${currentDevice === "desktop" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-200"}`}
      title="Desktop View"
    >
      <Monitor size={16} />
    </button>
  </div>
);

function AdminDashboard() {
  const { data: user, loading } = useUser();
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(1);
  const [videoType, setVideoType] = useState("long");
  const [deleteVideoId, setDeleteVideoId] = useState(null);
  const [selectedViewUserId, setSelectedViewUserId] = useState(1);
  const [currentDevice, setCurrentDevice] = useState("desktop");

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/account/signin";
    }
  }, [loading, user]);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Fetch videos for specific user
  const fetchVideos = async (userId = selectedViewUserId) => {
    try {
      setVideosLoading(true);
      const response = await fetch(`/api/videos?userId=${userId}&limit=100`);
      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error("Error fetching videos:", error);
      setError("Failed to load videos");
    } finally {
      setVideosLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
      fetchVideos();
    }
  }, [user]);

  // Refetch when viewing different user
  useEffect(() => {
    if (users.length > 0) {
      fetchVideos(selectedViewUserId);
    }
  }, [selectedViewUserId, users]);

  // Handle YouTube URL submission
  const handleYouTubeUpload = async (e) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setIsUploading(true);
    setError(null);

    try {
      // Extract video ID from YouTube URL (including Shorts)
      const videoId = extractYouTubeVideoId(youtubeUrl);
      if (!videoId) {
        throw new Error(
          "Invalid YouTube URL. Please enter a valid YouTube or YouTube Shorts URL.",
        );
      }

      // Determine if it's a YouTube Short based on URL or user selection
      const isShort = youtubeUrl.includes("/shorts/") || videoType === "short";

      // Create YouTube embed URL
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;

      // Get video title from URL (basic extraction from video ID)
      const title = isShort
        ? `YouTube Short ${videoId}`
        : `YouTube Video ${videoId}`;

      const videoData = {
        title,
        description: isShort
          ? `YouTube Short: ${youtubeUrl}`
          : `YouTube Video: ${youtubeUrl}`,
        video_url: embedUrl, // Store YouTube embed URL
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        youtube_url: youtubeUrl, // Keep original URL for sharing
        duration: isShort ? 60 : 120, // Default durations
        video_type: isShort ? "short" : "long",
        assigned_user_ids: [selectedUserId], // Assign to selected user
      };

      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(videoData),
      });

      if (!response.ok) {
        throw new Error("Failed to create video");
      }

      setYoutubeUrl("");
      setVideoType("long");
      fetchVideos(selectedViewUserId); // Refresh the list
    } catch (error) {
      console.error("Error adding video:", error);
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Extract YouTube video ID from various URL formats
  const extractYouTubeVideoId = (url) => {
    // Handle various YouTube URL formats including Shorts
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/, // youtube.com/watch?v=ID
      /(?:youtube\.com\/embed\/)([^&\n?#]+)/, // youtube.com/embed/ID
      /(?:youtube\.com\/v\/)([^&\n?#]+)/, // youtube.com/v/ID
      /(?:youtu\.be\/)([^&\n?#]+)/, // youtu.be/ID
      /(?:youtube\.com\/shorts\/)([^&\n?#]+)/, // youtube.com/shorts/ID
      /(?:youtube\.com\/.*[?&]v=)([^&\n?#]+)/, // Other youtube.com formats
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  // Handle delete video
  const handleDeleteVideo = async (videoId) => {
    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete video");
      }

      setDeleteVideoId(null);
      fetchVideos(); // Refresh the list
    } catch (error) {
      console.error("Error deleting video:", error);
      setError("Failed to delete video");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Responsive container based on device preview
  const getContainerClass = () => {
    switch (currentDevice) {
      case "mobile":
        return "max-w-sm";
      case "tablet":
        return "max-w-4xl";
      default:
        return "max-w-7xl";
    }
  };

  const getGridClass = () => {
    switch (currentDevice) {
      case "mobile":
        return "grid-cols-1";
      case "tablet":
        return "grid-cols-1 sm:grid-cols-2";
      default:
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className={`${getContainerClass()} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Video Admin</h1>
              <p className="text-gray-600 text-sm">Manage your video content</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <DevicePreview
                currentDevice={currentDevice}
                onDeviceChange={setCurrentDevice}
              />
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="hidden sm:inline">Welcome,</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <a
                href="/account/logout"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 text-center"
              >
                Sign Out
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="pb-4">
            <div
              className={`grid ${currentDevice === "mobile" ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"} gap-4`}
            >
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {videos.length}
                </div>
                <div className="text-sm text-blue-800">Total Videos</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {videos.filter((v) => v.video_type === "long").length}
                </div>
                <div className="text-sm text-green-800">Regular Videos</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {videos.filter((v) => v.video_type === "short").length}
                </div>
                <div className="text-sm text-purple-800">Shorts</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {new Set(videos.map((v) => v.category).filter(Boolean)).size}
                </div>
                <div className="text-sm text-orange-800">Categories</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${getContainerClass()} mx-auto px-4 py-8 sm:px-6 lg:px-8`}
      >
        {/* Upload Section */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 flex items-center">
            <Plus size={20} className="mr-2" />
            Add YouTube Video
          </h2>
          <form onSubmit={handleYouTubeUpload} className="space-y-4">
            <div
              className={`grid ${currentDevice === "mobile" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"} gap-4`}
            >
              {/* Target User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assign to User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#725BFF] focus:outline-none focus:ring-1 focus:ring-[#725BFF]"
                  disabled={isUploading}
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Video Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Video Type
                </label>
                <select
                  value={videoType}
                  onChange={(e) => setVideoType(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#725BFF] focus:outline-none focus:ring-1 focus:ring-[#725BFF]"
                  disabled={isUploading}
                >
                  <option value="long">Long Video</option>
                  <option value="short">Short Video</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isUploading || !youtubeUrl.trim()}
                  className="w-full rounded-lg bg-[#725BFF] px-6 py-2 text-white hover:bg-[#6A57FF] disabled:opacity-50 flex items-center justify-center"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      Add Video
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                YouTube URL
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/shorts/... or https://www.youtube.com/watch?v=..."
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#725BFF] focus:outline-none focus:ring-1 focus:ring-[#725BFF]"
                disabled={isUploading}
              />
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p>
              <strong>Supported formats:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                YouTube Shorts:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  https://youtube.com/shorts/VIDEO_ID
                </code>
              </li>
              <li>
                Regular YouTube:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  https://www.youtube.com/watch?v=VIDEO_ID
                </code>
              </li>
              <li>
                Short YouTube:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  https://youtu.be/VIDEO_ID
                </code>
              </li>
            </ul>
          </div>
        </div>

        {/* Videos List */}
        <div className="rounded-lg bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b px-6 py-4 gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Manage Videos
            </h2>

            {/* User Filter for Viewing */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <label className="text-sm font-medium text-gray-700">
                View videos for:
              </label>
              <select
                value={selectedViewUserId}
                onChange={(e) =>
                  setSelectedViewUserId(parseInt(e.target.value))
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#725BFF] focus:outline-none focus:ring-1 focus:ring-[#725BFF]"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {videosLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-3" />
              <div className="text-lg text-gray-600">Loading videos...</div>
            </div>
          ) : videos.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Upload size={48} className="text-gray-400 mx-auto mb-4" />
                <div className="text-lg text-gray-600 mb-2">
                  No videos added yet
                </div>
                <div className="text-sm text-gray-500">
                  Add your first YouTube video using the form above
                </div>
              </div>
            </div>
          ) : (
            <div className={`grid ${getGridClass()} gap-4 p-6`}>
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gray-200 relative">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/320x180/E5E7EB/6B7280?text=Video";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No thumbnail
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {video.video_type === "short" ? "Short" : "Video"}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                      <span>{video.likes_count || 0} likes</span>
                      {video.duration && <span>{video.duration}s</span>}
                      <span>
                        {new Date(video.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {video.youtube_url && (
                        <a
                          href={video.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 flex items-center justify-center"
                        >
                          <ExternalLink size={14} className="mr-1" />
                          YouTube
                        </a>
                      )}
                      <button
                        onClick={() => setDeleteVideoId(video.id)}
                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 flex items-center justify-center"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-w-md w-full rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Delete Video</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this video? This action cannot be
              undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setDeleteVideoId(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteVideo(deleteVideoId)}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
