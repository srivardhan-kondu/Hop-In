#!/bin/bash

# Initialize git repository
git init
git branch -M main

# Add remote if it doesn't exist
git remote add origin https://github.com/srivardhan-kondu/Hop-In.git 2>/dev/null || git remote set-url origin https://github.com/srivardhan-kondu/Hop-In.git

# Function to add, commit and push
commit_and_push() {
    local files="$1"
    local message="$2"
    
    # Enable word splitting for files
    # shellcheck disable=SC2086
    git add $files
    
    # Check if there's anything to commit
    if ! git diff --cached --quiet; then
        git commit -m "$message"
        echo "Pushing commit: $message"
        git push -u origin main
        sleep 2
    else
        echo "Nothing to commit for: $message"
    fi
}

# 15 Commits and Pushes
commit_and_push ".gitignore" "Add gitignore"
commit_and_push "public/" "Add public assets"
commit_and_push "index.html vite.config.js package.json" "Add project config files"
commit_and_push "src/lib/" "Add Firebase config lib"
commit_and_push "src/hooks/" "Add custom hooks"
commit_and_push "src/context/" "Add auth context"
commit_and_push "src/utils/" "Add utility functions"
commit_and_push "src/services/" "Add external services and DB functions"
commit_and_push "src/components/common/" "Add common UI components"
commit_and_push "src/components/layout/" "Add app shell layout"
commit_and_push "src/styles/" "Add global styles"
commit_and_push "src/pages/auth/ src/pages/admin/" "Add auth and admin pages"
commit_and_push "src/pages/driver/ src/pages/parent/" "Add driver and parent dashboard pages"
commit_and_push "src/pages/search/ src/pages/booking/ src/pages/landing/ src/app/" "Add remaining routing and core pages"
commit_and_push "." "Add tests, README, and final adjustments"

echo "All 15 commits and pushes completed successfully!"
