import express from 'express';
import routes from './routes';

const app = express();

app.use(express.static('public'));
app.use(express.json());


app.get('/', async (_, res): Promise<any> => {
    return res.status(200).json({ message: 'This server hosts the services for Spark application.' });
});

app.use('/api', routes);

module.exports = app