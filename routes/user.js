var express = require('express');
var userServiceInterface = require('../interfaces/user_service_interface');
var articleServiceInterface = require('../interfaces/article_service_interface');
var router = express.Router();
var Q = require('q');

router.get('/publish/mobile/:userId/:classifyId/:pageNumber', function(req, res, next) {
    var userId = req.params.userId;
    var classifyId = req.params.classifyId;
    var pageNumber = req.params.pageNumber;

    var promises = [userServiceInterface.requestUserArticles(userId, classifyId, pageNumber),
                    articleServiceInterface.requestUserClassifyTypes(userId)];

    Q.allSettled(promises).spread((userArticlesState, userClassifyTypesState) => {
        if (userArticlesState.state !== "fulfilled" || userArticlesState.value == null) {
            return next(userArticlesState.reason);
        }

        var userClassifyTypes = [ { id: 0, name: "最新" } ];

        if (userClassifyTypesState.state === "fulfilled") {
            userClassifyTypesState.value.forEach(v => userClassifyTypes.push(v));
        }

        res.render('mobile/user_article', {
            user: userArticlesState.value.user,
            articles: userArticlesState.value.articles,
            classifyTypes: userClassifyTypes,
            rawParameters: {
                userId: userId,
                classifyId: classifyId,
                pageNumber: pageNumber
            }
        });

    }).done();
});

module.exports = router;
