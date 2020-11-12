'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Users.init({
    id: {type:DataTypes.INTEGER, autoIncrement: true, primaryKey: true},
    name: DataTypes.STRING,
    mailaddress: DataTypes.STRING,
    password: DataTypes.STRING,
    wheretogo: DataTypes.STRING,
    go_date: DataTypes.DATE,
    go_time: DataTypes.TIME,
    back_date: DataTypes.DATE,
    back_time: DataTypes.TIME,
    active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Users',
  });
  return Users;
};