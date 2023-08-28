var express = require('express');
var router = express.Router();
var pool = require('../db/config');
var http = require('http'),
    path = require('path');
var fs = require('fs');
var fs = require('fs');
var net = require('net');
var mysql = require('mysql'),
    connectionsArray = [],
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'voting1',
        port: 3306
    }),
    POLLING_INTERVAL = 60000,
    pollingTimer;

router.get('/', function(req, res,next) {
    res.render('index', {title: 'Express'});


});

router.post('/incoming', function(req, res, next){
    console.log('incoming = ', req.body)
    var request = req.body.Message.split(",");
    if (request.length == 7)
    {
        pool.getConnection(function (err, connection) {
            if (err) {
                //  return next(err);
                res.send(err.message);
            }
            connection.beginTransaction(function (err) {
                if (err) {
                    connection.rollback();
                    connection.release();
                    //  next(err);
                    res.send(err.message);
                }
                else {
                    connection.query('call result(?,?,?,?,?, ?,?);',
                        [
                            request[0],
                            request[1],
                            request[2],
                            request[3],
                            request[4],
                            request[5],
                            request[6]
                        ],
                        function (err, rows) {
                            if (err) {
                                connection.rollback(function () {
                                    connection.release();
                                    err.status = 500;
                                    //  next(err);
                                    res.send(err.message);
                                });
                            }
                            else {
                                connection.commit();
                                connection.release();
                                res.send(200);
                            }
                        });
                }
            });
        });
    }
    if (request.length == 3)
    {
        pool.getConnection(function (err, connection) {
            if (err) {
                // return next(err);
                res.send(err.message);
            }
            connection.beginTransaction(function (err) {
                if (err) {
                    connection.rollback();
                    connection.release();
                    res.send(err.message);
                    //  next(err);
                }
                else {
                    connection.query('call summary(?,?,?);',
                        [
                            request[0],
                            request[1],
                            request[2]
                        ],
                        function (err, rows) {
                            if (err) {
                                connection.rollback(function () {
                                    connection.release();
                                    err.status = 500;
                                    // next(err);
                                    res.send(err.message);
                                });
                            }
                            else {
                                connection.commit();
                                connection.release();
                                res.send(200);
                            }
                        });
                }
            });
        });
    }
});

router.post('/register', function(req, res, next) {
    console.log("Received file:\n" + JSON.stringify(req.body));
    var v = JSON.stringify(req.body);
    pool.getConnection(function (err, connection) {
        if (err) {
            // return next(err);
            var errorMessage = err.message;
            errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
            err.message = errorMessage;
            res.send(err.message);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                var errorMessage = err.message;
                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                err.message = errorMessage;
                res.send(err.message);
                //   next(err);
            }
            else {
                connection.query('call register(?,?,?,?,?, ?,?,?,?,?, ?,?);',
                    [
                        req.body.agent_name,
                        req.body.phone,
                        req.body.passcode,
                        req.body.license,
                        req.body.polling_unit,
                        req.body.polling_unit_code,
                        req.body.ward_name,
                        req.body.ward_code,
                        req.body.lga_name,
                        req.body.lga_code,
                        req.body.state,
                        req.body.state_code,
                        // req.body.photo,
                        __dirname
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;

                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                                // next(err);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();
                            var json_res = JSON.parse('{"AgentId": [], "status": [] }');
                            json_res.AgentId.push(rows[0][0].AgentId);
                            json_res.status.push(200);
                            res.send(json_res);
                        }
                    });
            }
        });
    });
});

router.post('/photo', function(req, res, next) {
    var saveTo;
    req.pipe(req.busboy);
    req.busboy.on('field', function (fieldname, val) {
        req.body[fieldname] = val;
    });

    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        file.on('error', function (err) {
            console.log('Error while buffering the stream: ', err);
        });


        if (req.body.option == "agent") {
            saveTo = path.join(__dirname + "/photos/" + req.body.license + "/" + req.body.option + "/", path.basename(req.body.id + ".jpg"));
            file.pipe(fs.createWriteStream(saveTo));
            var json_res = JSON.parse('{"status": [] }');
            json_res.status.push(200);
            res.send(json_res);
        }
        else {
            saveTo = path.join(__dirname + "/photos/" + req.body.license + "/" + req.body.option + "/", path.basename(filename) + ".jpg");

            file.pipe(fs.createWriteStream(saveTo));

            if (req.headers['content-length']  >= req.body.size) {
                console.log("data = " + req.headers['content-length']  + "req = " + req.body.size);
                pool.getConnection(function (err, connection) {
                    if (err) {
                        //return next(err);
                        var errorMessage = err.message;
                        errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                        err.message = errorMessage;
                        res.send(err.message);
                    }
                    connection.beginTransaction(function (err) {
                        if (err) {
                            connection.rollback();
                            connection.release();
                            // next(err);
                            var errorMessage = err.message;
                            errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                            err.message = errorMessage;
                            res.send(err.message);
                        }
                        else {
                            var call = 'call ' + req.body.option + '(?,?,?,?,?);';
                            connection.query(call,
                                [
                                    req.body.id,
                                    req.body.license,
                                    req.body.size,
                                    req.body.source,
									req.body.lc_type,
                                    saveTo,
                                    req.body.X,
                                    req.body.Y
                                ],
                                function (err, rows) {
                                    if (err) {
                                        connection.rollback(function () {
                                            connection.release();
                                            err.status = 500;
                                            //next(err);
                                            var errorMessage = err.message;
                                            errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                            err.message = errorMessage;
                                            res.send(err.message);
                                        });
                                    }
                                    else {
                                        connection.commit();
                                        connection.release();
                                        var json_res = JSON.parse('{"status": [] }');
                                        json_res.status.push(200);
                                        res.send(json_res);
                                        // res.end();
                                    }
                                });
                        }
                    });
                });
            }
            else
            {
                console.log("data = " + req.headers['content-length']  + "req = " + req.body.size);
                res.send("erro");
                // res.end();
            }
        }


    });

    req.busboy.on('finish', function () {
        console.log('finish, files uploaded ');
    });
});

router.post('/result', function(req, res, next)
{
    var v = JSON.stringify(req.body);
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                //   next(err);
                var errorMessage = err.message;
                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                err.message = errorMessage;
                res.send(err.message);
            }
            else {
                connection.query('call result(?,?,?,?,?,?,? ?,?);',
                    [
                        req.body.apc,
                        req.body.lp,
                        req.body.nnpp,
                        req.body.pdp,
                        req.body.sdp,
                        req.body.othrs,
						req.body.voided,
                        req.body.accr,
						req.body.total,
                        
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                // next(err);
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();
                            var json_res = JSON.parse('{"status": [] }');
                            json_res.status.push(200);
                            res.send(json_res);
                        }
                    });
            }
        });
    });
});

router.post('/summary', function(req, res, next)
{
    var v = JSON.stringify(req.body);
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                var errorMessage = err.message;
                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                err.message = errorMessage;
                res.send(err.message);
                //  next(err);
            }
            else {
                connection.query('call summary(?,?,?);',
                    [
                        req.body.AgentId,
                        req.body.license,
                        req.body.summary,
						req.body.lc_type
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                // next(err);
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();

                            var json_res = JSON.parse('{"status": [] }');
                            json_res.status.push(200);
                            res.send(json_res);
                        }
                    });
            }
        });
    });
});


router.post('/getall', function(req,res,next) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.log("qwert", err)
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                next(err);
            }
            else {
                connection.query('call getAll_(?,?,?);',
                    [
                        req.body.get,
                        req.body.license,
                        req.body.date,
						req.body.lc_type
						
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();
                            var mess0 = "agent%";
                            for (var i = 0, j = 0; i < rows[0].length; i++) {
                                if(rows[0][i])
                                mess0 += rows[0][i].AgentId + "$" + rows[0][i].agent_name + "$" + rows[0][i].phone + "$" + rows[0][i].license + "$" + rows[0][i].polling_unit + "$" + rows[0][i].polling_unit_code + "$" + rows[0][i].ward_name + "$" + rows[0][i].ward_name_code + "$" + rows[0][i].LGA + "$" + rows[0][i].LGA_code + "$" + rows[0][i].state + "$" + rows[0][i].state_code + '$' + rows[0][i].photo +'$' + rows[0][i].date_.toLocaleDateString() + ' ' + rows[0][i].date_.toLocaleTimeString() + '%';
                            }
                            res.send(mess0 + "end%");
                        }
                    });
            }
        });
    });
});

router.post('/getallres', function(req,res,next) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                next(err);
            }
            else {
                connection.query('call getAll_(?,?,?);',
                    [
                        req.body.get,
                        req.body.license,
                        req.body.date,
						req.body.lc_type
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                // next(err);
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();
                            var mess0 = "result%";
                            for (var i = 0, j = 0; i < rows[1].length; i++) {
                                if(rows[1][i])
                                mess0 += rows[1][i].AgentId + "$" + rows[1][i].apc + "$" + rows[1][i].lp + "$" + rows[1][i].nnpp + "$" +rows[1][i].pdp + "$" + rows[1][i].sdp + '$' + rows[1][i].othrs + "$" +rows[1][i].voided + "$" + rows[1][i].accr + "$" + rows[1][i].total + "$" + rows[1][i].date_.toLocaleDateString() + ' ' + rows[1][i].date_.toLocaleTimeString() +'%';
                            }

                            res.send(mess0  + "end%");
                        }
                    });
            }
        });
    });
});

router.post('/getallsum', function(req,res,next) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                next(err);
            }
            else {
                connection.query('call getAll_(?,?,?);',
                    [
                        req.body.get,
                        req.body.license,
                        req.body.date,
						req.body.lc_type
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                // next(err);
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();

                            var mess1 = "summary%";
                            for (var i = 0, j = 0; i < rows[2].length; i++) {
                                if(rows[2][i] && rows[2][i].summary){
                                    mess1 += ( rows[2][i].AgentId) + "$" + ( rows[2][i].summary) +  '$' +  ( rows[2][i].lc_type) + "$" + rows[2][i].date_.toLocaleDateString() + ' ' + rows[2][i].date_.toLocaleTimeString() + '%';
                                }
                            }

                            res.send(mess1 + "end%");
                        }
                    });
            }
        });
    });
});


router.post('/getallphoto', function(req,res,next) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                next(err);
            }
            else {
                connection.query('call getAll_(?,?,?);',
                    [
                        req.body.get,
                        req.body.license,
                        req.body.date,
						req.body.lc_type
						
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                // next(err);
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();
                            var mess0 = "photo%";
                            for (var i = 0, j = 0; i < rows[3].length; i++) {
                                if(rows[3][i])
                                    mess0 += rows[3][i].AgentId + "$" + rows[3][i].photo + "$" + rows[3][i].lc_type + "$" + rows[3][i].date_.toLocaleDateString() + ' ' + rows[3][i].date_.toLocaleTimeString()+ '%';
                            }

                            res.send(mess0 + "end%");
                        }
                    });
            }
        });
    });
});

router.post('/getallphotoChaos', function(req,res,next) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                next(err);
            }
            else {
                connection.query('call getAll_(?,?,?);',
                    [
                        req.body.get,
                        req.body.license,
                        req.body.date,
						req.body.lc_type
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                // next(err);
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();
                            var mess0 = "photo%";

                            for (var i = 0, j = 0; i < rows[4].length; i++) {
                                if(rows[4][i])
                                    mess0 += ( rows[4][i].AgentId) + "$" + rows[4][i].photo + '$' + rows[4][i].lc_type + '$' + rows[4][i].date_.toLocaleDateString() + ' ' + rows[4][i].date_.toLocaleTimeString() + '%';
                            }

                            res.send(mess0 + "end%");
                        }
                    });
            }
        });
    });
});

router.post('/getallphotoPolling', function(req,res,next) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                next(err);
            }
            else {
                connection.query('call getAll_(?,?,?);',
                    [
                        req.body.get,
                        req.body.license,
                        req.body.date,
						req.body.lc_type
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                // next(err);
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();
                            var mess0 = "photo%";

                            for (var i = 0, j = 0; i < rows[5].length; i++) {
                                if(rows[5][i])
                                    mess0 += ( rows[5][i].AgentId) + "$" + rows[5][i].photo + '$' +rows[5][i].lc_type + "$" +  + rows[5][i].date_.toLocaleDateString() + ' ' + rows[5][i].date_.toLocaleTimeString() + '%';
                            }

                            res.send(mess0 + "end%");
                        }
                    }
                );
            }
        });
    });
});


router.post('/getphoto', function(req,res,next) {
    /////GET PHOTOS BYTE BY PACKAGE
    var async = require('async');
    var fd = fs.openSync(req.body.path, 'r');
    var stats = fs.fstatSync(fd);
    var bufferSize = stats.size,
        chunkSize = 555555555,//bytes
        buffer = new Buffer(bufferSize),
        bytesRead = 0;

    async.whilst(
        function () {
            return bytesRead < bufferSize;
        },
        function (done) {
            if ((bytesRead + chunkSize) > bufferSize) {
                chunkSize = (bufferSize - bytesRead);
            }
            fs.read(fd, buffer, bytesRead, chunkSize, bytesRead,
                function (err, bytes, buff) {
                    if (err) return done(err);
                    res.send(buff.slice(bytesRead, bytesRead + chunkSize));
                    fs.close(fd);
                });
        },
        function (err) {
            if (err) console.log(err);
            fs.close(fd);
        }
    );
});

router.post('/getphotosize', function(req,res,next) {
    /////GET PHOTOS BYTE BY PACKAGE
    var async = require('async');
    var fd = fs.openSync(req.body.path, 'r');
    var stats = fs.fstatSync(fd);
    var bufferSize = stats.size,
        chunkSize = 555555555,//bytes
        buffer = new Buffer(bufferSize),
        bytesRead = 0;

    async.whilst(
        function () {
            return bytesRead < bufferSize;
        },
        function (done) {
            if ((bytesRead + chunkSize) > bufferSize) {
                chunkSize = (bufferSize - bytesRead);
            }
            fs.read(fd, buffer, bytesRead, chunkSize, bytesRead,
                function (err, bytes, buff) {
                    if (err) return done(err);
                    var size_ = buff.slice(bytesRead, bytesRead + chunkSize).length;
                    res.send(size_.toString());
                    fs.close(fd);
                });
        },
        function (err) {
            if (err) console.log(err);
            fs.close(fd);
        }
    );
});


router.post('/getCurrentData', function(req,res,next) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                next(err);
            }
            else {
                connection.query('call getCurrent(?,?);',
                    [
                        req.body.AgentId,
                        req.body.license,
						req.body.lc_type
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();

                            var mess1 = "result%";
                            for (var i = 0, j = 0; i < rows[0].length; i++) {
                                mess1 += rows[0][i].AgentId + "$" + rows[0][i].apc + "$" + rows[0][i].lp + "$" + rows[0][i].nnpp + "$" +rows[0][i].pdp + "$" + rows[0][i].sdp + rows[0][i].othrs + "$" +rows[0][i].voided + "$" + rows[0][i].accr + "$" + rows[0][i].total +'%';
                            }

                            var mess2 = "summary%";
                            for (var i = 0, j = 0; i < rows[1].length; i++) {
                                if(rows[1][i] && rows[1][i].summary){
                                    mess2 += (rows[1][i].AgentId) + "$" + (rows[1][i].lc_type) + (rows[1][i].summary) +  '%';
                                }

                            }
                            res.send( mess1 + mess2  + "end%");
                        }
                    });
            }
        });
    });
});

router.post('/get_account', function(req,res,next) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                next(err);
            }
            else {
                connection.query('call get_account();',
                    [
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                // next(err);
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();
                            var mess0 = "account%";
                            for (var i = 0, j = 0; i < rows[0].length; i++) {
                                mess0 += rows[0][i].login + "$" + rows[0][i].password + "$" + rows[0][i].license + '%';
                            }

                            res.send(mess0 + "end%");
                        }
                    });
            }
        });
    });
});

router.post('/change_pass', function(req,res,next) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                next(err);
            }
            else {
                connection.query('call change_pass(?,?);',
                    [
                        req.body.license,
                        req.body.pass
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                // next(err);
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();
                            res.send("ok");
                        }
                    });
            }
        });
    });
});



router.post('/getphotoChaos', function(req,res,next) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                next(err);
            }
            else {
                connection.query('call getChaos(?,?);',
                    [
                        req.body.AgentId,
                        req.body.license,
                        req.body.lc_type
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                // next(err);
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();
                            var mess0 = "photo%";
                            for (var i = 0, j = 0; i < rows[0].length; i++) {
                                mess0 += rows[0][i].AgentId + "$" + rows[0][i].photo + "$" + rows[0][i].lc_type + '%';
                            }

                            res.send(mess0 + "end%");
                        }
                    });
            }
        });
    });
});

router.post('/getphotoLedger', function(req,res,next) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                next(err);
            }
            else {
                connection.query('call getLedger(?,?);',
                    [
                        req.body.AgentId,
                        req.body.license,
						req.body.lc_type
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                // next(err);
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();
                            var mess0 = "photo%";
                            for (var i = 0, j = 0; i < rows[0].length; i++) {
                                mess0 += rows[0][i].AgentId + "$" + rows[0][i].photo + "$" + rows[0][i].lc_type + '%';
                            }

                            res.send(mess0 + "end%");
                        }
                    });
            }
        });
    });
});

router.post('/getphotoPolling', function(req,res,next) {
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                next(err);
            }
            else {
                connection.query('call getPolling(?,?);',
                    [
                        req.body.AgentId,
                        req.body.license,
						req.body.lc_type
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                // next(err);
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();
                            var mess0 = "photo%";
                            for (var i = 0, j = 0; i < rows[0].length; i++) {
                                mess0 += rows[0][i].AgentId + "$" + rows[0][i].photo + "$" + rows[0][i].lc_type +'%';
                            }

                            res.send(mess0 + "end%");
                        }
                    });
            }
        });
    });
});


router.post('/delete', function(req, res, next)
{
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                next(err);
            }
            else {
                connection.query('call delete_result(?);',
                    [
                        req.body.AgentId
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                // next(err);
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();
                            res.send("ok");
                        }
                    });
            }
        });
    });
});

router.post('/deleteProfile', function(req, res, next)
{
    pool.getConnection(function (err, connection) {
        if (err) {
            return next(err);
        }
        connection.beginTransaction(function (err) {
            if (err) {
                connection.rollback();
                connection.release();
                next(err);
            }
            else {
                connection.query('call delete_profile(?);',
                    [
                        req.body.AgentId
                    ],
                    function (err, rows) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                                err.status = 500;
                                // next(err);
                                var errorMessage = err.message;
                                errorMessage = errorMessage.replace("ER_SIGNAL_EXCEPTION", "Error");
                                err.message = errorMessage;
                                res.send(err.message);
                            });
                        }
                        else {
                            connection.commit();
                            connection.release();
                            res.send("ok");
                        }
                    });
            }
        });
    });
});

module.exports = router;