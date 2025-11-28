/**
 * Session Configuration
 */

const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const config = require('./index');

const sessionConfig = {
  store: new SQLiteStore({
    db: config.session.dbName,
    dir: config.session.dbPath,
    table: 'sessions'
  }),
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: config.app.env === 'production',
    maxAge: config.session.maxAge
  }
};

module.exports = sessionConfig;
