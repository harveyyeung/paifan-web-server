var express = require('express');
var router = express.Router();
var merchantServiceInterface = require('../interfaces/merchant_service_interface');
var Q = require('q');
var config = require('../config/config.json');
var current_env = process.env.NODE_ENV || "development";

router.get('/publish/:type/:userId', function(req, res, next) {
    res.render('publish/promotion.ejs', {
        rawParameters: {
            type: req.params.type,
            userId: req.params.userId
        }
    });
});

module.exports = router;
