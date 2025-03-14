# Notion Slideshow Creator

<div align="center">
  <img src="build/icons/icon.png" alt="Notion Slideshow Creator Logo" width="200">
</div>

A desktop application that allows you to create beautiful slideshows for your Notion pages using GitHub Pages.

## Description

Notion Slideshow Creator is a simple yet powerful tool that helps you create embeddable slideshows for your Notion pages. With just a few clicks, you can upload images, arrange them in your preferred order, and generate a link to a slideshow that you can embed directly in Notion.

### Key Features

- **Easy Image Upload**: Drag and drop or select images from your computer
- **Customizable Order**: Rearrange your images with a simple drag-and-drop interface
- **GitHub Integration**: Automatically uploads your slideshow to GitHub Pages
- **Embeddable Links**: Generate links that can be embedded directly in Notion
- **Dark/Light Mode**: Choose your preferred theme
- **Secure**: Your GitHub token is stored locally on your device

## Download

You can download the latest version of Notion Slideshow Creator for your platform:

- [Mac (Apple Silicon)](https://github.com/sameehaliton/notion-slideshow-creator/releases/latest/download/Notion.Slideshow.Creator-0.1.0-arm64-mac.zip)
- [Windows](https://github.com/sameehaliton/notion-slideshow-creator/releases/latest/download/Notion.Slideshow.Creator-Setup-0.1.0.exe)
- [Linux](https://github.com/sameehaliton/notion-slideshow-creator/releases/latest/download/Notion.Slideshow.Creator-0.1.0.AppImage)

Or visit the [Releases page](https://github.com/sameehaliton/notion-slideshow-creator/releases) to see all available versions.

## How to Use

1. **Download and Install**: Download the application for your platform and install it.
2. **Connect to GitHub**:
   - Create a GitHub Personal Access Token with 'repo' scope at [GitHub Settings](https://github.com/settings/tokens)
   - Enter your GitHub username, repository name, and token
   - The repository should have GitHub Pages enabled (Settings > Pages)
3. **Upload Images**:
   - Drag and drop images or click the "Upload Images" button
   - Rearrange images by dragging them to your preferred order
4. **Generate Link**:
   - Optionally enter a name for your slideshow
   - Click "Generate Link" to create your slideshow
5. **Embed in Notion**:
   - Copy the generated link
   - In Notion, create an embed block and paste the link

## Requirements

- A GitHub account with a repository that has GitHub Pages enabled
- A GitHub Personal Access Token with 'repo' scope
- Internet connection to upload images to GitHub

## Privacy & Security

- Your GitHub token is stored locally on your device and is never sent to any server other than GitHub's API
- All communication with GitHub is done securely via HTTPS
- No analytics or tracking is included in the application

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/sameehaliton/notion-slideshow-creator/issues) on GitHub.

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- Built with Electron and React
- Created by Sameeha Liton
