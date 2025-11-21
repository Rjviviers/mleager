# Music League Analytics Dashboard

A beautiful analytics dashboard for Music League data, built with React, Vite, and Tailwind CSS following the Data Toys design system.

## Features

- 🎵 **Song Search**: Search submitted songs to avoid duplicates across all rounds and leagues
- 📊 **Analytics Dashboard**: Analyze votes by genre, artist, and popularity
- 🎼 **Audio Features Analysis**: Discover what types of music perform best using Spotify audio features (energy, danceability, valence, etc.)
- 🎭 **Genre Analytics**: Comprehensive genre classification and analysis system - **NEW!**
- 🎨 **Beautiful UI**: Dark theme with playful accents following the design system
- 📱 **Responsive**: Works on desktop and mobile devices

## Getting Started

### Quick Setup with MongoDB

For the complete experience with MongoDB backend:

```bash
# Automated setup (recommended)
./setup-mongodb.sh

# Or manual setup:
# 1. Start MongoDB
docker-compose up -d mongodb

# 2. Install dependencies
npm install

# 3. Configure Spotify API (for audio features)
cp env.template .env
# Edit .env and add your Spotify credentials

# 4. Seed the database
npm run seed

# 5. Export metadata for frontend
npm run export-metadata

# 6. Verify setup
npm run verify-db
```

See [MONGODB_SETUP.md](Documentation/MONGODB_SETUP.md) for detailed MongoDB documentation.

**Audio Features Analysis:**
See [SONG_METADATA_GUIDE.md](Documentation/SONG_METADATA_GUIDE.md) for detailed instructions on setting up Spotify API integration and analyzing song characteristics.

**Genre Analytics:**
See [GENRE_SEEDING.md](Documentation/GENRE_SEEDING.md) for instructions on populating the genres collection and adding genre fields to songs.

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Docker

Build and run with Docker Compose:

```bash
# Build and start the container
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

The app will be available at `http://localhost:3000`

To stop the container:

```bash
docker-compose down
```

### Docker (without Docker Compose)

```bash
# Build the image
docker build -t music-league-dashboard .

# Run the container
docker run -p 3000:80 music-league-dashboard
```

## Project Structure

```
music-league-dashboard/
├── src/
│   ├── components/       # React components
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── Overview.jsx
│   │   ├── SongSearch.jsx
│   │   ├── Analytics.jsx
│   │   └── StatCard.jsx
│   ├── utils/
│   │   └── dataLoader.js # CSV data loading utilities
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   └── data/            # CSV data files
├── Dockerfile
├── docker-compose.yml
└── tailwind.config.js
```

## Data

The dashboard supports two data sources:

### CSV Files (Default)
Data is loaded from CSV files in `public/data/`:
- `submissions.csv`: Song submissions
- `votes.csv`: Vote data
- `rounds.csv`: Round information
- `competitors.csv`: Competitor information

### MongoDB (Optional)
For better performance and scalability, data can be stored in MongoDB:
- Run `./setup-mongodb.sh` to set up and seed the database
- See [MONGODB_SETUP.md](Documentation/MONGODB_SETUP.md) for details
- MongoDB runs on `localhost:27017` with Docker

**Available Scripts:**
- `npm run seed` - Import CSV data into MongoDB
- `npm run verify-db` - Verify MongoDB setup and view statistics
- `node scripts/seed-genres.js` - Populate genres collection and add genre fields to songs
- `node scripts/query-genres.js` - View example genre queries and statistics

## Design System

This project follows the "Data Toys" design system with:
- Dark charcoal backgrounds (#18171F)
- Playful neon accents (mint, lavender, cyan)
- Poppins font for headlines
- Inter font for body text
- Soft rounded corners and floating cards
- Subtle shadows and glows

## Technologies

- **React 18**: UI library
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Chart library
- **PapaParse**: CSV parsing
- **Lucide React**: Icon library
- **Docker**: Containerization
- **MongoDB**: Database (optional)
- **Nginx**: Production web server

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run seed` - Seed MongoDB with CSV data
- `npm run verify-db` - Verify MongoDB setup
- `./setup-mongodb.sh` - Automated MongoDB setup

## Documentation

- [MONGODB_SETUP.md](Documentation/MONGODB_SETUP.md) - Complete MongoDB setup and usage guide
- [SONG_METADATA_GUIDE.md](Documentation/SONG_METADATA_GUIDE.md) - Spotify audio features integration guide
- [GENRE_SEEDING.md](Documentation/GENRE_SEEDING.md) - Genre classification and seeding guide - **NEW!**
- [GENRE_GUIDE.md](Documentation/GENRE_GUIDE.md) - Working with artist genres from Spotify
- [DATA_STATUS.md](Documentation/DATA_STATUS.md) - Current data availability status
