// src/index.ts
import express from 'express';
import routes from './routes';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Spark backend!' });
});

app.use('/api', routes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
