// src/index.ts
import express from 'express';
import routes from './routes';

const app = express();
app.use(express.json());

app.get('/', (_, res) => {
    res.json({ message: 'Spark backend on Vercel!' });
});

app.use('/api', routes);

const PORT = 3000;
app.listen(PORT, () => console.log("Server ready on port 3000."));

module.exports = app;