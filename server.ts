import express, { Request, Response } from 'express';

const app = express();
const PORT = 8000;

// JSON Middleware
app.use(express.json());

// Root GET route
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to the Sportz API!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});