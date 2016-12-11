var express = require('express');
var router = express.Router();
var merchantServiceInterface = require('../interfaces/merchant_service_interface');
var userServiceInterface = require('../interfaces/user_service_interface');
var shabiServiceInterface = require('../interfaces/shabi_service_interface')
var util = require('../common/util');
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

        if (promotion.status != 'e' && promotion.status != 'r') {
            throw new Error('您只能编辑尚未提交或退回修改的推广信息。');
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
        return merchantServiceInterface.requestPromotions(req.params.userId, req.params.type, req.params.status).then(result => {
            var promotions = result.promotions;
            var total = 0;
            var counts = {};
            if (result.counts) result.counts.forEach(c => { 
                total += c.count
                counts[c.status] = c.count;
            });
            counts['all'] = total;

            return res.render('list/my_promotion.ejs', {
                user,
                rawParameters: {
                    userId: req.params.userId,
                    type: req.params.type,
                    status: req.params.status,
                    baseUrl: config['extranet-server-url'][current_env]
                },
                promotions: promotions,
                counts: counts
            });
        });
    }).catch(err => {
        return next(err);
    });
});

router.get('/available/:userId/:token/:type/:hotOrNew/:page', function (req, res, next) {
    return userServiceInterface.requestUserInformation(req.params.userId).then(user => {
        if (!user || req.params.token !== user.telMask) {
            throw new Error('您尚未登录或者登录已经失效。请重新登录。');
        }
        if (!((req.params.type === 'm' && user.userType === 3) || (req.params.type === 's' && user.userType === 2))) {
            throw new Error('您所在的用户组无法执行此操作。');
        }
        return merchantServiceInterface.requestAvailablePromotionList(req.params.type, req.params.hotOrNew, req.params.page).then(result => {
            var promotions = result.promotions, count = result.count;
            return res.render('list/available_promotion.ejs', {
                count,
                promotions,
                user,
                rawParameters: {
                    type: req.params.type,
                    hotOrNew: req.params.hotOrNew,
                    baseUrl: config['extranet-server-url'][current_env],
                    page: parseInt(req.params.page)
                }
            });
        });
    }).catch(err => {
        return next(err);
    });
});

router.post('/image/upload/:userId/:token', function (req, res, next) {
    if (!req.body || !req.body.image) {
        return res.send({
            type: 'Error',
            message: 'Image must be in the property: image.'
        });
    }

    var imageUri = req.body.image;

    if (!imageUri || !util.isBase64Uri(imageUri)) {
        return res.send({
            type: 'Error',
            message: 'Image must be a base64 format!'
        });
    }
    
    var prefix = "prom_" + req.params.userId + "_"; 
    return shabiServiceInterface.uploadImageToQiniu(prefix, imageUri).then(result => {
        var url = config['product-configuration']['qiniuImageBaseUrl'] + result.fileName;
        return res.send({
            imageUri: url
        });
    }).catch(err => {
        return res.send({
            type: 'Error',
            message: err.message
        });
    });
});

/**
 * Below are the bridges connect to Merchant Service.
 */
router.post('/sign/:promotionId', function (req, res, next) {
    return merchantServiceInterface.postPromotionSign(req.params.promotionId, req.body).then(result => {
        return res.send(result);
    }).catch(err => {
        return res.send({
            type: 'Error',
            message: err.message
        });
    });
});

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
        
        var folder = decodeURIComponent(req.body.folder);

        // TODO: make this waterfall to save multiple images to the server.
        if (util.isBase64Uri(folder)) {
            var prefix = "prom_" + req.params.userId + "_"; 
            // Save the image to image server.
            return shabiServiceInterface.uploadImageToQiniu(prefix, folder).then(result => {
                req.body.folder = encodeURIComponent(config['product-configuration']['qiniuImageBaseUrl'] + result.fileName);
                req.body.folderPreview = req.body.folder;
                return merchantServiceInterface.postNewPromotion(req.params.type, req.params.userId, req.body).then(result => {
                    return res.send(result);
                });
            });
        } else {
            // The folder is already saved in image server.
            return merchantServiceInterface.postNewPromotion(req.params.type, req.params.userId, req.body).then(result => {
                return res.send(result);
            });
        }
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

        if (promotion.status != 'e' && promotion.status != 'r') {
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
