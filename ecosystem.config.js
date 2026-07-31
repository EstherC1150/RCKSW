module.exports = {
  apps: [
    {
      name: "rcksw_front",
      script: "npm",
      args: "run start",
      cwd: "./front",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3100
      }
    },
    {
      name: "rcksw_back",
      script: "node",
      args: "app.js",
      cwd: "./back",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 8180
      }
    }
  ]
}