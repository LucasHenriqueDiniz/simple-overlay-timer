# GitHub Setup Guide

## Initial Setup

### 1. Initialize Git Repository

**Windows:**
```bash
setup-git.bat
```

**Linux/Mac:**
```bash
chmod +x setup-git.sh
./setup-git.sh
```

**Or manually:**
```bash
git init
git add .
git commit -m "Initial commit: Simple Overlay Timer"
git branch -M main
git remote add origin https://github.com/LucasHenriqueDiniz/simple-overlay-timer.git
git push -u origin main
```

### 2. Create Your First Release

After pushing to GitHub, create a release tag:

```bash
# Create a tag
git tag v0.1.0

# Push the tag to GitHub
git push origin v0.1.0
```

The GitHub Actions workflow will automatically:
- Build the app for Windows, macOS, and Linux
- Create a GitHub Release
- Upload the built executables/installers

### 3. Future Releases

For future releases, just create and push a new tag:

```bash
git tag v0.2.0
git push origin v0.2.0
```

## GitHub Actions Workflow

The workflow (`.github/workflows/release.yml`) is configured to:
- Trigger on tags starting with `v*` (e.g., `v0.1.0`, `v1.0.0`)
- Build for Windows (x64), macOS (universal), and Linux (x64)
- Automatically create a GitHub Release with all build artifacts

## Notes

- The workflow uses `GITHUB_TOKEN` which is automatically provided by GitHub Actions
- No additional secrets need to be configured
- Builds may take 10-20 minutes depending on platform

