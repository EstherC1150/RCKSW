module.exports = {
  apps: [
    {
      name: "rcksw_front",
      script: "node",
      args: "c:/Users/c/Desktop/rck/VCLM/front/node_modules/next/dist/bin/next start",
      cwd: "c:/Users/c/Desktop/rck/VCLM/front",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "rcksw_back",
      script: "node",
      args: "app.js",
      cwd: "c:/Users/c/Desktop/rck/VCLM/back",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 8081
      }
    }
  ]
}