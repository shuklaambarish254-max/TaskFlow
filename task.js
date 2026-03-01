const { DataTypes } = require('sequelize');
const sequelize = require('../config/db_sql');
const User = require('./user');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true, defaultValue: '' },
  priority: { type: DataTypes.ENUM('low','medium','high'), allowNull: false, defaultValue: 'low' },
  dueDate: { type: DataTypes.DATE, allowNull: true },
  completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  userId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  timestamps: true,
  tableName: 'tasks'
});

Task.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Task, { foreignKey: 'userId' });

module.exports = Task;
