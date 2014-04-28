
module.exports.cleanOldDownloads = function(list) {
    if (typeof list === 'undefined')
        return [];
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var newlist = [];
    list.forEach(function(row) {
        if(row.downloadedAt > yesterday) {
            newlist.push(row);
        }
    });
    return newlist;
};

module.exports.sumDownloadQuota = function(list) {
    list = this.cleanOldDownloads(list);
    var sum = 0;
    list.forEach(function(row) {
        sum += row.weight;
    });
    return sum;
};