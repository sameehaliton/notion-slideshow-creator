// client/src/components/ImageUploader.js
import React, { useState } from 'react';
import './ImageUploader.css';

const ImageUploader = ({ onImagesUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.match('image/*')
    );
    
    if (files.length > 0) {
      onImagesUploaded(files);
    }
  };
  
  const handleFileInput = (e) => {
    const files = Array.from(e.target.files).filter(
      file => file.type.match('image/*')
    );
    
    if (files.length > 0) {
      onImagesUploaded(files);
    }
  };
  
  return (
    <div 
      className={`uploader-container ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="uploader-content">
        <h2>Drag & Drop Images Here</h2>
        <p>or</p>
        <input 
          type="file" 
          id="file-input" 
          multiple 
          accept="image/*" 
          onChange={handleFileInput} 
          style={{ display: 'none' }}
        />
        <button onClick={() => document.getElementById('file-input').click()}>
          Select Files
        </button>
      </div>
    </div>
  );
};

export default ImageUploader;