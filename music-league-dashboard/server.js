import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { seedDatabase } from './scripts/seed-db.js';
import { connectToDatabase } from './src/utils/mongodb.js';
import apiRoutes from './src/routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Database connection middleware (ensure connection)
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ error: 'Database connection error' });
    }
});

// Mount API Routes
app.use('/api', apiRoutes);

// Trigger CSV Import
app.post('/api/import', async (req, res) => {
    try {
        console.log('Starting CSV import...');
        await seedDatabase();
        res.json({ message: 'Data import completed successfully' });
    } catch (error) {
        console.error('Import failed:', error);
        res.status(500).json({ error: 'Data import failed', details: error.message });
    }
});

// Start server
if (process.env.NODE_ENV !== 'test') {
    // Connect to DB before listening
    connectToDatabase().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });
}

export default app;
