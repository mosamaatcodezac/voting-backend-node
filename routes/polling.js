var express = require('express');
var router = express.Router();
var pool = require('../db/config');
const twilio = require('twilio');
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
const accountSid = 'your_account_sid';
const authToken = 'your_auth_token';
const twilioClient = twilio(accountSid, authToken);

router.post('/getxandy', function(req,res,next) {
   
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
                connection.query('call getXandY(?);',
                    [
                        req.body.polling_unit
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
                            var mess0 = "coordinate%";
                            for (var i = 0, j = 0; i < rows[0].length; i++) {
                                mess0 += rows[0][i].AgentId + "$" + rows[0][i].lc_type+ "$" + rows[0][i].latitude+ "$" + rows[0][i].longitude + '%';
                            }

                            res.send(mess0 + "end%");
                        }
                    });
            }
        });
    });
});

router.post('/getallxandy', function(req,res,next) {
   
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
                connection.query('call getAllXandY(?,?);',
                    [
                        req.body.ward_name,
                        req.body.lga,
						req.body.state_code,
                      
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
                            var mess0 = "coordinate%";
                            for (var i = 0, j = 0; i < rows[0].length; i++) {
                                mess0 += rows[0][i].AgentId + "$" + rows[0][i].lc_type+ "$" + rows[0][i].latitude+ "$" + rows[0][i].longitude + '%';
                            }

                            res.send(mess0 + "end%");
                        }
                    });
            }
        });
    });
});

router.post('/getallrigresult', function(req,res,next) {
   
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
                connection.query('call getAllRigResult();',
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
                            var mess0 = "total%";
                            for (var i = 0, j = 0; i < rows[1].length; i++) {
                                if(rows[1][i])
                                mess0 += rows[1][i].id_agent + "$" + rows[1][i].apc + "$" + rows[1][i].lp + "$" + rows[1][i].nnpp + "$" +rows[1][i].pdp + "$" + rows[1][i].sdp + '$' + rows[1][i].othrs + "$" +rows[1][i].voided + "$" + rows[1][i].accr + "$" + rows[1][i].total + "$" + rows[1][i].date_.toLocaleDateString() + ' ' + rows[1][i].date_.toLocaleTimeString() +'%';
                            }

                            res.send(mess0  + "end%");
                        }
                    });
            }
        });
    });
});

router.post('/getalllog', function(req,res,next) {
   
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
                connection.query('call getAllLog();',
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
                            res.send(rows);
                        }
                    });
            }
        });
    });
});

router.post('/sendsummary', function(req,res,next) {
   
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
                connection.query('call sendSummary(?,?,?);',
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
                            twilioClient.messages
                            .create({
                                body: 'Your summary message goes here',
                                from: 'your_twilio_phone_number',
                                to: 'recipient_phone_number'
                            })
                            .then(message => {
                              
                                var json_res = JSON.parse('{"status": [] }');
                                json_res.status.push(200);
                                res.send(json_res);
                            })
                            .catch(error => {
                            
                                res.status(500).send('Error sending SMS');
                            });
                         
                        }
                    });
            }
        });
    });
});

router.post('/resultsum', function(req,res,next) {
   
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
                connection.query('call resultSum()',
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
                           res.send(rows)
                        }
                    });
            }
        });
    });
});

router.post('/resultsumward', function(req,res,next) {
   
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
                connection.query('call resultSumWard(?);',
                    [
                        req.body.ward_name,
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
                            // var mess0 = "result%";
                            // for (var i = 0, j = 0; i < rows[0].length; i++) {
                            //     mess0 += rows[0][i].AgentId + "$" + rows[0][i].lc_type+ "$" + rows[0][i].latitude+ "$" + rows[0][i].longitude + '%';
                            // }

                            // res.send(mess0 + "end%");
                            res.send(rows);

                        }
                    });
            }
        });
    });
});

router.post('/resultsumwardALL', function(req,res,next) {
   
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
                connection.query('call resultSumWardAll();',
                    [
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
                            // var mess0 = "result%";
                            // for (var i = 0, j = 0; i < rows[0].length; i++) {
                            //     mess0 += rows[0][i].AgentId + "$" + rows[0][i].lc_type+ "$" + rows[0][i].latitude+ "$" + rows[0][i].longitude + '%';
                            // }

                            // res.send(mess0 + "end%");
                            res.send(rows);

                        }
                    });
            }
        });
    });
});

router.post('/resultsumlga', function(req,res,next) {
   
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
                connection.query('call resultSumLga(?);',
                    [
                        req.body.lga,
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
                            // var mess0 = "result%";
                            // for (var i = 0, j = 0; i < rows[0].length; i++) {
                            //     mess0 += rows[0][i].AgentId + "$" + rows[0][i].lc_type+ "$" + rows[0][i].latitude+ "$" + rows[0][i].longitude + '%';
                            // }

                            // res.send(mess0 + "end%");
                            res.send(rows);

                        }
                    });
            }
        });
    });
});

router.post('/resultsumlgaALL', function(req,res,next) {
   
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
                connection.query('call resultSumLgaAll();',
                    [
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
                            // var mess0 = "result%";
                            // for (var i = 0, j = 0; i < rows[0].length; i++) {
                            //     mess0 += rows[0][i].AgentId + "$" + rows[0][i].lc_type+ "$" + rows[0][i].latitude+ "$" + rows[0][i].longitude + '%';
                            // }

                            // res.send(mess0 + "end%");
                            res.send(rows);

                        }
                    });
            }
        });
    });
});

router.post('/resultsumstate', function(req,res,next) {
   
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
                connection.query('call resultSumState(?);',
                    [
                        req.body.state,
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
                            // var mess0 = "result%";
                            // for (var i = 0, j = 0; i < rows[0].length; i++) {
                            //     mess0 += rows[0][i].AgentId + "$" + rows[0][i].lc_type+ "$" + rows[0][i].latitude+ "$" + rows[0][i].longitude + '%';
                            // }

                            // res.send(mess0 + "end%");
                            res.send(rows);

                        }
                    });
            }
        });
    });
});

router.post('/resultsumstateALL', function(req,res,next) {
   
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
                connection.query('call resultSumStateAll();',
                    [
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
                            // var mess0 = "result%";
                            // for (var i = 0, j = 0; i < rows[0].length; i++) {
                            //     mess0 += rows[0][i].AgentId + "$" + rows[0][i].lc_type+ "$" + rows[0][i].latitude+ "$" + rows[0][i].longitude + '%';
                            // }

                            // res.send(mess0 + "end%");
                            res.send(rows);

                        }
                    });
            }
        });
    });
});

router.post('/video', function(req, res, next) {
    var saveTo;
    req.pipe(req.busboy);
    req.busboy.on('field', function (fieldname, val) {
        req.body[fieldname] = val;
    });

    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        file.on('error', function (err) {
            console.log('Error while buffering the stream: ', err);
        });

        if (req.body.option === 'video') {
            saveTo = path.join(__dirname + "/videos/" + req.body.license + "/" + req.body.option + "/", path.basename(req.body.id + ".mp4"));
            file.pipe(fs.createWriteStream(saveTo));

            if (req.headers['content-length'] >= req.body.size) {
                console.log("data = " + req.headers['content-length'] + "req = " + req.body.size);
                pool.getConnection(function (err, connection) {
                    if (err) {
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
                        } else {
                            var call = 'call ' + req.body.option + '(?,?,?,?,?);';
                            connection.query(call,
                                [
                                    req.body.id,
                                    req.body.license,
                                    req.body.size,
                                    req.body.source,
                                    req.body.lc_type,
                            
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
                                    } else {
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
            } else {
                console.log("data = " + req.headers['content-length'] + "req = " + req.body.size);
                res.send("error");
            }
        } else {
            res.send("Invalid option");
        }
    });

    req.busboy.on('finish', function () {
        console.log('finish, files uploaded');
    });
});

router.post('/getchaosvideo', function(req,res,next) {
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
                connection.query('call getChaosVideo(?,?);',
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
                            var mess0 = "video%";
                            for (var i = 0, j = 0; i < rows[0].length; i++) {
                                mess0 += rows[0][i].AgentId + "$" + rows[0][i].video + "$" + rows[0][i].lc_type + '%';
                            }

                            res.send(mess0 + "end%");
                        }
                    });
            }
        });
    });
});

router.post('/getledgervideo', function(req,res,next) {
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
                connection.query('call getLedgerVideo(?,?);',
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
                            var mess0 = "video%";
                            for (var i = 0, j = 0; i < rows[0].length; i++) {
                                mess0 += rows[0][i].AgentId + "$" + rows[0][i].video + "$" + rows[0][i].lc_type + '%';
                            }

                            res.send(mess0 + "end%");
                        }
                    });
            }
        });
    });
});

module.exports = router;