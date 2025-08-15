import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Upload, Video, Play, Trash2 } from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/utils/auth/useUser";
import {
  useFonts,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto";

const { width: screenWidth } = Dimensions.get("window");

function VideoUploadSection({ title, type, onUpload }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!url.trim()) {
      Alert.alert("Error", "Please enter a video URL");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_url: url.trim(),
          video_type: type,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          "Success",
          `${type === "short" ? "Short" : "Video"} uploaded successfully!\n\nTitle: ${data.scrapedData?.title || "N/A"}\nChannel: ${data.scrapedData?.channel_name || "N/A"}`,
        );
        setUrl("");
        if (onUpload) onUpload();
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert(
        "Error",
        "Failed to upload video. Please check the URL and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.uploadSection}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {type === "short" ? "YouTube Shorts URL" : "YouTube Video URL"}
        </Text>
        <TextInput
          style={styles.textInput}
          value={url}
          onChangeText={setUrl}
          placeholder={
            type === "short"
              ? "https://youtube.com/shorts/..."
              : "https://youtube.com/watch?v=..."
          }
          placeholderTextColor="#999999"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.uploadButton, loading && styles.uploadButtonDisabled]}
        onPress={handleUpload}
        disabled={loading}
      >
        <Upload size={16} color="#FFFFFF" />
        <Text style={styles.uploadButtonText}>
          {loading
            ? "Extracting & Uploading..."
            : `Upload ${type === "short" ? "Short" : "Video"}`}
        </Text>
      </TouchableOpacity>

      <Text style={styles.uploadHelper}>
        Video details will be automatically extracted from the URL
      </Text>
    </View>
  );
}

function VideoCard({ video, onDelete }) {
  const formatViewCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Video",
      `Are you sure you want to delete "${video.title}"? This will remove it from everywhere in the app.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(video.id),
        },
      ],
    );
  };

  return (
    <View style={styles.videoCard}>
      {/* Thumbnail */}
      <Image
        source={{
          uri:
            video.thumbnail_url ||
            "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        }}
        style={styles.videoThumbnail}
      />

      {/* Video info */}
      <View style={styles.videoInfo}>
        <View style={styles.videoTypeContainer}>
          {video.video_type === "short" ? (
            <Play size={16} color="#FF0000" />
          ) : (
            <Video size={16} color="#606060" />
          )}
          <Text style={styles.videoType}>
            {video.video_type === "short" ? "Short" : "Video"}
          </Text>
        </View>

        <Text style={styles.videoTitle} numberOfLines={2}>
          {video.title}
        </Text>

        <Text style={styles.videoMeta}>
          {video.channel_name || "Unknown Channel"} •{" "}
          {formatViewCount(video.view_count || 0)}
        </Text>

        {video.category && (
          <Text style={styles.videoCategory}>Category: {video.category}</Text>
        )}
      </View>

      {/* Delete button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Trash2 size={20} color="#FF0000" />
      </TouchableOpacity>
    </View>
  );
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  const fetchAllVideos = useCallback(async () => {
    try {
      const [longResponse, shortResponse] = await Promise.all([
        fetch("/api/videos?type=long&limit=100"),
        fetch("/api/videos?type=short&limit=100"),
      ]);

      const longData = longResponse.ok
        ? await longResponse.json()
        : { videos: [] };
      const shortData = shortResponse.ok
        ? await shortResponse.json()
        : { videos: [] };

      const allVideos = [
        ...(longData.videos || []),
        ...(shortData.videos || []),
      ];

      // Sort by creation date, newest first
      allVideos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setAllVideos(allVideos);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllVideos();
  }, [fetchAllVideos]);

  const handleBack = () => {
    router.back();
  };

  const handleVideoUpload = () => {
    fetchAllVideos();
  };

  const handleDeleteVideo = async (videoId) => {
    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        Alert.alert("Success", "Video deleted successfully!");
        // Remove video from local state
        setAllVideos((prev) => prev.filter((v) => v.id !== videoId));
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Delete video error:", error);
      Alert.alert("Error", "Failed to delete video");
    }
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="dark" />
        <Text style={styles.loadingText}>Loading admin panel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Upload Sections */}
        <VideoUploadSection
          title="Upload Short Video"
          type="short"
          onUpload={handleVideoUpload}
        />

        <VideoUploadSection
          title="Upload Long Video"
          type="long"
          onUpload={handleVideoUpload}
        />

        {/* All Videos Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            All Videos ({allVideos.length})
          </Text>

          {allVideos.length > 0 ? (
            allVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDelete={handleDeleteVideo}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Video size={48} color="#CCCCCC" />
              <Text style={styles.emptyText}>No videos uploaded yet</Text>
              <Text style={styles.emptySubtext}>
                Upload your first video using the sections above
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
    fontFamily: "Roboto_400Regular",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Roboto_700Bold",
    color: "#0F0F0F",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Roboto_700Bold",
    color: "#0F0F0F",
    marginBottom: 16,
  },
  uploadSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: "Roboto_500Medium",
    color: "#0F0F0F",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: "Roboto_400Regular",
    color: "#0F0F0F",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34C759",
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: "#A0A0A0",
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Roboto_500Medium",
    marginLeft: 8,
  },
  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  videoThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
    marginRight: 12,
  },
  videoInfo: {
    flex: 1,
    marginRight: 12,
  },
  videoTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  videoType: {
    fontSize: 12,
    fontFamily: "Roboto_500Medium",
    color: "#606060",
    marginLeft: 4,
  },
  videoTitle: {
    fontSize: 16,
    fontFamily: "Roboto_500Medium",
    color: "#0F0F0F",
    marginBottom: 4,
  },
  videoMeta: {
    fontSize: 14,
    color: "#606060",
    fontFamily: "Roboto_400Regular",
    marginBottom: 2,
  },
  videoCategory: {
    fontSize: 12,
    color: "#999999",
    fontFamily: "Roboto_400Regular",
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Roboto_500Medium",
    marginLeft: 8,
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "Roboto_700Bold",
    color: "#0F0F0F",
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Roboto_400Regular",
    color: "#606060",
  },
  uploadHelper: {
    fontSize: 12,
    color: "#606060",
    marginTop: 8,
  },
});
