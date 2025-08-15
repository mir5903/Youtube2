import React, { useState, useEffect, useCallback } from "react";
import { Search, ArrowLeft, Filter, Grid, List } from "lucide-react";
import { useUser } from "@/utils/useUser";

const YouTubeLogo = ({ size = 24 }) => (
  <div className="flex items-center">
    <div className={`w-6 h-6 bg-red-600 rounded-sm flex items-center justify-center mr-2`}>
      <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5" />
    </div>
    <span className="text-xl font-bold text-gray-900">YouTube</span>
  </div>
);

function VideoCard({ video, onPress, layout = "grid" }) {
  return (
    <div 
      className={`${
        layout === "grid" 
          ? "w-full cursor-pointer hover:bg-gray-50 transition-colors rounded-lg" 
          : "flex space-x-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg"
      }`}
      onClick={() => onPress(video)}
    >
      {/* Thumbnail */}
      <div className={`${
        layout === "grid" 
          ? "w-full aspect-video rounded-xl mb-3" 
          : "w-40 aspect-video rounded-lg flex-shrink-0"
      } bg-gray-200 overflow-hidden relative`}>
        <img
          src={video.thumbnail_url || "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        {video.video_type === 'short' && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
            Shorts
          </div>
        )}
      </div>

      {/* Video info */}
      <div className={`${layout === "grid" ? "px-3 pb-4" : "flex-1 min-w-0"}`}>
        <h3 className={`${
          layout === "grid" ? "text-base" : "text-sm"
        } font-medium text-gray-900 line-clamp-2 mb-1`}>
          {video.title}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          {video.channel_name || "Unknown Channel"}
        </p>
        {video.view_count && (
          <p className="text-xs text-gray-500">
            {video.view_count.toLocaleString()} views
          </p>
        )}
      </div>
    </div>
  );
}

function FilterDropdown({ filters, onFilterChange, isOpen, onToggle }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Filter size={16} />
        <span>Filters</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-4 space-y-4">
            {/* Video Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Type
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => onFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Types</option>
                <option value="long">Regular Videos</option>
                <option value="short">Shorts</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => onFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Categories</option>
                <option value="Music">Music</option>
                <option value="Gaming">Gaming</option>
                <option value="Education">Education</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Sports">Sports</option>
                <option value="Technology">Technology</option>
                <option value="Travel">Travel</option>
                <option value="Food">Food</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy || 'relevance'}
                onChange={(e) => onFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="relevance">Relevance</option>
                <option value="created_at">Upload Date</option>
                <option value="view_count">View Count</option>
                <option value="likes_count">Likes</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => onFilterChange('clear')}
              className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  const { data: user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewLayout, setViewLayout] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    sortBy: 'relevance'
  });

  // Get search query from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, []);

  const performSearch = useCallback(async (query, currentFilters = filters) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // Build search params
      const params = new URLSearchParams({
        q: query.trim(),
        limit: '50'
      });

      // Add filters
      if (currentFilters.type) params.append('type', currentFilters.type);
      if (currentFilters.category) params.append('category', currentFilters.category);
      if (currentFilters.sortBy && currentFilters.sortBy !== 'relevance') {
        params.append('orderBy', currentFilters.sortBy);
        params.append('order', 'DESC');
      }

      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setVideos(data.videos || []);

      // Update URL without page reload
      const url = new URL(window.location);
      url.searchParams.set('q', query.trim());
      window.history.replaceState({}, '', url);

    } catch (error) {
      console.error("Search error:", error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleFilterChange = (key, value) => {
    if (key === 'clear') {
      const newFilters = { type: '', category: '', sortBy: 'relevance' };
      setFilters(newFilters);
      if (searchQuery.trim()) {
        performSearch(searchQuery, newFilters);
      }
    } else {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      if (searchQuery.trim()) {
        performSearch(searchQuery, newFilters);
      }
    }
  };

  const handleVideoPress = (video) => {
    if (video.video_type === 'short') {
      window.location.href = "/shorts";
    } else {
      window.location.href = `/home?video=${video.id}`;
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilters && !event.target.closest('.filter-dropdown')) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
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

            {/* Search Bar */}
            <div className="flex-1 max-w-3xl mx-8">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search videos..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-full hover:bg-gray-200 transition-colors"
                >
                  <Search size={20} className="text-gray-600" />
                </button>
              </form>
            </div>

            {/* Layout Toggle */}
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
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="filter-dropdown">
              <FilterDropdown
                filters={filters}
                onFilterChange={handleFilterChange}
                isOpen={showFilters}
                onToggle={() => setShowFilters(!showFilters)}
              />
            </div>
            
            {searchQuery && (
              <div className="text-sm text-gray-600">
                {loading ? (
                  "Searching..."
                ) : (
                  `${videos.length} results for "${searchQuery}"`
                )}
              </div>
            )}
          </div>

          {/* Mobile Layout Toggle */}
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

        {/* Active Filters */}
        {(filters.type || filters.category || filters.sortBy !== 'relevance') && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.type && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                {filters.type === 'long' ? 'Regular Videos' : 'Shorts'}
                <button
                  onClick={() => handleFilterChange('type', '')}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                {filters.category}
                <button
                  onClick={() => handleFilterChange('category', '')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.sortBy !== 'relevance' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                Sort: {filters.sortBy.replace('_', ' ')}
                <button
                  onClick={() => handleFilterChange('sortBy', 'relevance')}
                  className="ml-2 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-gray-600">Searching...</div>
          </div>
        )}

        {/* Results */}
        {!loading && searchQuery && (
          <>
            {videos.length > 0 ? (
              viewLayout === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onPress={handleVideoPress}
                      layout="grid"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onPress={handleVideoPress}
                      layout="list"
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or filters
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setVideos([]);
                    handleFilterChange('clear');
                  }}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Clear search
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && !searchQuery && (
          <div className="text-center py-12">
            <Search size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Search for videos
            </h3>
            <p className="text-gray-600">
              Enter a search term to find videos and shorts
            </p>
          </div>
        )}
      </main>
    </div>
  );
}