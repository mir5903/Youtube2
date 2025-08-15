import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Search as SearchIcon, X } from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from '@/utils/auth/useUser';
import {
  useFonts,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto";

function SearchResultsGrid({ results }) {
  const handleVideoPress = (video) => {
    if (video.video_type === "short") {
      router.push("/shorts");
    } else {
      router.push(`/video/${video.id}`);
    }
  };

  const formatViewCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  // Separate shorts and long videos
  const shorts = results.filter((video) => video.video_type === "short");
  const longVideos = results.filter((video) => video.video_type === "long");

  return (
    <ScrollView
      style={styles.resultsContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Shorts section (2 per row) */}
      {shorts.length > 0 && (
        <View style={styles.shortsSection}>
          <Text style={styles.sectionTitle}>Shorts</Text>
          <View style={styles.shortsGrid}>
            {shorts.map((video) => (
              <TouchableOpacity
                key={video.id}
                style={styles.shortCard}
                onPress={() => handleVideoPress(video)}
              >
                <Image
                  source={{ 
                    uri: video.thumbnail_url || 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
                  }}
                  style={styles.shortThumbnail}
                />
                <Text style={styles.shortTitle} numberOfLines={2}>
                  {video.title}
                </Text>
                <Text style={styles.shortViews}>
                  {formatViewCount(video.view_count)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Long videos section */}
      {longVideos.length > 0 && (
        <View style={styles.longVideosSection}>
          {shorts.length > 0 && <Text style={styles.sectionTitle}>Videos</Text>}
          {longVideos.map((video) => (
            <TouchableOpacity
              key={video.id}
              style={styles.videoCard}
              onPress={() => handleVideoPress(video)}
            >
              <Image
                source={{ 
                  uri: video.thumbnail_url || 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
                }}
                style={styles.videoThumbnail}
              />
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={2}>
                  {video.title}
                </Text>
                <Text style={styles.videoMeta}>
                  {formatViewCount(video.view_count)} • {video.category}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {results.length === 0 && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No results found</Text>
          <Text style={styles.noResultsSubtext}>
            Try searching for different keywords
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  const fetchSearchHistory = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/users/${user.id}/search-history`);
      const data = await response.json();

      if (data.searchHistory) {
        setSearchHistory(data.searchHistory);
      }
    } catch (error) {
      console.error("Error fetching search history:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSearchHistory();
  }, [fetchSearchHistory]);

  const handleSearch = useCallback(
    async (query) => {
      if (!query.trim()) return;

      // Check for admin secret code
      if (query.trim() === "4321") {
        router.push("/(tabs)/admin");
        return; // Don't save to search history
      }

      setIsSearching(true);
      setHasSearched(true);

      try {
        let apiUrl = `/api/search?q=${encodeURIComponent(query)}`;
        if (user?.id) {
          apiUrl += `&user_id=${user.id}`;
        }

        // Handle special NEET searches
        if (query.toLowerCase() === "neet") {
          apiUrl = `/api/videos?category=NEET&type=long&limit=50`;
        } else if (query.toLowerCase() === "neet shorts") {
          apiUrl = `/api/videos?category=NEET&type=short&limit=50`;
        }

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.videos) {
          setSearchResults(data.videos);
        }

        // Refresh search history (only for regular searches, not admin code)
        fetchSearchHistory();
      } catch (error) {
        console.error("Error searching videos:", error);
        Alert.alert("Error", "Failed to search videos");
      } finally {
        setIsSearching(false);
      }
    },
    [fetchSearchHistory, user?.id],
  );

  const handleSearchSubmit = () => {
    handleSearch(searchQuery);
  };

  const handleHistoryItemPress = (query) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search videos..."
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Educational notice */}
      <View style={styles.noticeContainer}>
        <Text style={styles.noticeText}>
          Search only for educational content
        </Text>
      </View>

      {!hasSearched ? (
        // Search history
        <ScrollView
          style={styles.historyContainer}
          showsVerticalScrollIndicator={false}
        >
          {searchHistory.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Recent searches</Text>
              {searchHistory.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.historyItem}
                  onPress={() => handleHistoryItemPress(item.query)}
                >
                  <SearchIcon size={16} color="#6B7280" />
                  <Text style={styles.historyItemText}>{item.query}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {searchHistory.length === 0 && (
            <View style={styles.emptyHistoryContainer}>
              <Text style={styles.emptyHistoryText}>No recent searches</Text>
              <Text style={styles.emptyHistorySubtext}>
                Start searching to see your history here
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        // Search results
        <SearchResultsGrid results={searchResults} />
      )}

      {isSearching && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    fontFamily: "Roboto_400Regular",
    marginLeft: 8,
    marginRight: 8,
  },
  noticeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FEF3C7",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  noticeText: {
    fontSize: 14,
    color: "#92400E",
    fontFamily: "Roboto_500Medium",
    textAlign: "center",
  },
  historyContainer: {
    flex: 1,
  },
  historySection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontFamily: "Roboto_700Bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  historyItemText: {
    fontSize: 16,
    color: "#374151",
    fontFamily: "Roboto_400Regular",
    marginLeft: 12,
  },
  emptyHistoryContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 18,
    fontFamily: "Roboto_500Medium",
    color: "#6B7280",
    marginBottom: 8,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    color: "#9CA3AF",
    textAlign: "center",
  },
  resultsContainer: {
    flex: 1,
  },
  shortsSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Roboto_700Bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  shortsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  shortCard: {
    width: "48%",
    marginBottom: 16,
  },
  shortThumbnail: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  shortTitle: {
    fontSize: 14,
    fontFamily: "Roboto_500Medium",
    color: "#1F2937",
    marginTop: 8,
    marginBottom: 4,
    lineHeight: 18,
  },
  shortViews: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Roboto_400Regular",
  },
  longVideosSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  videoCard: {
    flexDirection: "row",
    marginBottom: 16,
  },
  videoThumbnail: {
    width: 140,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginRight: 12,
  },
  videoInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  videoTitle: {
    fontSize: 16,
    fontFamily: "Roboto_500Medium",
    color: "#1F2937",
    lineHeight: 20,
    marginBottom: 8,
  },
  videoMeta: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Roboto_400Regular",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontFamily: "Roboto_500Medium",
    color: "#6B7280",
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    color: "#9CA3AF",
    textAlign: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Roboto_500Medium",
    color: "#6B7280",
  },
});