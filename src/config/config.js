
module.exports = {
  development: {
    username: "root",
    password: "password",
    database: "todo",
    host: "mysql",
    dialect: 'mysql',
  },
  test: {
    username: "user",
    password: "dvQXL55e",
    database: "todo",
    host: "54.150.104.149",
    dialect: 'mysql',
  },
  production: {
    username: "user",
    password: "dvQXL55e",
    database: "todo",
    host: "54.150.104.149",
    dialect: 'mariadb',
  },
};