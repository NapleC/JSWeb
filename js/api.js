window.api = (function ($, api) {

    //局部变量
    var local = {
        getApiCacheKey: function (url, params) {
            return "apiCache:" + url + "?" + $.param(params);
        }
    };

    //AJAX全局设置
    $.ajaxSetup({
        timeout: 10 * 1000
    });

    $.fn.extend({
        /**
         * 表单异步提交
         * @param callback 成功回调
         * @param validator 参数校验及处理，返回false结束提交
         * @param ajaxSettings AJAX设置（可选）
         */
        apiForm: function (callback, validator, ajaxSettings) {
            var $this = $(this);
            $this.submit(function () {
                //禁止重复提交
                if ($this.data("submitting")) {
                    return false;
                }

                //取参
                var params = {}, method, url;
                $.each($this.serializeArray(), function (index, param) {
                    var names = param.name.split(".");
                    var node = params;
                    for (var i = 0; i < names.length - 1; i++) {
                        if ($.type(node[names[i]]) === 'undefined') {
                            node[names[i]] = {};
                        }
                        node = node[names[i]];
                    }
                    node[names[names.length - 1]] = param.value;
                });
                method = $this.attr("method").toUpperCase();
                url = $this.attr("action");

                //验证
                if ($.isFunction(validator)) {
                    if (validator(params) === false) return false;
                }

                //请求
                $this.data("submitting", true);
                api.request(url, method, params, callback, $.extend({}, ajaxSettings, {
                    complete: function () {
                        $this.removeData("submitting");
                        if (ajaxSettings && $.isFunction(ajaxSettings.complete)) {
                            return ajaxSettings.complete.apply(this, arguments);
                        }
                    }
                }));
                return false;
            });

            return $this;
        }
    });

    return $.extend(api, {
        /**
         * 请求入口
         */
        apiEndpoint: "http://api.tdtfly.com/api",

        /**
         * Token在localStorage保存位置
         */
        tokenStorageName: "accessToken",

        //返回状态码
        code: {
            SUCCESS: 0,
            UNAUTHORIZED: 1
        },

        /**
         * GET请求
         * @param url 请求地址
         * @param params 请求参数
         * @param callback 成功回调
         * @param ajaxSettings ajax设置（可选）附加参数：<ul>
         *     <li>cache：是否开启缓存，缓存响应时callback第二个参数为"cache"</li>
         *     <li>interruptToast：中断错误警告</li>
         *     <li>interruptUnauthorized：中断未认证跳转</li>
         *     <li>loading：是否显示加载动画</li>
         * <ul>
         */
        get: function (url, params, callback, ajaxSettings) {
            return this.request(url, 'GET', params, callback, ajaxSettings);
        },

        /**
         * POST请求
         * @param url 请求地址
         * @param params 请求参数
         * @param callback 成功回调
         * @param ajaxSettings ajax设置（可选）附加参数：<ul>
         *     <li>cache：是否开启缓存，缓存响应时callback第二个参数为"cache"</li>
         *     <li>interruptToast：中断错误警告</li>
         *     <li>interruptUnauthorized：中断未认证跳转</li>
         *     <li>loading：是否显示加载动画</li>
         * <ul>
         */
        post: function (url, params, callback, ajaxSettings) {
            return this.request(url, 'POST', params, callback, ajaxSettings);
        },

        /**
         * 通用请求
         * @param url 请求地址
         * @param method 请求方法 GET|POST
         * @param params 请求参数
         * @param callback 成功回调
         * @param ajaxSettings ajax设置（可选）附加参数：<ul>
         *     <li>cache：是否开启缓存，缓存响应时callback第二个参数为"cache"</li>
         *     <li>interruptToast：中断错误警告</li>
         *     <li>interruptUnauthorized：中断未认证跳转</li>
         *     <li>loading：是否显示加载动画</li>
         * <ul>
         */
        request: function (url, method, params, callback, ajaxSettings) {
            var requestUrl = this.apiEndpoint + url;

            if (typeof ajaxSettings === 'undefined') ajaxSettings = {};

            var cache = ajaxSettings['cache'], cacheKey;
            if (cache === true || cache === 'cache') {
                cacheKey = local.getApiCacheKey(url, params);
                var cacheData = utils.localStorage(cacheKey);
                if (cacheData) {
                    callback(cacheData, 'cache');
                    console.debug("响应缓存请求", requestUrl, cacheData);
                }
                ajaxSettings['cache'] = false;
                if (cache === 'cache') return;
            } else {
                cache = false;
            }

            if (ajaxSettings['loading']) {
                api.showLoading();
            }

            var settings = {
                type: method.toUpperCase(),
                data: params
            };
            settings = $.extend({}, this.defaultAjaxSettings, settings, ajaxSettings, {
                beforeSend: function (xhr) {
                    var token = api.getToken();
                    if (token) {
                        xhr.setRequestHeader("X-Access-Token", token);
                    }

                    xhr.requestUrl = this.url;
                    console.debug("开始请求", xhr.requestUrl, arguments);

                    if ($.isFunction(ajaxSettings.beforeSend)) {
                        return ajaxSettings.beforeSend.apply(this, arguments);
                    }
                },
                success: function (data, status, xhr) {
                    //当AJAX设置interruptUnauthorized不为true时处理未登录状态
                    if (!ajaxSettings.interruptUnauthorized && data.code === api.code.UNAUTHORIZED) {
                        alert("未登录或登录凭证过期，将会跳转至登录页面");
                        location.href = "login.html";
                        return;
                    }

                    //AJAX设置interruptUnauthorized不为true时且请求不成功显示Toast
                    if (!ajaxSettings.interruptToast && data.code !== api.code.SUCCESS) {
                        //TODO: 替换为Toast提示
                        alert(data.message);
                    }

                    //缓存成功的请求结果
                    if (cache && data.code === api.code.SUCCESS) {
                        utils.localStorage(cacheKey, data);
                    }

                    console.debug("请求成功", xhr.requestUrl, arguments);
                    callback.apply(this, arguments);
                },
                error: function (xhr, status, ex) {
                    console.warn("请求失败", xhr.requestUrl, arguments);

                    if ($.isFunction(ajaxSettings.error)) {
                        return ajaxSettings.error.apply(this, arguments);
                    }
                },
                complete: function (xhr, status) {
                    console.debug("请求结束", xhr.requestUrl, arguments);
                    if (ajaxSettings['loading']) {
                        api.hideLoading();
                    }

                    if ($.isFunction(ajaxSettings.complete)) {
                        return ajaxSettings.complete.apply(this, arguments);
                    }
                }
            });

            return $.ajax(requestUrl, settings);
        },

        /**
         * 保存Token
         * @param accessToken accessToken
         */
        saveToken: function (accessToken) {
            utils.localStorage(this.tokenStorageName, accessToken);
        },

        /**
         * 获取Token
         * @return {string} 保存的Token
         */
        getToken: function () {
            return utils.localStorage(this.tokenStorageName);
        },

        /**
         * 显示加载动画
         */
        showLoading: function () {
            var $loading = $("#loading");
            if ($loading.length > 0) {
                $loading.removeClass("stop");
            } else {
                $loading = $('<div id="loading"><div class="box"><div class="image"></div></div></div>').appendTo(document.body);
            }
        },

        /**
         * 隐藏加载动画
         */
        hideLoading: function () {
            var $loading = $("#loading");
            if ($loading.length > 0) {
                $loading.addClass("stop");
            }
        },

        /**
         * AJAX默认配置
         */
        defaultAjaxSettings: {
            dataType: "json",
            headers: {},
            cache: false
        }
    });
})(jQuery, window['api'] || {});
