// client/src/components/GitHubSettings.js
import React, { useState } from 'react';

const GitHubSettings = ({ onAuthSuccess }) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/github/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store token in local storage (consider more secure options for production)
        localStorage.setItem('github_token', token);
        onAuthSuccess(token, data.username);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="github-settings">
      <h2>GitHub Authentication</h2>
      <p>To create slideshows, you need to authenticate with GitHub:</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="token">GitHub Personal Access Token:</label>
          <input
            type="password"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <small>
            <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
              Create a new token
            </a> with "repo" permissions
          </small>
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Authenticating...' : 'Authenticate'}
        </button>
      </form>
    </div>
  );
};

export default GitHubSettings;