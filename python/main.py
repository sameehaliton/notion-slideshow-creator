from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import base64
from github_manager import GitHubManager

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/test', methods=['GET'])
def test_connection():
    return jsonify({"status": "success", "message": "Python backend is running!"})

@app.route('/api/github/auth', methods=['POST'])
def github_auth():
    data = request.json
    token = data.get('token')
    
    if not token:
        return jsonify({"success": False, "error": "GitHub token is required"})
    
    try:
        github_manager = GitHubManager(token)
        # Just get user info to verify token works
        username = github_manager.user.login
        return jsonify({"success": True, "username": username})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/github/repos', methods=['POST'])
def get_repos():
    data = request.json
    token = data.get('token')
    
    if not token:
        return jsonify({"success": False, "error": "GitHub token is required"})
    
    try:
        github_manager = GitHubManager(token)
        repos = github_manager.get_repositories()
        return jsonify({"success": True, "repos": repos})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/github/create-repo', methods=['POST'])
def create_repo():
    data = request.json
    token = data.get('token')
    repo_name = data.get('repo_name')
    
    if not token or not repo_name:
        return jsonify({"success": False, "error": "GitHub token and repository name are required"})
    
    try:
        github_manager = GitHubManager(token)
        result = github_manager.create_repository(repo_name)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/github/create-slideshow', methods=['POST'])
def create_slideshow():
    token = request.form.get('token')
    repo_name = request.form.get('repo_name')
    slideshow_name = request.form.get('slideshow_name')
    
    if not token or not repo_name or not slideshow_name:
        return jsonify({"success": False, "error": "GitHub token, repository name, and slideshow name are required"})
    
    try:
        # Process the uploaded images
        if 'images' not in request.files:
            return jsonify({"success": False, "error": "No image files uploaded"})
        
        files = request.files.getlist('images')
        if len(files) == 0:
            return jsonify({"success": False, "error": "No image files uploaded"})
        
        # Get the file extension from the first image
        first_file = files[0]
        _, file_extension = os.path.splitext(first_file.filename)
        image_type = file_extension.lstrip('.').lower() or 'png'
        
        # Read image data
        images_data = []
        for file in files:
            images_data.append(file.read())
        
        # Create the slideshow
        github_manager = GitHubManager(token)
        result = github_manager.create_slideshow(repo_name, slideshow_name, images_data, image_type)
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    app.run(port=5000)