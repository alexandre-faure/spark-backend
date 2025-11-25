import { Router } from 'express';
import { Movie, TMDB, TV } from 'tmdb-ts';
import { AuthenticatedRequest, authenticateFirebaseToken } from './middleware/firebaseAuth';
import { computeTitleDistanceScore } from './utils/strings';


const getTmdb = () => {
    const tmdbAccessToken = process.env.TMDB_ACCESS_TOKEN;
    if (!tmdbAccessToken) {
        throw new Error('Missing TMDB Access Token');
    }
    return new TMDB(tmdbAccessToken);
}
const tmdb = getTmdb();

const router = Router();

// Apply middleware to all routes in this group
router.use(authenticateFirebaseToken);

// Both movie and serie search endpoint
router.get('/', async (req: AuthenticatedRequest, res): Promise<any> => {
    const query = req.query.query as string;
    if (!query || query.trim() === '') {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    const args = {
            query,
            page: Number(req.query.page) || 1,
            language:"fr-FR" as "fr-FR"
        };
    const movie_request = tmdb.search.movies(args);
    const serie_request = tmdb.search.tvShows(args);
        
    const [movies, series] = await Promise.all([movie_request, serie_request]);

    if (!movies || !series) {
        return res.status(404).json({ message: 'Error while fetching movies or series' });
    }

    if (movies.results.length + series.results.length === 0) {
        return res.status(204).json({ message: 'No results found' });
    }

    // Sort results by popularity and query hamming distance to prioritize relevant results
    const combinedResults = [
        ...movies.results.map(
            (x) => ({...x, media_type: "movie"})
        ),
        ...series.results.map(
            (x) => ({...x, media_type: "tv"}))
    ];

    const getResultScore = (item: TV | Movie, hammingWeight: number = 1, popularityWeight: number = 0.5) => {
        const name = 'title' in item ? item.title : item.name;
        const distanceScore = computeTitleDistanceScore(query, name);
        const popularityScore = item.popularity / 100;
        return (hammingWeight * distanceScore) + (popularityWeight * popularityScore);
    }

    const combinedResultsWithScore = combinedResults.reduce((acc: ((TV | Movie) & { score: number })[], item) => {
        const score = getResultScore(item);
        acc.push({ ...item, score });
        return acc;
    }, []);
    combinedResultsWithScore.sort((a, b) => b.score - a.score);

    return res.status(200).json(combinedResultsWithScore);
});

export default router;
