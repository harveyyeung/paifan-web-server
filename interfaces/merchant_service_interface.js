var bluebird = require('bluebird');
var request = bluebird.promisifyAll(require('request'), {multiArgs: true}); // See: http://stackoverflow.com/questions/34796172/request-getasync-only-returns-1-parameters
var current_env = process.env.NODE_ENV || "development";
var config = require('../config/config.json');
var timeout = config['product-configuration']['httpTimeout'];
var baseUrl = config['service-connection'][current_env]['merchant-service'];
var urls = require('../config/url.json')['merchant-service'];

var parseResponseMessage = function (body) {
    var obj = JSON.parse(body);

    if (obj.type !== undefined && obj.type === "Error") {
        throw new Error(obj.message);
    }

    return obj;
};

var translateStatusString = function (status) {
    if (!status || status == 'p')
        return '待审核';
    else if (status == 'r')
        return '退回修改';
    else if (status == 'a')
        return '审核通过';
    else
        return '未知';
};

exports.requestMediaAuditList = function (auditStatus) {
    if (!auditStatus)
        auditStatus = 'all';

    var url = urls['getMediaAuditList'].replace(':auditStatus', auditStatus);

    return request.getAsync({
        url:  url,
        baseUrl: baseUrl,
        timeout: timeout
    }).spread((res, body) => {
        var obj = parseResponseMessage(body);   

        if (!obj || !obj.mediaList) {
            return [];
        }

        obj.mediaList.forEach(info => info.statusString = translateStatusString(info.mediaInfoStatus));

        return obj.mediaList;
    });
};

exports.requestMerchantAuditList = function (auditStatus) {
    if (!auditStatus)
        auditStatus = 'all';

    var url = urls['getMerchantAuditList'].replace(':auditStatus', auditStatus);

    return request.getAsync({
        url:  url,
        baseUrl: baseUrl,
        timeout: timeout
    }).spread((res, body) => {
        var obj = parseResponseMessage(body);   

        if (!obj || !obj.merchantList) {
            return [];
        }

        obj.merchantList.forEach(info => info.statusString = translateStatusString(info.merchantInfoStatus));

        return obj.merchantList;
    });
};

exports.requestUserInformation = function (userId) {
    var url = urls['getUserInformation'].replace(':userId', userId);

    return request.getAsync({
        url:  url,
        baseUrl: baseUrl,
        timeout: timeout
    }).spread((res, body) => {
        var obj = parseResponseMessage(body);  

        if (obj && obj.auditStatus) {
            obj.auditStatus.merchantInfoStatusString = translateStatusString(obj.auditStatus.merchantInfoStatus);
            obj.auditStatus.mediaInfoStatusString = translateStatusString(obj.auditStatus.mediaInfoStatus);
        } 

        return obj;
    });
};

exports.requestAuditMerchant = function (userId, auditStatus, rejectedReason) {
    var url = urls['auditMerchantInfo'].replace(':userId', userId)
                                       .replace(':auditStatus', auditStatus)
                                       .replace(':rejectedReason', rejectedReason);

    return request.getAsync({
        url: url,
        baseUrl: baseUrl,
        timeout: timeout
    }).spread((res, body) => {
        return body;
    });
};

exports.requestAuditMedia = function (userId, auditStatus, rejectedReason) {
    var url = urls['auditMediaInfo'].replace(':userId', userId)
                                    .replace(':auditStatus', auditStatus)
                                    .replace(':rejectedReason', rejectedReason);

    return request.getAsync({
        url: url,
        baseUrl: baseUrl,
        timeout: timeout
    }).spread((res, body) => {
        return body;
    });
};

exports.postNewPromotion = function (type, userId, data) {
    var url = urls['addPromotion'].replace(':type', type)
                                  .replace(':userId', userId);

    return request.postAsync({
        url: url,
        baseUrl: baseUrl,
        timeout: timeout,
        form: data,
    }).spread((res, body) => {
        return parseResponseMessage(body);
    });
};

exports.requestPromotionInformation = function (promotionId) {
    var url = urls['getPromotion'].replace(':promotionId', promotionId);

    return request.getAsync({
        url: url,
        baseUrl: baseUrl,
        timeout: timeout,
    }).spread((res, body) => {
        return parseResponseMessage(body);
    });
};

exports.requestPromotionDetail = function(promotionId) {
    var url = urls['getPromotionDetail'].replace(':promotionId', promotionId);

    return request.getAsync({
        url: url,
        baseUrl: baseUrl,
        timeout: timeout,
    }).spread((res, body) => {
        return parseResponseMessage(body);
    });
}