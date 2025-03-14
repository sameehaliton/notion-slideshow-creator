// client/src/components/CreateSlideshow.js
import React, { useState } from 'react';
import './CreateSlideshow.css';

const CreateSlideshow = ({ images, githubToken, onCreated }) => {
  const [repositoryName, setRepositoryName] = useState('');
  const [slideshowName, setSlideshowName] = useState('');
  const [isCreatingRepo, setIsCreatingRepo] = useState(false);
  const [isCreatingSlideshow, setIsCreatingSlideshow] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [slideshowUrl, setSlideshowUrl] = useState('');
  
  const handleCreateRepository = async () => {
    if (!repositoryName) {
      setError('Repository name is required');
      return;
    }
    
    setIsCreatingRepo(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/github/create-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: githubToken,
          repo_name: repositoryName
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Repository "${repositoryName}" created successfully!`);
      } else {
        setError(data.error || 'Failed to create repository');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error(err);
    } finally {
      setIsCreatingRepo(false);
    }
  };
  
  const handleCreateSlideshow = async () => {
    if (!repositoryName || !slideshowName) {
      setError('Repository and slideshow names are required');
      return;
    }
    
    if (images.length === 0) {
      setError('You need to upload at least one image');
      return;
    }
    
    setIsCreatingSlideshow(true);
    setError('');
    setSuccess('');
    
    try {
      // Create FormData to send files
      const formData = new FormData();
      formData.append('token', githubToken);
      formData.append('repo_name', repositoryName);
      formData.append('slideshow_name', slideshowName);
      
      // Add all image files
      images.forEach((image, index) => {
        formData.append('images', image);
      });
      
      const response = await fetch('http://localhost:5000/api/github/create-slideshow', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Slideshow created successfully!`);
        setSlideshowUrl(data.url);
        
        if (onCreated) {
          onCreated(data);
        }
      } else {
        setError(data.error || 'Failed to create slideshow');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error(err);
    } finally {
      setIsCreatingSlideshow(false);
    }
  };
  
  return (
    <div className="create-slideshow">
      <h2>Create Slideshow</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="form-group">
        <label htmlFor="repository">Repository Name:</label>
        <div className="input-with-button">
          <input
            type="text"
            id="repository"
            value={repositoryName}
            onChange={(e) => setRepositoryName(e.target.value)}
            placeholder="e.g., notion-slideshows"
          />
          <button 
            onClick={handleCreateRepository} 
            disabled={isCreatingRepo || !repositoryName}
          >
            {isCreatingRepo ? 'Creating...' : 'Create Repo'}
          </button>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="slideshow">Slideshow Name:</label>
        <input
          type="text"
          id="slideshow"
          value={slideshowName}
          onChange={(e) => setSlideshowName(e.target.value)}
          placeholder="e.g., vacation-photos"
        />
      </div>
      
      <button 
        className="create-button"
        onClick={handleCreateSlideshow} 
        disabled={isCreatingSlideshow || !repositoryName || !slideshowName || images.length === 0}
      >
        {isCreatingSlideshow ? 'Creating Slideshow...' : 'Create Slideshow'}
      </button>
      
      {slideshowUrl && (
        <div className="slideshow-url">
          <h3>Your Slideshow URL:</h3>
          <div className="url-container">
            <input 
              type="text" 
              value={slideshowUrl} 
              readOnly 
              onClick={(e) => e.target.select()}
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(slideshowUrl);
                alert('URL copied to clipboard!');
              }}
            >
              Copy
            </button>
          </div>
          <p className="url-instructions">
            Paste this URL into Notion as an embed to display your slideshow.
          </p>
        </div>
      )}
    </div>
  );
};

export default CreateSlideshow;