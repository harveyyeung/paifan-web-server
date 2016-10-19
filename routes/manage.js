var express = require('express');
var router = express.Router();
var articleServiceInterface = require('../interfaces/article_service_interface');
var Q = require('q');

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

module.exports = router;
