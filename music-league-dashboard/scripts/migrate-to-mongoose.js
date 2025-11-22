import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { League } from '../src/models/League.js';
import { Competitor } from '../src/models/Competitor.js';
import { Round } from '../src/models/Round.js';
import { Submission } from '../src/models/Submission.js';
import { Vote } from '../src/models/Vote.js';
import { SongMetadata } from '../src/models/SongMetadata.js';
import { connectToDatabase } from '../src/utils/mongodb.js';

dotenv.config();

async function migrate() {
    try {
        console.log('Connecting to database...');
        await connectToDatabase();
        console.log('Connected.');

        // Leagues
        console.log('Migrating Leagues...');
        const leagues = await League.find({});
        for (const league of leagues) {
            // Mongoose automatically validates on save, but we can also just validate
            const error = league.validateSync();
            if (error) {
                console.error(`Validation error for League ${league._id}:`, error.message);
                // Attempt to fix or log
            } else {
                // Save to ensure defaults and types are applied
                await league.save();
            }
        }
        console.log(`Processed ${leagues.length} leagues.`);

        // Competitors
        console.log('Migrating Competitors...');
        const competitors = await Competitor.find({});
        for (const comp of competitors) {
            const error = comp.validateSync();
            if (error) {
                console.error(`Validation error for Competitor ${comp._id}:`, error.message);
            } else {
                await comp.save();
            }
        }
        console.log(`Processed ${competitors.length} competitors.`);

        // Rounds
        console.log('Migrating Rounds...');
        const rounds = await Round.find({});
        for (const round of rounds) {
            // Fix potential date issues if they are strings
            if (typeof round.created === 'string') round.created = new Date(round.created);
            if (typeof round.updated === 'string') round.updated = new Date(round.updated);

            const error = round.validateSync();
            if (error) {
                console.error(`Validation error for Round ${round._id}:`, error.message);
            } else {
                await round.save();
            }
        }
        console.log(`Processed ${rounds.length} rounds.`);

        // Submissions
        console.log('Migrating Submissions...');
        const submissions = await Submission.find({});
        let subSuccess = 0;
        let subFail = 0;
        for (const sub of submissions) {
            try {
                // Explicitly mark artists as modified if it was cast from string
                // Mongoose might not detect the type change automatically if the value 'looks' the same
                sub.markModified('artists');

                const error = sub.validateSync();
                if (error) {
                    console.error(`Validation error for Submission ${sub._id}:`, error.message);
                    subFail++;
                } else {
                    await sub.save();
                    subSuccess++;
                }
            } catch (err) {
                console.error(`Save error for Submission ${sub._id}:`, err.message);
                subFail++;
            }
        }
        console.log(`Processed ${submissions.length} submissions. Success: ${subSuccess}, Failed: ${subFail}`);

        // Votes
        console.log('Migrating Votes...');
        const votes = await Vote.find({});
        for (const vote of votes) {
            const error = vote.validateSync();
            if (error) {
                console.error(`Validation error for Vote ${vote._id}:`, error.message);
            } else {
                await vote.save();
            }
        }
        console.log(`Processed ${votes.length} votes.`);

        // Song Metadata
        console.log('Migrating Song Metadata...');
        const metadata = await SongMetadata.find({});
        for (const meta of metadata) {
            const error = meta.validateSync();
            if (error) {
                console.error(`Validation error for Metadata ${meta.spotifyUri}:`, error.message);
            } else {
                await meta.save();
            }
        }
        console.log(`Processed ${metadata.length} metadata entries.`);

        console.log('Migration completed.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
