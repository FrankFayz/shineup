import React, { useState, useRef, useEffect, useCallback } from 'react';
import Header from '../components/Header.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import VideoInfoSidebar from '../components/VideoInfoSidebar.jsx';
import MobileVideoControls from '../components/MobileVideoControls.jsx';
import '../styles/mainPage.css';

// Throttle utility function - moved outside component
const useThrottle = (callback, delay) => {
  const lastCall = useRef(0);
  
  return useCallback((...args) => {
    const now = new Date().getTime();
    if (now - lastCall.current < delay) return;
    lastCall.current = now;
    return callback(...args);
  }, [callback, delay]);
};

// Backend API base URL
const API_BASE_URL = 'http://localhost:8000/api';

const MainPage = () => {
  const [videos, setVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Individual video states
  const [videoStates, setVideoStates] = useState({});
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    topics: [{ title: '', content: '' }]
  });
  
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch videos from Django backend on component mount
  useEffect(() => {
    fetchVideos();
  }, []);

  // Backend API call to fetch videos
  const fetchVideos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/`);
      if (response.ok) {
        const videosData = await response.json();
        setVideos(videosData);
        setFilteredVideos(videosData);
      } else {
        console.error('Failed to fetch videos');
        // Fallback to sample data if backend is not available
        setVideos(sampleVideos);
        setFilteredVideos(sampleVideos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      // Fallback to sample data
      setVideos(sampleVideos);
      setFilteredVideos(sampleVideos);
    }
  };

  // Initialize video states when videos change
  useEffect(() => {
    const initialVideoStates = videos.reduce((acc, video) => ({
      ...acc,
      [video.id]: { 
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        progress: 0
      }
    }), {});
    setVideoStates(initialVideoStates);
  }, [videos]);

  const currentVideo = filteredVideos[currentVideoIndex] || (videos[0] || null);
  const currentVideoState = videoStates[currentVideo?.id] || {};

  // Video upload functionality
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file');
      return;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      alert('File size must be less than 500MB');
      return;
    }

    setSelectedFile(file);
    setShowUploadForm(true);
    setUploadFormData({
      title: file.name.replace(/\.[^/.]+$/, ""),
      description: '',
      topics: [{ title: '', content: '' }]
    });
  };

  // Handle form input changes
  const handleFormChange = useCallback((field, value) => {
    setUploadFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle topic changes
  const handleTopicChange = useCallback((index, field, value) => {
    const updatedTopics = [...uploadFormData.topics];
    updatedTopics[index][field] = value;
    setUploadFormData(prev => ({
      ...prev,
      topics: updatedTopics
    }));
  }, [uploadFormData.topics]);

  // Add new topic field
  const addTopic = useCallback(() => {
    setUploadFormData(prev => ({
      ...prev,
      topics: [...prev.topics, { title: '', content: '' }]
    }));
  }, []);

  // Remove topic field
  const removeTopic = useCallback((index) => {
    if (uploadFormData.topics.length > 1) {
      const updatedTopics = uploadFormData.topics.filter((_, i) => i !== index);
      setUploadFormData(prev => ({
        ...prev,
        topics: updatedTopics
      }));
    }
  }, [uploadFormData.topics.length]);

  // Helper function to get CSRF token (Django specific)
  const getCSRFToken = useCallback(() => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }, []);

  // Backend API call to upload video with metadata
  const uploadVideoToBackend = useCallback(async (file, formData) => {
    const data = new FormData();
    data.append('video_file', file);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('topics', JSON.stringify(formData.topics));

    try {
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 201) {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', `${API_BASE_URL}/videos/upload/`);
        
        // Add CSRF token if needed (Django specific)
        const csrfToken = getCSRFToken();
        if (csrfToken) {
          xhr.setRequestHeader('X-CSRFToken', csrfToken);
        }
        
        xhr.send(data);
      });
    } catch (error) {
      throw new Error('Upload failed: ' + error.message);
    }
  }, [getCSRFToken]);

  // Handle form submission and actual upload
  const handleUploadSubmit = async () => {
    if (!selectedFile || !uploadFormData.title.trim()) {
      alert('Please provide a title for your video');
      return;
    }

    setShowUploadForm(false);
    setShowUploadModal(true);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Backend API call to upload video
      const newVideo = await uploadVideoToBackend(selectedFile, uploadFormData);
      
      // Add the new video to the state
      setVideos(prev => [newVideo, ...prev]);
      setCurrentVideoIndex(0);
      
      // Reset form and file
      setSelectedFile(null);
      setUploadFormData({
        title: '',
        description: '',
        topics: [{ title: '', content: '' }]
      });
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
      
      // Fallback: Create a local video object if backend fails
      const videoUrl = URL.createObjectURL(selectedFile);
      const newVideo = {
        id: Date.now(),
        title: uploadFormData.title,
        description: uploadFormData.description,
        uploadDate: new Date().toISOString().split('T')[0],
        views: "0",
        user: {
          name: "Kasiita Frank",
          profilePic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
          university: "KABALE UNIVERSITY",
          department: "Computer Science",
          followers: "0",
          videos: 1,
          isVerified: false
        },
        videoUrl: videoUrl,
        likes: "0",
        shares: "0",
        comments: "0",
        duration: "0:00",
        topics: uploadFormData.topics.filter(topic => topic.title.trim() !== ''),
        isUploaded: true
      };

      setVideos(prev => [newVideo, ...prev]);
      setCurrentVideoIndex(0);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const cancelUpload = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setShowUploadModal(false);
    setShowUploadForm(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Search filtering
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = videos.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.topics && video.topics.some(topic => 
          topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.content.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
      setFilteredVideos(filtered);
      setCurrentVideoIndex(0);
    } else {
      setFilteredVideos(videos);
    }
  }, [searchQuery, videos]);

  // Video control functions
  const togglePlay = useCallback((videoId) => {
    setVideoStates(prev => ({
      ...prev,
      [videoId]: { ...prev[videoId], isPlaying: !prev[videoId]?.isPlaying }
    }));
  }, []);

  const handleVideoClick = useCallback((videoId) => {
    togglePlay(videoId);
  }, [togglePlay]);

  const handleVideoTimeUpdate = useCallback((videoId, currentTime, duration, progress) => {
    setVideoStates(prev => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        currentTime,
        duration,
        progress
      }
    }));
  }, []);

  // Scroll handling
  const handleScroll = useCallback((e) => {
    if (isScrolling) return;
    
    // Check if we're scrolling in the sidebar (don't switch videos if scrolling sidebar)
    const isSidebarScroll = e.target.closest('.video-info-sidebar-container');
    if (isSidebarScroll) return;
    
    setIsScrolling(true);
    const delta = Math.sign(e.deltaY);
    
    if (delta > 0 && currentVideoIndex < filteredVideos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
      // Pause current video when switching
      if (currentVideo) {
        setVideoStates(prev => ({
          ...prev,
          [currentVideo.id]: { ...prev[currentVideo.id], isPlaying: false }
        }));
      }
    } else if (delta < 0 && currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
      if (currentVideo) {
        setVideoStates(prev => ({
          ...prev,
          [currentVideo.id]: { ...prev[currentVideo.id], isPlaying: false }
        }));
      }
    }
    
    setTimeout(() => setIsScrolling(false), 500);
  }, [isScrolling, currentVideoIndex, filteredVideos.length, currentVideo]);

  const throttledScroll = useThrottle(handleScroll, 500);

  // Touch handling with velocity detection
  const handleTouchStart = useCallback((e) => {
    // Don't handle touch if it's on the sidebar
    if (e.target.closest('.video-info-sidebar-container')) return;

    const touchStartY = e.touches[0].clientY;
    const touchStartTime = Date.now();
    
    const handleTouchEnd = (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY;
      const deltaTime = Date.now() - touchStartTime;
      const velocity = Math.abs(deltaY) / deltaTime;

      if (Math.abs(deltaY) > 50 || velocity > 0.3) {
        if (deltaY > 0 && currentVideoIndex < filteredVideos.length - 1) {
          setCurrentVideoIndex(prev => prev + 1);
          if (currentVideo) {
            setVideoStates(prev => ({
              ...prev,
              [currentVideo.id]: { ...prev[currentVideo.id], isPlaying: false }
            }));
          }
        } else if (deltaY < 0 && currentVideoIndex > 0) {
          setCurrentVideoIndex(prev => prev - 1);
          if (currentVideo) {
            setVideoStates(prev => ({
              ...prev,
              [currentVideo.id]: { ...prev[currentVideo.id], isPlaying: false }
            }));
          }
        }
      }
      
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchend', handleTouchEnd);
  }, [currentVideoIndex, filteredVideos.length, currentVideo]);

  // Scroll and touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', throttledScroll, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', throttledScroll);
        container.removeEventListener('touchstart', handleTouchStart);
      }
    };
  }, [throttledScroll, handleTouchStart]);

  // Keyboard shortcuts - now ignores input fields
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Check if the active element is an input field, textarea, or contenteditable
      const activeElement = document.activeElement;
      const isInputField = 
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable;
      
      // If user is typing in an input field, don't handle keyboard shortcuts
      if (isInputField) {
        return;
      }

      // Handle keyboard shortcuts only when not in input fields
      if (e.code === 'Space') {
        e.preventDefault();
        if (currentVideo) {
          togglePlay(currentVideo.id);
        }
      } else if (e.code === 'ArrowDown' && currentVideoIndex < filteredVideos.length - 1) {
        e.preventDefault();
        setCurrentVideoIndex(prev => prev + 1);
      } else if (e.code === 'ArrowUp' && currentVideoIndex > 0) {
        e.preventDefault();
        setCurrentVideoIndex(prev => prev - 1);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentVideo, currentVideoIndex, filteredVideos.length, togglePlay]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // Sample videos data (fallback)
  const sampleVideos = [
    {
      id: 1,
      title: "Introduction to Machine Learning",
      description: "Learn the basics of machine learning algorithms and their applications in real-world scenarios. This video covers fundamental concepts that every computer science student should know. We'll explore supervised learning, unsupervised learning, and deep learning architectures.",
      uploadDate: "2023-10-15",
      views: "125K",
      user: {
        name: "Dr. Sarah Johnson",
        profilePic: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
        university: "Stanford University",
        department: "Computer Science",
        followers: "12.5K",
        videos: 47,
        isVerified: true
      },
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      likes: "2.4K",
      shares: "356",
      comments: "128",
      duration: "15:30",
      topics: [
        {
          title: "Machine Learning Fundamentals",
          content: "Comprehensive explanation about ML fundamentals and applications in modern technology."
        },
        {
          title: "Neural Networks",
          content: "Understanding how artificial neural networks work and their architecture."
        }
      ]
    },
    {
      id: 2,
      title: "Deep Learning Fundamentals",
      description: "Understanding neural networks and deep learning architectures for modern AI applications. This video dives into convolutional neural networks, recurrent neural networks, and transformer architectures.",
      uploadDate: "2023-10-20",
      views: "89K",
      user: {
        name: "Prof. Michael Chen",
        profilePic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80",
        university: "MIT",
        department: "AI Research",
        followers: "8.7K",
        videos: 32,
        isVerified: true
      },
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      likes: "1.8K",
      shares: "289",
      comments: "94",
      duration: "22:15",
      topics: [
        {
          title: "Deep Learning Architectures",
          content: "Exploring different deep learning models and their use cases."
        }
      ]
    }
  ];

  return (
    <div className="main-page tiktok-style" ref={containerRef}>
      <Header onUploadClick={handleUploadClick} onSearch={handleSearch} />
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="video/*"
        style={{ display: 'none' }}
      />
      
      {/* Upload Form Modal */}
      {showUploadForm && selectedFile && (
        <div className="upload-modal-overlay">
          <div className="upload-form-modal">
            <h3>Describe Your Video</h3>
            <div className="upload-form">
              <div className="form-group">
                <label>Video Title *</label>
                <input
                  type="text"
                  value={uploadFormData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="Enter a compelling title for your video"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={uploadFormData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Describe what your video is about..."
                  rows="4"
                />
              </div>
              
              <div className="topics-section">
                <label>Topics Covered</label>
                {uploadFormData.topics.map((topic, index) => (
                  <div key={index} className="topic-input-group">
                    <input
                      type="text"
                      value={topic.title}
                      onChange={(e) => handleTopicChange(index, 'title', e.target.value)}
                      placeholder="Topic title"
                    />
                    <input
                      type="text"
                      value={topic.content}
                      onChange={(e) => handleTopicChange(index, 'content', e.target.value)}
                      placeholder="Topic description"
                    />
                    {uploadFormData.topics.length > 1 && (
                      <button 
                        type="button" 
                        className="remove-topic-btn"
                        onClick={() => removeTopic(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  className="add-topic-btn"
                  onClick={addTopic}
                >
                  Add Another Topic
                </button>
              </div>
              
              <div className="form-actions">
                <button 
                  onClick={cancelUpload}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUploadSubmit}
                  className="upload-submit-btn"
                  disabled={!uploadFormData.title.trim()}
                >
                  Upload Video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Progress Modal */}
      {showUploadModal && (
        <div className="upload-modal-overlay">
          <div className="upload-modal">
            <h3>{isUploading ? 'Uploading Video' : 'Upload Complete'}</h3>
            {isUploading ? (
              <>
                <div className="upload-progress-bar">
                  <div 
                    className="upload-progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p>{Math.round(uploadProgress)}%</p>
                <button onClick={cancelUpload} className="cancel-upload-btn">
                  Cancel Upload
                </button>
              </>
            ) : (
              <>
                <div className="upload-success">
                  <span>✓</span>
                  <p>Video uploaded successfully!</p>
                </div>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="close-upload-btn"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="content-container">
        {/* Video Feed Container */}
        <div className="video-feed-container">
          {filteredVideos.map((video, index) => (
            <div 
              key={video.id}
              className={`video-section ${index === currentVideoIndex ? 'active' : 'inactive'}`}
            >
              <div className="video-content-wrapper">
                {/* Video Player - 3/4 width on PC, full width on mobile */}
                <div className="video-player-section">
                  <VideoPlayer
                    videoUrl={video.videoUrl}
                    isPlaying={videoStates[video.id]?.isPlaying || false}
                    onTogglePlay={() => togglePlay(video.id)}
                    onVideoClick={() => handleVideoClick(video.id)}
                    onTimeUpdate={(currentTime, duration, progress) => 
                      handleVideoTimeUpdate(video.id, currentTime, duration, progress)
                    }
                    showOverlay={index === currentVideoIndex}
                    isMobile={isMobile}
                  />
                  
                  {/* Mobile Video Info - Only visible on mobile */}
                  {isMobile && (
                    <div className="mobile-video-info">
                      <VideoInfoSidebar 
                        video={video}
                        isMobile={true}
                      />
                    </div>
                  )}

                  {/* Scroll Indicator */}
                  {index === currentVideoIndex && filteredVideos.length > 1 && (
                    <div className="scroll-indicator">
                      <span>↓ Scroll for next video ↑</span>
                    </div>
                  )}
                </div>

                {/* Video Info Sidebar - 1/4 width on PC, hidden on mobile */}
                {!isMobile && (
                  <div className="video-info-sidebar">
                    <VideoInfoSidebar 
                      video={video}
                      isMobile={false}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* No Results Message */}
          {filteredVideos.length === 0 && (
            <div className="no-results">
              <h3>No videos found</h3>
              <p>Try different search terms or upload your own video!</p>
              <button onClick={handleUploadClick} className="upload-cta-btn">
                Upload Your First Video
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Video Controls - Only progress bar at bottom */}
      {isMobile && currentVideo && (
        <MobileVideoControls 
          currentTime={currentVideoState.currentTime || 0}
          duration={currentVideoState.duration || 0}
          progress={currentVideoState.progress || 0}
        />
      )}
    </div>
  );
};

export default MainPage;