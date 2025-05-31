// src/index.ts
import express from 'express';
import routes from './routes';

const app = express();
app.use(express.json());

app.use('/api', routes);

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
