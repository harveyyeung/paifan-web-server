exports.getTimeSpan = function (createTime) {
    var timeSpan = "";
    try {
        createTime = Date.now() - Date.parse(createTime);
        if (createTime < 1000 * 60 * 60) {
            timeSpan = "刚刚";
        } else if (createTime < 1000 * 60 * 60 * 24) {
            timeSpan = Math.ceil(createTime / (1000 * 60 * 60)) + " 小时前";
        } else if (createTime < 1000 * 60 * 60 * 24 * 7) {
            timeSpan = Math.ceil(createTime / (1000 * 60 * 60 * 24)) + " 天前";
        } else {
            timeSpan = "7 天前";
        }
    } catch (err) {

    }

    return timeSpan;
};

exports.isBase64Uri = function (imageUri) {
    if (imageUri.startsWith('http', 0))
        return false;
    
    if (imageUri.indexOf(';base64,') > 0)
        return true;

    return false;
};