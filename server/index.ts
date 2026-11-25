import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Apex Campus Lost & Found API Server running on port ${PORT}`);
  console.log(`   Connected to: Supabase PostgreSQL`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
});
