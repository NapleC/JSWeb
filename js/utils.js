window.utils = (function ($, utils) {
    var paramsCache = null, lang = null;

    return $.extend(utils, {

        /**
         * 获取请求参数
         * @return {object} 请求参数
         */
        getRequestParams: function () {
            if (paramsCache !== null) {
                return paramsCache;
            }

            var params = {};
            var queryString = location.search;
            if (queryString.substring(0, 1) === '?') {
                queryString = queryString.substring(1);
            }
            queryString.split('&').forEach(function (kv) {
                kv = kv.split('=', 2);
                var name = decodeURIComponent(kv[0]);
                if (name) {
                    params[name] = (typeof kv[1] === 'undefined') ? '' : decodeURIComponent(kv[1]);
                }
            });
            paramsCache = params;
            return params;
        },

        /**
         * 获取指定参数
         * @param paramName 参数名
         * @return {object} 请求参数
         */
        getRequestParam: function (paramName) {
            return this.getRequestParams()[paramName];
        },

        /**
         * 获取指定参数，并转换为数字，无效数字为NaN
         * @param paramName 参数名
         * @return {object} 请求参数
         */
        getNumberParam: function (paramName) {
            return parseInt(this.getRequestParam(paramName));
        },

        /**
         * 获取Date对象
         * @param unixTimestamp Unix时间戳（秒）
         */
        getDateObject: function (unixTimestamp) {
            return new Date(unixTimestamp * 1000);
        },

        /**
         * 格式式成日期格式
         * @param time Unix时间戳（秒）或Date对象
         * @return {string} yyyy-MM-dd
         */
        formatDate: function (time) {
            var date = $.type(time) === "date" ? time : this.getDateObject(time);
            return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        },

        /**
         * 格式式成日期时间格式
         * @param time Unix时间戳（秒）或Date对象
         * @return {string} yyyy-MM-dd HH:mm
         */
        formatDateTime: function (time) {
            var date = $.type(time) === "date" ? time : this.getDateObject(time);
            return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
                date.getHours() + ":" + date.getMinutes();
        },

        /**
         * 格式式成日期时间格式
         * @param time Unix时间戳（秒）或Date对象
         * @return {string} yyyy-MM-dd HH:mm:ss
         */
        formatDateTimeLong: function (time) {
            var date = $.type(time) === "date" ? time : this.getDateObject(time);
            return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
                date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        },

        /**
         * 转换成Unix时间戳（秒）
         */
        toUnixSeconds: function (date) {
            return Math.floor(date.getTime() / 1000);
        },

        /**
         * 获取日期
         * @param offsetDate 偏移天数，例如-1为昨天
         * @return {Date} 时间为00:00:00的Date对象
         */
        getOffsetDate: function (offsetDate) {
            var date = new Date();
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
            if (!offsetDate) offsetDate = 0;
            date.setTime(date.getTime() + offsetDate * 24 * 60 * 60 * 1000);
            return date;
        },


        /**
         * 显示警告并跳转
         * @param alertMessage toast消息
         * @param url 跳转地址
         */
        alertGo: function (alertMessage, url) {
            alert(alertMessage);
            location.href = url;
        },

        /**
         * 获取|保存localStorage
         * @param key 缓存key
         * @param value value不传为获取缓存
         */
        localStorage: function (key, value) {
            if (typeof value === 'undefined') {
                return JSON.parse(localStorage.getItem(key));
            }

            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                window.alert(gettext('保存localStorage失败，请关闭隐私（无痕）模式'));
            }
        },

        /**
         * 获取|保存sessionStorage
         * @param key 缓存key
         * @param value value不传为获取缓存
         */
        sessionStorage: function (key, value) {
            if (typeof value === 'undefined') {
                return JSON.parse(sessionStorage.getItem(key));
            }

            try {
                sessionStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                window.alert(gettext('保存sessionStorage失败，请关闭隐私（无痕）模式'));
            }
        },


        /**
         * 给数字加符号
         * @param number 数字
         */
        signNumber: function (number) {
            return (number >= 0 ? "+" : "-") + number;
        },

        /**
         * 清除缓存
         */
        clearCache: function () {
            localStorage.clear();
            sessionStorage.clear();
        }
    });
})(jQuery, window['utils'] || {});
