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
            userId: req.params.userId,
            baseUrl: config['extranet-server-url'][current_env]
        }
    });
});

router.get('/:promotionId', function (req, res, next) {
    return merchantServiceInterface.requestPromotionInformation(req.params.promotionId).then(promotion => {
        if (!promotion) {
            throw new Error('找不到此推广信息。  --promotionId: ' + req.params.promotionId);
        }

        res.render('mobile/promotion.ejs', {
            rawParameters: {
                promotionId: req.params.promotionId,
                baseUrl: config['extranet-server-url'][current_env]
            },
            promotion: promotion
        });
    }).catch(err => {
        return next(err);
    });
});

/**
 * Below are the bridges connect to Merchant Service.
 */
router.post('/add/:type/:userId', function(req, res, next) {
    return merchantServiceInterface.postNewPromotion(req.params.type, req.params.userId, req.body).then(result => {
        return res.send(result);
    }).catch(err => {
        res.status(500);
        return res.send({
            type: 'Error',
            message: err.message
        });
    });
});

router.get('/detail/:promotionId', function (req, res, next) {
    return merchantServiceInterface.requestPromotionDetail(req.params.promotionId).then(result => {
        return res.send(result);
    }).catch(err => {
        res.status(500);
        return res.send({
            type: 'Error',
            message: err.message
        });
    });
});

module.exports = router;
