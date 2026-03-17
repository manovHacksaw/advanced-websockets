import express, { Request, Response } from 'express';
import { matchRouter } from './src/routes/matches';

const app = express();
const PORT = 8000;

// JSON Middleware
app.use(express.json());

// Root GET route
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to the Sportz API!' });
});

app.use("/matches", matchRouter);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});