#!/bin/bash

# MongoDB Setup Script for Music League Dashboard
# This script automates the MongoDB setup process

set -e

echo "🎵 Music League Dashboard - MongoDB Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed (try both v1 and v2 syntax)
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Determine which docker compose command to use
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Check if MongoDB is already running
if docker ps | grep -q music-league-mongodb; then
    echo -e "${YELLOW}⚠️  MongoDB container is already running${NC}"
    read -p "Do you want to stop and restart it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping existing containers..."
        $DOCKER_COMPOSE down
    else
        echo "Keeping existing containers running"
    fi
fi

# Start MongoDB with Docker Compose
echo ""
echo "🚀 Starting MongoDB container..."
$DOCKER_COMPOSE up -d mongodb

# Wait for MongoDB to be ready
echo ""
echo "⏳ Waiting for MongoDB to be ready..."
sleep 5

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec music-league-mongodb mongosh --eval "db.adminCommand('ping')" --quiet &> /dev/null; then
        echo -e "${GREEN}✅ MongoDB is ready!${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ MongoDB failed to start. Check logs with: docker logs music-league-mongodb${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing npm dependencies..."
    npm install
else
    echo -e "${GREEN}✅ npm dependencies already installed${NC}"
fi

# Seed the database
echo ""
echo "🌱 Seeding the database with CSV data..."
npm run seed

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Database seeded successfully!${NC}"

    # Verify the setup
    echo ""
    echo "🔍 Verifying database setup..."
    npm run verify-db

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}✅ MongoDB setup complete!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📊 MongoDB Connection Details:"
    echo "   URL: mongodb://admin:admin123@localhost:27017"
    echo "   Database: music_league"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   View logs: docker logs music-league-mongodb"
    echo "   Stop MongoDB: docker-compose down"
    echo "   Re-seed: npm run seed"
    echo "   Verify: npm run verify-db"
    echo ""
    echo "📖 For more information, see Documentation/MONGODB_SETUP.md"
    echo ""
else
    echo -e "${RED}❌ Failed to seed database${NC}"
    echo "Check the error messages above for details"
    exit 1
fi

