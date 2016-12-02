var qiniu = require('qiniu');
var uuid = require('node-uuid');
var config = require('../config/config.json')['product-configuration'];
var keys = require('../config/config.json')['keys']['qiniu'];

exports.uploadImage = function() {
    qiniu.conf.ACCESS_KEY = keys['access-key'];
    qiniu.conf.SECRET_KEY = keys['secret-key'];

    bucket = config['qiniuBucket'];
    keys = uuid.v1();
};