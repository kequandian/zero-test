
let DataUtil = {
    /**
     * 
     * @param {string} data 
     * @param {array} filter 过滤字段
     */
    filterJson(data, filter) {

        for(let i in filter) {
            for(let item in data) {
                if(filter[i] == item) {
                    delete data[item];
                } else if (typeof data[item] === 'object') {
                    data[item] = this.filterJson(data[item], filter);
                }

            }
        }
        return data;
    },

}

module.exports = DataUtil;