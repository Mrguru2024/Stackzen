#!/bin/bash

# Change to the project directory
cd "$(dirname "$0")/.."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run the backup
npm run backup

# Log the backup completion
echo "Backup completed at $(date)" >> logs/backup.log 