/**
 * Database Module - Compatibility Layer
 * Re-exports from new core database module
 */

const { db, checkIfUsersExist, dbRun, dbGet, dbAll } = require('../src/core/database');

module.exports = {
  db,
  checkIfUsersExist,
  dbRun,
  dbGet,
  dbAll
};
