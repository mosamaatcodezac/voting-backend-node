/**
 * Created by Belyaeva on 1/13/2015.
 */
/**
 * Created by smedialink on 13.01.2015.
 */
var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit : 10,
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'voting',
  
});

module.exports = pool;