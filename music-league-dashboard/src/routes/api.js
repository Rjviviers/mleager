import express from 'express';
import { getAllLeagues, getLeagueDetails } from '../controllers/leagueController.js';
import { getRoundDetails } from '../controllers/roundController.js';

const router = express.Router();

// League Routes
router.get('/leagues', getAllLeagues);
router.get('/leagues/:leagueId', getLeagueDetails);

// Round Routes
router.get('/rounds/:roundId', getRoundDetails);

// Stats Routes
import { getOverviewStats, getLeagueAnalytics } from '../controllers/statsController.js';
router.get('/stats/overview', getOverviewStats);
router.get('/stats/league/:leagueId', getLeagueAnalytics);

// Song Routes
import { getAllSongs } from '../controllers/songController.js';
router.get('/songs', getAllSongs);

export default router;
