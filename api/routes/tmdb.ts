import { Router } from 'express';
import { TMDB } from 'tmdb-ts';
import { AuthenticatedRequest, authenticateFirebaseToken } from './middleware/firebaseAuth';

const getTmdb = () => {
    const tmdbAccessToken = process.env.TMDB_ACCESS_TOKEN;
    if (!tmdbAccessToken) {
        throw new Error('Missing TMDB Access Token');
    }
    return new TMDB(tmdbAccessToken);
}
const tmdb = getTmdb();

const router = Router();

router.get('/', async (_, res): Promise<any> => {
    return res.status(200).json({ message: 'TMDB service is running' });
});

// Apply middleware to all routes in this group
router.use(authenticateFirebaseToken);


// Get movies by query
router.get('/movie', async (req: AuthenticatedRequest, res): Promise<any> => {
    const movies = await tmdb.search.movies({
            query: req.query.query as string,
            page: Number(req.query.page) || 1,
            language:"fr-FR"
        });

    if (!movies) {
        return res.status(404).json({ message: 'Error while fetching movies' });
    }

    if (movies.results.length === 0) {
        return res.status(204).json({ message: 'No movies found' });
    }

    return res.status(200).json(movies.results);
});


router.get('/serie', async (req: AuthenticatedRequest, res): Promise<any> => {
    const series = await tmdb.search.tvShows({
            query: req.query.query as string,
            page: Number(req.query.page) || 1,
            language:"fr-FR"
        });
    
    if (!series) {
        return res.status(404).json({ message: 'Error while fetching series' });
    }

    if (series.results.length === 0) {
        return res.status(204).json({ message: 'No series found' });
    }

    return res.status(200).json(series.results);
});

export default router;
