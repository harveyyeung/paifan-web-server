var bluebird = require('bluebird');
var request = bluebird.promisifyAll(require('request'), {multiArgs: true}); // See: http://stackoverflow.com/questions/34796172/request-getasync-only-returns-1-parameters
var current_env = process.env.NODE_ENV || "development";
var config = require('../config/config.json');
var timeout = config['product-configuration']['httpTimeout'];
var baseUrl = config['service-connection'][current_env]['shabi-service-interface'];
var urls = require('../config/url.json')['shabi-service-interface'];

var parseResponseMessage = function (body) {
    var obj = JSON.parse(body);

    if (obj.type !== undefined && obj.type === "Error") {
        throw new Error(obj.message);
    }

    return obj;
};

exports.uploadImageToQiniu = function (prefix, imageBase64) {
    var url = urls['uploadImageToQiNiu'];

    return request.postAsync({
        url: url,
        baseUrl: baseUrl,
        timeout: timeout,
        form: {
            image: encodeURIComponent(imageBase64),
            prefix: encodeURIComponent(prefix)
        },
    }).spread((res, body) => {
        return parseResponseMessage(body);
    });
};
