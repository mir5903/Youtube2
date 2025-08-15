import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, ThumbsUp, Share2, Bookmark, BookmarkCheck } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  useFonts,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';

const { width: screenWidth } = Dimensions.get('window');

// Sample current user ID - in a real app this would come from auth
const CURRENT_USER_ID = 1;

function RelatedVideoCard({ video, onPress, onSave, isSaved }) {
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  return (
    <TouchableOpacity style={styles.relatedVideoCard} onPress={() => onPress(video)}>
      <View style={styles.relatedThumbnailContainer}>
        <Image source={{ uri: video.thumbnail_url }} style={styles.relatedThumbnail} />
        <View style={styles.relatedDurationBadge}>
          <Text style={styles.relatedDurationText}>
            {formatDuration(video.duration)}
          </Text>
        </View>
      </View>
      
      <View style={styles.relatedVideoInfo}>
        <View style={styles.relatedVideoDetails}>
          <Text style={styles.relatedVideoTitle} numberOfLines={2}>
            {video.title}
          </Text>
          <Text style={styles.relatedVideoMeta}>
            {formatViewCount(video.view_count)} • {video.category}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.relatedSaveButton} 
          onPress={() => onSave(video.id)}
        >
          {isSaved ? (
            <BookmarkCheck size={16} color="#FF0000" />
          ) : (
            <Bookmark size={16} color="#6B6B6B" />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function VideoPlayerScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [savedVideos, setSavedVideos] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  // Create video player
  const player = useVideoPlayer(
    video?.video_url || '',
    (player) => {
      if (video?.video_url) {
        player.muted = false;
        player.loop = false;
        player.play();
      }
    }
  );

  const fetchVideoData = useCallback(async () => {
    try {
      // Fetch current video
      const videoResponse = await fetch(`/api/videos/${id}`);
      const videoData = await videoResponse.json();

      // Fetch related videos (same category, different video)
      const relatedResponse = await fetch(
        `/api/videos?type=long&category=${videoData.video?.category}&limit=5&user_id=${CURRENT_USER_ID}`
      );
      const relatedData = await relatedResponse.json();

      if (videoData.video) {
        setVideo(videoData.video);

        // Add to watch history
        try {
          await fetch(`/api/users/${CURRENT_USER_ID}/watch-history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_id: parseInt(id) }),
          });
        } catch (error) {
          console.error('Error adding to watch history:', error);
        }
      }

      if (relatedData.success && relatedData.videos) {
        // Filter out current video and get first 5
        const filtered = relatedData.videos.filter(v => v.id !== parseInt(id)).slice(0, 5);
        setRelatedVideos(filtered);

        // Extract saved video IDs
        const savedIds = new Set();
        [...(videoData.video?.isSaved ? [videoData.video] : []), ...filtered].forEach(video => {
          if (video.isSaved) {
            savedIds.add(video.id);
          }
        });
        setSavedVideos(savedIds);
      }
    } catch (error) {
      console.error('Error fetching video data:', error);
      Alert.alert('Error', 'Failed to load video');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchVideoData();
    }
  }, [fetchVideoData, id]);

  const handleBack = () => {
    router.back();
  };

  const handleLike = useCallback(async () => {
    try {
      const response = await fetch(`/api/videos/${id}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        setIsLiked(true);
        setVideo(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : null);
      }
    } catch (error) {
      console.error('Error liking video:', error);
    }
  }, [id]);

  const handleShare = useCallback(async () => {
    try {
      const { Share } = await import('react-native');
      await Share.share({
        message: `Check out this video: ${video?.title}`,
        url: video?.youtube_url || video?.video_url,
      });
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  }, [video]);

  const handleSaveVideo = useCallback(async (videoId) => {
    try {
      const isSaved = savedVideos.has(videoId);
      
      if (isSaved) {
        // Remove from saved
        const response = await fetch(
          `/api/users/${CURRENT_USER_ID}/saved-videos?video_id=${videoId}`,
          { method: 'DELETE' }
        );
        
        if (response.ok) {
          setSavedVideos(prev => {
            const newSet = new Set(prev);
            newSet.delete(videoId);
            return newSet;
          });
        }
      } else {
        // Add to saved
        const response = await fetch(
          `/api/users/${CURRENT_USER_ID}/saved-videos`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_id: videoId }),
          }
        );
        
        if (response.ok) {
          setSavedVideos(prev => new Set([...prev, videoId]));
        }
      }
    } catch (error) {
      console.error('Error saving video:', error);
      Alert.alert('Error', 'Failed to save video');
    }
  }, [savedVideos]);

  const handleRelatedVideoPress = (relatedVideo) => {
    router.replace(`/video/${relatedVideo.id}`);
  };

  const formatViewCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  if (loading || !fontsLoaded || !video) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header - overlay on video */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          <VideoView
            player={player}
            style={styles.video}
            nativeControls={true}
            allowsFullscreen={true}
            contentFit="contain"
          />
        </View>

        {/* Video Info */}
        <View style={styles.videoInfoContainer}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.videoMeta}>
            {formatViewCount(video.view_count)} views • {video.category}
          </Text>
          
          {video.description && (
            <Text style={styles.videoDescription}>{video.description}</Text>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLike}
            >
              <ThumbsUp 
                size={20} 
                color={isLiked ? "#FF0000" : "#6B7280"} 
                fill={isLiked ? "#FF0000" : "transparent"} 
              />
              <Text style={[styles.actionButtonText, isLiked && styles.activeActionText]}>
                {video.likes_count || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Share2 size={20} color="#6B7280" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleSaveVideo(video.id)}
            >
              {savedVideos.has(video.id) ? (
                <>
                  <BookmarkCheck size={20} color="#FF0000" />
                  <Text style={[styles.actionButtonText, styles.activeActionText]}>Saved</Text>
                </>
              ) : (
                <>
                  <Bookmark size={20} color="#6B7280" />
                  <Text style={styles.actionButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Related Videos */}
        {relatedVideos.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Related Videos</Text>
            {relatedVideos.map((relatedVideo) => (
              <RelatedVideoCard
                key={relatedVideo.id}
                video={relatedVideo}
                onPress={handleRelatedVideoPress}
                onSave={handleSaveVideo}
                isSaved={savedVideos.has(relatedVideo.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto_400Regular',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  videoContainer: {
    width: screenWidth,
    height: screenWidth * 0.5625, // 16:9 aspect ratio
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoInfoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  videoTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 8,
  },
  videoMeta: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Roboto_400Regular',
    marginBottom: 12,
  },
  videoDescription: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Roboto_400Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Roboto_500Medium',
    marginLeft: 6,
  },
  activeActionText: {
    color: '#FF0000',
  },
  relatedSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
  },
  relatedTitle: {
    fontSize: 18,
    fontFamily: 'Roboto_700Bold',
    color: '#1F2937',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  relatedVideoCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  relatedThumbnailContainer: {
    position: 'relative',
  },
  relatedThumbnail: {
    width: 140,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  relatedDurationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  relatedDurationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Roboto_400Regular',
  },
  relatedVideoInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  relatedVideoDetails: {
    flex: 1,
    marginRight: 8,
  },
  relatedVideoTitle: {
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
    color: '#1F2937',
    lineHeight: 18,
    marginBottom: 4,
  },
  relatedVideoMeta: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Roboto_400Regular',
  },
  relatedSaveButton: {
    padding: 8,
  },
});