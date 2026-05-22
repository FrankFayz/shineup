import React, { useState } from 'react';
import { FaSearch, FaMicrophone } from 'react-icons/fa';
import '../styles/searchBar.css';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleVoiceSearch = () => {
    // Voice search functionality can be implemented here
    alert('Voice search feature coming soon!');
  };

  return (
    <div className="search-bar-container">
      <form className="search-form" onSubmit={handleSubmit}>
        <div className="search-input-group">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search for videos, topics, or creators..."
            value={query}
            onChange={handleInputChange}
          />
          <button 
            type="button" 
            className="voice-search"
            onClick={handleVoiceSearch}
          >
            <FaMicrophone />
          </button>
        </div>
        <button type="submit" className="search-btn">
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchBar;