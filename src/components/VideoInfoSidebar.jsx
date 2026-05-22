import React, { useState } from 'react';
import { 
  FaUserCircle, 
  FaCalendarAlt, 
  FaEye, 
  FaGraduationCap,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import '../styles/VideoInfoSidebar.css';

const VideoInfoSidebar = ({ video, isMobile }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // For PC, show limited description with show more/less
  const getDescription = () => {
    if (showFullDescription || video.description.length <= 200) {
      return video.description;
    }
    return video.description.substring(0, 200) + '...';
  };

  // Prevent scroll propagation to parent
  const handleScroll = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      className={`video-info-sidebar-container ${isMobile ? 'mobile' : 'desktop'}`}
      onWheel={handleScroll}
      onTouchMove={handleScroll}
    >
      {/* User Info Section */}
      <div className="user-info-section">
        
        <div className="user-details">
          <div className="user-name">
            <h3>{video.user.name}</h3>
            {video.user.isVerified && <FaCheckCircle className="verified-icon" />}
          </div>
          <div className="user-university">
            <FaGraduationCap className="icon" />
            <span>{video.user.university}</span>
          </div>
          <div className="user-stats">
            <span className="stat">
              <FaEye className="icon" />
              {video.user.followers} followers
            </span>
            <span className="stat">
              <FaUserCircle className="icon" />
              {video.user.videos} videos
            </span>
          </div>
        </div>
      </div>

      {/* Video Description */}
      <div className="description-section">
        <h4 className="description-title">About this video</h4>
        <p className="video-description">
          {getDescription()}
        </p>
        {video.description.length > 200 && (
          <button className="show-more-btn" onClick={toggleDescription}>
            {showFullDescription ? 'Show less' : 'Show more'}
            {showFullDescription ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        )}
      </div>

      {/* Video Metadata */}
      <div className="metadata-section">
        <div className="metadata-item">
          <FaCalendarAlt className="meta-icon" />
          <span>Uploaded: {formatDate(video.uploadDate)}</span>
        </div>
        <div className="metadata-item">
          <FaEye className="meta-icon" />
          <span>Views: {video.views}</span>
        </div>
        {video.isUploaded && (
          <div className="uploaded-badge">
            Your Upload
          </div>
        )}
      </div>

      {/* Topics Covered */}
      <div className="topics-section">
        <h4 className="topics-title">Topics Covered</h4>
        <div className="topics-list">
          {video.topics.map((topic, index) => (
            <div key={index} className="topic-item">
              <h5 className="topic-title">{topic.title}</h5>
              <p className="topic-content">{topic.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoInfoSidebar;
