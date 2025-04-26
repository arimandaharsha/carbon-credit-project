#!/bin/bash

# Build the project without ESLint
echo "Building Carbon Credit Project without ESLint checks..."
npm run build:no-lint

if [ $? -eq 0 ]; then
  echo "Build successful! Starting the server..."
  npm run start
else
  echo "Build failed. Please check the errors above."
  exit 1
fi 