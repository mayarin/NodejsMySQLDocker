// データベース名に DB_NAME の値を使用する
let database = process.env.DB_NAME;

// データベース接続の際のユーザに DB_USER の値を使用する
let username = process.env.DB_USER;

// データベース接続の際のユーザパスワードに DB_PASSWORD の値を使用する
let password = process.env.DB_PASSWORD;

// データベース接続の際のホストに DB_HOST の値を使用する (デフォは localhost)
let host = process.env.DB_HOST || 'localhost';

// データベース接続の際のポートに DB_PORT の値を使用する (デフォは 5432)
let port = process.env.DB_PORT || '5432';

// dialect の 'postgres' は使用するデータベースにより mysql とかにする
// 使用可能なデータベース一覧 (https://github.com/sequelize/sequelize#installation)
module.exports = {
  development: {
    database: "todo",
    username: "root",
    password: "password",
    host: "127.0.0.1",
    port: "3306",
    dialect: 'mysql',
    define: {
      underscored: true
    },
  },
  test: {
    database: "todo",
    username: "user",
    password: "dvQXL55e",
    host: "54.150.104.149",
    port: "3306",
    dialect: 'mysql',
    define: {
      underscored: true
    },
  },
  production: {
    database: "todo",
    username: "user",
    password: "dvQXL55e",
    host: "54.150.104.149",
    port: "3306",
    dialect: 'mysql',
    define: {
      underscored: true
    },
  },
}