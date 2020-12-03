'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
     queryInterface.addColumn('Users', 'wheretogo',
     {type: Sequelize.STRING,
      after: 'password' // after option is only supported by MySQL
     });

     queryInterface.addColumn('Users', 'go_date',
     {type: Sequelize.DATE,
      after: 'wheretogo' // after option is only supported by MySQL
     });

     queryInterface.addColumn('Users', 'go_time',
     {type: Sequelize.TIME,
      after: 'go_date' // after option is only supported by MySQL
     });

     queryInterface.addColumn('Users', 'back_date',
     {type: Sequelize.DATE,
      after: 'go_time' // after option is only supported by MySQL
     });

     queryInterface.addColumn('Users', 'back_time',
     {type: Sequelize.TIME,
      after: 'back_date' // after option is only supported by MySQL
     });

  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};