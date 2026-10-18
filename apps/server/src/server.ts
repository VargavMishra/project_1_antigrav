import { app } from './app.js';
import { config } from './config/index.js';

const PORT = config.port;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Production Shared API Server Started!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📖 Swagger API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`💓 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${config.env}`);
  console.log(`====================================================`);
});

// Graceful shutdown handling for cloud providers (Render, Heroku, Docker)
function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed. Process terminating cleanly.');
    process.exit(0);
  });

  // Force close after 10 seconds if hanging connections persist
  setTimeout(() => {
    console.error('⚠️ Forcefully terminating process after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
