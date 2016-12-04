var express = require('express');
var router = express.Router();
var merchantServiceInterface = require('../interfaces/merchant_service_interface');
var userServiceInterface = require('../interfaces/user_service_interface');
var Q = require('q');
var config = require('../config/config.json');
var current_env = process.env.NODE_ENV || "development";

router.get('/publish/:type/:userId/:token', function(req, res, next) {
    return userServiceInterface.requestUserInformation(req.params.userId).then(user => {
        if (!user || req.params.token !== user.telMask) {
            throw new Error('您尚未登录或者登录已经失效。请重新登录。');
        }

        var type = req.params.type;
        if ((user.userType !== 2 && user.userType !== 3) 
            || (type !== 'm' && type !== 's') 
            || (user.userType == 2 && req.params.type !== 'm')
            || (user.userType == 3 && req.params.type !== 's')) {
                throw new Error('您所在的用户组无法执行此操作。');
        }

        return res.render('publish/promotion.ejs', {
            promotionId: 0,
            user: user,
            rawParameters: {
                type: req.params.type,
                userId: req.params.userId,
                baseUrl: config['extranet-server-url'][current_env]
            }
        });
    }).catch(err => {
        return next(err);
    });
});

router.get('/publish/update/:promotionId/:userId/:token', function(req, res, next) {
    var promises = [userServiceInterface.requestUserInformation(req.params.userId),
                    merchantServiceInterface.requestPromotionInformation(req.params.promotionId)];

    return Q.all(promises).spread((user, promotion) => {
        if (!user || !promotion) {
            throw new Error('找不到相关的推广或用户信息。');
        }

        if (user.telMask != req.params.token) {
            throw new Error('您尚未登录或者登录已经失效。请重新登录。');
        }

        if (promotion.userId != user.id) {
            throw new Error('您只能编辑自己发布的推广信息。');
        }

        if (promotion.status != 'e') {
            throw new Error('您只能编辑尚未提交的推广信息。');
        }

        return res.render('publish/promotion.ejs', {
            promotionId: req.params.promotionId,
            user: user,
            rawParameters: {
                type: promotion.type,
                userId: req.params.userId,
                baseUrl: config['extranet-server-url'][current_env]
            }
        });
    }).catch(err => {
        return next(err);
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

router.get('/list/:userId/:type/:status/:token', function (req, res, next) {
    return userServiceInterface.requestUserInformation(req.params.userId).then(user => {
        if (!user || req.params.token !== user.telMask) {
            throw new Error('您尚未登录或者登录已经失效。请重新登录。');
        }
        return merchantServiceInterface.requestPromotions(req.params.userId, req.params.type, req.params.status).then(promotions => {
            return res.render('list/my_promotion.ejs', {
                user,
                rawParameters: {
                    userId: req.params.userId,
                    type: req.params.type,
                    status: req.params.status,
                    baseUrl: config['extranet-server-url'][current_env]
                },
                promotions: promotions
            });
        });
    }).catch(err => {
        return next(err)
    });
});

/**
 * Below are the bridges connect to Merchant Service.
 */
router.get('/information/:promotionId', function (req, res, next) {
    return merchantServiceInterface.requestPromotionInformation(req.params.promotionId).then(promotion => {
        if (!promotion) {
            throw new Error('找不到此推广信息。  --promotionId: ' + req.params.promotionId);
        }

        res.send(promotion);
    }).catch(err => {
        return res.send({
            type: 'Error',
            message: err.message
        });
    });
});

router.post('/add/:type/:userId/:token', function(req, res, next) {
    return userServiceInterface.requestUserInformation(req.params.userId).then(user => {
        if (!user || user.telMask !== req.params.token)
            throw new Error('您尚未登录或者登录已经失效。请重新登录。');

        return merchantServiceInterface.postNewPromotion(req.params.type, req.params.userId, req.body).then(result => {
            return res.send(result);
        });
        
    }).catch(err => {
        res.status(500);
        return res.send({
            type: 'Error',
            message: err.message
        });
    });
    
});

router.post('/update/:promotionId/:userId/:token', function (req, res, next) {
    var promises = [userServiceInterface.requestUserInformation(req.params.userId),
                    merchantServiceInterface.requestPromotionInformation(req.params.promotionId)];

    return Q.all(promises).spread((user, promotion) => {
        if (!user || !promotion) {
            throw new Error('找不到相关的推广或用户信息。');
        }

        if (user.telMask != req.params.token) {
            throw new Error('您尚未登录或者登录已经失效。请重新登录。');
        }

        if (promotion.userId != user.id) {
            throw new Error('您只能编辑自己发布的推广信息。');
        }

        if (promotion.status != 'e') {
            throw new Error('您只能编辑尚未提交的推广信息。');
        }

        req.body.userId = promotion.userId;

        return merchantServiceInterface.postUpdatePromotion(req.params.promotionId, req.body).then(result => {
            return res.send(result);
        });
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
