import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [hideCards, setHideCards] = useState(false);
  const [uiState, setUiState] = useState("initial"); // 'initial', 'transitioning', 'upload'
  const [transitionStage, setTransitionStage] = useState(0); // 0: not started, 1: title moving, 2: button expanding, 3: complete
  const [isDragging, setIsDragging] = useState(false); // Track if user is dragging files over the drop zone
  const [uploadedImages, setUploadedImages] = useState([]); // Store uploaded images
  const [draggedItem, setDraggedItem] = useState(null); // Track which item is being dragged for reordering
  const [dragOverItem, setDragOverItem] = useState(null); // Track which item is being dragged over
  const [showGithubForm, setShowGithubForm] = useState(false); // Track whether to show the GitHub access form
  const [githubInfo, setGithubInfo] = useState({
    // Store GitHub access information
    token: "",
    username: "",
    repository: "",
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track if the user is logged in
  const [slideshowName, setSlideshowName] = useState(""); // Store the slideshow folder name
  const [showSettings, setShowSettings] = useState(false); // Track whether to show the settings button
  const [isLoading, setIsLoading] = useState(false); // Track loading state
  const [generatedLink, setGeneratedLink] = useState(""); // Track generated link
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Track whether to show the success modal
  const [showToken, setShowToken] = useState(false); // Track whether to show the token in plain text
  const buttonRef = useRef(null);
  const titleRef = useRef(null);
  const dropZoneRef = useRef(null);
  const githubFormRef = useRef(null);

  // Load GitHub credentials from local storage on component mount
  useEffect(() => {
    const storedGithubInfo = localStorage.getItem("githubInfo");
    if (storedGithubInfo) {
      const parsedInfo = JSON.parse(storedGithubInfo);
      setGithubInfo(parsedInfo);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "";
  }, [darkMode]);

  // Ensure title position is fixed after initial transition
  useEffect(() => {
    if (transitionStage >= 1 && titleRef.current) {
      // Lock the title in place after it moves up
      titleRef.current.style.position = "absolute";
      titleRef.current.style.top = "0";
      titleRef.current.style.left = "0";
    }
  }, [transitionStage]);

  const handleClick = () => {
    if (!showGetStarted) {
      // Force the hover state to show the cards flying away
      setIsHovering(true);

      // Move the title up
      setUiState("transitioning");
      setTransitionStage(1);

      // After the cards have flown away, show the button
      setTimeout(() => {
        setShowGetStarted(true);
        // Keep the cards hidden
        setHideCards(true);
      }, 800);
    }
  };

  const handleGetStarted = () => {
    // Button expands
    setTransitionStage(2);

    // If user is already logged in, skip GitHub form and go straight to image upload
    if (isLoggedIn) {
      setTimeout(() => {
        setTransitionStage(3);
        setShowSettings(true);
      }, 1200);
    } else {
      // Show GitHub form after button has expanded
      setTimeout(() => {
        setShowGithubForm(true);
      }, 1200);
    }
  };

  // Handle GitHub form input changes
  const handleGithubInputChange = (e) => {
    const { name, value } = e.target;
    setGithubInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle slideshow name input change
  const handleSlideshowNameChange = (e) => {
    setSlideshowName(e.target.value);
  };

  // Handle GitHub form submission
  const handleGithubFormSubmit = (e) => {
    e.preventDefault();

    // Save GitHub info to local storage
    localStorage.setItem("githubInfo", JSON.stringify(githubInfo));
    setIsLoggedIn(true);

    // Transition to the image upload UI
    setShowGithubForm(false);
    setTransitionStage(3);
    setShowSettings(true);
  };

  // Handle settings button click
  const handleSettingsClick = () => {
    setShowGithubForm(true);
  };

  // Handle logout
  const handleLogout = () => {
    // Clear GitHub info from local storage
    localStorage.removeItem("githubInfo");
    setIsLoggedIn(false);
    setGithubInfo({
      token: "",
      username: "",
      repository: "",
    });

    // Close the GitHub form
    setShowGithubForm(false);
  };

  // Handle drag events for file dropping
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // Process the uploaded files
  const handleFiles = (files) => {
    const newImages = Array.from(files)
      .map((file) => {
        // Only process image files
        if (!file.type.match("image.*")) {
          return null;
        }

        return {
          file,
          preview: URL.createObjectURL(file),
          name: file.name,
        };
      })
      .filter(Boolean); // Remove null entries

    setUploadedImages((prev) => [...prev, ...newImages]);
  };

  // Handle manual upload button click
  const handleUploadClick = () => {
    // Trigger hidden file input click
    document.getElementById("file-input").click();
  };

  // Handle generate link button click
  const handleGenerateLink = async () => {
    // Generate a default slideshow name if not provided
    const folderName =
      slideshowName.trim() || `slideshow-${new Date().getTime()}`;

    // Show loading state
    setIsLoading(true);

    try {
      // Step 1: Create the HTML content for the slideshow
      const htmlContent = generateSlideshowHTML(uploadedImages, folderName);

      // Step 2: Upload images and HTML to GitHub
      const repoUrl = await uploadToGitHub(
        uploadedImages,
        htmlContent,
        folderName
      );

      // Step 3: Generate the shareable link
      const slideshowUrl = `https://${githubInfo.username}.github.io/${githubInfo.repository}/${folderName}/index.html`;

      // Show success message with the link
      setIsLoading(false);
      setGeneratedLink(slideshowUrl);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error generating link:", error);
      setIsLoading(false);
      alert(`Error generating link: ${error.message}`);
    }
  };

  // Generate HTML for the slideshow
  const generateSlideshowHTML = (images, folderName) => {
    const imagesHtml = images
      .map((image, index) => {
        return `<div class="slide" ${
          index === 0 ? 'style="display: block;"' : ""
        }>
        <img src="./${index + 1}.${getFileExtension(image.name)}" alt="Slide ${
          index + 1
        }">
      </div>`;
      })
      .join("\n      ");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${folderName}</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      height: 100%;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .slideshow-container {
      position: relative;
      width: 100%;
      height: 100vh;
      background-color: #000;
    }
    .slide {
      display: none;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      justify-content: center;
      align-items: center;
    }
    .slide img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .nav-button {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background-color: rgba(255, 255, 255, 0.3);
      color: white;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      font-size: 24px;
      cursor: pointer;
      z-index: 10;
      transition: background-color 0.3s;
    }
    .nav-button:hover {
      background-color: rgba(255, 255, 255, 0.5);
    }
    .prev {
      left: 20px;
    }
    .next {
      right: 20px;
    }
    .dots-container {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.3);
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .dot.active {
      background-color: white;
    }
  </style>
</head>
<body>
  <div class="slideshow-container">
      ${imagesHtml}
      
      <button class="nav-button prev" onclick="changeSlide(-1)">&#10094;</button>
      <button class="nav-button next" onclick="changeSlide(1)">&#10095;</button>
      
      <div class="dots-container">
        ${images
          .map(
            (_, index) =>
              `<div class="dot ${
                index === 0 ? "active" : ""
              }" onclick="currentSlide(${index + 1})"></div>`
          )
          .join("\n        ")}
      </div>
  </div>

  <script>
    let slideIndex = 1;
    showSlide(slideIndex);
    
    function changeSlide(n) {
      showSlide(slideIndex += n);
    }
    
    function currentSlide(n) {
      showSlide(slideIndex = n);
    }
    
    function showSlide(n) {
      const slides = document.getElementsByClassName("slide");
      const dots = document.getElementsByClassName("dot");
      
      if (n > slides.length) {slideIndex = 1}
      if (n < 1) {slideIndex = slides.length}
      
      for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
      }
      
      for (let i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
      }
      
      slides[slideIndex-1].style.display = "flex";
      dots[slideIndex-1].className += " active";
    }
  </script>
</body>
</html>`;
  };

  // Get file extension from filename
  const getFileExtension = (filename) => {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
  };

  // Upload files to GitHub
  const uploadToGitHub = async (images, htmlContent, folderName) => {
    const { token, username, repository } = githubInfo;
    const apiUrl = `https://api.github.com/repos/${username}/${repository}/contents`;

    // Create a new folder for the slideshow
    const folderPath = `${folderName}`;

    // Upload HTML file
    await uploadFileToGitHub(
      token,
      apiUrl,
      `${folderPath}/index.html`,
      btoa(htmlContent),
      "Create slideshow HTML"
    );

    // Upload each image
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const extension = getFileExtension(image.name);
      const newFilename = `${i + 1}.${extension}`;

      // Convert image to base64
      const base64Data = await getBase64FromFile(image.file);
      const base64Content = base64Data.split(",")[1];

      // Upload to GitHub
      await uploadFileToGitHub(
        token,
        apiUrl,
        `${folderPath}/${newFilename}`,
        base64Content,
        `Upload slide ${i + 1}`
      );
    }

    return `https://github.com/${username}/${repository}/tree/main/${folderPath}`;
  };

  // Upload a single file to GitHub
  const uploadFileToGitHub = async (
    token,
    apiUrl,
    path,
    content,
    commitMessage
  ) => {
    try {
      const response = await fetch(`${apiUrl}/${path}`, {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: commitMessage,
          content: content,
          branch: "main",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API error: ${errorData.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error uploading ${path}:`, error);
      throw error;
    }
  };

  // Convert file to base64
  const getBase64FromFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Remove an image from the uploaded images
  const removeImage = (index) => {
    setUploadedImages((prev) => {
      const newImages = [...prev];
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Handlers for drag and drop reordering
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    // Add a ghost image effect
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add("dragging");

    // Create a custom ghost image that's smaller
    const ghostImg = e.target.cloneNode(true);
    ghostImg.style.width = "100px";
    ghostImg.style.height = "100px";
    ghostImg.style.opacity = "0.8";
    ghostImg.style.position = "absolute";
    ghostImg.style.top = "-1000px";
    document.body.appendChild(ghostImg);
    e.dataTransfer.setDragImage(ghostImg, 50, 50);

    // Remove the ghost element after a short delay
    setTimeout(() => {
      document.body.removeChild(ghostImg);
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove("dragging");
    setDraggedItem(null);
    setDragOverItem(null);

    // Remove any drop indicators
    const indicators = document.querySelectorAll(".drop-indicator");
    indicators.forEach((indicator) => indicator.remove());
  };

  const handleDragEnterItem = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    setDragOverItem(index);

    // Remove any existing indicators
    const existingIndicators = document.querySelectorAll(".drop-indicator");
    existingIndicators.forEach((indicator) => indicator.remove());

    // Create a drop indicator
    const targetElement = e.currentTarget;
    const indicator = document.createElement("div");
    indicator.className = "drop-indicator";

    // Determine if we should place the indicator before or after the target
    const rect = targetElement.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Calculate if we're on the left/right or top/bottom half of the element
    const gridElement = targetElement.parentElement;
    const gridStyle = window.getComputedStyle(gridElement);
    const isHorizontalGrid =
      gridStyle.gridAutoFlow === "column" ||
      (gridStyle.gridTemplateColumns &&
        gridStyle.gridTemplateColumns !== "none");

    if (isHorizontalGrid) {
      // For horizontal grid, check if mouse is on left or right half
      const isLeftHalf = mouseX < rect.left + rect.width / 2;
      indicator.classList.add(isLeftHalf ? "left" : "right");
      targetElement.appendChild(indicator);
    } else {
      // For vertical grid, check if mouse is on top or bottom half
      const isTopHalf = mouseY < rect.top + rect.height / 2;
      indicator.classList.add(isTopHalf ? "top" : "bottom");
      targetElement.appendChild(indicator);
    }
  };

  const handleDragLeaveItem = (e) => {
    e.preventDefault();
    setDragOverItem(null);

    // Only remove the indicator if we're leaving the element completely
    // This check prevents the indicator from disappearing when moving within the element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      const indicators = e.currentTarget.querySelectorAll(".drop-indicator");
      indicators.forEach((indicator) => indicator.remove());
    }
  };

  const handleDragOverItem = (e, index) => {
    e.preventDefault();
    if (draggedItem === null) return;
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropItem = (e, index) => {
    e.preventDefault();
    if (draggedItem === null) return;

    // Remove any drop indicators
    const indicators = document.querySelectorAll(".drop-indicator");
    indicators.forEach((indicator) => indicator.remove());

    // Determine if we should place the item before or after the target
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Calculate if we're on the left/right or top/bottom half of the element
    const gridElement = e.currentTarget.parentElement;
    const gridStyle = window.getComputedStyle(gridElement);
    const isHorizontalGrid =
      gridStyle.gridAutoFlow === "column" ||
      (gridStyle.gridTemplateColumns &&
        gridStyle.gridTemplateColumns !== "none");

    let targetIndex = index;

    if (isHorizontalGrid) {
      // For horizontal grid, if mouse is on right half, insert after
      const isRightHalf = mouseX >= rect.left + rect.width / 2;
      if (isRightHalf && index > draggedItem) {
        targetIndex = index;
      } else if (isRightHalf && index < draggedItem) {
        targetIndex = index + 1;
      } else if (!isRightHalf && index < draggedItem) {
        targetIndex = index;
      } else if (!isRightHalf && index > draggedItem) {
        targetIndex = index - 1;
      }
    } else {
      // For vertical grid, if mouse is on bottom half, insert after
      const isBottomHalf = mouseY >= rect.top + rect.height / 2;
      if (isBottomHalf && index > draggedItem) {
        targetIndex = index;
      } else if (isBottomHalf && index < draggedItem) {
        targetIndex = index + 1;
      } else if (!isBottomHalf && index < draggedItem) {
        targetIndex = index;
      } else if (!isBottomHalf && index > draggedItem) {
        targetIndex = index - 1;
      }
    }

    // Reorder the images
    const newImages = [...uploadedImages];
    const draggedImage = newImages[draggedItem];
    newImages.splice(draggedItem, 1);
    newImages.splice(targetIndex, 0, draggedImage);

    setUploadedImages(newImages);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Toggle token visibility
  const toggleTokenVisibility = () => {
    setShowToken(!showToken);
  };

  // Handle paste event for token input
  const handleTokenPaste = (e) => {
    // Get pasted content
    const pastedText = e.clipboardData.getData("text");
    if (pastedText) {
      // Update the token value directly
      setGithubInfo((prev) => ({
        ...prev,
        token: pastedText.trim(),
      }));
      // Prevent default paste behavior
      e.preventDefault();
    }
  };

  // Handle token input click to select all text
  const handleTokenInputClick = (e) => {
    e.target.select();
  };

  return (
    <div
      className={`app-container ${darkMode ? "dark" : "light"} ${
        uiState === "transitioning" ? `transition-stage-${transitionStage}` : ""
      }`}
      onClick={
        uiState === "initial" && !showGetStarted ? handleClick : undefined
      }
    >
      <header>
        <div className="theme-toggles">
          <button
            className={`theme-toggle ${!darkMode ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent container click handler
              setDarkMode(false);
            }}
            aria-label="Light mode"
          >
            Light
          </button>
          <button
            className={`theme-toggle ${darkMode ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent container click handler
              setDarkMode(true);
            }}
            aria-label="Dark mode"
          >
            Dark
          </button>
        </div>
      </header>

      <main>
        {(uiState === "initial" || uiState === "transitioning") && (
          <div
            className={`landing-container ${
              uiState === "transitioning" ? "transitioning" : ""
            }`}
          >
            <div
              className={`content-section ${
                uiState === "transitioning" ? "transitioning" : ""
              }`}
            >
              <h1
                className={`title ${
                  uiState === "transitioning" ? "transitioning" : ""
                }`}
                ref={titleRef}
              >
                <span className="notion-text">Notion</span>
                <span className="slideshow-text">Slideshow Generator</span>
              </h1>
              <p
                className={`subtitle ${
                  uiState === "transitioning" ? "transitioning" : ""
                }`}
              >
                Upload images to get an embed slideshow widget for Notion
              </p>
            </div>

            <div
              className={`visual-section ${
                uiState === "transitioning" ? "transitioning" : ""
              }`}
              onMouseEnter={() => !hideCards && setIsHovering(true)}
              onMouseLeave={() => !hideCards && setIsHovering(false)}
            >
              {!hideCards && (
                <div
                  className={`cards-container ${isHovering ? "hovering" : ""}`}
                >
                  <div className="card card-1"></div>
                  <div className="card card-2"></div>
                  <div className="card card-3"></div>
                  <div className="card card-4"></div>
                </div>
              )}
            </div>
          </div>
        )}

        {(showGetStarted || uiState === "transitioning") && (
          <div
            className={`button-container ${showGetStarted ? "visible" : ""} ${
              transitionStage >= 2 ? "expanding" : ""
            }`}
            ref={buttonRef}
          >
            <button
              className={`get-started-button ${
                transitionStage >= 2 ? "transitioning" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation(); // Prevent container click handler
                if (showGetStarted && transitionStage === 1) {
                  handleGetStarted();
                }
              }}
            >
              {transitionStage < 2 ? "Get Started" : ""}
            </button>

            {transitionStage === 3 && (
              <div className="upload-preview-container">
                {showSettings && (
                  <button
                    className="settings-button"
                    onClick={handleSettingsClick}
                    aria-label="GitHub Settings"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
                <div
                  className={`image-preview-box ${
                    isDragging ? "dragging" : ""
                  }`}
                  ref={dropZoneRef}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {uploadedImages.length === 0 ? (
                    <div className="image-placeholder">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16M14 14L15.586 12.414C15.9611 12.0391 16.4697 11.8284 17 11.8284C17.5303 11.8284 18.0389 12.0391 18.414 12.414L20 14M14 8H14.01M6 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V6C20 5.46957 19.7893 4.96086 19.4142 4.58579C19.0391 4.21071 18.5304 4 18 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p>
                        {isDragging
                          ? "Drop images here"
                          : "Your images will appear here"}
                      </p>
                    </div>
                  ) : (
                    <div className="image-grid">
                      {uploadedImages.map((image, index) => (
                        <div
                          key={index}
                          className={`image-thumbnail ${
                            draggedItem === index ? "being-dragged" : ""
                          } ${dragOverItem === index ? "drag-over" : ""}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={handleDragEnd}
                          onDragEnter={(e) => handleDragEnterItem(e, index)}
                          onDragLeave={handleDragLeaveItem}
                          onDragOver={(e) => handleDragOverItem(e, index)}
                          onDrop={(e) => handleDropItem(e, index)}
                        >
                          <div className="image-number">{index + 1}</div>
                          <div className="thumbnail-container">
                            <img src={image.preview} alt={image.name} />
                            <button
                              className="remove-image"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(index);
                              }}
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                          </div>
                          <span className="image-name">{image.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Hidden file input for traditional upload */}
                <input
                  type="file"
                  id="file-input"
                  multiple
                  accept="image/*"
                  onChange={handleFileInputChange}
                  style={{ display: "none" }}
                />
              </div>
            )}
          </div>
        )}

        {transitionStage === 3 && (
          <div className="action-buttons">
            <div className="slideshow-name-container">
              <input
                type="text"
                id="slideshow-name"
                name="slideshow-name"
                value={slideshowName}
                onChange={handleSlideshowNameChange}
                placeholder="Slideshow name (optional)"
                className="slideshow-name-input"
              />
            </div>
            <div className="button-group">
              <button className="upload-button" onClick={handleUploadClick}>
                Upload Images
              </button>
              <button
                className="generate-button"
                onClick={handleGenerateLink}
                disabled={uploadedImages.length === 0}
              >
                Generate Link
              </button>
            </div>
          </div>
        )}
      </main>

      {/* GitHub form container moved outside of button container */}
      {showGithubForm && (
        <div
          className={`github-form-container ${showGithubForm ? "visible" : ""}`}
          ref={githubFormRef}
        >
          <form
            onSubmit={handleGithubFormSubmit}
            className="github-access-form"
          >
            <h2>{isLoggedIn ? "GitHub Settings" : "Connect to GitHub"}</h2>
            <p>
              {isLoggedIn
                ? "Update your GitHub repository settings:"
                : "We need access to your GitHub repository to store your slideshow files:"}
            </p>

            <div className="form-group">
              <label htmlFor="token">Personal Access Token</label>
              <div className="token-input-container">
                <input
                  type={showToken ? "text" : "password"}
                  id="token"
                  name="token"
                  value={githubInfo.token}
                  onChange={handleGithubInputChange}
                  onPaste={handleTokenPaste}
                  onClick={handleTokenInputClick}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  required
                  className="token-input"
                  autoComplete="off"
                  spellCheck="false"
                />
                <button
                  type="button"
                  className="toggle-token-visibility"
                  onClick={toggleTokenVisibility}
                  aria-label={showToken ? "Hide token" : "Show token"}
                >
                  {showToken ? "Hide" : "Show"}
                </button>
              </div>
              <div className="token-actions">
                <button
                  type="button"
                  className="paste-token-button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setGithubInfo((prev) => ({
                        ...prev,
                        token: text.trim(),
                      }));
                    } catch (err) {
                      console.error("Failed to read clipboard:", err);
                      alert(
                        "Unable to paste from clipboard. Please paste manually or check browser permissions."
                      );
                    }
                  }}
                >
                  Paste from Clipboard
                </button>
              </div>
              <small>
                Create a token with 'repo' scope at{" "}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Settings
                </a>
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="username">GitHub Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={githubInfo.username}
                onChange={handleGithubInputChange}
                placeholder="Your GitHub username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="repository">Repository Name</label>
              <input
                type="text"
                id="repository"
                name="repository"
                value={githubInfo.repository}
                onChange={handleGithubInputChange}
                placeholder="your-repository-name"
                required
              />
            </div>

            <div className="form-actions">
              {isLoggedIn && (
                <>
                  <button
                    type="button"
                    className="github-cancel-button"
                    onClick={() => setShowGithubForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="github-logout-button"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              )}
              <button type="submit" className="github-connect-button">
                {isLoggedIn ? "Update" : "Connect"}
              </button>
            </div>
          </form>
        </div>
      )}

      <footer>
        <div className="footer-left">
          <div className="personal-logo">
            <span>Sameeha</span>
          </div>
        </div>
        <div className="footer-right">
          <span>© 2025-{new Date().getFullYear()} Sameeha</span>
          <span>Made In Figma</span>
        </div>
      </footer>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Generating your slideshow...</p>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <h2>Slideshow Created!</h2>
            <p>
              Your slideshow has been successfully created and is now available
              at:
            </p>
            <div className="link-container">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="generated-link-input"
                onClick={(e) => e.target.select()}
              />
              <button
                className="copy-link-button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  alert("Link copied to clipboard!");
                }}
              >
                Copy
              </button>
            </div>
            <p className="note">
              Note: It may take a few minutes for GitHub Pages to deploy your
              slideshow.
            </p>
            <div className="modal-actions">
              <button
                className="view-slideshow-button"
                onClick={() => window.open(generatedLink, "_blank")}
              >
                View Slideshow
              </button>
              <button
                className="close-modal-button"
                onClick={() => setShowSuccessModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
