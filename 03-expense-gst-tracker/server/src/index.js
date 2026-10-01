import { createApp } from './app.js';
import { openDb } from './db.js';

const PORT = process.env.PORT || 4000;
const app = createApp(openDb());

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
