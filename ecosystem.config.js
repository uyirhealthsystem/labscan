// PM2 process config. Used by the CI/CD deploy (pm2 startOrReload ecosystem.config.js)
// and for manual starts on the server: `pm2 start ecosystem.config.js`.
module.exports = {
  apps: [
    {
      name: 'labscan',
      script: 'dist/server.js',
      // dotenv reads .env and multer writes uploads/ relative to cwd.
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      time: true,
    },
  ],
};
