var express = require('express');
var router = express.Router();
var articleServiceInterface = require('../interfaces/article_service_interface');
var merchantServiceInterface = require('../interfaces/merchant_service_interface');
var userServiceInterface = require('../interfaces/user_service_interface');
var Q = require('q');
var StringBuilder = require('string-builder');
var iconv = require('iconv-lite');
var json2csv = require('json2csv');
var fs = require('fs');
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

router.post('/audit/promotion/list', function (req, res, next) {
    if (!req.body) {
        return next(new Error('No body posted.'));
    }

    if (!req.body.titleOrTelephone || req.body.titleOrTelephone == "")
        req.body.titleOrTelephone = "all";

    return merchantServiceInterface.requestPromotionAuditList(req.body.token, req.body.type, req.body.auditStatus, encodeURIComponent(req.body.titleOrTelephone), "0", "0", req.body.page).then(result => {
        return res.render('manage/audit_promotion.ejs', {
            token: req.body.token,
            count: result.count,
            promotions: result.promotions,
            page: parseInt(req.body.page),
            rawParameters: {
                baseUrl: config['extranet-server-url'][current_env]
            },
            queries: {
                type: req.body.type,
                auditStatus: req.body.auditStatus,
                titleOrTelephone: req.body.titleOrTelephone
            }
        });
    }).catch(err => {
        return next(err);
    });
});

/**
 * We are handling the STUPID framework behaviors!
 */
router.get('/audit/promotion/list', function (req, res, next) {
    if (!req.query.titleOrTelephone || req.query.titleOrTelephone == "")
        req.query.titleOrTelephone = "all";

    return merchantServiceInterface.requestPromotionAuditList(req.query.token, req.query.type, req.query.auditStatus, encodeURIComponent(req.query.titleOrTelephone), "0", "0", req.query.page).then(result => {
        return res.render('manage/audit_promotion.ejs', {
            token: req.query.token,
            count: result.count,
            promotions: result.promotions,
            page: parseInt(req.query.page),
            rawParameters: {
                baseUrl: config['extranet-server-url'][current_env]
            },
            queries: {
                type: req.query.type,
                auditStatus: req.query.auditStatus,
                titleOrTelephone: req.query.titleOrTelephone
            }
        });
    }).catch(err => {
        return next(err);
    });
});

router.get('/audit/promotion/list/:adminToken/:type/:auditStatus/:titleOrTelephone/:startTime/:endTime/:page', function(req, res, next) {
    return merchantServiceInterface.requestPromotionAuditList(req.params.adminToken, req.params.type, req.params.auditStatus,
                                                              req.params.titleOrTelephone, req.params.startTime, req.params.endTime, req.params.page).then(result => {
        return res.render('manage/audit_promotion.ejs', {
            token: req.params.adminToken,
            count: result.count,
            promotions: result.promotions,
            page: parseInt(req.params.page),
            rawParameters: {
                baseUrl: config['extranet-server-url'][current_env]
            },
            queries: {
                type: req.params.type,
                auditStatus: req.params.auditStatus,
                titleOrTelephone: req.params.titleOrTelephone == "all" ? "" : req.params.titleOrTelephone
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

router.get('/sign/list/:adminToken/:promotionId', function(req, res, next) {
    return merchantServiceInterface.requestPromotionInformation(req.params.promotionId).then(promotion => {
        if (!promotion) {
            throw new Error('找不到此推广信息。  --promotionId: ' + req.params.promotionId);
        }

        return merchantServiceInterface.requestPromotionSignList(req.params.adminToken, req.params.promotionId).then(signs => {
            return res.render('manage/promotion_sign_list.ejs', {
                promotion,
                signs,
                rawParameters: {
                    token: req.params.adminToken,
                    promotionId: req.params.promotionId,
                    baseUrl: config['extranet-server-url'][current_env]
                }
            });
        });
    }).catch(err => {
        return next(err);
    });
});

router.get('/sign/list/download/:adminToken/:promotionId', function(req, res, next) {
    return merchantServiceInterface.requestPromotionInformation(req.params.promotionId).then(promotion => {
        if (!promotion) {
            throw new Error('找不到此推广信息。  --promotionId: ' + req.params.promotionId);
        }

        return merchantServiceInterface.requestPromotionSignList(req.params.adminToken, req.params.promotionId).then(signs => {
            /*
            var fields = ['name', 'telephone', 'description'];
            json2csv({data: signs, fields: fields}, function (err, csv) {
                if (err) return next(err);

                var newCsv = iconv.encode(csv, 'UTF16');
                fs.writeFile("D:\a.csv", newCsv, function (err) {
                    return res.send('ok');
                });
                //res.attachment('promotion.csv');
                //return res.send(newCsv);
            })
            */
            
            var sb = new StringBuilder();
            //sb.append('' + promotion.title);
            //sb.append(',,,\n');
            sb.append('序号,姓名,手机号,备注\r\n');

            signs.forEach((sign, i) => {
                sb.append('' + (i + 1).toString());
                sb.append(',');
                sb.append(sign.name ? sign.name.replace(',', ' ').replace('"', ' ') : '');
                sb.append(',');
                sb.append(sign.telephone ? sign.telephone.replace(',', ' ').replace('"', ' ') : '');
                sb.append(',');
                sb.append(sign.description ? sign.description.replace(',', ' ').replace('"', ' ') : '');
                sb.append('\r\n');
            });
            res.attachment('promotion.csv');
            return res.send(iconv.encode(sb.toString(), "UTF16"));
            
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
            req.params.rejectedReason).then(message => {
        return res.send(message);
    }).catch(err => {
        return next(err);
    });
});

module.exports = router;
