import os
import base64
from github import Github
from github import GithubException

class GitHubManager:
    def __init__(self, token):
        self.github = Github(token)
        self.user = self.github.get_user()
    
    def get_repositories(self):
        """Get a list of user's repositories"""
        repos = []
        for repo in self.user.get_repos():
            repos.append({
                'name': repo.name,
                'full_name': repo.full_name,
                'has_pages': repo.has_pages
            })
        return repos
    
    def create_repository(self, name, description="Notion Slideshow Repository", private=False):
        """Create a new repository"""
        try:
            repo = self.user.create_repo(
                name=name,
                description=description,
                private=private,
                has_issues=False,
                has_projects=False,
                has_wiki=False
            )
            return {'success': True, 'repo': repo.name, 'full_name': repo.full_name}
        except GithubException as e:
            return {'success': False, 'error': str(e)}
    
    def create_slideshow(self, repo_name, slideshow_name, images, image_type='png'):
        """Create a slideshow in the repository"""
        try:
            repo = self.github.get_repo(f"{self.user.login}/{repo_name}")
            
            # Create slideshow folder if it doesn't exist
            try:
                # Check if directory exists by trying to get a file inside it
                repo.get_contents(f"{slideshow_name}/placeholder")
            except GithubException:
                # Create the directory by creating a placeholder file
                repo.create_file(
                    f"{slideshow_name}/placeholder",
                    "Creating slideshow directory",
                    "This file can be deleted"
                )
            
            # Upload each image
            for i, image_data in enumerate(images):
                file_name = f"{i+1}.{image_type}"
                path = f"{slideshow_name}/{file_name}"
                
                # Convert image data to base64 for GitHub API
                encoded_image = base64.b64encode(image_data).decode("utf-8")
                
                # Create or update the file
                try:
                    contents = repo.get_contents(path)
                    repo.update_file(
                        path=path,
                        message=f"Update {file_name}",
                        content=encoded_image,
                        sha=contents.sha
                    )
                except GithubException:
                    repo.create_file(
                        path=path,
                        message=f"Add {file_name}",
                        content=encoded_image
                    )
            
            # Generate and upload HTML
            html_content = self.generate_html_template(len(images), image_type)
            html_path = f"{slideshow_name}/index.html"
            
            try:
                contents = repo.get_contents(html_path)
                repo.update_file(
                    path=html_path,
                    message="Update slideshow HTML",
                    content=html_content,
                    sha=contents.sha
                )
            except GithubException:
                repo.create_file(
                    path=html_path,
                    message="Add slideshow HTML",
                    content=html_content
                )
            
            # Enable GitHub Pages if not already enabled
            if not repo.has_pages:
                try:
                    # This requires PyGithub 1.55 or higher
                    repo.create_pages(source_branch="main")
                except Exception as e:
                    # If PyGithub version doesn't support create_pages
                    return {
                        'success': True, 
                        'warning': 'GitHub Pages may need to be enabled manually',
                        'repo': repo.name,
                        'slideshow': slideshow_name,
                        'url': f"https://{self.user.login}.github.io/{repo.name}/{slideshow_name}/"
                    }
            
            # Return success with the GitHub Pages URL
            return {
                'success': True,
                'repo': repo.name,
                'slideshow': slideshow_name,
                'url': f"https://{self.user.login}.github.io/{repo.name}/{slideshow_name}/"
            }
            
        except GithubException as e:
            return {'success': False, 'error': str(e)}
    
    def generate_html_template(self, num_images, image_type='png'):
        """Generate HTML template for the slideshow based on number of images"""
        # Create the slide divs based on number of images
        slide_divs = ""
        slide_css = ""
        
        for i in range(1, num_images + 1):
            slide_divs += f'<div class="slide{" current" if i == 1 else ""}"></div>\n'
            slide_css += f'.slide:nth-child({i}) {{ background: url("{i}.{image_type}") no-repeat center top/cover; }}\n'
        
        # HTML template based on the provided code
        html_template = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Notion Slideshow</title>
    <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css'>
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Lexend:wght@400;700&display=swap");
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        body {{
            font-family: "Lexend", sans-serif;
            background-color: #362a2b;
            color: #e5ebf3;
        }}
        .slider {{
            position: relative;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
        }}
        .slide {{
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            transition: opacity 0.4s ease-in-out;
        }}
        .slide.current {{
            opacity: 1;
        }}
        {slide_css}
        .buttons button#prev {{
            position: absolute;
            top: 50%;
            left: 1rem;
        }}
        .buttons button#next {{
            position: absolute;
            top: 50%;
            right: 1rem;
        }}
        .buttons button {{
            border: 2px solid #e5ebf3;
            background-color: transparent;
            color: #e5ebf3;
            cursor: pointer;
            padding: 13px 15px;
            border-radius: 50%;
            outline: none;
        }}
        .buttons button:hover {{
            background-color: #e5ebf3;
            color: #362a2b;
        }}
        @media (min-width: 640px) and (min-height: 640px) {{
            .slide .content {{
                bottom: 70px;
                left: -600px;
                width: 600px;
                padding: 2rem;
                line-height: 1.6;
            }}
            .slide .content h1 {{
                font-size: 2rem;
            }}
            .slide.current .content {{
                transform: translateX(600px);
            }}
        }}
    </style>
</head>
<body>
    <div class="slider">
        {slide_divs}
    </div>
    <div class="buttons">
        <button id="prev"><i class="fas fa-arrow-left"></i></button>
        <button id="next"><i class="fas fa-arrow-right"></i></button>
    </div>
    <script>
        const slides = document.querySelectorAll(".slide");
        const nextButton = document.getElementById("next");
        const prevButton = document.getElementById("prev");
        const auto = true;
        const intervalTime = 5000;
        let slideInterval;

        const nextSlide = () => {{
            const current = document.querySelector(".current");
            current.classList.remove("current");
            if (current.nextElementSibling) {{
                current.nextElementSibling.classList.add("current");
            }} else {{
                slides[0].classList.add("current");
            }}
        }};

        const prevSlide = () => {{
            const current = document.querySelector(".current");
            current.classList.remove("current");
            if (current.previousElementSibling) {{
                current.previousElementSibling.classList.add("current");
            }} else {{
                slides[slides.length - 1].classList.add("current");
            }}
        }};

        nextButton.addEventListener("click", () => {{
            nextSlide();
            if (auto) {{
                clearInterval(slideInterval);
                slideInterval = setInterval(nextSlide, intervalTime);
            }}
        }});

        prevButton.addEventListener("click", () => {{
            prevSlide();
            if (auto) {{
                clearInterval(slideInterval);
                slideInterval = setInterval(nextSlide, intervalTime);
            }}
        }});

        if (auto) {{
            slideInterval = setInterval(nextSlide, intervalTime);
        }}
    </script>
</body>
</html>'''
        
        return html_template