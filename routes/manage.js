var express = require('express');
var router = express.Router();
var articleServiceInterface = require('../interfaces/article_service_interface');
var merchantServiceInterface = require('../interfaces/merchant_service_interface');
var userServiceInterface = require('../interfaces/user_service_interface');
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

router.get('/audit/promotion/list/:adminToken/:type/:auditStatus/:titleOrTelephone/:startTime/:endTime/:page', function(req, res, next) {
    return merchantServiceInterface.requestPromotionAuditList(req.params.adminToken, req.params.type, req.params.auditStatus,
                                                              req.params.titleOrTelephone, req.params.startTime, req.params.endTime, req.params.page).then(promotions => {
        return res.render('manage/audit_promotion.ejs', {
            token: req.params.adminToken,
            promotions: promotions,
            rawParameters: {
                baseUrl: config['extranet-server-url'][current_env]
            }
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
                baseUrl: config['extranet-server-url'][current_env]
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
                baseUrl: config['extranet-server-url'][current_env]
            }
        });
    }).catch(err => {
        return next(err);
    });
});

router.get('/audit/info/:userId', function(req, res, next) {
    var promises = [merchantServiceInterface.requestUserInformation(req.params.userId),
                    userServiceInterface.requestUserInformation(req.params.userId)];
    
    return Q.all(promises).spread((info, userInfo) => {
        res.render('manage/audit_merchant_view.ejs', {
            info: info,
            userInfo: userInfo,
            rawParameters: {
                baseUrl: config['extranet-server-url'][current_env]
            }
        });
    }).catch(err => {
        return next(err);
    });

});

/**
 * This is a bridge for the web page to access Merchant Service to avoid cross domain accessing.
 */
router.get('/audit/merchant/:userId/:auditStatus/:rejectedReason', function (req, res, next) {
    return merchantServiceInterface.requestAuditMerchant(req.params.userId, req.params.auditStatus, req.params.rejectedReason).then(message => {
        return res.send(message);
    }).catch(err => {
        return next(err);
    });
});

router.get('/audit/media/:userId/:auditStatus/:rejectedReason', function (req, res, next) {
    return merchantServiceInterface.requestAuditMedia(req.params.userId, req.params.auditStatus, req.params.rejectedReason).then(message => {
        return res.send(message);
    }).catch(err => {
        return next(err);
    });
});

router.get('/audit/promotion/:adminToken/:promotionId/:auditStatus/:rejectedReason', function (req, res, next) {
    return merchantServiceInterface.requestAuditPromotion(req.params.adminToken, req.params.promotionId, req.params.auditStatus,
            encodeURIComponent(req.params.rejectedReason)).then(message => {
        return res.send(message);
    }).catch(err => {
        return next(err);
    });
});

module.exports = router;
