var bluebird = require('bluebird');
var request = bluebird.promisifyAll(require('request'), {multiArgs: true}); // See: http://stackoverflow.com/questions/34796172/request-getasync-only-returns-1-parameters
var current_env = process.env.NODE_ENV || "development";
var config = require('../config/config.json');
var timeout = config['product-configuration']['httpTimeout'];
var baseUrl = config['service-connection'][current_env]['article-service'];
var urls = require('../config/url.json')['article-service'];

var parseResponseMessage = function (body) {
    var obj = JSON.parse(body);

    if (obj.type !== undefined && obj.type === "Error") {
        throw new Error(obj.message);
    }

    return obj;
};

exports.requestUserClassifyTypes = function (userId) {
    var url = urls['getUserClassifyTypes'].replace(':userId', userId.toString());

    return request.getAsync({
        url:  url,
        baseUrl: baseUrl,
        timeout: timeout
    }).spread((res, body) => {
        var obj = parseResponseMessage(body);       
        return obj;
    });
};

exports.requestHomeCategories = function () {
    var url = urls['getHomeCategories'];

    return request.getAsync({
        url: url,
        baseUrl: baseUrl,
        timeout: timeout
    }).spread((res, body) => {
        var obj = parseResponseMessage(body);
        return obj.homeCategories;
    });
};

exports.requestClassifyTypes = function() {
    var url = urls['getAllClassifies'];

    return request.getAsync({
        url: url,
        baseUrl: baseUrl,
        timeout: timeout
    }).spread((res, body) => {
        var obj = parseResponseMessage(body);
        return obj.classifies;
    });
};