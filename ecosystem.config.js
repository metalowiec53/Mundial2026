module.exports = {
  apps: [
    {
      name: "mundial",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/mundial-2026",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
