module.exports = {
  apps: [{
    name: 'ggb-game',
    script: 'server.js',
    cwd: '/var/www/ggb-game',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/ggb-game-error.log',
    out_file: '/var/log/pm2/ggb-game-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_restarts: 10,
    restart_delay: 5000
  }]
};