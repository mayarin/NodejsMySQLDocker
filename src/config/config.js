
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
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_SERVER,
    dialect: 'mysql',
  },
};