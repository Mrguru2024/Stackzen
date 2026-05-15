#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Checking for existing processes on port 3000...${NC}"

# Check if port 3000 is in use
if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}Found existing process on port 3000. Attempting to kill...${NC}"
    
    # Get the PID of the process using port 3000
    PID=$(lsof -ti :3000)
    
    if [ ! -z "$PID" ]; then
        echo -e "${YELLOW}Killing process $PID...${NC}"
        kill -9 $PID
        echo -e "${GREEN}Successfully killed process on port 3000${NC}"
    else
        echo -e "${RED}Could not find process ID for port 3000${NC}"
    fi
else
    echo -e "${GREEN}No existing process found on port 3000${NC}"
fi

# Wait a moment to ensure the port is fully released
sleep 1

echo -e "${YELLOW}Starting development server...${NC}"
npx next dev 