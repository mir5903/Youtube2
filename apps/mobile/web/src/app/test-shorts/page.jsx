'use client';
import React, { useState, useEffect } from 'react';

export default function TestShortsPage() {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShorts();
  }, []);

  const fetchShorts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/videos?type=short&limit=10');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched shorts data:', data);
      
      if (data.success && data.videos) {
        setShorts(data.videos);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching shorts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Shorts Debug Page</h1>
      
      {loading && <p className="text-blue-600">Loading shorts...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      <div className="mb-4">
        <p className="font-semibold">Total Shorts Found: {shorts.length}</p>
      </div>
      
      {shorts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shorts.map((short) => (
            <div key={short.id} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-bold text-lg mb-2">{short.title || 'Untitled'}</h3>
              
              <div className="mb-2">
                <p className="text-sm text-gray-600">
                  <strong>Channel:</strong> {short.channel_name || 'Unknown'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Type:</strong> {short.video_type}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>ID:</strong> {short.id}
                </p>
              </div>
              
              {short.thumbnail_url && (
                <div className="mb-2">
                  <img 
                    src={short.thumbnail_url} 
                    alt={short.title}
                    className="w-full h-48 object-cover rounded"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=Thumbnail+Not+Found';
                    }}
                  />
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                <p><strong>Video URL:</strong></p>
                <p className="truncate">{short.video_url || 'N/A'}</p>
              </div>
              
              {short.youtube_url && (
                <div className="text-xs text-gray-500 mt-1">
                  <p><strong>YouTube URL:</strong></p>
                  <p className="truncate">{short.youtube_url}</p>
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-400">
                Created: {new Date(short.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && shorts.length === 0 && !error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No shorts found. Please add some shorts through the admin panel.
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h2 className="font-bold mb-2">Debug Information</h2>
        <pre className="text-xs overflow-auto bg-white p-2 rounded">
          {JSON.stringify({ shortsCount: shorts.length, shorts: shorts.slice(0, 2) }, null, 2)}
        </pre>
      </div>
    </div>
  );
}