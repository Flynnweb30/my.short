import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const distDir = path.join(process.cwd(), 'dist');

app.use(express.static(distDir, { maxAge: '1d' }));

app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`my.short production server running on port ${PORT}`);
});
