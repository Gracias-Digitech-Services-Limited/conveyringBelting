// PM2 process file - alternative to Docker for the single EC2 instance.
// Usage on the server: npm ci && npm run build && pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'conveyorbelting',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      // Next.js loads .env / .env.production from the project root itself at runtime,
      // so secrets don't need to be duplicated here - just make sure .env exists on the server.
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
    },
  ],
}
