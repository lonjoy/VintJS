/**
 * User: Vincent Ting
 * Date: 13-9-7
 * Time: 下午5:42
 */

(function ($) {

    'use strict';

    var root = this,
        /**
         * 检测当前是否有全局变量 VintJS 存在。
         */
            Vt = root['VintJS'] || {} ,

        /**
         * @name VintJS.console
         * @object
         * @description
         * 当浏览器版本较低不支持console的时候防止报错。具体使用同浏览器原生console。
         * api 详情 https://developers.google.com/chrome-developer-tools/docs/console-api。
         */
            console = Vt.console = root.console || (function () {
            var cl = {} , attr_list = ['assert', 'clear', 'constructor', 'count', 'debug', 'dir', 'dirxml',
                'error', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile',
                'profileEnd', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
            for (var i = 0; i < attr_list.length; i++) {
                cl[attr_list[i]] = $.noop;
            }
            return cl;
        })(),

        /**
         * @name VintJS.isType
         * @function
         * @description
         * 判断对象 obj 是否为 type 类型。
         * @return {boolean}
         */
            isType = Vt.isType = function (obj, type) {
            return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === type.toLowerCase();
        },

        /**
         * @name VintJS.has
         * @function
         * @description
         * 判断对象 obj 是否含有属性 attr。
         * @return {boolean}
         */
            has = Vt.has = function (obj, attr) {
            return obj.hasOwnProperty(attr);
        },

        nativeForEach = Array.prototype.forEach,
        forEach = Vt.forEach = function (obj, iterator, context) {
            if (obj == null) return;
            if (nativeForEach && obj.forEach === nativeForEach) {
                obj.forEach(iterator, context);
            } else if (obj.length === +obj.length) {
                for (var i = 0; i < obj.length; i++) {
                    iterator.call(context, obj[i], i, obj);
                }
            } else {
                for (var attr in obj) {
                    if (!obj.hasOwnProperty(attr))continue;
                    iterator.call(context, obj[attr], attr, obj);
                }
            }
        },

        nativeKeys = Object.keys,
        /**
         * @name VintJS.getKeys
         * @description
         * 获取对象所有的属性名称。
         * @example
         * console.log(VintJS.getKeys({'name':'VintJS','author':'Vincent Ting'}));
         * 输出 => ['name','author']
         * @return {array}
         */
            getKeys = Vt.getKeys = nativeKeys || function (obj) {
            if (obj !== Object(obj)) throw new TypeError('Invalid object');
            var keys = [];
            forEach(obj, function (value, key) {
                keys.push(key);
            }, this);
            return keys;
        },

        extend = Vt.extend = function (obj) {
            forEach(Array.prototype.slice.call(arguments, 1), function (source) {
                if (source) {
                    for (var prop in source) {
                        obj[prop] = source[prop];
                    }
                }
            });
            return obj;
        },

        __temp_array = [],
        /**
         * @private
         * @name __getTempArray
         * @description
         * 为节约内存，所有临时的数组都不会单独实例化Array对象，调用该方法生成临时的即用即销毁的Array对象。
         * var args = __getTempArray('VintJS', 'AngularJs');
         * args => ['VintJS', 'AngularJs']
         */
            __getTempArray = function () {
            __temp_array.length = 0;
            forEach(arguments, function (value, i) {
                __temp_array[i] = value;
            }, this);
            return __temp_array;
        },
        hash_spliter;


    var GLOBAL_CONFIG = {
        hash_prefix: '',
        getCurrentUser: function () {
            //NOT support asynchronous request currently!!
            return true;
        },
        template_url: '/static/template/',
        login_url: '/login'
    };


    Vt.setTimeout = function (callback, time, context) {
        context = context || root;
        return setTimeout(function () {
            callback.call(context)
        }, time);
    };


    Vt.setInterval = function (callback, time, context) {
        context = context || root;
        return setInterval(function () {
            callback.call(context)
        }, time);
    };

    Vt.create = function (options) {
        forEach(options, function (value, key) {
            GLOBAL_CONFIG[key] = value;
        });
        hash_spliter = new RegExp('#' + GLOBAL_CONFIG['hash_prefix'] + '(.*)$');
        this.location.listen();
        return this;
    };

    //Call this function in development environment.
    Vt.Debug = function () {
        GLOBAL_CONFIG.debug = true;
    };

    var event_spliter = /\s+/,
        /**
         * @private
         * @name eventAnalyze
         * @function
         * @description
         * 分析事件相关函数传入的参数。
         * @return {boolean}
         */
            eventAnalyze = function (obj, action, name, rest) {
            if (!name) return true;
            if (isType(name, 'object')) {
                forEach(name, function (value, key) {
                    obj[action].apply(obj, __getTempArray(key, value).concat(rest));
                }, this);
                return false;
            }
            if (event_spliter.test(name)) {
                var names = name.split(event_spliter);
                forEach(names, function (name) {
                    obj[action].apply(obj, __getTempArray(name).concat(rest));
                }, this);
                return false;
            }
            return true;
        };


    //事件相关方法
    var Event = {
        /**
         * @name Event.on
         * @function
         * @param name 需绑定的时间名称，支持字符串以及对象、列表。
         * @param callback 回调函数，当name为对象的时候该参数可为空。
         * @param context 回调函数执行时的上下文。
         * @description
         * 绑定事件。
         * @returns {object}
         */
        on: function (name, callback, context) {
            if (!eventAnalyze(this, 'on', name, [callback, context]) || !callback) return this;
            this.__events || (this.__events = {});
            var events = this.__events[name] || (this.__events[name] = []);
            events.push({callback: callback, context: context, ctx: context || this});
            return this;
        },

        /**
         * @name Event.off
         * @function
         * @param name 需绑定的时间名称，支持字符串以及对象、列表、以及正则，可选。
         * @param callback 回调函数，可选。
         * @param context 回调函数执行时的上下文，可选。
         * @description
         * 取消绑定事件。只有在回调函数和上下文同时满足的时候，才能够取消绑定。
         * 如果参数为空则删除所有绑定。如果只有name则删除该name下所有绑定事件。
         * @returns {object}
         */
        off: function (name, callback, context) {
            if (!this.__events || !eventAnalyze(this, 'off', name, [callback, context])) return this;
            if (arguments.length === 0) {
                this.__events = {};
                return this;
            }
            var names, events , retain;
            if (isType(name, 'RegExp')) {
                names = [];
                forEach(getKeys(this.__events), function (ev_name) {
                    if (name.test(ev_name)) {
                        names.push(name);
                    }
                });
            } else {
                names = name ? [name] : getKeys(this.__events)
            }
            forEach(names, function (name) {
                if (events = this.__events[name]) {
                    this.__events[name] = retain = __getTempArray();
                    if (callback || context) {
                        forEach(events, function (event) {
                            if ((callback && callback !== event.callback) || (context && context !== event.context)) {
                                retain.push(event);
                            }
                        });
                    }
                    if (!retain.length) delete this.__events[name];
                }
            }, this);
            return this;
        },

        /**
         * @name Event.trigger
         * @function
         * @param name 触发的名称。
         * @description
         * 事件触发方法。name为必须值，后面可以追加参数，所追加的参数最终最为参数在回调函数中使用。
         * @example
         * var vt = new VintJS;
         * vt.on('sleep',function(){console.log(arguments)});
         * vt.trigger('sleep','arg1','arg2')
         * 输出 => ['sleep','arg1','arg2']
         * @returns {object}
         */
        trigger: function (name) {
            if (!this.__events) return this;
            var args = Array.prototype.slice.call(arguments, 1);
            if (!eventAnalyze(this, 'trigger', name, args)) return this;
            var events = this.__events[name];
            forEach(events, function (ev) {
                ev.callback.apply(ev.ctx, args);
            }, this);
            return this;
        }
    };

    extend(Vt, Event);

    //URL相关处理内容
    var path_spliter = /^([^\?#]*)?(\?([^#]*))?$/,
        location = root.location,
        current_location = {
            root: location.href.indexOf('#') === -1 ? location.href : location.href.substr(0, location.href.indexOf('#')),
            path: '',
            search: {}
        }, pre_url , docMode = document.documentMode,
        tryDecodeURIComponent = function (value) {
            try {
                return decodeURIComponent(value);
            } catch (e) {
                return value;
            }
        },
        getHash = function () {
            var match = location.href.match(hash_spliter);
            return match ? match[1] : '';
        },
        oldIE = /msie [\w.]+/.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7),
        encodeUriQuery = function (val, pctEncodeSpaces) {
            return encodeURIComponent(val).
                replace(/%40/gi, '@').
                replace(/%3A/gi, ':').
                replace(/%24/g, '$').
                replace(/%2C/gi, ',').
                replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
        };
    /**
     * @description
     * 输出负责处理url相关的函数集，目前只支持锚链接格式，暂不支持pushState方法。
     */
    Vt.location = {
        /**
         *
         * @param url
         * @param replace
         * @returns {*}
         */
        url: function (url, replace) {
            if (!arguments.length)return location.href;
            if (url === pre_url)return this;
            if (replace) {
                location.replace(url);
                return this;
            }
            location.href = url;
            return this;
        },
        /**
         * @private
         * @name __getResultUrl
         * @function
         * @returns {string}
         * @description
         * 根据current_location的内容返回当前的地址。
         */
        __getResultUrl: function () {
            var url_search_list = __getTempArray();
            forEach(current_location.search, function (value, key) {
                url_search_list.push(encodeUriQuery(key, true) + (value === true ? '' : '=' + encodeUriQuery(value, true)));
            }, this);
            return current_location.root + '#' + GLOBAL_CONFIG['hash_prefix'] + current_location.path + (url_search_list.length ? ('?' + url_search_list.join('&')) : '');
        },
        path: function (path) {
            if (path) {
                current_location.path = path.charAt(0) == '/' ? path : '/' + path;
                this.url(this.__getResultUrl());
                return this;
            }
            return current_location.path;
        },
        replace: function (path) {
            if (!path)return this;
            current_location.path = path.charAt(0) == '/' ? path : '/' + path;
            this.url(this.__getResultUrl(), true);
            return this;
        },
        __checkUrl: function () {
            var now_url = location.href;
            if (now_url === pre_url)return this;
            pre_url = now_url;
            var hash = getHash();
            if (!hash) {
                this.replace('/');
                return this;
            }
            var match = path_spliter.exec(hash);
            if (match[1] && current_location.path !== tryDecodeURIComponent(match[1])) {
                current_location.path = tryDecodeURIComponent(match[1]);
                this.trigger('urlChange.path');
            }
            if (match[3]) {
                var key_value , key;
                forEach(match[3].split('&'), function (keyValue) {
                    if (keyValue) {
                        key_value = keyValue.split('=');
                        if (key = tryDecodeURIComponent(key_value[0])) {
                            current_location.search[key] = key_value[1] ? tryDecodeURIComponent(key_value[1]) : true;
                        }
                    }
                })
            }
            this.trigger('urlChange');
            return this;
        },
        search: function (key, value) {
            if (arguments.length === 1) {
                if (isType(key, 'string')) {
                    return current_location.search[key];
                }
                if (isType(key, 'object')) {
                    current_location.search = key;
                }
            }
            if (arguments.length === 2) {
                if (value === null) {
                    delete current_location.search[key];
                } else {
                    current_location.search[key] = value;
                }
            }
            this.url(this.__getResultUrl());
            return this;
        },
        listen: function () {
            var parent = this;
            Vt.setTimeout(this.__checkUrl, 0, this);
            if (!oldIE && 'onhashchange' in window) {
                $(window).on('hashchange', function () {
                    parent.__checkUrl();
                });
            } else {
                Vt.setInterval(this.__checkUrl, 50, this);
            }
            return this;
        }
    };

    extend(Vt.location, Event);

    var TEMPLATE_CACHE = {};

    Vt.route = {

        __routers: [],

        __route_init: false,

        __otherwise: null,

        __pre_treat_role: function () {
            var old_routers = __getTempArray.apply(this, this.__routers);
            this.__routers.length = 0;
            forEach(old_routers, function (old_router) {
                if (!isType(old_router.role, 'regExp')) {
                    old_router.role = new RegExp('^' + old_router.role.replace(/:number/g, '(\\d+)')
                        .replace(/:string/g, '(\\w+)').replace(/:all/g, '(.+)') + '$')
                }
                this.__routers.push(old_router);
            }, this);
        },

        __use: function (router_object, params) {
            if (isType(router_object, 'function')) {
                router_object.apply(this, params);
                return this;
            }
            if (!isType(router_object, 'object'))return this;
            if (router_object['login_required'] && !!GLOBAL_CONFIG.getCurrentUser()) {
                if (Vt.location.path() != '/')Vt.location.search('redirect', Vt.location.path());
                this.redirectTo(GLOBAL_CONFIG.login_url);
                return this;
            }
            if (router_object['redirect_to']) {
                this.redirectTo(router_object['redirect_to']);
                return this;
            }
            this.render(router_object['template'], router_object['controller'], params);
            return this;
        },

        render: function (template, controller, params) {
            console.log(params);
            //TODO It's time to render html.
            return this;
        },

        redirectTo: function (url, replace) {
            if (replace) {
                Vt.location.replace(url);
            } else {
                Vt.location.path(url);
            }
            return this;
        },

        when: function (role, router_object) {
            this.__routers.push({role: role, router_object: router_object})
            return this;
        },

        otherwise: function (router_object) {
            this.__otherwise = router_object;
            return this;
        },

        response: function () {
            if (!this.__route_init) {
                this.__pre_treat_role();
                this.__route_init = true;
            }
            var path = Vt.location.path();
            for (var i = 0; i < this.__routers.length; i++) {
                var router = this.__routers[i],
                    params = router.role.exec(path);
                if (params !== null) {
                    params.shift();
                    this.__use(router.router_object, params);
                    return this;
                }
            }
            if (this.__otherwise)this.__use(this.__otherwise);

            return this;
        }

    };

    Vt.location.on('urlChange.path', Vt.route.response, Vt.route);

    window['VintJS'] = Vt;

}).call(window, jQuery);