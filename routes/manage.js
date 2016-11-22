var express = require('express');
var router = express.Router();
var articleServiceInterface = require('../interfaces/article_service_interface');
var merchantServiceInterface = require('../interfaces/merchant_service_interface');
var Q = require('q');
var config = require('../config/config.json');
var current_env = process.env.NODE_ENV || "development";

router.get('/app_tags/:token', function(req, res, next) {
    Q.all([articleServiceInterface.requestHomeCategories(), articleServiceInterface.requestClassifyTypes()])
    .spread((home, types) => {
        res.render('manage/app_tags', {
            homeCategories: JSON.stringify(home),
            classifyTypes: JSON.stringify(types)
        });
    }).catch(err => {
        return next(err);
    });
});

router.get('/audit/media/list', function(req, res, next) {
    return merchantServiceInterface.requestMediaAuditList().then(result => {
        res.render('manage/audit_media.ejs', {
            list: result,
            rawParameters: {
                baseUrl: config['base-url'][current_env],
                merchantServiceUrl: config['extranet-service-connection'][current_env]['merchant-service']
            }
        });
    }).catch(err => {
        return next(err);
    });
});

router.get('/audit/merchant/list', function(req, res, next) {
    return merchantServiceInterface.requestMerchantAuditList().then(result => {
        res.render('manage/audit_merchant.ejs', {
            list: result,
            rawParameters: {
                baseUrl: config['base-url'][current_env],
                merchantServiceUrl: config['extranet-service-connection'][current_env]['merchant-service']
            }
        });
    }).catch(err => {
        return next(err);
    });
});

module.exports = router;
