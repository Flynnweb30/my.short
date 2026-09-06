import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Serve static files from the Vite 'dist' directory
app.use(express.static(path.join(process.cwd(), 'dist')));

// 2. Optional: Put your custom API routes here
// app.get('/api/status', (req, res) => res.json({ status: 'ok' }));

// 3. Catch-all route to fix "Cannot GET /" for React Router
app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});