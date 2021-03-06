(function compatibilityWrapper() {
    "use strict";
    if (typeof PDFJS === "undefined") {
        (typeof window !== "undefined" ? window : this).PDFJS = {}
    }(function checkTypedArrayCompatibility() {
        if (typeof Uint8Array !== "undefined") {
            if (typeof Uint8Array.prototype.subarray === "undefined") {
                Uint8Array.prototype.subarray = function subarray(start, end) {
                    return new Uint8Array(this.slice(start, end))
                };
                Float32Array.prototype.subarray = function subarray(start, end) {
                    return new Float32Array(this.slice(start, end))
                }
            }
            if (typeof Float64Array === "undefined") {
                window.Float64Array = Float32Array
            }
            return
        }

        function subarray(start, end) {
            return new TypedArray(this.slice(start, end))
        }

        function setArrayOffset(array, offset) {
            if (arguments.length < 2) {
                offset = 0
            }
            for (var i = 0, n = array.length; i < n; ++i, ++offset) {
                this[offset] = array[i] & 255
            }
        }

        function TypedArray(arg1) {
            var result, i, n;
            if (typeof arg1 === "number") {
                result = [];
                for (i = 0; i < arg1; ++i) {
                    result[i] = 0
                }
            } else if ("slice" in arg1) {
                result = arg1.slice(0)
            } else {
                result = [];
                for (i = 0, n = arg1.length; i < n; ++i) {
                    result[i] = arg1[i]
                }
            }
            result.subarray = subarray;
            result.buffer = result;
            result.byteLength = result.length;
            result.set = setArrayOffset;
            if (typeof arg1 === "object" && arg1.buffer) {
                result.buffer = arg1.buffer
            }
            return result
        }
        window.Uint8Array = TypedArray;
        window.Int8Array = TypedArray;
        window.Uint32Array = TypedArray;
        window.Int32Array = TypedArray;
        window.Uint16Array = TypedArray;
        window.Float32Array = TypedArray;
        window.Float64Array = TypedArray
    })();
    (function normalizeURLObject() {
        if (!window.URL) {
            window.URL = window.webkitURL
        }
    })();
    (function checkObjectDefinePropertyCompatibility() {
        if (typeof Object.defineProperty !== "undefined") {
            var definePropertyPossible = true;
            try {
                Object.defineProperty(new Image, "id", {
                    value: "test"
                });
                var Test = function Test() {};
                Test.prototype = {
                    get id() {}
                };
                Object.defineProperty(new Test, "id", {
                    value: "",
                    configurable: true,
                    enumerable: true,
                    writable: false
                })
            } catch (e) {
                definePropertyPossible = false
            }
            if (definePropertyPossible) {
                return
            }
        }
        Object.defineProperty = function objectDefineProperty(obj, name, def) {
            delete obj[name];
            if ("get" in def) {
                obj.__defineGetter__(name, def["get"])
            }
            if ("set" in def) {
                obj.__defineSetter__(name, def["set"])
            }
            if ("value" in def) {
                obj.__defineSetter__(name, function objectDefinePropertySetter(value) {
                    this.__defineGetter__(name, function objectDefinePropertyGetter() {
                        return value
                    });
                    return value
                });
                obj[name] = def.value
            }
        }
    })();
    (function checkXMLHttpRequestResponseCompatibility() {
        var xhrPrototype = XMLHttpRequest.prototype;
        var xhr = new XMLHttpRequest;
        if (!("overrideMimeType" in xhr)) {
            Object.defineProperty(xhrPrototype, "overrideMimeType", {
                value: function xmlHttpRequestOverrideMimeType(mimeType) {}
            })
        }
        if ("responseType" in xhr) {
            return
        }
        PDFJS.disableWorker = true;
        Object.defineProperty(xhrPrototype, "responseType", {
            get: function xmlHttpRequestGetResponseType() {
                return this._responseType || "text"
            },
            set: function xmlHttpRequestSetResponseType(value) {
                if (value === "text" || value === "arraybuffer") {
                    this._responseType = value;
                    if (value === "arraybuffer" && typeof this.overrideMimeType === "function") {
                        this.overrideMimeType("text/plain; charset=x-user-defined")
                    }
                }
            }
        });
        if (typeof VBArray !== "undefined") {
            Object.defineProperty(xhrPrototype, "response", {
                get: function xmlHttpRequestResponseGet() {
                    if (this.responseType === "arraybuffer") {
                        return new Uint8Array(new VBArray(this.responseBody).toArray())
                    } else {
                        return this.responseText
                    }
                }
            });
            return
        }
        Object.defineProperty(xhrPrototype, "response", {
            get: function xmlHttpRequestResponseGet() {
                if (this.responseType !== "arraybuffer") {
                    return this.responseText
                }
                var text = this.responseText;
                var i, n = text.length;
                var result = new Uint8Array(n);
                for (i = 0; i < n; ++i) {
                    result[i] = text.charCodeAt(i) & 255
                }
                return result.buffer
            }
        })
    })();
    (function checkWindowBtoaCompatibility() {
        if ("btoa" in window) {
            return
        }
        var digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        window.btoa = function windowBtoa(chars) {
            var buffer = "";
            var i, n;
            for (i = 0, n = chars.length; i < n; i += 3) {
                var b1 = chars.charCodeAt(i) & 255;
                var b2 = chars.charCodeAt(i + 1) & 255;
                var b3 = chars.charCodeAt(i + 2) & 255;
                var d1 = b1 >> 2,
                    d2 = (b1 & 3) << 4 | b2 >> 4;
                var d3 = i + 1 < n ? (b2 & 15) << 2 | b3 >> 6 : 64;
                var d4 = i + 2 < n ? b3 & 63 : 64;
                buffer += digits.charAt(d1) + digits.charAt(d2) + digits.charAt(d3) + digits.charAt(d4)
            }
            return buffer
        }
    })();
    (function checkWindowAtobCompatibility() {
        if ("atob" in window) {
            return
        }
        var digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        window.atob = function(input) {
            input = input.replace(/=+$/, "");
            if (input.length % 4 === 1) {
                throw new Error("bad atob input")
            }
            for (var bc = 0, bs, buffer, idx = 0, output = ""; buffer = input.charAt(idx++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
                buffer = digits.indexOf(buffer)
            }
            return output
        }
    })();
    (function checkFunctionPrototypeBindCompatibility() {
        if (typeof Function.prototype.bind !== "undefined") {
            return
        }
        Function.prototype.bind = function functionPrototypeBind(obj) {
            var fn = this,
                headArgs = Array.prototype.slice.call(arguments, 1);
            var bound = function functionPrototypeBindBound() {
                var args = headArgs.concat(Array.prototype.slice.call(arguments));
                return fn.apply(obj, args)
            };
            return bound
        }
    })();
    (function checkDatasetProperty() {
        var div = document.createElement("div");
        if ("dataset" in div) {
            return
        }
        Object.defineProperty(HTMLElement.prototype, "dataset", {
            get: function() {
                if (this._dataset) {
                    return this._dataset
                }
                var dataset = {};
                for (var j = 0, jj = this.attributes.length; j < jj; j++) {
                    var attribute = this.attributes[j];
                    if (attribute.name.substring(0, 5) !== "data-") {
                        continue
                    }
                    var key = attribute.name.substring(5).replace(/\-([a-z])/g, function(all, ch) {
                        return ch.toUpperCase()
                    });
                    dataset[key] = attribute.value
                }
                Object.defineProperty(this, "_dataset", {
                    value: dataset,
                    writable: false,
                    enumerable: false
                });
                return dataset
            },
            enumerable: true
        })
    })();
    (function checkClassListProperty() {
        var div = document.createElement("div");
        if ("classList" in div) {
            return
        }

        function changeList(element, itemName, add, remove) {
            var s = element.className || "";
            var list = s.split(/\s+/g);
            if (list[0] === "") {
                list.shift()
            }
            var index = list.indexOf(itemName);
            if (index < 0 && add) {
                list.push(itemName)
            }
            if (index >= 0 && remove) {
                list.splice(index, 1)
            }
            element.className = list.join(" ");
            return index >= 0
        }
        var classListPrototype = {
            add: function(name) {
                changeList(this.element, name, true, false)
            },
            contains: function(name) {
                return changeList(this.element, name, false, false)
            },
            remove: function(name) {
                changeList(this.element, name, false, true)
            },
            toggle: function(name) {
                changeList(this.element, name, true, true)
            }
        };
        Object.defineProperty(HTMLElement.prototype, "classList", {
            get: function() {
                if (this._classList) {
                    return this._classList
                }
                var classList = Object.create(classListPrototype, {
                    element: {
                        value: this,
                        writable: false,
                        enumerable: true
                    }
                });
                Object.defineProperty(this, "_classList", {
                    value: classList,
                    writable: false,
                    enumerable: false
                });
                return classList
            },
            enumerable: true
        })
    })();
    (function checkConsoleCompatibility() {
        if (!("console" in window)) {
            window.console = {
                log: function() {},
                error: function() {},
                warn: function() {}
            }
        } else if (!("bind" in console.log)) {
            console.log = function(fn) {
                return function(msg) {
                    return fn(msg)
                }
            }(console.log);
            console.error = function(fn) {
                return function(msg) {
                    return fn(msg)
                }
            }(console.error);
            console.warn = function(fn) {
                return function(msg) {
                    return fn(msg)
                }
            }(console.warn)
        }
    })();
    (function checkOnClickCompatibility() {
        function ignoreIfTargetDisabled(event) {
            if (isDisabled(event.target)) {
                event.stopPropagation()
            }
        }

        function isDisabled(node) {
            return node.disabled || node.parentNode && isDisabled(node.parentNode)
        }
        if (navigator.userAgent.indexOf("Opera") !== -1) {
            document.addEventListener("click", ignoreIfTargetDisabled, true)
        }
    })();
    (function checkOnBlobSupport() {
        if (navigator.userAgent.indexOf("Trident") >= 0) {
            PDFJS.disableCreateObjectURL = true
        }
    })();
    (function checkNavigatorLanguage() {
        if ("language" in navigator) {
            return
        }
        PDFJS.locale = navigator.userLanguage || "en-US"
    })();
    (function checkRangeRequests() {
        var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor") > 0;
        var regex = /Android\s[0-2][^\d]/;
        var isOldAndroid = regex.test(navigator.userAgent);
        var isChromeWithRangeBug = /Chrome\/(39|40)\./.test(navigator.userAgent);
        if (isSafari || isOldAndroid || isChromeWithRangeBug) {
            PDFJS.disableRange = true;
            PDFJS.disableStream = true
        }
    })();
    (function checkHistoryManipulation() {
        if (!history.pushState || navigator.userAgent.indexOf("Android 2.") >= 0) {
            PDFJS.disableHistory = true
        }
    })();
    (function checkSetPresenceInImageData() {
        if (window.CanvasPixelArray) {
            if (typeof window.CanvasPixelArray.prototype.set !== "function") {
                window.CanvasPixelArray.prototype.set = function(arr) {
                    for (var i = 0, ii = this.length; i < ii; i++) {
                        this[i] = arr[i]
                    }
                }
            }
        } else {
            var polyfill = false,
                versionMatch;
            if (navigator.userAgent.indexOf("Chrom") >= 0) {
                versionMatch = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
                polyfill = versionMatch && parseInt(versionMatch[2]) < 21
            } else if (navigator.userAgent.indexOf("Android") >= 0) {
                polyfill = /Android\s[0-4][^\d]/g.test(navigator.userAgent)
            } else if (navigator.userAgent.indexOf("Safari") >= 0) {
                versionMatch = navigator.userAgent.match(/Version\/([0-9]+)\.([0-9]+)\.([0-9]+) Safari\//);
                polyfill = versionMatch && parseInt(versionMatch[1]) < 6
            }
            if (polyfill) {
                var contextPrototype = window.CanvasRenderingContext2D.prototype;
                var createImageData = contextPrototype.createImageData;
                contextPrototype.createImageData = function(w, h) {
                    var imageData = createImageData.call(this, w, h);
                    imageData.data.set = function(arr) {
                        for (var i = 0, ii = this.length; i < ii; i++) {
                            this[i] = arr[i]
                        }
                    };
                    return imageData
                };
                contextPrototype = null
            }
        }
    })();
    (function checkRequestAnimationFrame() {
        function fakeRequestAnimationFrame(callback) {
            window.setTimeout(callback, 20)
        }
        var isIOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
        if (isIOS) {
            window.requestAnimationFrame = fakeRequestAnimationFrame;
            return
        }
        if ("requestAnimationFrame" in window) {
            return
        }
        window.requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || fakeRequestAnimationFrame
    })();
    (function checkCanvasSizeLimitation() {
        var isIOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
        var isAndroid = /Android/g.test(navigator.userAgent);
        if (isIOS || isAndroid) {
            PDFJS.maxCanvasPixels = 5242880
        }
    })();
    (function checkFullscreenSupport() {
        var isEmbeddedIE = navigator.userAgent.indexOf("Trident") >= 0 && window.parent !== window;
        if (isEmbeddedIE) {
            PDFJS.disableFullscreen = true
        }
    })();
    (function checkCurrentScript() {
        if ("currentScript" in document) {
            return
        }
        Object.defineProperty(document, "currentScript", {
            get: function() {
                var scripts = document.getElementsByTagName("script");
                return scripts[scripts.length - 1]
            },
            enumerable: true,
            configurable: true
        })
    })()
}).call(typeof window === "undefined" ? this : window);

! function(t, e) {
    "use strict";
    "function" == typeof define && define.amd ? define("pdfjs-dist/build/pdf", ["exports"], e) : e("undefined" != typeof exports ? exports : t.pdfjsDistBuildPdf = {})
}(this, function(t) {
    "use strict";
    var e = "undefined" != typeof document && document.currentScript ? document.currentScript.src : null,
        n = {};
    (function() {
        ! function(t, e) {
            e(t.pdfjsSharedUtil = {})
        }(this, function(t) {
            function e(t) {
                K = t
            }

            function n() {
                return K
            }

            function i(t) {
                K >= J.infos && console.log("Info: " + t)
            }

            function r(t) {
                K >= J.warnings && console.log("Warning: " + t)
            }

            function a(t) {
                console.log("Deprecated API usage: " + t)
            }

            function s(t) {
                throw K >= J.errors && (console.log("Error: " + t), console.log(o())), new Error(t)
            }

            function o() {
                try {
                    throw new Error
                } catch (t) {
                    return t.stack ? t.stack.split("\n").slice(2).join("\n") : ""
                }
            }

            function c(t, e) {
                t || s(e)
            }

            function l(t, e) {
                try {
                    var n = new URL(t);
                    if (!n.origin || "null" === n.origin) return !1
                } catch (t) {
                    return !1
                }
                var i = new URL(e, n);
                return n.origin === i.origin
            }

            function h(t, e) {
                if (!t || "string" != typeof t) return !1;
                var n = /^[a-z][a-z0-9+\-.]*(?=:)/i.exec(t);
                if (!n) return e;
                switch (n = n[0].toLowerCase()) {
                    case "http":
                    case "https":
                    case "ftp":
                    case "mailto":
                    case "tel":
                        return !0;
                    default:
                        return !1
                }
            }

            function u(t, e, n) {
                return Object.defineProperty(t, e, {
                    value: n,
                    enumerable: !0,
                    configurable: !0,
                    writable: !1
                }), n
            }

            function d(t) {
                var e;
                return function() {
                    return t && (e = Object.create(null), t(e), t = null), e
                }
            }

            function p(t) {
                return "string" != typeof t ? (r("The argument for removeNullCharacters must be a string."), t) : t.replace(/\x00/g, "")
            }

            function f(t) {
                c(null !== t && "object" == typeof t && void 0 !== t.length, "Invalid argument for bytesToString");
                var e = t.length;
                if (e < 8192) return String.fromCharCode.apply(null, t);
                for (var n = [], i = 0; i < e; i += 8192) {
                    var r = Math.min(i + 8192, e),
                        a = t.subarray(i, r);
                    n.push(String.fromCharCode.apply(null, a))
                }
                return n.join("")
            }

            function g(t) {
                c("string" == typeof t, "Invalid argument for stringToBytes");
                for (var e = t.length, n = new Uint8Array(e), i = 0; i < e; ++i) n[i] = 255 & t.charCodeAt(i);
                return n
            }

            function m(t) {
                return void 0 !== t.length ? t.length : (c(void 0 !== t.byteLength), t.byteLength)
            }

            function A(t) {
                if (1 === t.length && t[0] instanceof Uint8Array) return t[0];
                var e, n, i, r = 0,
                    a = t.length;
                for (e = 0; e < a; e++) n = t[e], i = m(n), r += i;
                var s = 0,
                    o = new Uint8Array(r);
                for (e = 0; e < a; e++) n = t[e], n instanceof Uint8Array || (n = "string" == typeof n ? g(n) : new Uint8Array(n)), i = n.byteLength, o.set(n, s), s += i;
                return o
            }

            function v(t) {
                return String.fromCharCode(t >> 24 & 255, t >> 16 & 255, t >> 8 & 255, 255 & t)
            }

            function b(t) {
                for (var e = 1, n = 0; t > e;) e <<= 1, n++;
                return n
            }

            function y(t, e) {
                return t[e] << 24 >> 24
            }

            function x(t, e) {
                return t[e] << 8 | t[e + 1]
            }

            function S(t, e) {
                return (t[e] << 24 | t[e + 1] << 16 | t[e + 2] << 8 | t[e + 3]) >>> 0
            }

            function k() {
                var t = new Uint8Array(2);
                return t[0] = 1, 1 === new Uint16Array(t.buffer)[0]
            }

            function C() {
                try {
                    return new Function(""), !0
                } catch (t) {
                    return !1
                }
            }

            function _(t) {
                var e, n = t.length,
                    i = [];
                if ("??" === t[0] && "??" === t[1])
                    for (e = 2; e < n; e += 2) i.push(String.fromCharCode(t.charCodeAt(e) << 8 | t.charCodeAt(e + 1)));
                else
                    for (e = 0; e < n; ++e) {
                        var r = dt[t.charCodeAt(e)];
                        i.push(r ? String.fromCharCode(r) : t.charAt(e))
                    }
                return i.join("")
            }

            function w(t) {
                return decodeURIComponent(escape(t))
            }

            function T(t) {
                return unescape(encodeURIComponent(t))
            }

            function L(t) {
                for (var e in t) return !1;
                return !0
            }

            function P(t) {
                return "boolean" == typeof t
            }

            function E(t) {
                return "number" == typeof t && (0 | t) === t
            }

            function R(t) {
                return "number" == typeof t
            }

            function I(t) {
                return "string" == typeof t
            }

            function D(t) {
                return t instanceof Array
            }

            function j(t) {
                return "object" == typeof t && null !== t && void 0 !== t.byteLength
            }

            function O(t) {
                return 32 === t || 9 === t || 13 === t || 10 === t
            }

            function M() {
                var t = {};
                return t.promise = new Promise(function(e, n) {
                    t.resolve = e, t.reject = n
                }), t
            }

            function F(t, e, n) {
                this.sourceName = t, this.targetName = e, this.comObj = n, this.callbackIndex = 1, this.postMessageTransfers = !0;
                var i = this.callbacksCapabilities = Object.create(null),
                    r = this.actionHandler = Object.create(null);
                this._onComObjOnMessage = function(t) {
                    var e = t.data;
                    if (e.targetName === this.sourceName)
                        if (e.isReply) {
                            var a = e.callbackId;
                            if (e.callbackId in i) {
                                var o = i[a];
                                delete i[a], "error" in e ? o.reject(e.error) : o.resolve(e.data)
                            } else s("Cannot resolve callback " + a)
                        } else if (e.action in r) {
                        var c = r[e.action];
                        if (e.callbackId) {
                            var l = this.sourceName,
                                h = e.sourceName;
                            Promise.resolve().then(function() {
                                return c[0].call(c[1], e.data)
                            }).then(function(t) {
                                n.postMessage({
                                    sourceName: l,
                                    targetName: h,
                                    isReply: !0,
                                    callbackId: e.callbackId,
                                    data: t
                                })
                            }, function(t) {
                                t instanceof Error && (t += ""), n.postMessage({
                                    sourceName: l,
                                    targetName: h,
                                    isReply: !0,
                                    callbackId: e.callbackId,
                                    error: t
                                })
                            })
                        } else c[0].call(c[1], e.data)
                    } else s("Unknown action from worker: " + e.action)
                }.bind(this), n.addEventListener("message", this._onComObjOnMessage)
            }

            function N(t, e, n) {
                var i = new Image;
                i.onload = function() {
                    n.resolve(t, i)
                }, i.onerror = function() {
                    n.resolve(t, null), r("Error during JPEG image loading")
                }, i.src = e
            }
            var U = "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this,
                B = [.001, 0, 0, .001, 0, 0],
                W = {
                    FILL: 0,
                    STROKE: 1,
                    FILL_STROKE: 2,
                    INVISIBLE: 3,
                    FILL_ADD_TO_PATH: 4,
                    STROKE_ADD_TO_PATH: 5,
                    FILL_STROKE_ADD_TO_PATH: 6,
                    ADD_TO_PATH: 7,
                    FILL_STROKE_MASK: 3,
                    ADD_TO_PATH_FLAG: 4
                },
                G = {
                    GRAYSCALE_1BPP: 1,
                    RGB_24BPP: 2,
                    RGBA_32BPP: 3
                },
                X = {
                    TEXT: 1,
                    LINK: 2,
                    FREETEXT: 3,
                    LINE: 4,
                    SQUARE: 5,
                    CIRCLE: 6,
                    POLYGON: 7,
                    POLYLINE: 8,
                    HIGHLIGHT: 9,
                    UNDERLINE: 10,
                    SQUIGGLY: 11,
                    STRIKEOUT: 12,
                    STAMP: 13,
                    CARET: 14,
                    INK: 15,
                    POPUP: 16,
                    FILEATTACHMENT: 17,
                    SOUND: 18,
                    MOVIE: 19,
                    WIDGET: 20,
                    SCREEN: 21,
                    PRINTERMARK: 22,
                    TRAPNET: 23,
                    WATERMARK: 24,
                    THREED: 25,
                    REDACT: 26
                },
                z = {
                    INVISIBLE: 1,
                    HIDDEN: 2,
                    PRINT: 4,
                    NOZOOM: 8,
                    NOROTATE: 16,
                    NOVIEW: 32,
                    READONLY: 64,
                    LOCKED: 128,
                    TOGGLENOVIEW: 256,
                    LOCKEDCONTENTS: 512
                },
                H = {
                    READONLY: 1,
                    REQUIRED: 2,
                    NOEXPORT: 4,
                    MULTILINE: 4096,
                    PASSWORD: 8192,
                    NOTOGGLETOOFF: 16384,
                    RADIO: 32768,
                    PUSHBUTTON: 65536,
                    COMBO: 131072,
                    EDIT: 262144,
                    SORT: 524288,
                    FILESELECT: 1048576,
                    MULTISELECT: 2097152,
                    DONOTSPELLCHECK: 4194304,
                    DONOTSCROLL: 8388608,
                    COMB: 16777216,
                    RICHTEXT: 33554432,
                    RADIOSINUNISON: 33554432,
                    COMMITONSELCHANGE: 67108864
                },
                Y = {
                    SOLID: 1,
                    DASHED: 2,
                    BEVELED: 3,
                    INSET: 4,
                    UNDERLINE: 5
                },
                q = {
                    UNKNOWN: 0,
                    FLATE: 1,
                    LZW: 2,
                    DCT: 3,
                    JPX: 4,
                    JBIG: 5,
                    A85: 6,
                    AHX: 7,
                    CCF: 8,
                    RL: 9
                },
                V = {
                    UNKNOWN: 0,
                    TYPE1: 1,
                    TYPE1C: 2,
                    CIDFONTTYPE0: 3,
                    CIDFONTTYPE0C: 4,
                    TRUETYPE: 5,
                    CIDFONTTYPE2: 6,
                    TYPE3: 7,
                    OPENTYPE: 8,
                    TYPE0: 9,
                    MMTYPE1: 10
                },
                J = {
                    errors: 0,
                    warnings: 1,
                    infos: 5
                },
                Q = {
                    dependency: 1,
                    setLineWidth: 2,
                    setLineCap: 3,
                    setLineJoin: 4,
                    setMiterLimit: 5,
                    setDash: 6,
                    setRenderingIntent: 7,
                    setFlatness: 8,
                    setGState: 9,
                    save: 10,
                    restore: 11,
                    transform: 12,
                    moveTo: 13,
                    lineTo: 14,
                    curveTo: 15,
                    curveTo2: 16,
                    curveTo3: 17,
                    closePath: 18,
                    rectangle: 19,
                    stroke: 20,
                    closeStroke: 21,
                    fill: 22,
                    eoFill: 23,
                    fillStroke: 24,
                    eoFillStroke: 25,
                    closeFillStroke: 26,
                    closeEOFillStroke: 27,
                    endPath: 28,
                    clip: 29,
                    eoClip: 30,
                    beginText: 31,
                    endText: 32,
                    setCharSpacing: 33,
                    setWordSpacing: 34,
                    setHScale: 35,
                    setLeading: 36,
                    setFont: 37,
                    setTextRenderingMode: 38,
                    setTextRise: 39,
                    moveText: 40,
                    setLeadingMoveText: 41,
                    setTextMatrix: 42,
                    nextLine: 43,
                    showText: 44,
                    showSpacedText: 45,
                    nextLineShowText: 46,
                    nextLineSetSpacingShowText: 47,
                    setCharWidth: 48,
                    setCharWidthAndBounds: 49,
                    setStrokeColorSpace: 50,
                    setFillColorSpace: 51,
                    setStrokeColor: 52,
                    setStrokeColorN: 53,
                    setFillColor: 54,
                    setFillColorN: 55,
                    setStrokeGray: 56,
                    setFillGray: 57,
                    setStrokeRGBColor: 58,
                    setFillRGBColor: 59,
                    setStrokeCMYKColor: 60,
                    setFillCMYKColor: 61,
                    shadingFill: 62,
                    beginInlineImage: 63,
                    beginImageData: 64,
                    endInlineImage: 65,
                    paintXObject: 66,
                    markPoint: 67,
                    markPointProps: 68,
                    beginMarkedContent: 69,
                    beginMarkedContentProps: 70,
                    endMarkedContent: 71,
                    beginCompat: 72,
                    endCompat: 73,
                    paintFormXObjectBegin: 74,
                    paintFormXObjectEnd: 75,
                    beginGroup: 76,
                    endGroup: 77,
                    beginAnnotations: 78,
                    endAnnotations: 79,
                    beginAnnotation: 80,
                    endAnnotation: 81,
                    paintJpegXObject: 82,
                    paintImageMaskXObject: 83,
                    paintImageMaskXObjectGroup: 84,
                    paintImageXObject: 85,
                    paintInlineImageXObject: 86,
                    paintInlineImageXObjectGroup: 87,
                    paintImageXObjectRepeat: 88,
                    paintImageMaskXObjectRepeat: 89,
                    paintSolidColorImageMask: 90,
                    constructPath: 91
                },
                K = J.warnings,
                Z = {
                    unknown: "unknown",
                    forms: "forms",
                    javaScript: "javaScript",
                    smask: "smask",
                    shadingPattern: "shadingPattern",
                    font: "font"
                },
                $ = {
                    NEED_PASSWORD: 1,
                    INCORRECT_PASSWORD: 2
                },
                tt = function() {
                    function t(t, e) {
                        this.name = "PasswordException", this.message = t, this.code = e
                    }
                    return t.prototype = new Error, t.constructor = t, t
                }(),
                et = function() {
                    function t(t, e) {
                        this.name = "UnknownErrorException", this.message = t, this.details = e
                    }
                    return t.prototype = new Error, t.constructor = t, t
                }(),
                nt = function() {
                    function t(t) {
                        this.name = "InvalidPDFException", this.message = t
                    }
                    return t.prototype = new Error, t.constructor = t, t
                }(),
                it = function() {
                    function t(t) {
                        this.name = "MissingPDFException", this.message = t
                    }
                    return t.prototype = new Error, t.constructor = t, t
                }(),
                rt = function() {
                    function t(t, e) {
                        this.name = "UnexpectedResponseException", this.message = t, this.status = e
                    }
                    return t.prototype = new Error, t.constructor = t, t
                }(),
                at = function() {
                    function t(t) {
                        this.message = t
                    }
                    return t.prototype = new Error, t.prototype.name = "NotImplementedException", t.constructor = t, t
                }(),
                st = function() {
                    function t(t, e) {
                        this.begin = t, this.end = e, this.message = "Missing data [" + t + ", " + e + ")"
                    }
                    return t.prototype = new Error, t.prototype.name = "MissingDataException", t.constructor = t, t
                }(),
                ot = function() {
                    function t(t) {
                        this.message = t
                    }
                    return t.prototype = new Error, t.prototype.name = "XRefParseException", t.constructor = t, t
                }(),
                ct = function() {
                    function t(t, e) {
                        this.buffer = t, this.byteLength = t.length, this.length = void 0 === e ? this.byteLength >> 2 : e, n(this.length)
                    }

                    function e(t) {
                        return {
                            get: function() {
                                var e = this.buffer,
                                    n = t << 2;
                                return (e[n] | e[n + 1] << 8 | e[n + 2] << 16 | e[n + 3] << 24) >>> 0
                            },
                            set: function(e) {
                                var n = this.buffer,
                                    i = t << 2;
                                n[i] = 255 & e, n[i + 1] = e >> 8 & 255, n[i + 2] = e >> 16 & 255, n[i + 3] = e >>> 24 & 255
                            }
                        }
                    }

                    function n(n) {
                        for (; i < n;) Object.defineProperty(t.prototype, i, e(i)), i++
                    }
                    t.prototype = Object.create(null);
                    var i = 0;
                    return t
                }();
            t.Uint32ArrayView = ct;
            var lt = [1, 0, 0, 1, 0, 0],
                ht = function() {
                    function t() {}
                    var e = ["rgb(", 0, ",", 0, ",", 0, ")"];
                    t.makeCssRgb = function(t, n, i) {
                        return e[1] = t, e[3] = n, e[5] = i, e.join("")
                    }, t.transform = function(t, e) {
                        return [t[0] * e[0] + t[2] * e[1], t[1] * e[0] + t[3] * e[1], t[0] * e[2] + t[2] * e[3], t[1] * e[2] + t[3] * e[3], t[0] * e[4] + t[2] * e[5] + t[4], t[1] * e[4] + t[3] * e[5] + t[5]]
                    }, t.applyTransform = function(t, e) {
                        return [t[0] * e[0] + t[1] * e[2] + e[4], t[0] * e[1] + t[1] * e[3] + e[5]]
                    }, t.applyInverseTransform = function(t, e) {
                        var n = e[0] * e[3] - e[1] * e[2];
                        return [(t[0] * e[3] - t[1] * e[2] + e[2] * e[5] - e[4] * e[3]) / n, (-t[0] * e[1] + t[1] * e[0] + e[4] * e[1] - e[5] * e[0]) / n]
                    }, t.getAxialAlignedBoundingBox = function(e, n) {
                        var i = t.applyTransform(e, n),
                            r = t.applyTransform(e.slice(2, 4), n),
                            a = t.applyTransform([e[0], e[3]], n),
                            s = t.applyTransform([e[2], e[1]], n);
                        return [Math.min(i[0], r[0], a[0], s[0]), Math.min(i[1], r[1], a[1], s[1]), Math.max(i[0], r[0], a[0], s[0]), Math.max(i[1], r[1], a[1], s[1])]
                    }, t.inverseTransform = function(t) {
                        var e = t[0] * t[3] - t[1] * t[2];
                        return [t[3] / e, -t[1] / e, -t[2] / e, t[0] / e, (t[2] * t[5] - t[4] * t[3]) / e, (t[4] * t[1] - t[5] * t[0]) / e]
                    }, t.apply3dTransform = function(t, e) {
                        return [t[0] * e[0] + t[1] * e[1] + t[2] * e[2], t[3] * e[0] + t[4] * e[1] + t[5] * e[2], t[6] * e[0] + t[7] * e[1] + t[8] * e[2]]
                    }, t.singularValueDecompose2dScale = function(t) {
                        var e = [t[0], t[2], t[1], t[3]],
                            n = t[0] * e[0] + t[1] * e[2],
                            i = t[0] * e[1] + t[1] * e[3],
                            r = t[2] * e[0] + t[3] * e[2],
                            a = t[2] * e[1] + t[3] * e[3],
                            s = (n + a) / 2,
                            o = Math.sqrt((n + a) * (n + a) - 4 * (n * a - r * i)) / 2,
                            c = s + o || 1,
                            l = s - o || 1;
                        return [Math.sqrt(c), Math.sqrt(l)]
                    }, t.normalizeRect = function(t) {
                        var e = t.slice(0);
                        return t[0] > t[2] && (e[0] = t[2], e[2] = t[0]), t[1] > t[3] && (e[1] = t[3], e[3] = t[1]), e
                    }, t.intersect = function(e, n) {
                        function i(t, e) {
                            return t - e
                        }
                        var r = [e[0], e[2], n[0], n[2]].sort(i),
                            a = [e[1], e[3], n[1], n[3]].sort(i),
                            s = [];
                        return e = t.normalizeRect(e), n = t.normalizeRect(n), (r[0] === e[0] && r[1] === n[0] || r[0] === n[0] && r[1] === e[0]) && (s[0] = r[1], s[2] = r[2], (a[0] === e[1] && a[1] === n[1] || a[0] === n[1] && a[1] === e[1]) && (s[1] = a[1], s[3] = a[2], s))
                    }, t.sign = function(t) {
                        return t < 0 ? -1 : 1
                    };
                    var n = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM", "", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC", "", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
                    return t.toRoman = function(t, e) {
                        c(E(t) && t > 0, "The number should be a positive integer.");
                        for (var i, r = []; t >= 1e3;) t -= 1e3, r.push("M");
                        i = t / 100 | 0, t %= 100, r.push(n[i]), i = t / 10 | 0, t %= 10, r.push(n[10 + i]), r.push(n[20 + t]);
                        var a = r.join("");
                        return e ? a.toLowerCase() : a
                    }, t.appendToArray = function(t, e) {
                        Array.prototype.push.apply(t, e)
                    }, t.prependToArray = function(t, e) {
                        Array.prototype.unshift.apply(t, e)
                    }, t.extendObj = function(t, e) {
                        for (var n in e) t[n] = e[n]
                    }, t.getInheritableProperty = function(t, e) {
                        for (; t && !t.has(e);) t = t.get("Parent");
                        return t ? t.get(e) : null
                    }, t.inherit = function(t, e, n) {
                        t.prototype = Object.create(e.prototype), t.prototype.constructor = t;
                        for (var i in n) t.prototype[i] = n[i]
                    }, t.loadScript = function(t, e) {
                        var n = document.createElement("script"),
                            i = !1;
                        n.setAttribute("src", t), e && (n.onload = function() {
                            i || e(), i = !0
                        }), document.getElementsByTagName("head")[0].appendChild(n)
                    }, t
                }(),
                ut = function() {
                    function t(t, e, n, i, r, a) {
                        this.viewBox = t, this.scale = e, this.rotation = n, this.offsetX = i, this.offsetY = r;
                        var s, o, c, l, h = (t[2] + t[0]) / 2,
                            u = (t[3] + t[1]) / 2;
                        switch (n %= 360, n = n < 0 ? n + 360 : n) {
                            case 180:
                                s = -1, o = 0, c = 0, l = 1;
                                break;
                            case 90:
                                s = 0, o = 1, c = 1, l = 0;
                                break;
                            case 270:
                                s = 0, o = -1, c = -1, l = 0;
                                break;
                            default:
                                s = 1, o = 0, c = 0, l = -1
                        }
                        a && (c = -c, l = -l);
                        var d, p, f, g;
                        0 === s ? (d = Math.abs(u - t[1]) * e + i, p = Math.abs(h - t[0]) * e + r, f = Math.abs(t[3] - t[1]) * e, g = Math.abs(t[2] - t[0]) * e) : (d = Math.abs(h - t[0]) * e + i, p = Math.abs(u - t[1]) * e + r, f = Math.abs(t[2] - t[0]) * e, g = Math.abs(t[3] - t[1]) * e), this.transform = [s * e, o * e, c * e, l * e, d - s * e * h - c * e * u, p - o * e * h - l * e * u], this.width = f, this.height = g, this.fontScale = e
                    }
                    return t.prototype = {
                        clone: function(e) {
                            e = e || {};
                            var n = "scale" in e ? e.scale : this.scale,
                                i = "rotation" in e ? e.rotation : this.rotation;
                            return new t(this.viewBox.slice(), n, i, this.offsetX, this.offsetY, e.dontFlip)
                        },
                        convertToViewportPoint: function(t, e) {
                            return ht.applyTransform([t, e], this.transform)
                        },
                        convertToViewportRectangle: function(t) {
                            var e = ht.applyTransform([t[0], t[1]], this.transform),
                                n = ht.applyTransform([t[2], t[3]], this.transform);
                            return [e[0], e[1], n[0], n[1]]
                        },
                        convertToPdfPoint: function(t, e) {
                            return ht.applyInverseTransform([t, e], this.transform)
                        }
                    }, t
                }(),
                dt = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 728, 711, 710, 729, 733, 731, 730, 732, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8226, 8224, 8225, 8230, 8212, 8211, 402, 8260, 8249, 8250, 8722, 8240, 8222, 8220, 8221, 8216, 8217, 8218, 8482, 64257, 64258, 321, 338, 352, 376, 381, 305, 322, 339, 353, 382, 0, 8364];
            ! function() {
                function t(t) {
                    this._status = 0, this._handlers = [];
                    try {
                        t.call(this, this._resolve.bind(this), this._reject.bind(this))
                    } catch (t) {
                        this._reject(t)
                    }
                }
                if (U.Promise) return "function" != typeof U.Promise.all && (U.Promise.all = function(t) {
                    var e, n, i = 0,
                        r = [],
                        a = new U.Promise(function(t, i) {
                            e = t, n = i
                        });
                    return t.forEach(function(t, a) {
                        i++, t.then(function(t) {
                            r[a] = t, 0 === --i && e(r)
                        }, n)
                    }), 0 === i && e(r), a
                }), "function" != typeof U.Promise.resolve && (U.Promise.resolve = function(t) {
                    return new U.Promise(function(e) {
                        e(t)
                    })
                }), "function" != typeof U.Promise.reject && (U.Promise.reject = function(t) {
                    return new U.Promise(function(e, n) {
                        n(t)
                    })
                }), void("function" != typeof U.Promise.prototype.catch && (U.Promise.prototype.catch = function(t) {
                    return U.Promise.prototype.then(void 0, t)
                }));
                var e = {
                    handlers: [],
                    running: !1,
                    unhandledRejections: [],
                    pendingRejectionCheck: !1,
                    scheduleHandlers: function(t) {
                        0 !== t._status && (this.handlers = this.handlers.concat(t._handlers), t._handlers = [], this.running || (this.running = !0, setTimeout(this.runHandlers.bind(this), 0)))
                    },
                    runHandlers: function() {
                        for (var t = Date.now() + 1; this.handlers.length > 0;) {
                            var e = this.handlers.shift(),
                                n = e.thisPromise._status,
                                i = e.thisPromise._value;
                            try {
                                1 === n ? "function" == typeof e.onResolve && (i = e.onResolve(i)) : "function" == typeof e.onReject && (i = e.onReject(i), n = 1, e.thisPromise._unhandledRejection && this.removeUnhandeledRejection(e.thisPromise))
                            } catch (t) {
                                n = 2, i = t
                            }
                            if (e.nextPromise._updateStatus(n, i), Date.now() >= t) break
                        }
                        if (this.handlers.length > 0) return void setTimeout(this.runHandlers.bind(this), 0);
                        this.running = !1
                    },
                    addUnhandledRejection: function(t) {
                        this.unhandledRejections.push({
                            promise: t,
                            time: Date.now()
                        }), this.scheduleRejectionCheck()
                    },
                    removeUnhandeledRejection: function(t) {
                        t._unhandledRejection = !1;
                        for (var e = 0; e < this.unhandledRejections.length; e++) this.unhandledRejections[e].promise === t && (this.unhandledRejections.splice(e), e--)
                    },
                    scheduleRejectionCheck: function() {
                        this.pendingRejectionCheck || (this.pendingRejectionCheck = !0, setTimeout(function() {
                            this.pendingRejectionCheck = !1;
                            for (var t = Date.now(), e = 0; e < this.unhandledRejections.length; e++)
                                if (t - this.unhandledRejections[e].time > 500) {
                                    var n = this.unhandledRejections[e].promise._value,
                                        i = "Unhandled rejection: " + n;
                                    n.stack && (i += "\n" + n.stack), r(i), this.unhandledRejections.splice(e), e--
                                } this.unhandledRejections.length && this.scheduleRejectionCheck()
                        }.bind(this), 500))
                    }
                };
                t.all = function(e) {
                    function n(t) {
                        2 !== a._status && (o = [], r(t))
                    }
                    var i, r, a = new t(function(t, e) {
                            i = t, r = e
                        }),
                        s = e.length,
                        o = [];
                    if (0 === s) return i(o), a;
                    for (var c = 0, l = e.length; c < l; ++c) {
                        var h = e[c],
                            u = function(t) {
                                return function(e) {
                                    2 !== a._status && (o[t] = e, 0 === --s && i(o))
                                }
                            }(c);
                        t.isPromise(h) ? h.then(u, n) : u(h)
                    }
                    return a
                }, t.isPromise = function(t) {
                    return t && "function" == typeof t.then
                }, t.resolve = function(e) {
                    return new t(function(t) {
                        t(e)
                    })
                }, t.reject = function(e) {
                    return new t(function(t, n) {
                        n(e)
                    })
                }, t.prototype = {
                    _status: null,
                    _value: null,
                    _handlers: null,
                    _unhandledRejection: null,
                    _updateStatus: function(n, i) {
                        if (1 !== this._status && 2 !== this._status) {
                            if (1 === n && t.isPromise(i)) return void i.then(this._updateStatus.bind(this, 1), this._updateStatus.bind(this, 2));
                            this._status = n, this._value = i, 2 === n && 0 === this._handlers.length && (this._unhandledRejection = !0, e.addUnhandledRejection(this)), e.scheduleHandlers(this)
                        }
                    },
                    _resolve: function(t) {
                        this._updateStatus(1, t)
                    },
                    _reject: function(t) {
                        this._updateStatus(2, t)
                    },
                    then: function(n, i) {
                        var r = new t(function(t, e) {
                            this.resolve = t, this.reject = e
                        });
                        return this._handlers.push({
                            thisPromise: this,
                            onResolve: n,
                            onReject: i,
                            nextPromise: r
                        }), e.scheduleHandlers(this), r
                    },
                    catch: function(t) {
                        return this.then(void 0, t)
                    }
                }, U.Promise = t
            }(),
            function() {
                function t() {
                    this.id = "$weakmap" + e++
                }
                if (!U.WeakMap) {
                    var e = 0;
                    t.prototype = {
                        has: function(t) {
                            return !!Object.getOwnPropertyDescriptor(t, this.id)
                        },
                        get: function(t, e) {
                            return this.has(t) ? t[this.id] : e
                        },
                        set: function(t, e) {
                            Object.defineProperty(t, this.id, {
                                value: e,
                                enumerable: !1,
                                configurable: !0
                            })
                        },
                        delete: function(t) {
                            delete t[this.id]
                        }
                    }, U.WeakMap = t
                }
            }();
            var pt = function() {
                    function t(t, e, n) {
                        for (; t.length < n;) t += e;
                        return t
                    }

                    function e() {
                        this.started = Object.create(null), this.times = [], this.enabled = !0
                    }
                    return e.prototype = {
                        time: function(t) {
                            this.enabled && (t in this.started && r("Timer is already running for " + t), this.started[t] = Date.now())
                        },
                        timeEnd: function(t) {
                            this.enabled && (t in this.started || r("Timer has not been started for " + t), this.times.push({
                                name: t,
                                start: this.started[t],
                                end: Date.now()
                            }), delete this.started[t])
                        },
                        toString: function() {
                            var e, n, i = this.times,
                                r = "",
                                a = 0;
                            for (e = 0, n = i.length; e < n; ++e) {
                                var s = i[e].name;
                                s.length > a && (a = s.length)
                            }
                            for (e = 0, n = i.length; e < n; ++e) {
                                var o = i[e],
                                    c = o.end - o.start;
                                r += t(o.name, " ", a) + " " + c + "ms\n"
                            }
                            return r
                        }
                    }, e
                }(),
                ft = function(t, e) {
                    if ("undefined" != typeof Blob) return new Blob([t], {
                        type: e
                    });
                    r('The "Blob" constructor is not supported.')
                },
                gt = function() {
                    var t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
                    return function(e, n, i) {
                        if (!i && "undefined" != typeof URL && URL.createObjectURL) {
                            var r = ft(e, n);
                            return URL.createObjectURL(r)
                        }
                        for (var a = "data:" + n + ";base64,", s = 0, o = e.length; s < o; s += 3) {
                            var c = 255 & e[s],
                                l = 255 & e[s + 1],
                                h = 255 & e[s + 2],
                                u = c >> 2,
                                d = (3 & c) << 4 | l >> 4,
                                p = s + 1 < o ? (15 & l) << 2 | h >> 6 : 64,
                                f = s + 2 < o ? 63 & h : 64;
                            a += t[u] + t[d] + t[p] + t[f]
                        }
                        return a
                    }
                }();
            F.prototype = {
                    on: function(t, e, n) {
                        var i = this.actionHandler;
                        i[t] && s('There is already an actionName called "' + t + '"'), i[t] = [e, n]
                    },
                    send: function(t, e, n) {
                        var i = {
                            sourceName: this.sourceName,
                            targetName: this.targetName,
                            action: t,
                            data: e
                        };
                        this.postMessage(i, n)
                    },
                    sendWithPromise: function(t, e, n) {
                        var i = this.callbackIndex++,
                            r = {
                                sourceName: this.sourceName,
                                targetName: this.targetName,
                                action: t,
                                data: e,
                                callbackId: i
                            },
                            a = M();
                        this.callbacksCapabilities[i] = a;
                        try {
                            this.postMessage(r, n)
                        } catch (t) {
                            a.reject(t)
                        }
                        return a.promise
                    },
                    postMessage: function(t, e) {
                        e && this.postMessageTransfers ? this.comObj.postMessage(t, e) : this.comObj.postMessage(t)
                    },
                    destroy: function() {
                        this.comObj.removeEventListener("message", this._onComObjOnMessage)
                    }
                },
                function(t) {
                    function e(t) {
                        return void 0 !== u[t]
                    }

                    function n() {
                        o.call(this), this._isInvalid = !0
                    }

                    function i(t) {
                        return "" === t && n.call(this), t.toLowerCase()
                    }

                    function r(t) {
                        var e = t.charCodeAt(0);
                        return e > 32 && e < 127 && [34, 35, 60, 62, 63, 96].indexOf(e) === -1 ? t : encodeURIComponent(t)
                    }

                    function a(t) {
                        var e = t.charCodeAt(0);
                        return e > 32 && e < 127 && [34, 35, 60, 62, 96].indexOf(e) === -1 ? t : encodeURIComponent(t)
                    }

                    function s(t, s, o) {
                        function c(t) {
                            b.push(t)
                        }
                        var l = s || "scheme start",
                            h = 0,
                            m = "",
                            A = !1,
                            v = !1,
                            b = [];
                        t: for (;
                            (t[h - 1] !== p || 0 === h) && !this._isInvalid;) {
                            var y = t[h];
                            switch (l) {
                                case "scheme start":
                                    if (!y || !f.test(y)) {
                                        if (s) {
                                            c("Invalid scheme.");
                                            break t
                                        }
                                        m = "", l = "no scheme";
                                        continue
                                    }
                                    m += y.toLowerCase(), l = "scheme";
                                    break;
                                case "scheme":
                                    if (y && g.test(y)) m += y.toLowerCase();
                                    else {
                                        if (":" !== y) {
                                            if (s) {
                                                if (p === y) break t;
                                                c("Code point not allowed in scheme: " + y);
                                                break t
                                            }
                                            m = "", h = 0, l = "no scheme";
                                            continue
                                        }
                                        if (this._scheme = m, m = "", s) break t;
                                        e(this._scheme) && (this._isRelative = !0), l = "file" === this._scheme ? "relative" : this._isRelative && o && o._scheme === this._scheme ? "relative or authority" : this._isRelative ? "authority first slash" : "scheme data"
                                    }
                                    break;
                                case "scheme data":
                                    "?" === y ? (this._query = "?", l = "query") : "#" === y ? (this._fragment = "#", l = "fragment") : p !== y && "\t" !== y && "\n" !== y && "\r" !== y && (this._schemeData += r(y));
                                    break;
                                case "no scheme":
                                    if (o && e(o._scheme)) {
                                        l = "relative";
                                        continue
                                    }
                                    c("Missing scheme."), n.call(this);
                                    break;
                                case "relative or authority":
                                    if ("/" !== y || "/" !== t[h + 1]) {
                                        c("Expected /, got: " + y), l = "relative";
                                        continue
                                    }
                                    l = "authority ignore slashes";
                                    break;
                                case "relative":
                                    if (this._isRelative = !0, "file" !== this._scheme && (this._scheme = o._scheme), p === y) {
                                        this._host = o._host, this._port = o._port, this._path = o._path.slice(), this._query = o._query, this._username = o._username, this._password = o._password;
                                        break t
                                    }
                                    if ("/" === y || "\\" === y) "\\" === y && c("\\ is an invalid code point."), l = "relative slash";
                                    else if ("?" === y) this._host = o._host, this._port = o._port, this._path = o._path.slice(), this._query = "?", this._username = o._username, this._password = o._password, l = "query";
                                    else {
                                        if ("#" !== y) {
                                            var x = t[h + 1],
                                                S = t[h + 2];
                                            ("file" !== this._scheme || !f.test(y) || ":" !== x && "|" !== x || p !== S && "/" !== S && "\\" !== S && "?" !== S && "#" !== S) && (this._host = o._host, this._port = o._port, this._username = o._username, this._password = o._password, this._path = o._path.slice(), this._path.pop()), l = "relative path";
                                            continue
                                        }
                                        this._host = o._host, this._port = o._port, this._path = o._path.slice(), this._query = o._query, this._fragment = "#", this._username = o._username, this._password = o._password, l = "fragment"
                                    }
                                    break;
                                case "relative slash":
                                    if ("/" !== y && "\\" !== y) {
                                        "file" !== this._scheme && (this._host = o._host, this._port = o._port, this._username = o._username, this._password = o._password), l = "relative path";
                                        continue
                                    }
                                    "\\" === y && c("\\ is an invalid code point."), l = "file" === this._scheme ? "file host" : "authority ignore slashes";
                                    break;
                                case "authority first slash":
                                    if ("/" !== y) {
                                        c("Expected '/', got: " + y), l = "authority ignore slashes";
                                        continue
                                    }
                                    l = "authority second slash";
                                    break;
                                case "authority second slash":
                                    if (l = "authority ignore slashes", "/" !== y) {
                                        c("Expected '/', got: " + y);
                                        continue
                                    }
                                    break;
                                case "authority ignore slashes":
                                    if ("/" !== y && "\\" !== y) {
                                        l = "authority";
                                        continue
                                    }
                                    c("Expected authority, got: " + y);
                                    break;
                                case "authority":
                                    if ("@" === y) {
                                        A && (c("@ already seen."), m += "%40"), A = !0;
                                        for (var k = 0; k < m.length; k++) {
                                            var C = m[k];
                                            if ("\t" !== C && "\n" !== C && "\r" !== C)
                                                if (":" !== C || null !== this._password) {
                                                    var _ = r(C);
                                                    null !== this._password ? this._password += _ : this._username += _
                                                } else this._password = "";
                                            else c("Invalid whitespace in authority.")
                                        }
                                        m = ""
                                    } else {
                                        if (p === y || "/" === y || "\\" === y || "?" === y || "#" === y) {
                                            h -= m.length, m = "", l = "host";
                                            continue
                                        }
                                        m += y
                                    }
                                    break;
                                case "file host":
                                    if (p === y || "/" === y || "\\" === y || "?" === y || "#" === y) {
                                        2 !== m.length || !f.test(m[0]) || ":" !== m[1] && "|" !== m[1] ? 0 === m.length ? l = "relative path start" : (this._host = i.call(this, m), m = "", l = "relative path start") : l = "relative path";
                                        continue
                                    }
                                    "\t" === y || "\n" === y || "\r" === y ? c("Invalid whitespace in file host.") : m += y;
                                    break;
                                case "host":
                                case "hostname":
                                    if (":" !== y || v) {
                                        if (p === y || "/" === y || "\\" === y || "?" === y || "#" === y) {
                                            if (this._host = i.call(this, m), m = "", l = "relative path start", s) break t;
                                            continue
                                        }
                                        "\t" !== y && "\n" !== y && "\r" !== y ? ("[" === y ? v = !0 : "]" === y && (v = !1), m += y) : c("Invalid code point in host/hostname: " + y)
                                    } else if (this._host = i.call(this, m), m = "", l = "port", "hostname" === s) break t;
                                    break;
                                case "port":
                                    if (/[0-9]/.test(y)) m += y;
                                    else {
                                        if (p === y || "/" === y || "\\" === y || "?" === y || "#" === y || s) {
                                            if ("" !== m) {
                                                var w = parseInt(m, 10);
                                                w !== u[this._scheme] && (this._port = w + ""), m = ""
                                            }
                                            if (s) break t;
                                            l = "relative path start";
                                            continue
                                        }
                                        "\t" === y || "\n" === y || "\r" === y ? c("Invalid code point in port: " + y) : n.call(this)
                                    }
                                    break;
                                case "relative path start":
                                    if ("\\" === y && c("'\\' not allowed in path."), l = "relative path", "/" !== y && "\\" !== y) continue;
                                    break;
                                case "relative path":
                                    if (p !== y && "/" !== y && "\\" !== y && (s || "?" !== y && "#" !== y)) "\t" !== y && "\n" !== y && "\r" !== y && (m += r(y));
                                    else {
                                        "\\" === y && c("\\ not allowed in relative path.");
                                        var T;
                                        (T = d[m.toLowerCase()]) && (m = T), ".." === m ? (this._path.pop(), "/" !== y && "\\" !== y && this._path.push("")) : "." === m && "/" !== y && "\\" !== y ? this._path.push("") : "." !== m && ("file" === this._scheme && 0 === this._path.length && 2 === m.length && f.test(m[0]) && "|" === m[1] && (m = m[0] + ":"), this._path.push(m)), m = "", "?" === y ? (this._query = "?", l = "query") : "#" === y && (this._fragment = "#", l = "fragment")
                                    }
                                    break;
                                case "query":
                                    s || "#" !== y ? p !== y && "\t" !== y && "\n" !== y && "\r" !== y && (this._query += a(y)) : (this._fragment = "#", l = "fragment");
                                    break;
                                case "fragment":
                                    p !== y && "\t" !== y && "\n" !== y && "\r" !== y && (this._fragment += y)
                            }
                            h++
                        }
                    }

                    function o() {
                        this._scheme = "", this._schemeData = "", this._username = "", this._password = null, this._host = "", this._port = "", this._path = [], this._query = "", this._fragment = "", this._isInvalid = !1, this._isRelative = !1
                    }

                    function c(t, e) {
                        void 0 === e || e instanceof c || (e = new c(String(e))), this._url = t, o.call(this);
                        var n = t.replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/g, "");
                        s.call(this, n, null, e)
                    }
                    var l = !1;
                    try {
                        if ("function" == typeof URL && "object" == typeof URL.prototype && "origin" in URL.prototype) {
                            var h = new URL("b", "http://a");
                            h.pathname = "c%20d", l = "http://a/c%20d" === h.href
                        }
                    } catch (t) {}
                    if (!l) {
                        var u = Object.create(null);
                        u.ftp = 21, u.file = 0, u.gopher = 70, u.http = 80, u.https = 443, u.ws = 80, u.wss = 443;
                        var d = Object.create(null);
                        d["%2e"] = ".", d[".%2e"] = "..", d["%2e."] = "..", d["%2e%2e"] = "..";
                        var p, f = /[a-zA-Z]/,
                            g = /[a-zA-Z0-9\+\-\.]/;
                        c.prototype = {
                            toString: function() {
                                return this.href
                            },
                            get href() {
                                if (this._isInvalid) return this._url;
                                var t = "";
                                return "" === this._username && null === this._password || (t = this._username + (null !== this._password ? ":" + this._password : "") + "@"), this.protocol + (this._isRelative ? "//" + t + this.host : "") + this.pathname + this._query + this._fragment
                            },
                            set href(t) {
                                o.call(this), s.call(this, t)
                            },
                            get protocol() {
                                return this._scheme + ":"
                            },
                            set protocol(t) {
                                this._isInvalid || s.call(this, t + ":", "scheme start")
                            },
                            get host() {
                                return this._isInvalid ? "" : this._port ? this._host + ":" + this._port : this._host
                            },
                            set host(t) {
                                !this._isInvalid && this._isRelative && s.call(this, t, "host")
                            },
                            get hostname() {
                                return this._host
                            },
                            set hostname(t) {
                                !this._isInvalid && this._isRelative && s.call(this, t, "hostname")
                            },
                            get port() {
                                return this._port
                            },
                            set port(t) {
                                !this._isInvalid && this._isRelative && s.call(this, t, "port")
                            },
                            get pathname() {
                                return this._isInvalid ? "" : this._isRelative ? "/" + this._path.join("/") : this._schemeData
                            },
                            set pathname(t) {
                                !this._isInvalid && this._isRelative && (this._path = [], s.call(this, t, "relative path start"))
                            },
                            get search() {
                                return this._isInvalid || !this._query || "?" === this._query ? "" : this._query
                            },
                            set search(t) {
                                !this._isInvalid && this._isRelative && (this._query = "?", "?" === t[0] && (t = t.slice(1)), s.call(this, t, "query"))
                            },
                            get hash() {
                                return this._isInvalid || !this._fragment || "#" === this._fragment ? "" : this._fragment
                            },
                            set hash(t) {
                                this._isInvalid || (this._fragment = "#", "#" === t[0] && (t = t.slice(1)), s.call(this, t, "fragment"))
                            },
                            get origin() {
                                var t;
                                if (this._isInvalid || !this._scheme) return "";
                                switch (this._scheme) {
                                    case "data":
                                    case "file":
                                    case "javascript":
                                    case "mailto":
                                        return "null"
                                }
                                return t = this.host, t ? this._scheme + "://" + t : ""
                            }
                        };
                        var m = t.URL;
                        m && (c.createObjectURL = function(t) {
                            return m.createObjectURL.apply(m, arguments)
                        }, c.revokeObjectURL = function(t) {
                            m.revokeObjectURL(t)
                        }), t.URL = c
                    }
                }(U), t.FONT_IDENTITY_MATRIX = B, t.IDENTITY_MATRIX = lt, t.OPS = Q, t.VERBOSITY_LEVELS = J, t.UNSUPPORTED_FEATURES = Z, t.AnnotationBorderStyleType = Y, t.AnnotationFieldFlag = H, t.AnnotationFlag = z, t.AnnotationType = X, t.FontType = V, t.ImageKind = G, t.InvalidPDFException = nt, t.MessageHandler = F, t.MissingDataException = st, t.MissingPDFException = it, t.NotImplementedException = at, t.PageViewport = ut, t.PasswordException = tt, t.PasswordResponses = $, t.StatTimer = pt, t.StreamType = q, t.TextRenderingMode = W, t.UnexpectedResponseException = rt, t.UnknownErrorException = et, t.Util = ht, t.XRefParseException = ot, t.arrayByteLength = m, t.arraysToBytes = A, t.assert = c, t.bytesToString = f, t.createBlob = ft, t.createPromiseCapability = M, t.createObjectURL = gt, t.deprecated = a, t.error = s, t.getLookupTableFactory = d, t.getVerbosityLevel = n, t.globalScope = U, t.info = i, t.isArray = D, t.isArrayBuffer = j, t.isBool = P, t.isEmptyObj = L, t.isInt = E, t.isNum = R, t.isString = I, t.isSpace = O, t.isSameOrigin = l, t.isValidUrl = h, t.isLittleEndian = k, t.isEvalSupported = C, t.loadJpegStream = N, t.log2 = b, t.readInt8 = y, t.readUint16 = x, t.readUint32 = S, t.removeNullCharacters = p, t.setVerbosityLevel = e, t.shadow = u, t.string32 = v, t.stringToBytes = g, t.stringToPDFString = _, t.stringToUTF8String = w, t.utf8StringToString = T, t.warn = r
        }),
        function(t, e) {
            e(t.pdfjsDisplayDOMUtils = {}, t.pdfjsSharedUtil)
        }(this, function(t, e) {
            function n() {
                var t = document.createElement("canvas");
                return t.width = t.height = 1, void 0 !== t.getContext("2d").createImageData(1, 1).data.buffer
            }

            function i(t, e) {
                var n = e && e.url;
                if (t.href = t.title = n ? o(n) : "", n) {
                    var i = e.target;
                    void 0 === i && (i = a("externalLinkTarget")), t.target = u[i];
                    var r = e.rel;
                    void 0 === r && (r = a("externalLinkRel")), t.rel = r
                }
            }

            function r(t) {
                var e = t.indexOf("#"),
                    n = t.indexOf("?"),
                    i = Math.min(e > 0 ? e : t.length, n > 0 ? n : t.length);
                return t.substring(t.lastIndexOf("/", i) + 1, i)
            }

            function a(t) {
                var n = e.globalScope.PDFJS;
                switch (t) {
                    case "pdfBug":
                        return !!n && n.pdfBug;
                    case "disableAutoFetch":
                        return !!n && n.disableAutoFetch;
                    case "disableStream":
                        return !!n && n.disableStream;
                    case "disableRange":
                        return !!n && n.disableRange;
                    case "disableFontFace":
                        return !!n && n.disableFontFace;
                    case "disableCreateObjectURL":
                        return !!n && n.disableCreateObjectURL;
                    case "disableWebGL":
                        return !n || n.disableWebGL;
                    case "cMapUrl":
                        return n ? n.cMapUrl : null;
                    case "cMapPacked":
                        return !!n && n.cMapPacked;
                    case "postMessageTransfers":
                        return !n || n.postMessageTransfers;
                    case "workerSrc":
                        return n ? n.workerSrc : null;
                    case "disableWorker":
                        return !!n && n.disableWorker;
                    case "maxImageSize":
                        return n ? n.maxImageSize : -1;
                    case "imageResourcesPath":
                        return n ? n.imageResourcesPath : "";
                    case "isEvalSupported":
                        return !n || n.isEvalSupported;
                    case "externalLinkTarget":
                        if (!n) return h.NONE;
                        switch (n.externalLinkTarget) {
                            case h.NONE:
                            case h.SELF:
                            case h.BLANK:
                            case h.PARENT:
                            case h.TOP:
                                return n.externalLinkTarget
                        }
                        return c("PDFJS.externalLinkTarget is invalid: " + n.externalLinkTarget), n.externalLinkTarget = h.NONE, h.NONE;
                    case "externalLinkRel":
                        return n ? n.externalLinkRel : "noreferrer";
                    case "enableStats":
                        return !(!n || !n.enableStats);
                    default:
                        throw new Error("Unknown default setting: " + t)
                }
            }

            function s() {
                switch (a("externalLinkTarget")) {
                    case h.NONE:
                        return !1;
                    case h.SELF:
                    case h.BLANK:
                    case h.PARENT:
                    case h.TOP:
                        return !0
                }
            }
            var o = e.removeNullCharacters,
                c = e.warn,
                l = function() {
                    function t() {}
                    var e = ["ms", "Moz", "Webkit", "O"],
                        n = Object.create(null);
                    return t.getProp = function(t, i) {
                        if (1 === arguments.length && "string" == typeof n[t]) return n[t];
                        i = i || document.documentElement;
                        var r, a, s = i.style;
                        if ("string" == typeof s[t]) return n[t] = t;
                        a = t.charAt(0).toUpperCase() + t.slice(1);
                        for (var o = 0, c = e.length; o < c; o++)
                            if (r = e[o] + a, "string" == typeof s[r]) return n[t] = r;
                        return n[t] = "undefined"
                    }, t.setProp = function(t, e, n) {
                        var i = this.getProp(t);
                        "undefined" !== i && (e.style[i] = n)
                    }, t
                }(),
                h = {
                    NONE: 0,
                    SELF: 1,
                    BLANK: 2,
                    PARENT: 3,
                    TOP: 4
                },
                u = ["", "_self", "_blank", "_parent", "_top"];
            t.CustomStyle = l, t.addLinkAttributes = i, t.isExternalLinkTargetSet = s, t.getFilenameFromUrl = r, t.LinkTarget = h, t.hasCanvasTypedArrays = n, t.getDefaultSetting = a
        }),
        function(t, e) {
            e(t.pdfjsDisplayFontLoader = {}, t.pdfjsSharedUtil)
        }(this, function(t, e) {
            function n(t) {
                this.docId = t, this.styleElement = null, this.nativeFontFaces = [], this.loadTestFontId = 0, this.loadingContext = {
                    requests: [],
                    nextRequestId: 0
                }
            }
            var i = e.assert,
                r = e.bytesToString,
                a = e.string32,
                s = e.shadow,
                o = e.warn;
            n.prototype = {
                insertRule: function(t) {
                    var e = this.styleElement;
                    e || (e = this.styleElement = document.createElement("style"), e.id = "PDFJS_FONT_STYLE_TAG_" + this.docId, document.documentElement.getElementsByTagName("head")[0].appendChild(e));
                    var n = e.sheet;
                    n.insertRule(t, n.cssRules.length)
                },
                clear: function() {
                    var t = this.styleElement;
                    t && (t.parentNode.removeChild(t), t = this.styleElement = null), this.nativeFontFaces.forEach(function(t) {
                        document.fonts.delete(t)
                    }), this.nativeFontFaces.length = 0
                },
                get loadTestFont() {
                    return s(this, "loadTestFont", atob("T1RUTwALAIAAAwAwQ0ZGIDHtZg4AAAOYAAAAgUZGVE1lkzZwAAAEHAAAABxHREVGABQAFQAABDgAAAAeT1MvMlYNYwkAAAEgAAAAYGNtYXABDQLUAAACNAAAAUJoZWFk/xVFDQAAALwAAAA2aGhlYQdkA+oAAAD0AAAAJGhtdHgD6AAAAAAEWAAAAAZtYXhwAAJQAAAAARgAAAAGbmFtZVjmdH4AAAGAAAAAsXBvc3T/hgAzAAADeAAAACAAAQAAAAEAALZRFsRfDzz1AAsD6AAAAADOBOTLAAAAAM4KHDwAAAAAA+gDIQAAAAgAAgAAAAAAAAABAAADIQAAAFoD6AAAAAAD6AABAAAAAAAAAAAAAAAAAAAAAQAAUAAAAgAAAAQD6AH0AAUAAAKKArwAAACMAooCvAAAAeAAMQECAAACAAYJAAAAAAAAAAAAAQAAAAAAAAAAAAAAAFBmRWQAwAAuAC4DIP84AFoDIQAAAAAAAQAAAAAAAAAAACAAIAABAAAADgCuAAEAAAAAAAAAAQAAAAEAAAAAAAEAAQAAAAEAAAAAAAIAAQAAAAEAAAAAAAMAAQAAAAEAAAAAAAQAAQAAAAEAAAAAAAUAAQAAAAEAAAAAAAYAAQAAAAMAAQQJAAAAAgABAAMAAQQJAAEAAgABAAMAAQQJAAIAAgABAAMAAQQJAAMAAgABAAMAAQQJAAQAAgABAAMAAQQJAAUAAgABAAMAAQQJAAYAAgABWABYAAAAAAAAAwAAAAMAAAAcAAEAAAAAADwAAwABAAAAHAAEACAAAAAEAAQAAQAAAC7//wAAAC7////TAAEAAAAAAAABBgAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAD/gwAyAAAAAQAAAAAAAAAAAAAAAAAAAAABAAQEAAEBAQJYAAEBASH4DwD4GwHEAvgcA/gXBIwMAYuL+nz5tQXkD5j3CBLnEQACAQEBIVhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYAAABAQAADwACAQEEE/t3Dov6fAH6fAT+fPp8+nwHDosMCvm1Cvm1DAz6fBQAAAAAAAABAAAAAMmJbzEAAAAAzgTjFQAAAADOBOQpAAEAAAAAAAAADAAUAAQAAAABAAAAAgABAAAAAAAAAAAD6AAAAAAAAA=="))
                },
                addNativeFontFace: function(t) {
                    this.nativeFontFaces.push(t), document.fonts.add(t)
                },
                bind: function(t, e) {
                    for (var i = [], r = [], a = [], s = function(t) {
                            return t.loaded.catch(function(e) {
                                o('Failed to load font "' + t.family + '": ' + e)
                            })
                        }, c = 0, l = t.length; c < l; c++) {
                        var h = t[c];
                        if (!h.attached && h.loading !== !1)
                            if (h.attached = !0, n.isFontLoadingAPISupported) {
                                var u = h.createNativeFontFace();
                                u && (this.addNativeFontFace(u), a.push(s(u)))
                            } else {
                                var d = h.createFontFaceRule();
                                d && (this.insertRule(d), i.push(d), r.push(h))
                            }
                    }
                    var p = this.queueLoadingCallback(e);
                    n.isFontLoadingAPISupported ? Promise.all(a).then(function() {
                        p.complete()
                    }) : i.length > 0 && !n.isSyncFontLoadingSupported ? this.prepareFontLoadEvent(i, r, p) : p.complete()
                },
                queueLoadingCallback: function(t) {
                    function e() {
                        for (i(!a.end, "completeRequest() cannot be called twice"), a.end = Date.now(); n.requests.length > 0 && n.requests[0].end;) {
                            var t = n.requests.shift();
                            setTimeout(t.callback, 0)
                        }
                    }
                    var n = this.loadingContext,
                        r = "pdfjs-font-loading-" + n.nextRequestId++,
                        a = {
                            id: r,
                            complete: e,
                            callback: t,
                            started: Date.now()
                        };
                    return n.requests.push(a), a
                },
                prepareFontLoadEvent: function(t, e, n) {
                    function i(t, e) {
                        return t.charCodeAt(e) << 24 | t.charCodeAt(e + 1) << 16 | t.charCodeAt(e + 2) << 8 | 255 & t.charCodeAt(e + 3)
                    }

                    function r(t, e, n, i) {
                        return t.substr(0, e) + i + t.substr(e + n)
                    }

                    function s(t, e) {
                        return ++d > 30 ? (o("Load test font never loaded."), void e()) : (u.font = "30px " + t, u.fillText(".", 0, 20), u.getImageData(0, 0, 1, 1).data[3] > 0 ? void e() : void setTimeout(s.bind(null, t, e)))
                    }
                    var c, l, h = document.createElement("canvas");
                    h.width = 1, h.height = 1;
                    var u = h.getContext("2d"),
                        d = 0,
                        p = "lt" + Date.now() + this.loadTestFontId++,
                        f = this.loadTestFont;
                    f = r(f, 976, p.length, p);
                    var g = i(f, 16);
                    for (c = 0, l = p.length - 3; c < l; c += 4) g = g - 1482184792 + i(p, c) | 0;
                    c < p.length && (g = g - 1482184792 + i(p + "XXX", c) | 0), f = r(f, 16, 4, a(g));
                    var m = "url(data:font/opentype;base64," + btoa(f) + ");",
                        A = '@font-face { font-family:"' + p + '";src:' + m + "}";
                    this.insertRule(A);
                    var v = [];
                    for (c = 0, l = e.length; c < l; c++) v.push(e[c].loadedName);
                    v.push(p);
                    var b = document.createElement("div");
                    for (b.setAttribute("style", "visibility: hidden;width: 10px; height: 10px;position: absolute; top: 0px; left: 0px;"), c = 0, l = v.length; c < l; ++c) {
                        var y = document.createElement("span");
                        y.textContent = "Hi", y.style.fontFamily = v[c], b.appendChild(y)
                    }
                    document.body.appendChild(b), s(p, function() {
                        document.body.removeChild(b), n.complete()
                    })
                }
            }, n.isFontLoadingAPISupported = "undefined" != typeof document && !!document.fonts, Object.defineProperty(n, "isSyncFontLoadingSupported", {
                get: function() {
                    if ("undefined" == typeof navigator) return s(n, "isSyncFontLoadingSupported", !0);
                    var t = !1,
                        e = /Mozilla\/5.0.*?rv:(\d+).*? Gecko/.exec(navigator.userAgent);
                    return e && e[1] >= 14 && (t = !0), s(n, "isSyncFontLoadingSupported", t)
                },
                enumerable: !0,
                configurable: !0
            });
            var c = {
                    get value() {
                        return s(this, "value", e.isEvalSupported())
                    }
                },
                l = function() {
                    function t(t, e) {
                        this.compiledGlyphs = Object.create(null);
                        for (var n in t) this[n] = t[n];
                        this.options = e
                    }
                    return t.prototype = {
                        createNativeFontFace: function() {
                            if (!this.data) return null;
                            if (this.options.disableFontFace) return this.disableFontFace = !0, null;
                            var t = new FontFace(this.loadedName, this.data, {});
                            return this.options.fontRegistry && this.options.fontRegistry.registerFont(this), t
                        },
                        createFontFaceRule: function() {
                            if (!this.data) return null;
                            if (this.options.disableFontFace) return this.disableFontFace = !0, null;
                            var t = r(new Uint8Array(this.data)),
                                e = this.loadedName,
                                n = "url(data:" + this.mimetype + ";base64," + btoa(t) + ");",
                                i = '@font-face { font-family:"' + e + '";src:' + n + "}";
                            return this.options.fontRegistry && this.options.fontRegistry.registerFont(this, n), i
                        },
                        getPathGenerator: function(t, e) {
                            if (!(e in this.compiledGlyphs)) {
                                var n, i, r, a = t.get(this.loadedName + "_path_" + e);
                                if (this.options.isEvalSupported && c.value) {
                                    var s, o = "";
                                    for (i = 0, r = a.length; i < r; i++) n = a[i], s = void 0 !== n.args ? n.args.join(",") : "", o += "c." + n.cmd + "(" + s + ");\n";
                                    this.compiledGlyphs[e] = new Function("c", "size", o)
                                } else this.compiledGlyphs[e] = function(t, e) {
                                    for (i = 0, r = a.length; i < r; i++) n = a[i], "scale" === n.cmd && (n.args = [e, -e]), t[n.cmd].apply(t, n.args)
                                }
                            }
                            return this.compiledGlyphs[e]
                        }
                    }, t
                }();
            t.FontFaceObject = l, t.FontLoader = n
        }),
        function(t, e) {
            e(t.pdfjsDisplayMetadata = {}, t.pdfjsSharedUtil)
        }(this, function(t, e) {
            function n(t) {
                return t.replace(/>\\376\\377([^<]+)/g, function(t, e) {
                    for (var n = e.replace(/\\([0-3])([0-7])([0-7])/g, function(t, e, n, i) {
                            return String.fromCharCode(64 * e + 8 * n + 1 * i)
                        }), i = "", r = 0; r < n.length; r += 2) {
                        var a = 256 * n.charCodeAt(r) + n.charCodeAt(r + 1);
                        i += "&#x" + (65536 + a).toString(16).substring(1) + ";"
                    }
                    return ">" + i
                })
            }

            function i(t) {
                if ("string" == typeof t) {
                    t = n(t);
                    t = (new DOMParser).parseFromString(t, "application/xml")
                } else t instanceof Document || r("Metadata: Invalid metadata object");
                this.metaDocument = t, this.metadata = Object.create(null), this.parse()
            }
            var r = e.error;
            i.prototype = {
                parse: function() {
                    var t = this.metaDocument,
                        e = t.documentElement;
                    if ("rdf:rdf" !== e.nodeName.toLowerCase())
                        for (e = e.firstChild; e && "rdf:rdf" !== e.nodeName.toLowerCase();) e = e.nextSibling;
                    var n = e ? e.nodeName.toLowerCase() : null;
                    if (e && "rdf:rdf" === n && e.hasChildNodes()) {
                        var i, r, a, s, o, c, l, h = e.childNodes;
                        for (s = 0, c = h.length; s < c; s++)
                            if (i = h[s], "rdf:description" === i.nodeName.toLowerCase())
                                for (o = 0, l = i.childNodes.length; o < l; o++) "#text" !== i.childNodes[o].nodeName.toLowerCase() && (r = i.childNodes[o], a = r.nodeName.toLowerCase(), this.metadata[a] = r.textContent.trim())
                    }
                },
                get: function(t) {
                    return this.metadata[t] || null
                },
                has: function(t) {
                    return void 0 !== this.metadata[t]
                }
            }, t.Metadata = i
        }),
        function(t, e) {
            e(t.pdfjsDisplaySVG = {}, t.pdfjsSharedUtil)
        }(this, function(t, e) {
            var n = e.FONT_IDENTITY_MATRIX,
                i = e.IDENTITY_MATRIX,
                r = e.ImageKind,
                a = e.OPS,
                s = e.Util,
                o = e.isNum,
                c = e.isArray,
                l = e.warn,
                h = e.createObjectURL,
                u = {
                    fontStyle: "normal",
                    fontWeight: "normal",
                    fillColor: "#000000"
                },
                d = function() {
                    function t(t, e, n) {
                        for (var i = -1, r = e; r < n; r++) {
                            i = i >>> 8 ^ s[255 & (i ^ t[r])]
                        }
                        return i ^ -1
                    }

                    function e(e, n, i, r) {
                        var a = r,
                            s = n.length;
                        i[a] = s >> 24 & 255, i[a + 1] = s >> 16 & 255, i[a + 2] = s >> 8 & 255, i[a + 3] = 255 & s, a += 4, i[a] = 255 & e.charCodeAt(0), i[a + 1] = 255 & e.charCodeAt(1), i[a + 2] = 255 & e.charCodeAt(2), i[a + 3] = 255 & e.charCodeAt(3), a += 4, i.set(n, a), a += n.length;
                        var o = t(i, r + 4, a);
                        i[a] = o >> 24 & 255, i[a + 1] = o >> 16 & 255, i[a + 2] = o >> 8 & 255, i[a + 3] = 255 & o
                    }

                    function n(t, e, n) {
                        for (var i = 1, r = 0, a = e; a < n; ++a) i = (i + (255 & t[a])) % 65521, r = (r + i) % 65521;
                        return r << 16 | i
                    }

                    function i(t, i, s) {
                        var o, c, l, u = t.width,
                            d = t.height,
                            p = t.data;
                        switch (i) {
                            case r.GRAYSCALE_1BPP:
                                c = 0, o = 1, l = u + 7 >> 3;
                                break;
                            case r.RGB_24BPP:
                                c = 2, o = 8, l = 3 * u;
                                break;
                            case r.RGBA_32BPP:
                                c = 6, o = 8, l = 4 * u;
                                break;
                            default:
                                throw new Error("invalid format")
                        }
                        var f, g, m = new Uint8Array((1 + l) * d),
                            A = 0,
                            v = 0;
                        for (f = 0; f < d; ++f) m[A++] = 0, m.set(p.subarray(v, v + l), A), v += l, A += l;
                        if (i === r.GRAYSCALE_1BPP)
                            for (A = 0, f = 0; f < d; f++)
                                for (A++, g = 0; g < l; g++) m[A++] ^= 255;
                        var b = new Uint8Array([u >> 24 & 255, u >> 16 & 255, u >> 8 & 255, 255 & u, d >> 24 & 255, d >> 16 & 255, d >> 8 & 255, 255 & d, o, c, 0, 0, 0]),
                            y = m.length,
                            x = Math.ceil(y / 65535),
                            S = new Uint8Array(2 + y + 5 * x + 4),
                            k = 0;
                        S[k++] = 120, S[k++] = 156;
                        for (var C = 0; y > 65535;) S[k++] = 0, S[k++] = 255, S[k++] = 255, S[k++] = 0, S[k++] = 0, S.set(m.subarray(C, C + 65535), k), k += 65535, C += 65535, y -= 65535;
                        S[k++] = 1, S[k++] = 255 & y, S[k++] = y >> 8 & 255, S[k++] = 255 & ~y, S[k++] = (65535 & ~y) >> 8 & 255, S.set(m.subarray(C), k), k += m.length - C;
                        var _ = n(m, 0, m.length);
                        S[k++] = _ >> 24 & 255, S[k++] = _ >> 16 & 255, S[k++] = _ >> 8 & 255, S[k++] = 255 & _;
                        var w = a.length + 36 + b.length + S.length,
                            T = new Uint8Array(w),
                            L = 0;
                        return T.set(a, L), L += a.length, e("IHDR", b, T, L), L += 12 + b.length, e("IDATA", S, T, L), L += 12 + S.length, e("IEND", new Uint8Array(0), T, L), h(T, "image/png", s)
                    }
                    for (var a = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), s = new Int32Array(256), o = 0; o < 256; o++) {
                        for (var c = o, l = 0; l < 8; l++) c = 1 & c ? 3988292384 ^ c >> 1 & 2147483647 : c >> 1 & 2147483647;
                        s[o] = c
                    }
                    return function(t, e) {
                        return i(t, void 0 === t.kind ? r.GRAYSCALE_1BPP : t.kind, e)
                    }
                }(),
                p = function() {
                    function t() {
                        this.fontSizeScale = 1, this.fontWeight = u.fontWeight, this.fontSize = 0, this.textMatrix = i, this.fontMatrix = n, this.leading = 0, this.x = 0, this.y = 0, this.lineX = 0, this.lineY = 0, this.charSpacing = 0, this.wordSpacing = 0, this.textHScale = 1, this.textRise = 0, this.fillColor = u.fillColor, this.strokeColor = "#000000", this.fillAlpha = 1, this.strokeAlpha = 1, this.lineWidth = 1, this.lineJoin = "", this.lineCap = "", this.miterLimit = 0, this.dashArray = [], this.dashPhase = 0, this.dependencies = [], this.clipId = "", this.pendingClip = !1, this.maskId = ""
                    }
                    return t.prototype = {
                        clone: function() {
                            return Object.create(this)
                        },
                        setCurrentPoint: function(t, e) {
                            this.x = t, this.y = e
                        }
                    }, t
                }(),
                f = function() {
                    function t(t, e) {
                        var n = document.createElementNS("http://www.w3.org/2000/svg", "svg:svg");
                        return n.setAttributeNS(null, "version", "1.1"), n.setAttributeNS(null, "width", t + "px"), n.setAttributeNS(null, "height", e + "px"), n.setAttributeNS(null, "viewBox", "0 0 " + t + " " + e), n
                    }

                    function e(t) {
                        for (var e = [], n = [], i = t.length, r = 0; r < i; r++) "save" !== t[r].fn ? "restore" === t[r].fn ? e = n.pop() : e.push(t[r]) : (e.push({
                            fnId: 92,
                            fn: "group",
                            items: []
                        }), n.push(e), e = e[e.length - 1].items);
                        return e
                    }

                    function r(t) {
                        if (t === (0 | t)) return t.toString();
                        var e = t.toFixed(10),
                            n = e.length - 1;
                        if ("0" !== e[n]) return e;
                        do n--; while ("0" === e[n]);
                        return e.substr(0, "." === e[n] ? n : n + 1)
                    }

                    function f(t) {
                        if (0 === t[4] && 0 === t[5]) {
                            if (0 === t[1] && 0 === t[2]) return 1 === t[0] && 1 === t[3] ? "" : "scale(" + r(t[0]) + " " + r(t[3]) + ")";
                            if (t[0] === t[3] && t[1] === -t[2]) {
                                return "rotate(" + r(180 * Math.acos(t[0]) / Math.PI) + ")"
                            }
                        } else if (1 === t[0] && 0 === t[1] && 0 === t[2] && 1 === t[3]) return "translate(" + r(t[4]) + " " + r(t[5]) + ")";
                        return "matrix(" + r(t[0]) + " " + r(t[1]) + " " + r(t[2]) + " " + r(t[3]) + " " + r(t[4]) + " " + r(t[5]) + ")"
                    }

                    function g(t, e, n) {
                        this.current = new p, this.transformMatrix = i, this.transformStack = [], this.extraStack = [], this.commonObjs = t, this.objs = e, this.pendingEOFill = !1, this.embedFonts = !1, this.embeddedFonts = Object.create(null), this.cssStyle = null, this.forceDataSchema = !!n
                    }
                    var m = "http://www.w3.org/2000/svg",
                        A = "http://www.w3.org/1999/xlink",
                        v = ["butt", "round", "square"],
                        b = ["miter", "round", "bevel"],
                        y = 0,
                        x = 0;
                    return g.prototype = {
                        save: function() {
                            this.transformStack.push(this.transformMatrix);
                            var t = this.current;
                            this.extraStack.push(t), this.current = t.clone()
                        },
                        restore: function() {
                            this.transformMatrix = this.transformStack.pop(), this.current = this.extraStack.pop(), this.tgrp = document.createElementNS(m, "svg:g"), this.tgrp.setAttributeNS(null, "transform", f(this.transformMatrix)), this.pgrp.appendChild(this.tgrp)
                        },
                        group: function(t) {
                            this.save(), this.executeOpTree(t), this.restore()
                        },
                        loadDependencies: function(t) {
                            for (var e = t.fnArray, n = e.length, i = t.argsArray, r = this, s = 0; s < n; s++)
                                if (a.dependency === e[s])
                                    for (var o = i[s], c = 0, l = o.length; c < l; c++) {
                                        var h, u = o[c],
                                            d = "g_" === u.substring(0, 2);
                                        h = d ? new Promise(function(t) {
                                            r.commonObjs.get(u, t)
                                        }) : new Promise(function(t) {
                                            r.objs.get(u, t)
                                        }), this.current.dependencies.push(h)
                                    }
                            return Promise.all(this.current.dependencies)
                        },
                        transform: function(t, e, n, i, r, a) {
                            var o = [t, e, n, i, r, a];
                            this.transformMatrix = s.transform(this.transformMatrix, o), this.tgrp = document.createElementNS(m, "svg:g"), this.tgrp.setAttributeNS(null, "transform", f(this.transformMatrix))
                        },
                        getSVG: function(e, n) {
                            return this.svg = t(n.width, n.height), this.viewport = n, this.loadDependencies(e).then(function() {
                                this.transformMatrix = i, this.pgrp = document.createElementNS(m, "svg:g"), this.pgrp.setAttributeNS(null, "transform", f(n.transform)), this.tgrp = document.createElementNS(m, "svg:g"), this.tgrp.setAttributeNS(null, "transform", f(this.transformMatrix)), this.defs = document.createElementNS(m, "svg:defs"), this.pgrp.appendChild(this.defs), this.pgrp.appendChild(this.tgrp), this.svg.appendChild(this.pgrp);
                                var t = this.convertOpList(e);
                                return this.executeOpTree(t), this.svg
                            }.bind(this))
                        },
                        convertOpList: function(t) {
                            var n = t.argsArray,
                                i = t.fnArray,
                                r = i.length,
                                s = [],
                                o = [];
                            for (var c in a) s[a[c]] = c;
                            for (var l = 0; l < r; l++) {
                                var h = i[l];
                                o.push({
                                    fnId: h,
                                    fn: s[h],
                                    args: n[l]
                                })
                            }
                            return e(o)
                        },
                        executeOpTree: function(t) {
                            for (var e = t.length, n = 0; n < e; n++) {
                                var i = t[n].fn,
                                    r = t[n].fnId,
                                    s = t[n].args;
                                switch (0 | r) {
                                    case a.beginText:
                                        this.beginText();
                                        break;
                                    case a.setLeading:
                                        this.setLeading(s);
                                        break;
                                    case a.setLeadingMoveText:
                                        this.setLeadingMoveText(s[0], s[1]);
                                        break;
                                    case a.setFont:
                                        this.setFont(s);
                                        break;
                                    case a.showText:
                                        this.showText(s[0]);
                                        break;
                                    case a.showSpacedText:
                                        this.showText(s[0]);
                                        break;
                                    case a.endText:
                                        this.endText();
                                        break;
                                    case a.moveText:
                                        this.moveText(s[0], s[1]);
                                        break;
                                    case a.setCharSpacing:
                                        this.setCharSpacing(s[0]);
                                        break;
                                    case a.setWordSpacing:
                                        this.setWordSpacing(s[0]);
                                        break;
                                    case a.setHScale:
                                        this.setHScale(s[0]);
                                        break;
                                    case a.setTextMatrix:
                                        this.setTextMatrix(s[0], s[1], s[2], s[3], s[4], s[5]);
                                        break;
                                    case a.setLineWidth:
                                        this.setLineWidth(s[0]);
                                        break;
                                    case a.setLineJoin:
                                        this.setLineJoin(s[0]);
                                        break;
                                    case a.setLineCap:
                                        this.setLineCap(s[0]);
                                        break;
                                    case a.setMiterLimit:
                                        this.setMiterLimit(s[0]);
                                        break;
                                    case a.setFillRGBColor:
                                        this.setFillRGBColor(s[0], s[1], s[2]);
                                        break;
                                    case a.setStrokeRGBColor:
                                        this.setStrokeRGBColor(s[0], s[1], s[2]);
                                        break;
                                    case a.setDash:
                                        this.setDash(s[0], s[1]);
                                        break;
                                    case a.setGState:
                                        this.setGState(s[0]);
                                        break;
                                    case a.fill:
                                        this.fill();
                                        break;
                                    case a.eoFill:
                                        this.eoFill();
                                        break;
                                    case a.stroke:
                                        this.stroke();
                                        break;
                                    case a.fillStroke:
                                        this.fillStroke();
                                        break;
                                    case a.eoFillStroke:
                                        this.eoFillStroke();
                                        break;
                                    case a.clip:
                                        this.clip("nonzero");
                                        break;
                                    case a.eoClip:
                                        this.clip("evenodd");
                                        break;
                                    case a.paintSolidColorImageMask:
                                        this.paintSolidColorImageMask();
                                        break;
                                    case a.paintJpegXObject:
                                        this.paintJpegXObject(s[0], s[1], s[2]);
                                        break;
                                    case a.paintImageXObject:
                                        this.paintImageXObject(s[0]);
                                        break;
                                    case a.paintInlineImageXObject:
                                        this.paintInlineImageXObject(s[0]);
                                        break;
                                    case a.paintImageMaskXObject:
                                        this.paintImageMaskXObject(s[0]);
                                        break;
                                    case a.paintFormXObjectBegin:
                                        this.paintFormXObjectBegin(s[0], s[1]);
                                        break;
                                    case a.paintFormXObjectEnd:
                                        this.paintFormXObjectEnd();
                                        break;
                                    case a.closePath:
                                        this.closePath();
                                        break;
                                    case a.closeStroke:
                                        this.closeStroke();
                                        break;
                                    case a.closeFillStroke:
                                        this.closeFillStroke();
                                        break;
                                    case a.nextLine:
                                        this.nextLine();
                                        break;
                                    case a.transform:
                                        this.transform(s[0], s[1], s[2], s[3], s[4], s[5]);
                                        break;
                                    case a.constructPath:
                                        this.constructPath(s[0], s[1]);
                                        break;
                                    case a.endPath:
                                        this.endPath();
                                        break;
                                    case 92:
                                        this.group(t[n].items);
                                        break;
                                    default:
                                        l("Unimplemented method " + i)
                                }
                            }
                        },
                        setWordSpacing: function(t) {
                            this.current.wordSpacing = t
                        },
                        setCharSpacing: function(t) {
                            this.current.charSpacing = t
                        },
                        nextLine: function() {
                            this.moveText(0, this.current.leading)
                        },
                        setTextMatrix: function(t, e, n, i, a, s) {
                            var o = this.current;
                            this.current.textMatrix = this.current.lineMatrix = [t, e, n, i, a, s], this.current.x = this.current.lineX = 0, this.current.y = this.current.lineY = 0, o.xcoords = [], o.tspan = document.createElementNS(m, "svg:tspan"), o.tspan.setAttributeNS(null, "font-family", o.fontFamily), o.tspan.setAttributeNS(null, "font-size", r(o.fontSize) + "px"), o.tspan.setAttributeNS(null, "y", r(-o.y)), o.txtElement = document.createElementNS(m, "svg:text"), o.txtElement.appendChild(o.tspan)
                        },
                        beginText: function() {
                            this.current.x = this.current.lineX = 0, this.current.y = this.current.lineY = 0, this.current.textMatrix = i, this.current.lineMatrix = i, this.current.tspan = document.createElementNS(m, "svg:tspan"), this.current.txtElement = document.createElementNS(m, "svg:text"), this.current.txtgrp = document.createElementNS(m, "svg:g"), this.current.xcoords = []
                        },
                        moveText: function(t, e) {
                            var n = this.current;
                            this.current.x = this.current.lineX += t, this.current.y = this.current.lineY += e, n.xcoords = [], n.tspan = document.createElementNS(m, "svg:tspan"), n.tspan.setAttributeNS(null, "font-family", n.fontFamily), n.tspan.setAttributeNS(null, "font-size", r(n.fontSize) + "px"), n.tspan.setAttributeNS(null, "y", r(-n.y))
                        },
                        showText: function(t) {
                            var e = this.current,
                                n = e.font,
                                i = e.fontSize;
                            if (0 !== i) {
                                var a, s = e.charSpacing,
                                    c = e.wordSpacing,
                                    l = e.fontDirection,
                                    h = e.textHScale * l,
                                    d = t.length,
                                    p = n.vertical,
                                    g = i * e.fontMatrix[0],
                                    m = 0;
                                for (a = 0; a < d; ++a) {
                                    var A = t[a];
                                    if (null !== A)
                                        if (o(A)) m += -A * i * .001;
                                        else {
                                            e.xcoords.push(e.x + m * h);
                                            var v = A.width,
                                                b = A.fontChar,
                                                y = v * g + s * l;
                                            m += y, e.tspan.textContent += b
                                        }
                                    else m += l * c
                                }
                                p ? e.y -= m * h : e.x += m * h, e.tspan.setAttributeNS(null, "x", e.xcoords.map(r).join(" ")), e.tspan.setAttributeNS(null, "y", r(-e.y)), e.tspan.setAttributeNS(null, "font-family", e.fontFamily), e.tspan.setAttributeNS(null, "font-size", r(e.fontSize) + "px"), e.fontStyle !== u.fontStyle && e.tspan.setAttributeNS(null, "font-style", e.fontStyle), e.fontWeight !== u.fontWeight && e.tspan.setAttributeNS(null, "font-weight", e.fontWeight), e.fillColor !== u.fillColor && e.tspan.setAttributeNS(null, "fill", e.fillColor), e.txtElement.setAttributeNS(null, "transform", f(e.textMatrix) + " scale(1, -1)"), e.txtElement.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve"), e.txtElement.appendChild(e.tspan), e.txtgrp.appendChild(e.txtElement), this.tgrp.appendChild(e.txtElement)
                            }
                        },
                        setLeadingMoveText: function(t, e) {
                            this.setLeading(-e), this.moveText(t, e)
                        },
                        addFontStyle: function(t) {
                            this.cssStyle || (this.cssStyle = document.createElementNS(m, "svg:style"), this.cssStyle.setAttributeNS(null, "type", "text/css"), this.defs.appendChild(this.cssStyle));
                            var e = h(t.data, t.mimetype, this.forceDataSchema);
                            this.cssStyle.textContent += '@font-face { font-family: "' + t.loadedName + '"; src: url(' + e + "); }\n"
                        },
                        setFont: function(t) {
                            var e = this.current,
                                i = this.commonObjs.get(t[0]),
                                a = t[1];
                            this.current.font = i, this.embedFonts && i.data && !this.embeddedFonts[i.loadedName] && (this.addFontStyle(i), this.embeddedFonts[i.loadedName] = i), e.fontMatrix = i.fontMatrix ? i.fontMatrix : n;
                            var s = i.black ? i.bold ? "bolder" : "bold" : i.bold ? "bold" : "normal",
                                o = i.italic ? "italic" : "normal";
                            a < 0 ? (a = -a, e.fontDirection = -1) : e.fontDirection = 1, e.fontSize = a, e.fontFamily = i.loadedName, e.fontWeight = s, e.fontStyle = o, e.tspan = document.createElementNS(m, "svg:tspan"), e.tspan.setAttributeNS(null, "y", r(-e.y)), e.xcoords = []
                        },
                        endText: function() {
                            this.current.pendingClip ? (this.cgrp.appendChild(this.tgrp), this.pgrp.appendChild(this.cgrp)) : this.pgrp.appendChild(this.tgrp), this.tgrp = document.createElementNS(m, "svg:g"), this.tgrp.setAttributeNS(null, "transform", f(this.transformMatrix))
                        },
                        setLineWidth: function(t) {
                            this.current.lineWidth = t
                        },
                        setLineCap: function(t) {
                            this.current.lineCap = v[t]
                        },
                        setLineJoin: function(t) {
                            this.current.lineJoin = b[t]
                        },
                        setMiterLimit: function(t) {
                            this.current.miterLimit = t
                        },
                        setStrokeRGBColor: function(t, e, n) {
                            var i = s.makeCssRgb(t, e, n);
                            this.current.strokeColor = i
                        },
                        setFillRGBColor: function(t, e, n) {
                            var i = s.makeCssRgb(t, e, n);
                            this.current.fillColor = i, this.current.tspan = document.createElementNS(m, "svg:tspan"), this.current.xcoords = []
                        },
                        setDash: function(t, e) {
                            this.current.dashArray = t, this.current.dashPhase = e
                        },
                        constructPath: function(t, e) {
                            var n = this.current,
                                i = n.x,
                                s = n.y;
                            n.path = document.createElementNS(m, "svg:path");
                            for (var o = [], c = t.length, l = 0, h = 0; l < c; l++) switch (0 | t[l]) {
                                case a.rectangle:
                                    i = e[h++], s = e[h++];
                                    var u = e[h++],
                                        d = e[h++],
                                        p = i + u,
                                        f = s + d;
                                    o.push("M", r(i), r(s), "L", r(p), r(s), "L", r(p), r(f), "L", r(i), r(f), "Z");
                                    break;
                                case a.moveTo:
                                    i = e[h++], s = e[h++], o.push("M", r(i), r(s));
                                    break;
                                case a.lineTo:
                                    i = e[h++], s = e[h++], o.push("L", r(i), r(s));
                                    break;
                                case a.curveTo:
                                    i = e[h + 4], s = e[h + 5], o.push("C", r(e[h]), r(e[h + 1]), r(e[h + 2]), r(e[h + 3]), r(i), r(s)), h += 6;
                                    break;
                                case a.curveTo2:
                                    i = e[h + 2], s = e[h + 3], o.push("C", r(i), r(s), r(e[h]), r(e[h + 1]), r(e[h + 2]), r(e[h + 3])), h += 4;
                                    break;
                                case a.curveTo3:
                                    i = e[h + 2], s = e[h + 3], o.push("C", r(e[h]), r(e[h + 1]), r(i), r(s), r(i), r(s)), h += 4;
                                    break;
                                case a.closePath:
                                    o.push("Z")
                            }
                            n.path.setAttributeNS(null, "d", o.join(" ")), n.path.setAttributeNS(null, "stroke-miterlimit", r(n.miterLimit)), n.path.setAttributeNS(null, "stroke-linecap", n.lineCap), n.path.setAttributeNS(null, "stroke-linejoin", n.lineJoin), n.path.setAttributeNS(null, "stroke-width", r(n.lineWidth) + "px"), n.path.setAttributeNS(null, "stroke-dasharray", n.dashArray.map(r).join(" ")), n.path.setAttributeNS(null, "stroke-dashoffset", r(n.dashPhase) + "px"), n.path.setAttributeNS(null, "fill", "none"), this.tgrp.appendChild(n.path), n.pendingClip ? (this.cgrp.appendChild(this.tgrp), this.pgrp.appendChild(this.cgrp)) : this.pgrp.appendChild(this.tgrp), n.element = n.path, n.setCurrentPoint(i, s)
                        },
                        endPath: function() {
                            this.current.pendingClip ? (this.cgrp.appendChild(this.tgrp), this.pgrp.appendChild(this.cgrp)) : this.pgrp.appendChild(this.tgrp), this.tgrp = document.createElementNS(m, "svg:g"), this.tgrp.setAttributeNS(null, "transform", f(this.transformMatrix))
                        },
                        clip: function(t) {
                            var e = this.current;
                            e.clipId = "clippath" + y, y++, this.clippath = document.createElementNS(m, "svg:clipPath"), this.clippath.setAttributeNS(null, "id", e.clipId);
                            var n = e.element.cloneNode();
                            "evenodd" === t ? n.setAttributeNS(null, "clip-rule", "evenodd") : n.setAttributeNS(null, "clip-rule", "nonzero"), this.clippath.setAttributeNS(null, "transform", f(this.transformMatrix)), this.clippath.appendChild(n), this.defs.appendChild(this.clippath), e.pendingClip = !0, this.cgrp = document.createElementNS(m, "svg:g"), this.cgrp.setAttributeNS(null, "clip-path", "url(#" + e.clipId + ")"), this.pgrp.appendChild(this.cgrp)
                        },
                        closePath: function() {
                            var t = this.current,
                                e = t.path.getAttributeNS(null, "d");
                            e += "Z", t.path.setAttributeNS(null, "d", e)
                        },
                        setLeading: function(t) {
                            this.current.leading = -t
                        },
                        setTextRise: function(t) {
                            this.current.textRise = t
                        },
                        setHScale: function(t) {
                            this.current.textHScale = t / 100
                        },
                        setGState: function(t) {
                            for (var e = 0, n = t.length; e < n; e++) {
                                var i = t[e],
                                    r = i[0],
                                    a = i[1];
                                switch (r) {
                                    case "LW":
                                        this.setLineWidth(a);
                                        break;
                                    case "LC":
                                        this.setLineCap(a);
                                        break;
                                    case "LJ":
                                        this.setLineJoin(a);
                                        break;
                                    case "ML":
                                        this.setMiterLimit(a);
                                        break;
                                    case "D":
                                        this.setDash(a[0], a[1]);
                                        break;
                                    case "RI":
                                        break;
                                    case "FL":
                                        break;
                                    case "Font":
                                        this.setFont(a);
                                        break;
                                    case "CA":
                                        break;
                                    case "ca":
                                        break;
                                    case "BM":
                                        break;
                                    case "SMask":
                                }
                            }
                        },
                        fill: function() {
                            var t = this.current;
                            t.element.setAttributeNS(null, "fill", t.fillColor)
                        },
                        stroke: function() {
                            var t = this.current;
                            t.element.setAttributeNS(null, "stroke", t.strokeColor), t.element.setAttributeNS(null, "fill", "none")
                        },
                        eoFill: function() {
                            var t = this.current;
                            t.element.setAttributeNS(null, "fill", t.fillColor), t.element.setAttributeNS(null, "fill-rule", "evenodd")
                        },
                        fillStroke: function() {
                            this.stroke(), this.fill()
                        },
                        eoFillStroke: function() {
                            this.current.element.setAttributeNS(null, "fill-rule", "evenodd"), this.fillStroke()
                        },
                        closeStroke: function() {
                            this.closePath(), this.stroke()
                        },
                        closeFillStroke: function() {
                            this.closePath(), this.fillStroke()
                        },
                        paintSolidColorImageMask: function() {
                            var t = this.current,
                                e = document.createElementNS(m, "svg:rect");
                            e.setAttributeNS(null, "x", "0"), e.setAttributeNS(null, "y", "0"), e.setAttributeNS(null, "width", "1px"), e.setAttributeNS(null, "height", "1px"), e.setAttributeNS(null, "fill", t.fillColor), this.tgrp.appendChild(e)
                        },
                        paintJpegXObject: function(t, e, n) {
                            var i = this.current,
                                a = this.objs.get(t),
                                s = document.createElementNS(m, "svg:image");
                            s.setAttributeNS(A, "xlink:href", a.src), s.setAttributeNS(null, "width", a.width + "px"), s.setAttributeNS(null, "height", a.height + "px"), s.setAttributeNS(null, "x", "0"), s.setAttributeNS(null, "y", r(-n)), s.setAttributeNS(null, "transform", "scale(" + r(1 / e) + " " + r(-1 / n) + ")"), this.tgrp.appendChild(s), i.pendingClip ? (this.cgrp.appendChild(this.tgrp), this.pgrp.appendChild(this.cgrp)) : this.pgrp.appendChild(this.tgrp)
                        },
                        paintImageXObject: function(t) {
                            var e = this.objs.get(t);
                            if (!e) return void l("Dependent image isn't ready yet");
                            this.paintInlineImageXObject(e)
                        },
                        paintInlineImageXObject: function(t, e) {
                            var n = this.current,
                                i = t.width,
                                a = t.height,
                                s = d(t, this.forceDataSchema),
                                o = document.createElementNS(m, "svg:rect");
                            o.setAttributeNS(null, "x", "0"), o.setAttributeNS(null, "y", "0"), o.setAttributeNS(null, "width", r(i)), o.setAttributeNS(null, "height", r(a)), n.element = o, this.clip("nonzero");
                            var c = document.createElementNS(m, "svg:image");
                            c.setAttributeNS(A, "xlink:href", s), c.setAttributeNS(null, "x", "0"), c.setAttributeNS(null, "y", r(-a)), c.setAttributeNS(null, "width", r(i) + "px"), c.setAttributeNS(null, "height", r(a) + "px"), c.setAttributeNS(null, "transform", "scale(" + r(1 / i) + " " + r(-1 / a) + ")"), e ? e.appendChild(c) : this.tgrp.appendChild(c), n.pendingClip ? (this.cgrp.appendChild(this.tgrp), this.pgrp.appendChild(this.cgrp)) : this.pgrp.appendChild(this.tgrp)
                        },
                        paintImageMaskXObject: function(t) {
                            var e = this.current,
                                n = t.width,
                                i = t.height,
                                a = e.fillColor;
                            e.maskId = "mask" + x++;
                            var s = document.createElementNS(m, "svg:mask");
                            s.setAttributeNS(null, "id", e.maskId);
                            var o = document.createElementNS(m, "svg:rect");
                            o.setAttributeNS(null, "x", "0"), o.setAttributeNS(null, "y", "0"), o.setAttributeNS(null, "width", r(n)), o.setAttributeNS(null, "height", r(i)), o.setAttributeNS(null, "fill", a), o.setAttributeNS(null, "mask", "url(#" + e.maskId + ")"), this.defs.appendChild(s), this.tgrp.appendChild(o), this.paintInlineImageXObject(t, s)
                        },
                        paintFormXObjectBegin: function(t, e) {
                            if (this.save(), c(t) && 6 === t.length && this.transform(t[0], t[1], t[2], t[3], t[4], t[5]), c(e) && 4 === e.length) {
                                var n = e[2] - e[0],
                                    i = e[3] - e[1],
                                    a = document.createElementNS(m, "svg:rect");
                                a.setAttributeNS(null, "x", e[0]), a.setAttributeNS(null, "y", e[1]), a.setAttributeNS(null, "width", r(n)), a.setAttributeNS(null, "height", r(i)), this.current.element = a, this.clip("nonzero"), this.endPath()
                            }
                        },
                        paintFormXObjectEnd: function() {
                            this.restore()
                        }
                    }, g
                }();
            t.SVGGraphics = f
        }),
        function(t, e) {
            e(t.pdfjsDisplayAnnotationLayer = {}, t.pdfjsSharedUtil, t.pdfjsDisplayDOMUtils)
        }(this, function(t, e, n) {
            function i() {}
            var r = e.AnnotationBorderStyleType,
                a = e.AnnotationType,
                s = e.Util,
                o = n.addLinkAttributes,
                c = n.LinkTarget,
                l = n.getFilenameFromUrl,
                h = e.warn,
                u = n.CustomStyle,
                d = n.getDefaultSetting;
            i.prototype = {
                create: function(t) {
                    switch (t.data.annotationType) {
                        case a.LINK:
                            return new f(t);
                        case a.TEXT:
                            return new g(t);
                        case a.WIDGET:
                            switch (t.data.fieldType) {
                                case "Tx":
                                    return new A(t)
                            }
                            return new m(t);
                        case a.POPUP:
                            return new v(t);
                        case a.HIGHLIGHT:
                            return new y(t);
                        case a.UNDERLINE:
                            return new x(t);
                        case a.SQUIGGLY:
                            return new S(t);
                        case a.STRIKEOUT:
                            return new k(t);
                        case a.FILEATTACHMENT:
                            return new C(t);
                        default:
                            return new p(t)
                    }
                }
            };
            var p = function() {
                    function t(t, e) {
                        this.isRenderable = e || !1, this.data = t.data, this.layer = t.layer, this.page = t.page, this.viewport = t.viewport, this.linkService = t.linkService, this.downloadManager = t.downloadManager, this.imageResourcesPath = t.imageResourcesPath, this.renderInteractiveForms = t.renderInteractiveForms, e && (this.container = this._createContainer())
                    }
                    return t.prototype = {
                        _createContainer: function() {
                            var t = this.data,
                                e = this.page,
                                n = this.viewport,
                                i = document.createElement("section"),
                                a = t.rect[2] - t.rect[0],
                                o = t.rect[3] - t.rect[1];
                            i.setAttribute("data-annotation-id", t.id);
                            var c = s.normalizeRect([t.rect[0], e.view[3] - t.rect[1] + e.view[1], t.rect[2], e.view[3] - t.rect[3] + e.view[1]]);
                            if (u.setProp("transform", i, "matrix(" + n.transform.join(",") + ")"), u.setProp("transformOrigin", i, -c[0] + "px " + -c[1] + "px"), t.borderStyle.width > 0) {
                                i.style.borderWidth = t.borderStyle.width + "px", t.borderStyle.style !== r.UNDERLINE && (a -= 2 * t.borderStyle.width, o -= 2 * t.borderStyle.width);
                                var l = t.borderStyle.horizontalCornerRadius,
                                    d = t.borderStyle.verticalCornerRadius;
                                if (l > 0 || d > 0) {
                                    var p = l + "px / " + d + "px";
                                    u.setProp("borderRadius", i, p)
                                }
                                switch (t.borderStyle.style) {
                                    case r.SOLID:
                                        i.style.borderStyle = "solid";
                                        break;
                                    case r.DASHED:
                                        i.style.borderStyle = "dashed";
                                        break;
                                    case r.BEVELED:
                                        h("Unimplemented border style: beveled");
                                        break;
                                    case r.INSET:
                                        h("Unimplemented border style: inset");
                                        break;
                                    case r.UNDERLINE:
                                        i.style.borderBottomStyle = "solid"
                                }
                                t.color ? i.style.borderColor = s.makeCssRgb(0 | t.color[0], 0 | t.color[1], 0 | t.color[2]) : i.style.borderWidth = 0
                            }
                            return i.style.left = c[0] + "px", i.style.top = c[1] + "px", i.style.width = a + "px", i.style.height = o + "px", i
                        },
                        _createPopup: function(t, e, n) {
                            e || (e = document.createElement("div"), e.style.height = t.style.height, e.style.width = t.style.width, t.appendChild(e));
                            var i = new b({
                                    container: t,
                                    trigger: e,
                                    color: n.color,
                                    title: n.title,
                                    contents: n.contents,
                                    hideWrapper: !0
                                }),
                                r = i.render();
                            r.style.left = t.style.width, t.appendChild(r)
                        },
                        render: function() {
                            throw new Error("Abstract method AnnotationElement.render called")
                        }
                    }, t
                }(),
                f = function() {
                    function t(t) {
                        p.call(this, t, !0)
                    }
                    return s.inherit(t, p, {
                        render: function() {
                            this.container.className = "linkAnnotation";
                            var t = document.createElement("a");
                            return o(t, {
                                url: this.data.url,
                                target: this.data.newWindow ? c.BLANK : void 0
                            }), this.data.url || (this.data.action ? this._bindNamedAction(t, this.data.action) : this._bindLink(t, this.data.dest || null)), this.container.appendChild(t), this.container
                        },
                        _bindLink: function(t, e) {
                            var n = this;
                            t.href = this.linkService.getDestinationHash(e), t.onclick = function() {
                                return e && n.linkService.navigateTo(e), !1
                            }, e && (t.className = "internalLink")
                        },
                        _bindNamedAction: function(t, e) {
                            var n = this;
                            t.href = this.linkService.getAnchorUrl(""), t.onclick = function() {
                                return n.linkService.executeNamedAction(e), !1
                            }, t.className = "internalLink"
                        }
                    }), t
                }(),
                g = function() {
                    function t(t) {
                        var e = !!(t.data.hasPopup || t.data.title || t.data.contents);
                        p.call(this, t, e)
                    }
                    return s.inherit(t, p, {
                        render: function() {
                            this.container.className = "textAnnotation";
                            var t = document.createElement("img");
                            return t.style.height = this.container.style.height, t.style.width = this.container.style.width, t.src = this.imageResourcesPath + "annotation-" + this.data.name.toLowerCase() + ".svg", t.alt = "[{{type}} Annotation]", t.dataset.l10nId = "text_annotation_type", t.dataset.l10nArgs = JSON.stringify({
                                type: this.data.name
                            }), this.data.hasPopup || this._createPopup(this.container, t, this.data), this.container.appendChild(t), this.container
                        }
                    }), t
                }(),
                m = function() {
                    function t(t) {
                        var e = t.renderInteractiveForms || !t.data.hasAppearance && !!t.data.fieldValue;
                        p.call(this, t, e)
                    }
                    return s.inherit(t, p, {
                        render: function() {
                            return this.container
                        }
                    }), t
                }(),
                A = function() {
                    function t(t) {
                        m.call(this, t)
                    }
                    var e = ["left", "center", "right"];
                    return s.inherit(t, m, {
                        render: function() {
                            this.container.className = "textWidgetAnnotation";
                            var t = null;
                            if (this.renderInteractiveForms) {
                                if (this.data.multiLine ? (t = document.createElement("textarea"), t.textContent = this.data.fieldValue) : (t = document.createElement("input"), t.type = "text", t.setAttribute("value", this.data.fieldValue)), t.disabled = this.data.readOnly, null !== this.data.maxLen && (t.maxLength = this.data.maxLen), this.data.comb) {
                                    var n = this.data.rect[2] - this.data.rect[0],
                                        i = n / this.data.maxLen;
                                    t.classList.add("comb"), t.style.letterSpacing = "calc(" + i + "px - 1ch)"
                                }
                            } else {
                                t = document.createElement("div"), t.textContent = this.data.fieldValue, t.style.verticalAlign = "middle", t.style.display = "table-cell";
                                var r = null;
                                this.data.fontRefName && (r = this.page.commonObjs.getData(this.data.fontRefName)), this._setTextStyle(t, r)
                            }
                            return null !== this.data.textAlignment && (t.style.textAlign = e[this.data.textAlignment]), this.container.appendChild(t), this.container
                        },
                        _setTextStyle: function(t, e) {
                            var n = t.style;
                            if (n.fontSize = this.data.fontSize + "px", n.direction = this.data.fontDirection < 0 ? "rtl" : "ltr", e) {
                                n.fontWeight = e.black ? e.bold ? "900" : "bold" : e.bold ? "bold" : "normal", n.fontStyle = e.italic ? "italic" : "normal";
                                var i = e.loadedName ? '"' + e.loadedName + '", ' : "",
                                    r = e.fallbackName || "Helvetica, sans-serif";
                                n.fontFamily = i + r
                            }
                        }
                    }), t
                }(),
                v = function() {
                    function t(t) {
                        var e = !(!t.data.title && !t.data.contents);
                        p.call(this, t, e)
                    }
                    return s.inherit(t, p, {
                        render: function() {
                            this.container.className = "popupAnnotation";
                            var t = '[data-annotation-id="' + this.data.parentId + '"]',
                                e = this.layer.querySelector(t);
                            if (!e) return this.container;
                            var n = new b({
                                    container: this.container,
                                    trigger: e,
                                    color: this.data.color,
                                    title: this.data.title,
                                    contents: this.data.contents
                                }),
                                i = parseFloat(e.style.left),
                                r = parseFloat(e.style.width);
                            return u.setProp("transformOrigin", this.container, -(i + r) + "px -" + e.style.top), this.container.style.left = i + r + "px", this.container.appendChild(n.render()), this.container
                        }
                    }), t
                }(),
                b = function() {
                    function t(t) {
                        this.container = t.container, this.trigger = t.trigger, this.color = t.color, this.title = t.title, this.contents = t.contents, this.hideWrapper = t.hideWrapper || !1, this.pinned = !1
                    }
                    return t.prototype = {
                        render: function() {
                            var t = document.createElement("div");
                            t.className = "popupWrapper", this.hideElement = this.hideWrapper ? t : this.container, this.hideElement.setAttribute("hidden", !0);
                            var e = document.createElement("div");
                            e.className = "popup";
                            var n = this.color;
                            if (n) {
                                var i = .7 * (255 - n[0]) + n[0],
                                    r = .7 * (255 - n[1]) + n[1],
                                    a = .7 * (255 - n[2]) + n[2];
                                e.style.backgroundColor = s.makeCssRgb(0 | i, 0 | r, 0 | a)
                            }
                            var o = this._formatContents(this.contents),
                                c = document.createElement("h1");
                            return c.textContent = this.title, this.trigger.addEventListener("click", this._toggle.bind(this)), this.trigger.addEventListener("mouseover", this._show.bind(this, !1)), this.trigger.addEventListener("mouseout", this._hide.bind(this, !1)), e.addEventListener("click", this._hide.bind(this, !0)), e.appendChild(c), e.appendChild(o), t.appendChild(e), t
                        },
                        _formatContents: function(t) {
                            for (var e = document.createElement("p"), n = t.split(/(?:\r\n?|\n)/), i = 0, r = n.length; i < r; ++i) {
                                var a = n[i];
                                e.appendChild(document.createTextNode(a)), i < r - 1 && e.appendChild(document.createElement("br"))
                            }
                            return e
                        },
                        _toggle: function() {
                            this.pinned ? this._hide(!0) : this._show(!0)
                        },
                        _show: function(t) {
                            t && (this.pinned = !0), this.hideElement.hasAttribute("hidden") && (this.hideElement.removeAttribute("hidden"), this.container.style.zIndex += 1)
                        },
                        _hide: function(t) {
                            t && (this.pinned = !1), this.hideElement.hasAttribute("hidden") || this.pinned || (this.hideElement.setAttribute("hidden", !0), this.container.style.zIndex -= 1)
                        }
                    }, t
                }(),
                y = function() {
                    function t(t) {
                        var e = !!(t.data.hasPopup || t.data.title || t.data.contents);
                        p.call(this, t, e)
                    }
                    return s.inherit(t, p, {
                        render: function() {
                            return this.container.className = "highlightAnnotation", this.data.hasPopup || this._createPopup(this.container, null, this.data), this.container
                        }
                    }), t
                }(),
                x = function() {
                    function t(t) {
                        var e = !!(t.data.hasPopup || t.data.title || t.data.contents);
                        p.call(this, t, e)
                    }
                    return s.inherit(t, p, {
                        render: function() {
                            return this.container.className = "underlineAnnotation", this.data.hasPopup || this._createPopup(this.container, null, this.data), this.container
                        }
                    }), t
                }(),
                S = function() {
                    function t(t) {
                        var e = !!(t.data.hasPopup || t.data.title || t.data.contents);
                        p.call(this, t, e)
                    }
                    return s.inherit(t, p, {
                        render: function() {
                            return this.container.className = "squigglyAnnotation", this.data.hasPopup || this._createPopup(this.container, null, this.data), this.container
                        }
                    }), t
                }(),
                k = function() {
                    function t(t) {
                        var e = !!(t.data.hasPopup || t.data.title || t.data.contents);
                        p.call(this, t, e)
                    }
                    return s.inherit(t, p, {
                        render: function() {
                            return this.container.className = "strikeoutAnnotation", this.data.hasPopup || this._createPopup(this.container, null, this.data), this.container
                        }
                    }), t
                }(),
                C = function() {
                    function t(t) {
                        p.call(this, t, !0), this.filename = l(t.data.file.filename), this.content = t.data.file.content
                    }
                    return s.inherit(t, p, {
                        render: function() {
                            this.container.className = "fileAttachmentAnnotation";
                            var t = document.createElement("div");
                            return t.style.height = this.container.style.height, t.style.width = this.container.style.width, t.addEventListener("dblclick", this._download.bind(this)), this.data.hasPopup || !this.data.title && !this.data.contents || this._createPopup(this.container, t, this.data), this.container.appendChild(t), this.container
                        },
                        _download: function() {
                            if (!this.downloadManager) return void h("Download cannot be started due to unavailable download manager");
                            this.downloadManager.downloadData(this.content, this.filename, "")
                        }
                    }), t
                }(),
                _ = function() {
                    return {
                        render: function(t) {
                            for (var e = new i, n = 0, r = t.annotations.length; n < r; n++) {
                                var a = t.annotations[n];
                                if (a) {
                                    var s = {
                                            data: a,
                                            layer: t.div,
                                            page: t.page,
                                            viewport: t.viewport,
                                            linkService: t.linkService,
                                            downloadManager: t.downloadManager,
                                            imageResourcesPath: t.imageResourcesPath || d("imageResourcesPath"),
                                            renderInteractiveForms: t.renderInteractiveForms || !1
                                        },
                                        o = e.create(s);
                                    o.isRenderable && t.div.appendChild(o.render())
                                }
                            }
                        },
                        update: function(t) {
                            for (var e = 0, n = t.annotations.length; e < n; e++) {
                                var i = t.annotations[e],
                                    r = t.div.querySelector('[data-annotation-id="' + i.id + '"]');
                                r && u.setProp("transform", r, "matrix(" + t.viewport.transform.join(",") + ")")
                            }
                            t.div.removeAttribute("hidden")
                        }
                    }
                }();
            t.AnnotationLayer = _
        }),
        function(t, e) {
            e(t.pdfjsDisplayTextLayer = {}, t.pdfjsSharedUtil, t.pdfjsDisplayDOMUtils)
        }(this, function(t, e, n) {
            var i = e.Util,
                r = e.createPromiseCapability,
                a = n.CustomStyle,
                s = n.getDefaultSetting,
                o = function() {
                    function t(t) {
                        return !d.test(t)
                    }

                    function e(e, n, r) {
                        var a = document.createElement("div"),
                            o = {
                                style: null,
                                angle: 0,
                                canvasWidth: 0,
                                isWhitespace: !1,
                                originalTransform: null,
                                paddingBottom: 0,
                                paddingLeft: 0,
                                paddingRight: 0,
                                paddingTop: 0,
                                scale: 1
                            };
                        if (e._textDivs.push(a), t(n.str)) return o.isWhitespace = !0, void e._textDivProperties.set(a, o);
                        var c = i.transform(e._viewport.transform, n.transform),
                            l = Math.atan2(c[1], c[0]),
                            h = r[n.fontName];
                        h.vertical && (l += Math.PI / 2);
                        var u = Math.sqrt(c[2] * c[2] + c[3] * c[3]),
                            d = u;
                        h.ascent ? d = h.ascent * d : h.descent && (d = (1 + h.descent) * d);
                        var f, g;
                        if (0 === l ? (f = c[4], g = c[5] - d) : (f = c[4] + d * Math.sin(l), g = c[5] - d * Math.cos(l)), p[1] = f, p[3] = g, p[5] = u, p[7] = h.fontFamily, o.style = p.join(""), a.setAttribute("style", o.style), a.textContent = n.str, s("pdfBug") && (a.dataset.fontName = n.fontName), 0 !== l && (o.angle = l * (180 / Math.PI)), n.str.length > 1 && (h.vertical ? o.canvasWidth = n.height * e._viewport.scale : o.canvasWidth = n.width * e._viewport.scale), e._textDivProperties.set(a, o), e._enhanceTextSelection) {
                            var m = 1,
                                A = 0;
                            0 !== l && (m = Math.cos(l), A = Math.sin(l));
                            var v, b, y = (h.vertical ? n.height : n.width) * e._viewport.scale,
                                x = u;
                            0 !== l ? (v = [m, A, -A, m, f, g], b = i.getAxialAlignedBoundingBox([0, 0, y, x], v)) : b = [f, g, f + y, g + x], e._bounds.push({
                                left: b[0],
                                top: b[1],
                                right: b[2],
                                bottom: b[3],
                                div: a,
                                size: [y, x],
                                m: v
                            })
                        }
                    }

                    function n(t) {
                        if (!t._canceled) {
                            var e = t._container,
                                n = t._textDivs,
                                i = t._capability,
                                r = n.length;
                            if (r > 1e5) return t._renderingDone = !0, void i.resolve();
                            var s = document.createElement("canvas");
                            s.mozOpaque = !0;
                            for (var o, c, l = s.getContext("2d", {
                                    alpha: !1
                                }), h = 0; h < r; h++) {
                                var u = n[h],
                                    d = t._textDivProperties.get(u);
                                if (!d.isWhitespace) {
                                    var p = u.style.fontSize,
                                        f = u.style.fontFamily;
                                    p === o && f === c || (l.font = p + " " + f, o = p, c = f);
                                    var g = l.measureText(u.textContent).width;
                                    e.appendChild(u);
                                    var m = "";
                                    0 !== d.canvasWidth && g > 0 && (d.scale = d.canvasWidth / g, m = "scaleX(" + d.scale + ")"), 0 !== d.angle && (m = "rotate(" + d.angle + "deg) " + m), "" !== m && (d.originalTransform = m, a.setProp("transform", u, m)), t._textDivProperties.set(u, d)
                                }
                            }
                            t._renderingDone = !0, i.resolve()
                        }
                    }

                    function o(t) {
                        for (var e = t._bounds, n = t._viewport, r = c(n.width, n.height, e), a = 0; a < r.length; a++) {
                            var s = e[a].div,
                                o = t._textDivProperties.get(s);
                            if (0 !== o.angle) {
                                var l = r[a],
                                    h = e[a],
                                    u = h.m,
                                    d = u[0],
                                    p = u[1],
                                    f = [
                                        [0, 0],
                                        [0, h.size[1]],
                                        [h.size[0], 0], h.size
                                    ],
                                    g = new Float64Array(64);
                                f.forEach(function(t, e) {
                                    var n = i.applyTransform(t, u);
                                    g[e + 0] = d && (l.left - n[0]) / d, g[e + 4] = p && (l.top - n[1]) / p, g[e + 8] = d && (l.right - n[0]) / d, g[e + 12] = p && (l.bottom - n[1]) / p, g[e + 16] = p && (l.left - n[0]) / -p, g[e + 20] = d && (l.top - n[1]) / d, g[e + 24] = p && (l.right - n[0]) / -p, g[e + 28] = d && (l.bottom - n[1]) / d, g[e + 32] = d && (l.left - n[0]) / -d, g[e + 36] = p && (l.top - n[1]) / -p, g[e + 40] = d && (l.right - n[0]) / -d, g[e + 44] = p && (l.bottom - n[1]) / -p, g[e + 48] = p && (l.left - n[0]) / p, g[e + 52] = d && (l.top - n[1]) / -d, g[e + 56] = p && (l.right - n[0]) / p, g[e + 60] = d && (l.bottom - n[1]) / -d
                                });
                                var m = function(t, e, n) {
                                        for (var i = 0, r = 0; r < n; r++) {
                                            var a = t[e++];
                                            a > 0 && (i = i ? Math.min(a, i) : a)
                                        }
                                        return i
                                    },
                                    A = 1 + Math.min(Math.abs(d), Math.abs(p));
                                o.paddingLeft = m(g, 32, 16) / A, o.paddingTop = m(g, 48, 16) / A, o.paddingRight = m(g, 0, 16) / A, o.paddingBottom = m(g, 16, 16) / A, t._textDivProperties.set(s, o)
                            } else o.paddingLeft = e[a].left - r[a].left, o.paddingTop = e[a].top - r[a].top, o.paddingRight = r[a].right - e[a].right, o.paddingBottom = r[a].bottom - e[a].bottom, t._textDivProperties.set(s, o)
                        }
                    }

                    function c(t, e, n) {
                        var i = n.map(function(t, e) {
                            return {
                                x1: t.left,
                                y1: t.top,
                                x2: t.right,
                                y2: t.bottom,
                                index: e,
                                x1New: void 0,
                                x2New: void 0
                            }
                        });
                        l(t, i);
                        var r = new Array(n.length);
                        return i.forEach(function(t) {
                            r[t.index] = {
                                left: t.x1New,
                                top: 0,
                                right: t.x2New,
                                bottom: 0
                            }
                        }), n.map(function(e, n) {
                            var a = r[n],
                                s = i[n];
                            s.x1 = e.top, s.y1 = t - a.right, s.x2 = e.bottom, s.y2 = t - a.left, s.index = n, s.x1New = void 0, s.x2New = void 0
                        }), l(e, i), i.forEach(function(t) {
                            var e = t.index;
                            r[e].top = t.x1New, r[e].bottom = t.x2New
                        }), r
                    }

                    function l(t, e) {
                        e.sort(function(t, e) {
                            return t.x1 - e.x1 || t.index - e.index
                        });
                        var n = {
                                x1: -(1 / 0),
                                y1: -(1 / 0),
                                x2: 0,
                                y2: 1 / 0,
                                index: -1,
                                x1New: 0,
                                x2New: 0
                            },
                            i = [{
                                start: -(1 / 0),
                                end: 1 / 0,
                                boundary: n
                            }];
                        e.forEach(function(t) {
                            for (var e = 0; e < i.length && i[e].end <= t.y1;) e++;
                            for (var n = i.length - 1; n >= 0 && i[n].start >= t.y2;) n--;
                            var r, a, s, o, c = -(1 / 0);
                            for (s = e; s <= n; s++) {
                                r = i[s], a = r.boundary;
                                var l;
                                l = a.x2 > t.x1 ? a.index > t.index ? a.x1New : t.x1 : void 0 === a.x2New ? (a.x2 + t.x1) / 2 : a.x2New, l > c && (c = l)
                            }
                            for (t.x1New = c, s = e; s <= n; s++) r = i[s], a = r.boundary, void 0 === a.x2New ? a.x2 > t.x1 ? a.index > t.index && (a.x2New = a.x2) : a.x2New = c : a.x2New > c && (a.x2New = Math.max(c, a.x2));
                            var h = [],
                                u = null;
                            for (s = e; s <= n; s++) {
                                r = i[s], a = r.boundary;
                                var d = a.x2 > t.x2 ? a : t;
                                u === d ? h[h.length - 1].end = r.end : (h.push({
                                    start: r.start,
                                    end: r.end,
                                    boundary: d
                                }), u = d)
                            }
                            for (i[e].start < t.y1 && (h[0].start = t.y1, h.unshift({
                                    start: i[e].start,
                                    end: t.y1,
                                    boundary: i[e].boundary
                                })), t.y2 < i[n].end && (h[h.length - 1].end = t.y2, h.push({
                                    start: t.y2,
                                    end: i[n].end,
                                    boundary: i[n].boundary
                                })), s = e; s <= n; s++)
                                if (r = i[s], a = r.boundary, void 0 === a.x2New) {
                                    var p = !1;
                                    for (o = e - 1; !p && o >= 0 && i[o].start >= a.y1; o--) p = i[o].boundary === a;
                                    for (o = n + 1; !p && o < i.length && i[o].end <= a.y2; o++) p = i[o].boundary === a;
                                    for (o = 0; !p && o < h.length; o++) p = h[o].boundary === a;
                                    p || (a.x2New = c)
                                } Array.prototype.splice.apply(i, [e, n - e + 1].concat(h))
                        }), i.forEach(function(e) {
                            var n = e.boundary;
                            void 0 === n.x2New && (n.x2New = Math.max(t, n.x2))
                        })
                    }

                    function h(t, e, n, i, a) {
                        this._textContent = t, this._container = e, this._viewport = n, this._textDivs = i || [], this._textDivProperties = new WeakMap, this._renderingDone = !1, this._canceled = !1, this._capability = r(), this._renderTimer = null, this._bounds = [], this._enhanceTextSelection = !!a
                    }

                    function u(t) {
                        var e = new h(t.textContent, t.container, t.viewport, t.textDivs, t.enhanceTextSelection);
                        return e._render(t.timeout), e
                    }
                    var d = /\S/,
                        p = ["left: ", 0, "px; top: ", 0, "px; font-size: ", 0, "px; font-family: ", "", ";"];
                    return h.prototype = {
                        get promise() {
                            return this._capability.promise
                        },
                        cancel: function() {
                            this._canceled = !0, null !== this._renderTimer && (clearTimeout(this._renderTimer), this._renderTimer = null), this._capability.reject("canceled")
                        },
                        _render: function(t) {
                            for (var i = this._textContent.items, r = this._textContent.styles, a = 0, s = i.length; a < s; a++) e(this, i[a], r);
                            if (t) {
                                var o = this;
                                this._renderTimer = setTimeout(function() {
                                    n(o), o._renderTimer = null
                                }, t)
                            } else n(this)
                        },
                        expandTextDivs: function(t) {
                            if (this._enhanceTextSelection && this._renderingDone) {
                                null !== this._bounds && (o(this), this._bounds = null);
                                for (var e = 0, n = this._textDivs.length; e < n; e++) {
                                    var i = this._textDivs[e],
                                        r = this._textDivProperties.get(i);
                                    if (!r.isWhitespace)
                                        if (t) {
                                            var s = "",
                                                c = "";
                                            1 !== r.scale && (s = "scaleX(" + r.scale + ")"), 0 !== r.angle && (s = "rotate(" + r.angle + "deg) " + s), 0 !== r.paddingLeft && (c += " padding-left: " + r.paddingLeft / r.scale + "px;", s += " translateX(" + -r.paddingLeft / r.scale + "px)"), 0 !== r.paddingTop && (c += " padding-top: " + r.paddingTop + "px;", s += " translateY(" + -r.paddingTop + "px)"), 0 !== r.paddingRight && (c += " padding-right: " + r.paddingRight / r.scale + "px;"), 0 !== r.paddingBottom && (c += " padding-bottom: " + r.paddingBottom + "px;"), "" !== c && i.setAttribute("style", r.style + c), "" !== s && a.setProp("transform", i, s)
                                        } else i.style.padding = 0, a.setProp("transform", i, r.originalTransform || "")
                                }
                            }
                        }
                    }, u
                }();
            t.renderTextLayer = o
        }),
        function(t, e) {
            e(t.pdfjsDisplayWebGL = {}, t.pdfjsSharedUtil, t.pdfjsDisplayDOMUtils)
        }(this, function(t, e, n) {
            var i = e.shadow,
                r = n.getDefaultSetting,
                a = function() {
                    function t(t, e, n) {
                        var i = t.createShader(n);
                        if (t.shaderSource(i, e), t.compileShader(i), !t.getShaderParameter(i, t.COMPILE_STATUS)) {
                            var r = t.getShaderInfoLog(i);
                            throw new Error("Error during shader compilation: " + r)
                        }
                        return i
                    }

                    function e(e, n) {
                        return t(e, n, e.VERTEX_SHADER)
                    }

                    function n(e, n) {
                        return t(e, n, e.FRAGMENT_SHADER)
                    }

                    function a(t, e) {
                        for (var n = t.createProgram(), i = 0, r = e.length; i < r; ++i) t.attachShader(n, e[i]);
                        if (t.linkProgram(n), !t.getProgramParameter(n, t.LINK_STATUS)) {
                            var a = t.getProgramInfoLog(n);
                            throw new Error("Error during program linking: " + a)
                        }
                        return n
                    }

                    function s(t, e, n) {
                        t.activeTexture(n);
                        var i = t.createTexture();
                        return t.bindTexture(t.TEXTURE_2D, i), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.NEAREST), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.NEAREST), t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, t.RGBA, t.UNSIGNED_BYTE, e), i
                    }

                    function o() {
                        p || (f = document.createElement("canvas"), p = f.getContext("webgl", {
                            premultipliedalpha: !1
                        }))
                    }

                    function c() {
                        var t, i;
                        o(), t = f, f = null, i = p, p = null;
                        var r = e(i, "  attribute vec2 a_position;                                      attribute vec2 a_texCoord;                                                                                                      uniform vec2 u_resolution;                                                                                                      varying vec2 v_texCoord;                                                                                                        void main() {                                                     vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;       gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);                                                                              v_texCoord = a_texCoord;                                      }                                                             "),
                            s = n(i, "  precision mediump float;                                                                                                        uniform vec4 u_backdrop;                                        uniform int u_subtype;                                          uniform sampler2D u_image;                                      uniform sampler2D u_mask;                                                                                                       varying vec2 v_texCoord;                                                                                                        void main() {                                                     vec4 imageColor = texture2D(u_image, v_texCoord);               vec4 maskColor = texture2D(u_mask, v_texCoord);                 if (u_backdrop.a > 0.0) {                                         maskColor.rgb = maskColor.rgb * maskColor.a +                                   u_backdrop.rgb * (1.0 - maskColor.a);         }                                                               float lum;                                                      if (u_subtype == 0) {                                             lum = maskColor.a;                                            } else {                                                          lum = maskColor.r * 0.3 + maskColor.g * 0.59 +                        maskColor.b * 0.11;                                     }                                                               imageColor.a *= lum;                                            imageColor.rgb *= imageColor.a;                                 gl_FragColor = imageColor;                                    }                                                             "),
                            c = a(i, [r, s]);
                        i.useProgram(c);
                        var l = {};
                        l.gl = i, l.canvas = t, l.resolutionLocation = i.getUniformLocation(c, "u_resolution"), l.positionLocation = i.getAttribLocation(c, "a_position"), l.backdropLocation = i.getUniformLocation(c, "u_backdrop"), l.subtypeLocation = i.getUniformLocation(c, "u_subtype");
                        var h = i.getAttribLocation(c, "a_texCoord"),
                            u = i.getUniformLocation(c, "u_image"),
                            d = i.getUniformLocation(c, "u_mask"),
                            m = i.createBuffer();
                        i.bindBuffer(i.ARRAY_BUFFER, m), i.bufferData(i.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), i.STATIC_DRAW), i.enableVertexAttribArray(h), i.vertexAttribPointer(h, 2, i.FLOAT, !1, 0, 0), i.uniform1i(u, 0), i.uniform1i(d, 1), g = l
                    }

                    function l(t, e, n) {
                        var i = t.width,
                            r = t.height;
                        g || c();
                        var a = g,
                            o = a.canvas,
                            l = a.gl;
                        o.width = i, o.height = r, l.viewport(0, 0, l.drawingBufferWidth, l.drawingBufferHeight), l.uniform2f(a.resolutionLocation, i, r), n.backdrop ? l.uniform4f(a.resolutionLocation, n.backdrop[0], n.backdrop[1], n.backdrop[2], 1) : l.uniform4f(a.resolutionLocation, 0, 0, 0, 0), l.uniform1i(a.subtypeLocation, "Luminosity" === n.subtype ? 1 : 0);
                        var h = s(l, t, l.TEXTURE0),
                            u = s(l, e, l.TEXTURE1),
                            d = l.createBuffer();
                        return l.bindBuffer(l.ARRAY_BUFFER, d), l.bufferData(l.ARRAY_BUFFER, new Float32Array([0, 0, i, 0, 0, r, 0, r, i, 0, i, r]), l.STATIC_DRAW), l.enableVertexAttribArray(a.positionLocation), l.vertexAttribPointer(a.positionLocation, 2, l.FLOAT, !1, 0, 0), l.clearColor(0, 0, 0, 0), l.enable(l.BLEND), l.blendFunc(l.ONE, l.ONE_MINUS_SRC_ALPHA), l.clear(l.COLOR_BUFFER_BIT), l.drawArrays(l.TRIANGLES, 0, 6), l.flush(), l.deleteTexture(h), l.deleteTexture(u), l.deleteBuffer(d), o
                    }

                    function h() {
                        var t, i;
                        o(), t = f, f = null, i = p, p = null;
                        var r = e(i, "  attribute vec2 a_position;                                      attribute vec3 a_color;                                                                                                         uniform vec2 u_resolution;                                      uniform vec2 u_scale;                                           uniform vec2 u_offset;                                                                                                          varying vec4 v_color;                                                                                                           void main() {                                                     vec2 position = (a_position + u_offset) * u_scale;              vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;         gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);                                                                              v_color = vec4(a_color / 255.0, 1.0);                         }                                                             "),
                            s = n(i, "  precision mediump float;                                                                                                        varying vec4 v_color;                                                                                                           void main() {                                                     gl_FragColor = v_color;                                       }                                                             "),
                            c = a(i, [r, s]);
                        i.useProgram(c);
                        var l = {};
                        l.gl = i, l.canvas = t, l.resolutionLocation = i.getUniformLocation(c, "u_resolution"), l.scaleLocation = i.getUniformLocation(c, "u_scale"), l.offsetLocation = i.getUniformLocation(c, "u_offset"), l.positionLocation = i.getAttribLocation(c, "a_position"), l.colorLocation = i.getAttribLocation(c, "a_color"), m = l
                    }

                    function u(t, e, n, i, r) {
                        m || h();
                        var a = m,
                            s = a.canvas,
                            o = a.gl;
                        s.width = t, s.height = e, o.viewport(0, 0, o.drawingBufferWidth, o.drawingBufferHeight), o.uniform2f(a.resolutionLocation, t, e);
                        var c, l, u, d = 0;
                        for (c = 0, l = i.length; c < l; c++) switch (i[c].type) {
                            case "lattice":
                                u = i[c].coords.length / i[c].verticesPerRow | 0, d += (u - 1) * (i[c].verticesPerRow - 1) * 6;
                                break;
                            case "triangles":
                                d += i[c].coords.length
                        }
                        var p = new Float32Array(2 * d),
                            f = new Uint8Array(3 * d),
                            g = r.coords,
                            A = r.colors,
                            v = 0,
                            b = 0;
                        for (c = 0, l = i.length; c < l; c++) {
                            var y = i[c],
                                x = y.coords,
                                S = y.colors;
                            switch (y.type) {
                                case "lattice":
                                    var k = y.verticesPerRow;
                                    u = x.length / k | 0;
                                    for (var C = 1; C < u; C++)
                                        for (var _ = C * k + 1, w = 1; w < k; w++, _++) p[v] = g[x[_ - k - 1]], p[v + 1] = g[x[_ - k - 1] + 1], p[v + 2] = g[x[_ - k]], p[v + 3] = g[x[_ - k] + 1], p[v + 4] = g[x[_ - 1]], p[v + 5] = g[x[_ - 1] + 1], f[b] = A[S[_ - k - 1]], f[b + 1] = A[S[_ - k - 1] + 1], f[b + 2] = A[S[_ - k - 1] + 2], f[b + 3] = A[S[_ - k]], f[b + 4] = A[S[_ - k] + 1], f[b + 5] = A[S[_ - k] + 2], f[b + 6] = A[S[_ - 1]], f[b + 7] = A[S[_ - 1] + 1], f[b + 8] = A[S[_ - 1] + 2], p[v + 6] = p[v + 2], p[v + 7] = p[v + 3], p[v + 8] = p[v + 4], p[v + 9] = p[v + 5], p[v + 10] = g[x[_]], p[v + 11] = g[x[_] + 1], f[b + 9] = f[b + 3], f[b + 10] = f[b + 4], f[b + 11] = f[b + 5], f[b + 12] = f[b + 6], f[b + 13] = f[b + 7], f[b + 14] = f[b + 8], f[b + 15] = A[S[_]], f[b + 16] = A[S[_] + 1], f[b + 17] = A[S[_] + 2], v += 12, b += 18;
                                    break;
                                case "triangles":
                                    for (var T = 0, L = x.length; T < L; T++) p[v] = g[x[T]], p[v + 1] = g[x[T] + 1], f[b] = A[S[T]], f[b + 1] = A[S[T] + 1], f[b + 2] = A[S[T] + 2], v += 2, b += 3
                            }
                        }
                        n ? o.clearColor(n[0] / 255, n[1] / 255, n[2] / 255, 1) : o.clearColor(0, 0, 0, 0), o.clear(o.COLOR_BUFFER_BIT);
                        var P = o.createBuffer();
                        o.bindBuffer(o.ARRAY_BUFFER, P), o.bufferData(o.ARRAY_BUFFER, p, o.STATIC_DRAW), o.enableVertexAttribArray(a.positionLocation), o.vertexAttribPointer(a.positionLocation, 2, o.FLOAT, !1, 0, 0);
                        var E = o.createBuffer();
                        return o.bindBuffer(o.ARRAY_BUFFER, E), o.bufferData(o.ARRAY_BUFFER, f, o.STATIC_DRAW), o.enableVertexAttribArray(a.colorLocation), o.vertexAttribPointer(a.colorLocation, 3, o.UNSIGNED_BYTE, !1, 0, 0), o.uniform2f(a.scaleLocation, r.scaleX, r.scaleY), o.uniform2f(a.offsetLocation, r.offsetX, r.offsetY), o.drawArrays(o.TRIANGLES, 0, d), o.flush(), o.deleteBuffer(P), o.deleteBuffer(E), s
                    }

                    function d() {
                        g && g.canvas && (g.canvas.width = 0, g.canvas.height = 0), m && m.canvas && (m.canvas.width = 0, m.canvas.height = 0), g = null, m = null
                    }
                    var p, f, g = null,
                        m = null;
                    return {
                        get isEnabled() {
                            if (r("disableWebGL")) return !1;
                            var t = !1;
                            try {
                                o(), t = !!p
                            } catch (t) {}
                            return i(this, "isEnabled", t)
                        },
                        composeSMask: l,
                        drawFigures: u,
                        clear: d
                    }
                }();
            t.WebGLUtils = a
        }),
        function(t, e) {
            e(t.pdfjsDisplayPatternHelper = {}, t.pdfjsSharedUtil, t.pdfjsDisplayWebGL)
        }(this, function(t, e, n) {
            function i(t) {
                var e = l[t[0]];
                return e || o("Unknown IR type: " + t[0]), e.fromIR(t)
            }
            var r = e.Util,
                a = e.info,
                s = e.isArray,
                o = e.error,
                c = n.WebGLUtils,
                l = {};
            l.RadialAxial = {
                fromIR: function(t) {
                    var e = t[1],
                        n = t[2],
                        i = t[3],
                        r = t[4],
                        a = t[5],
                        s = t[6];
                    return {
                        type: "Pattern",
                        getPattern: function(t) {
                            var o;
                            "axial" === e ? o = t.createLinearGradient(i[0], i[1], r[0], r[1]) : "radial" === e && (o = t.createRadialGradient(i[0], i[1], a, r[0], r[1], s));
                            for (var c = 0, l = n.length; c < l; ++c) {
                                var h = n[c];
                                o.addColorStop(h[0], h[1])
                            }
                            return o
                        }
                    }
                }
            };
            var h = function() {
                function t(t, e, n, i, r, a, s, o) {
                    var c, l = e.coords,
                        h = e.colors,
                        u = t.data,
                        d = 4 * t.width;
                    l[n + 1] > l[i + 1] && (c = n, n = i, i = c, c = a, a = s, s = c), l[i + 1] > l[r + 1] && (c = i, i = r, r = c, c = s, s = o, o = c), l[n + 1] > l[i + 1] && (c = n, n = i, i = c, c = a, a = s, s = c);
                    var p = (l[n] + e.offsetX) * e.scaleX,
                        f = (l[n + 1] + e.offsetY) * e.scaleY,
                        g = (l[i] + e.offsetX) * e.scaleX,
                        m = (l[i + 1] + e.offsetY) * e.scaleY,
                        A = (l[r] + e.offsetX) * e.scaleX,
                        v = (l[r + 1] + e.offsetY) * e.scaleY;
                    if (!(f >= v))
                        for (var b, y, x, S, k, C, _, w, T, L = h[a], P = h[a + 1], E = h[a + 2], R = h[s], I = h[s + 1], D = h[s + 2], j = h[o], O = h[o + 1], M = h[o + 2], F = Math.round(f), N = Math.round(v), U = F; U <= N; U++) {
                            U < m ? (T = U < f ? 0 : f === m ? 1 : (f - U) / (f - m), b = p - (p - g) * T, y = L - (L - R) * T, x = P - (P - I) * T, S = E - (E - D) * T) : (T = U > v ? 1 : m === v ? 0 : (m - U) / (m - v), b = g - (g - A) * T, y = R - (R - j) * T, x = I - (I - O) * T, S = D - (D - M) * T), T = U < f ? 0 : U > v ? 1 : (f - U) / (f - v), k = p - (p - A) * T, C = L - (L - j) * T, _ = P - (P - O) * T, w = E - (E - M) * T;
                            for (var B = Math.round(Math.min(b, k)), W = Math.round(Math.max(b, k)), G = d * U + 4 * B, X = B; X <= W; X++) T = (b - X) / (b - k), T = T < 0 ? 0 : T > 1 ? 1 : T, u[G++] = y - (y - C) * T | 0, u[G++] = x - (x - _) * T | 0, u[G++] = S - (S - w) * T | 0, u[G++] = 255
                        }
                }

                function e(e, n, i) {
                    var r, a, s = n.coords,
                        c = n.colors;
                    switch (n.type) {
                        case "lattice":
                            var l = n.verticesPerRow,
                                h = Math.floor(s.length / l) - 1,
                                u = l - 1;
                            for (r = 0; r < h; r++)
                                for (var d = r * l, p = 0; p < u; p++, d++) t(e, i, s[d], s[d + 1], s[d + l], c[d], c[d + 1], c[d + l]), t(e, i, s[d + l + 1], s[d + 1], s[d + l], c[d + l + 1], c[d + 1], c[d + l]);
                            break;
                        case "triangles":
                            for (r = 0, a = s.length; r < a; r += 3) t(e, i, s[r], s[r + 1], s[r + 2], c[r], c[r + 1], c[r + 2]);
                            break;
                        default:
                            o("illigal figure")
                    }
                }

                function n(t, n, i, r, a, s, o) {
                    var l, h, u, d, p = Math.floor(t[0]),
                        f = Math.floor(t[1]),
                        g = Math.ceil(t[2]) - p,
                        m = Math.ceil(t[3]) - f,
                        A = Math.min(Math.ceil(Math.abs(g * n[0] * 1.1)), 3e3),
                        v = Math.min(Math.ceil(Math.abs(m * n[1] * 1.1)), 3e3),
                        b = g / A,
                        y = m / v,
                        x = {
                            coords: i,
                            colors: r,
                            offsetX: -p,
                            offsetY: -f,
                            scaleX: 1 / b,
                            scaleY: 1 / y
                        },
                        S = A + 4,
                        k = v + 4;
                    if (c.isEnabled) l = c.drawFigures(A, v, s, a, x), h = o.getCanvas("mesh", S, k, !1), h.context.drawImage(l, 2, 2), l = h.canvas;
                    else {
                        h = o.getCanvas("mesh", S, k, !1);
                        var C = h.context,
                            _ = C.createImageData(A, v);
                        if (s) {
                            var w = _.data;
                            for (u = 0, d = w.length; u < d; u += 4) w[u] = s[0], w[u + 1] = s[1], w[u + 2] = s[2], w[u + 3] = 255
                        }
                        for (u = 0; u < a.length; u++) e(_, a[u], x);
                        C.putImageData(_, 2, 2), l = h.canvas
                    }
                    return {
                        canvas: l,
                        offsetX: p - 2 * b,
                        offsetY: f - 2 * y,
                        scaleX: b,
                        scaleY: y
                    }
                }
                return n
            }();
            l.Mesh = {
                fromIR: function(t) {
                    var e = t[2],
                        n = t[3],
                        i = t[4],
                        a = t[5],
                        s = t[6],
                        o = t[8];
                    return {
                        type: "Pattern",
                        getPattern: function(t, c, l) {
                            var u;
                            if (l) u = r.singularValueDecompose2dScale(t.mozCurrentTransform);
                            else if (u = r.singularValueDecompose2dScale(c.baseTransform), s) {
                                var d = r.singularValueDecompose2dScale(s);
                                u = [u[0] * d[0], u[1] * d[1]]
                            }
                            var p = h(a, u, e, n, i, l ? null : o, c.cachedCanvases);
                            return l || (t.setTransform.apply(t, c.baseTransform), s && t.transform.apply(t, s)), t.translate(p.offsetX, p.offsetY), t.scale(p.scaleX, p.scaleY), t.createPattern(p.canvas, "no-repeat")
                        }
                    }
                }
            }, l.Dummy = {
                fromIR: function() {
                    return {
                        type: "Pattern",
                        getPattern: function() {
                            return "hotpink"
                        }
                    }
                }
            };
            var u = function() {
                function t(t, e, n, i, r) {
                    this.operatorList = t[2], this.matrix = t[3] || [1, 0, 0, 1, 0, 0], this.bbox = t[4], this.xstep = t[5], this.ystep = t[6], this.paintType = t[7], this.tilingType = t[8], this.color = e, this.canvasGraphicsFactory = i, this.baseTransform = r, this.type = "Pattern", this.ctx = n
                }
                var e = {
                    COLORED: 1,
                    UNCOLORED: 2
                };
                return t.prototype = {
                    createPatternCanvas: function(t) {
                        var e = this.operatorList,
                            n = this.bbox,
                            i = this.xstep,
                            s = this.ystep,
                            o = this.paintType,
                            c = this.tilingType,
                            l = this.color,
                            h = this.canvasGraphicsFactory;
                        a("TilingType: " + c);
                        var u = n[0],
                            d = n[1],
                            p = n[2],
                            f = n[3],
                            g = [u, d],
                            m = [u + i, d + s],
                            A = m[0] - g[0],
                            v = m[1] - g[1],
                            b = r.singularValueDecompose2dScale(this.matrix),
                            y = r.singularValueDecompose2dScale(this.baseTransform),
                            x = [b[0] * y[0], b[1] * y[1]];
                        A = Math.min(Math.ceil(Math.abs(A * x[0])), 3e3), v = Math.min(Math.ceil(Math.abs(v * x[1])), 3e3);
                        var S = t.cachedCanvases.getCanvas("pattern", A, v, !0),
                            k = S.context,
                            C = h.createCanvasGraphics(k);
                        C.groupLevel = t.groupLevel, this.setFillAndStrokeStyleToContext(k, o, l), this.setScale(A, v, i, s), this.transformToScale(C);
                        var _ = [1, 0, 0, 1, -g[0], -g[1]];
                        return C.transform.apply(C, _), this.clipBbox(C, n, u, d, p, f), C.executeOperatorList(e), S.canvas
                    },
                    setScale: function(t, e, n, i) {
                        this.scale = [t / n, e / i]
                    },
                    transformToScale: function(t) {
                        var e = this.scale,
                            n = [e[0], 0, 0, e[1], 0, 0];
                        t.transform.apply(t, n)
                    },
                    scaleToContext: function() {
                        var t = this.scale;
                        this.ctx.scale(1 / t[0], 1 / t[1])
                    },
                    clipBbox: function(t, e, n, i, r, a) {
                        if (e && s(e) && 4 === e.length) {
                            var o = r - n,
                                c = a - i;
                            t.ctx.rect(n, i, o, c), t.clip(), t.endPath()
                        }
                    },
                    setFillAndStrokeStyleToContext: function(t, n, i) {
                        switch (n) {
                            case e.COLORED:
                                var a = this.ctx;
                                t.fillStyle = a.fillStyle, t.strokeStyle = a.strokeStyle;
                                break;
                            case e.UNCOLORED:
                                var s = r.makeCssRgb(i[0], i[1], i[2]);
                                t.fillStyle = s, t.strokeStyle = s;
                                break;
                            default:
                                o("Unsupported paint type: " + n)
                        }
                    },
                    getPattern: function(t, e) {
                        var n = this.createPatternCanvas(e);
                        return t = this.ctx, t.setTransform.apply(t, this.baseTransform), t.transform.apply(t, this.matrix), this.scaleToContext(), t.createPattern(n, "repeat")
                    }
                }, t
            }();
            t.getShadingPatternFromIR = i, t.TilingPattern = u
        }),
        function(t, e) {
            e(t.pdfjsDisplayCanvas = {}, t.pdfjsSharedUtil, t.pdfjsDisplayDOMUtils, t.pdfjsDisplayPatternHelper, t.pdfjsDisplayWebGL)
        }(this, function(t, e, n, i, r) {
            function a(t, e) {
                var n = document.createElement("canvas");
                return n.width = t, n.height = e, n
            }

            function s(t) {
                t.mozCurrentTransform || (t._originalSave = t.save, t._originalRestore = t.restore, t._originalRotate = t.rotate, t._originalScale = t.scale, t._originalTranslate = t.translate, t._originalTransform = t.transform, t._originalSetTransform = t.setTransform, t._transformMatrix = t._transformMatrix || [1, 0, 0, 1, 0, 0], t._transformStack = [], Object.defineProperty(t, "mozCurrentTransform", {
                    get: function() {
                        return this._transformMatrix
                    }
                }), Object.defineProperty(t, "mozCurrentTransformInverse", {
                    get: function() {
                        var t = this._transformMatrix,
                            e = t[0],
                            n = t[1],
                            i = t[2],
                            r = t[3],
                            a = t[4],
                            s = t[5],
                            o = e * r - n * i,
                            c = n * i - e * r;
                        return [r / o, n / c, i / c, e / o, (r * a - i * s) / c, (n * a - e * s) / o]
                    }
                }), t.save = function() {
                    var t = this._transformMatrix;
                    this._transformStack.push(t), this._transformMatrix = t.slice(0, 6), this._originalSave()
                }, t.restore = function() {
                    var t = this._transformStack.pop();
                    t && (this._transformMatrix = t, this._originalRestore())
                }, t.translate = function(t, e) {
                    var n = this._transformMatrix;
                    n[4] = n[0] * t + n[2] * e + n[4], n[5] = n[1] * t + n[3] * e + n[5], this._originalTranslate(t, e)
                }, t.scale = function(t, e) {
                    var n = this._transformMatrix;
                    n[0] = n[0] * t, n[1] = n[1] * t, n[2] = n[2] * e, n[3] = n[3] * e, this._originalScale(t, e)
                }, t.transform = function(e, n, i, r, a, s) {
                    var o = this._transformMatrix;
                    this._transformMatrix = [o[0] * e + o[2] * n, o[1] * e + o[3] * n, o[0] * i + o[2] * r, o[1] * i + o[3] * r, o[0] * a + o[2] * s + o[4], o[1] * a + o[3] * s + o[5]], t._originalTransform(e, n, i, r, a, s)
                }, t.setTransform = function(e, n, i, r, a, s) {
                    this._transformMatrix = [e, n, i, r, a, s], t._originalSetTransform(e, n, i, r, a, s)
                }, t.rotate = function(t) {
                    var e = Math.cos(t),
                        n = Math.sin(t),
                        i = this._transformMatrix;
                    this._transformMatrix = [i[0] * e + i[2] * n, i[1] * e + i[3] * n, i[0] * -n + i[2] * e, i[1] * -n + i[3] * e, i[4], i[5]], this._originalRotate(t)
                })
            }

            function o(t) {
                var e, n, i, r, a = t.width,
                    s = t.height,
                    o = a + 1,
                    c = new Uint8Array(o * (s + 1)),
                    l = new Uint8Array([0, 2, 4, 0, 1, 0, 5, 4, 8, 10, 0, 8, 0, 2, 1, 0]),
                    h = a + 7 & -8,
                    u = t.data,
                    d = new Uint8Array(h * s),
                    p = 0;
                for (e = 0, r = u.length; e < r; e++)
                    for (var f = 128, g = u[e]; f > 0;) d[p++] = g & f ? 0 : 255, f >>= 1;
                var m = 0;
                for (p = 0, 0 !== d[p] && (c[0] = 1, ++m), n = 1; n < a; n++) d[p] !== d[p + 1] && (c[n] = d[p] ? 2 : 1, ++m), p++;
                for (0 !== d[p] && (c[n] = 2, ++m), e = 1; e < s; e++) {
                    p = e * h, i = e * o, d[p - h] !== d[p] && (c[i] = d[p] ? 1 : 8, ++m);
                    var A = (d[p] ? 4 : 0) + (d[p - h] ? 8 : 0);
                    for (n = 1; n < a; n++) A = (A >> 2) + (d[p + 1] ? 4 : 0) + (d[p - h + 1] ? 8 : 0), l[A] && (c[i + n] = l[A], ++m), p++;
                    if (d[p - h] !== d[p] && (c[i + n] = d[p] ? 2 : 4, ++m), m > 1e3) return null
                }
                for (p = h * (s - 1), i = e * o, 0 !== d[p] && (c[i] = 8, ++m), n = 1; n < a; n++) d[p] !== d[p + 1] && (c[i + n] = d[p] ? 4 : 8, ++m), p++;
                if (0 !== d[p] && (c[i + n] = 4, ++m), m > 1e3) return null;
                var v = new Int32Array([0, o, -1, 0, -o, 0, 0, 0, 1]),
                    b = [];
                for (e = 0; m && e <= s; e++) {
                    for (var y = e * o, x = y + a; y < x && !c[y];) y++;
                    if (y !== x) {
                        var S, k = [y % o, e],
                            C = c[y],
                            _ = y;
                        do {
                            var w = v[C];
                            do y += w; while (!c[y]);
                            S = c[y], 5 !== S && 10 !== S ? (C = S, c[y] = 0) : (C = S & 51 * C >> 4, c[y] &= C >> 2 | C << 2), k.push(y % o), k.push(y / o | 0), --m
                        } while (_ !== y);
                        b.push(k), --e
                    }
                }
                return function(t) {
                    t.save(), t.scale(1 / a, -1 / s), t.translate(0, -s), t.beginPath();
                    for (var e = 0, n = b.length; e < n; e++) {
                        var i = b[e];
                        t.moveTo(i[0], i[1]);
                        for (var r = 2, o = i.length; r < o; r += 2) t.lineTo(i[r], i[r + 1])
                    }
                    t.fill(), t.beginPath(), t.restore()
                }
            }
            var c = e.FONT_IDENTITY_MATRIX,
                l = e.IDENTITY_MATRIX,
                h = e.ImageKind,
                u = e.OPS,
                d = e.TextRenderingMode,
                p = e.Uint32ArrayView,
                f = e.Util,
                g = e.assert,
                m = e.info,
                A = e.isNum,
                v = e.isArray,
                b = e.isLittleEndian,
                y = e.error,
                x = e.shadow,
                S = e.warn,
                k = i.TilingPattern,
                C = i.getShadingPatternFromIR,
                _ = r.WebGLUtils,
                w = n.hasCanvasTypedArrays,
                T = {
                    get value() {
                        return x(T, "value", w())
                    }
                },
                L = {
                    get value() {
                        return x(L, "value", b())
                    }
                },
                P = function() {
                    function t() {
                        this.cache = Object.create(null)
                    }
                    return t.prototype = {
                        getCanvas: function(t, e, n, i) {
                            var r;
                            if (void 0 !== this.cache[t]) r = this.cache[t], r.canvas.width = e, r.canvas.height = n, r.context.setTransform(1, 0, 0, 1, 0, 0);
                            else {
                                var o = a(e, n),
                                    c = o.getContext("2d");
                                i && s(c), this.cache[t] = r = {
                                    canvas: o,
                                    context: c
                                }
                            }
                            return r
                        },
                        clear: function() {
                            for (var t in this.cache) {
                                var e = this.cache[t];
                                e.canvas.width = 0, e.canvas.height = 0, delete this.cache[t]
                            }
                        }
                    }, t
                }(),
                E = function() {
                    function t(t) {
                        this.alphaIsShape = !1, this.fontSize = 0, this.fontSizeScale = 1, this.textMatrix = l, this.textMatrixScale = 1, this.fontMatrix = c, this.leading = 0, this.x = 0, this.y = 0, this.lineX = 0, this.lineY = 0, this.charSpacing = 0, this.wordSpacing = 0, this.textHScale = 1, this.textRenderingMode = d.FILL, this.textRise = 0, this.fillColor = "#000000", this.strokeColor = "#000000", this.patternFill = !1, this.fillAlpha = 1, this.strokeAlpha = 1, this.lineWidth = 1, this.activeSMask = null, this.resumeSMaskCtx = null, this.old = t
                    }
                    return t.prototype = {
                        clone: function() {
                            return Object.create(this)
                        },
                        setCurrentPoint: function(t, e) {
                            this.x = t, this.y = e
                        }
                    }, t
                }(),
                R = function() {
                    function t(t, e, n, i) {
                        this.ctx = t, this.current = new E, this.stateStack = [], this.pendingClip = null, this.pendingEOFill = !1, this.res = null, this.xobjs = null, this.commonObjs = e, this.objs = n, this.imageLayer = i, this.groupStack = [], this.processingType3 = null, this.baseTransform = null, this.baseTransformStack = [], this.groupLevel = 0, this.smaskStack = [], this.smaskCounter = 0, this.tempSMask = null, this.cachedCanvases = new P, t && s(t), this.cachedGetSinglePixelWidth = null
                    }

                    function e(t, e) {
                        if ("undefined" != typeof ImageData && e instanceof ImageData) return void t.putImageData(e, 0, 0);
                        var n, i, r, a, s, o = e.height,
                            c = e.width,
                            l = o % 16,
                            u = (o - l) / 16,
                            d = 0 === l ? u : u + 1,
                            f = t.createImageData(c, 16),
                            g = 0,
                            m = e.data,
                            A = f.data;
                        if (e.kind === h.GRAYSCALE_1BPP) {
                            var v = m.byteLength,
                                b = T.value ? new Uint32Array(A.buffer) : new p(A),
                                x = b.length,
                                S = c + 7 >> 3,
                                k = 4294967295,
                                C = L.value || !T.value ? 4278190080 : 255;
                            for (i = 0; i < d; i++) {
                                for (a = i < u ? 16 : l, n = 0, r = 0; r < a; r++) {
                                    for (var _ = v - g, w = 0, P = _ > S ? c : 8 * _ - 7, E = P & -8, R = 0, I = 0; w < E; w += 8) I = m[g++], b[n++] = 128 & I ? k : C, b[n++] = 64 & I ? k : C, b[n++] = 32 & I ? k : C, b[n++] = 16 & I ? k : C, b[n++] = 8 & I ? k : C, b[n++] = 4 & I ? k : C, b[n++] = 2 & I ? k : C, b[n++] = 1 & I ? k : C;
                                    for (; w < P; w++) 0 === R && (I = m[g++], R = 128), b[n++] = I & R ? k : C, R >>= 1
                                }
                                for (; n < x;) b[n++] = 0;
                                t.putImageData(f, 0, 16 * i)
                            }
                        } else if (e.kind === h.RGBA_32BPP) {
                            for (r = 0, s = 16 * c * 4, i = 0; i < u; i++) A.set(m.subarray(g, g + s)), g += s, t.putImageData(f, 0, r), r += 16;
                            i < d && (s = c * l * 4, A.set(m.subarray(g, g + s)), t.putImageData(f, 0, r))
                        } else if (e.kind === h.RGB_24BPP)
                            for (a = 16, s = c * a, i = 0; i < d; i++) {
                                for (i >= u && (a = l, s = c * a), n = 0, r = s; r--;) A[n++] = m[g++], A[n++] = m[g++], A[n++] = m[g++], A[n++] = 255;
                                t.putImageData(f, 0, 16 * i)
                            } else y("bad image kind: " + e.kind)
                    }

                    function n(t, e) {
                        for (var n = e.height, i = e.width, r = n % 16, a = (n - r) / 16, s = 0 === r ? a : a + 1, o = t.createImageData(i, 16), c = 0, l = e.data, h = o.data, u = 0; u < s; u++) {
                            for (var d = u < a ? 16 : r, p = 3, f = 0; f < d; f++)
                                for (var g = 0, m = 0; m < i; m++) {
                                    if (!g) {
                                        var A = l[c++];
                                        g = 128
                                    }
                                    h[p] = A & g ? 0 : 255, p += 4, g >>= 1
                                }
                            t.putImageData(o, 0, 16 * u)
                        }
                    }

                    function i(t, e) {
                        for (var n = ["strokeStyle", "fillStyle", "fillRule", "globalAlpha", "lineWidth", "lineCap", "lineJoin", "miterLimit", "globalCompositeOperation", "font"], i = 0, r = n.length; i < r; i++) {
                            var a = n[i];
                            void 0 !== t[a] && (e[a] = t[a])
                        }
                        void 0 !== t.setLineDash && (e.setLineDash(t.getLineDash()), e.lineDashOffset = t.lineDashOffset)
                    }

                    function r(t, e, n, i) {
                        for (var r = t.length, a = 3; a < r; a += 4) {
                            var s = t[a];
                            if (0 === s) t[a - 3] = e, t[a - 2] = n, t[a - 1] = i;
                            else if (s < 255) {
                                var o = 255 - s;
                                t[a - 3] = t[a - 3] * s + e * o >> 8, t[a - 2] = t[a - 2] * s + n * o >> 8, t[a - 1] = t[a - 1] * s + i * o >> 8
                            }
                        }
                    }

                    function a(t, e, n) {
                        for (var i = t.length, r = 3; r < i; r += 4) {
                            var a = n ? n[t[r]] : t[r];
                            e[r] = e[r] * a * (1 / 255) | 0
                        }
                    }

                    function b(t, e, n) {
                        for (var i = t.length, r = 3; r < i; r += 4) {
                            var a = 77 * t[r - 3] + 152 * t[r - 2] + 28 * t[r - 1];
                            e[r] = n ? e[r] * n[a >> 8] >> 8 : e[r] * a >> 16
                        }
                    }

                    function w(t, e, n, i, s, o, c) {
                        var l, h = !!o,
                            u = h ? o[0] : 0,
                            d = h ? o[1] : 0,
                            p = h ? o[2] : 0;
                        l = "Luminosity" === s ? b : a;
                        for (var f = Math.min(i, Math.ceil(1048576 / n)), g = 0; g < i; g += f) {
                            var m = Math.min(f, i - g),
                                A = t.getImageData(0, g, n, m),
                                v = e.getImageData(0, g, n, m);
                            h && r(A.data, u, d, p), l(A.data, v.data, c), t.putImageData(v, 0, g)
                        }
                    }

                    function R(t, e, n) {
                        var i = e.canvas,
                            r = e.context;
                        t.setTransform(e.scaleX, 0, 0, e.scaleY, e.offsetX, e.offsetY);
                        var a = e.backdrop || null;
                        if (!e.transferMap && _.isEnabled) {
                            var s = _.composeSMask(n.canvas, i, {
                                subtype: e.subtype,
                                backdrop: a
                            });
                            return t.setTransform(1, 0, 0, 1, 0, 0), void t.drawImage(s, e.offsetX, e.offsetY)
                        }
                        w(r, n, i.width, i.height, e.subtype, a, e.transferMap), t.drawImage(i, 0, 0)
                    }
                    var I = ["butt", "round", "square"],
                        D = ["miter", "round", "bevel"],
                        j = {},
                        O = {};
                    t.prototype = {
                        beginDrawing: function(t, e, n) {
                            var i = this.ctx.canvas.width,
                                r = this.ctx.canvas.height;
                            if (this.ctx.save(), this.ctx.fillStyle = "rgb(255, 255, 255)", this.ctx.fillRect(0, 0, i, r), this.ctx.restore(), n) {
                                var a = this.cachedCanvases.getCanvas("transparent", i, r, !0);
                                this.compositeCtx = this.ctx, this.transparentCanvas = a.canvas, this.ctx = a.context, this.ctx.save(), this.ctx.transform.apply(this.ctx, this.compositeCtx.mozCurrentTransform)
                            }
                            this.ctx.save(), t && this.ctx.transform.apply(this.ctx, t), this.ctx.transform.apply(this.ctx, e.transform), this.baseTransform = this.ctx.mozCurrentTransform.slice(), this.imageLayer && this.imageLayer.beginLayout()
                        },
                        executeOperatorList: function(t, e, n, i) {
                            var r = t.argsArray,
                                a = t.fnArray,
                                s = e || 0,
                                o = r.length;
                            if (o === s) return s;
                            for (var c, l = o - s > 10 && "function" == typeof n, h = l ? Date.now() + 15 : 0, d = 0, p = this.commonObjs, f = this.objs;;) {
                                if (void 0 !== i && s === i.nextBreakPoint) return i.breakIt(s, n), s;
                                if ((c = a[s]) !== u.dependency) this[c].apply(this, r[s]);
                                else
                                    for (var g = r[s], m = 0, A = g.length; m < A; m++) {
                                        var v = g[m],
                                            b = "g" === v[0] && "_" === v[1],
                                            y = b ? p : f;
                                        if (!y.isResolved(v)) return y.get(v, n), s
                                    }
                                if (++s === o) return s;
                                if (l && ++d > 10) {
                                    if (Date.now() > h) return n(), s;
                                    d = 0
                                }
                            }
                        },
                        endDrawing: function() {
                            null !== this.current.activeSMask && this.endSMaskGroup(), this.ctx.restore(), this.transparentCanvas && (this.ctx = this.compositeCtx, this.ctx.save(), this.ctx.setTransform(1, 0, 0, 1, 0, 0), this.ctx.drawImage(this.transparentCanvas, 0, 0), this.ctx.restore(), this.transparentCanvas = null), this.cachedCanvases.clear(), _.clear(), this.imageLayer && this.imageLayer.endLayout()
                        },
                        setLineWidth: function(t) {
                            this.current.lineWidth = t, this.ctx.lineWidth = t
                        },
                        setLineCap: function(t) {
                            this.ctx.lineCap = I[t]
                        },
                        setLineJoin: function(t) {
                            this.ctx.lineJoin = D[t]
                        },
                        setMiterLimit: function(t) {
                            this.ctx.miterLimit = t
                        },
                        setDash: function(t, e) {
                            var n = this.ctx;
                            void 0 !== n.setLineDash && (n.setLineDash(t), n.lineDashOffset = e)
                        },
                        setRenderingIntent: function(t) {},
                        setFlatness: function(t) {},
                        setGState: function(t) {
                            for (var e = 0, n = t.length; e < n; e++) {
                                var i = t[e],
                                    r = i[0],
                                    a = i[1];
                                switch (r) {
                                    case "LW":
                                        this.setLineWidth(a);
                                        break;
                                    case "LC":
                                        this.setLineCap(a);
                                        break;
                                    case "LJ":
                                        this.setLineJoin(a);
                                        break;
                                    case "ML":
                                        this.setMiterLimit(a);
                                        break;
                                    case "D":
                                        this.setDash(a[0], a[1]);
                                        break;
                                    case "RI":
                                        this.setRenderingIntent(a);
                                        break;
                                    case "FL":
                                        this.setFlatness(a);
                                        break;
                                    case "Font":
                                        this.setFont(a[0], a[1]);
                                        break;
                                    case "CA":
                                        this.current.strokeAlpha = i[1];
                                        break;
                                    case "ca":
                                        this.current.fillAlpha = i[1], this.ctx.globalAlpha = i[1];
                                        break;
                                    case "BM":
                                        if (a && a.name && "Normal" !== a.name) {
                                            var s = a.name.replace(/([A-Z])/g, function(t) {
                                                return "-" + t.toLowerCase()
                                            }).substring(1);
                                            this.ctx.globalCompositeOperation = s, this.ctx.globalCompositeOperation !== s && S('globalCompositeOperation "' + s + '" is not supported')
                                        } else this.ctx.globalCompositeOperation = "source-over";
                                        break;
                                    case "SMask":
                                        this.current.activeSMask && (this.stateStack.length > 0 && this.stateStack[this.stateStack.length - 1].activeSMask === this.current.activeSMask ? this.suspendSMaskGroup() : this.endSMaskGroup()), this.current.activeSMask = a ? this.tempSMask : null, this.current.activeSMask && this.beginSMaskGroup(), this.tempSMask = null
                                }
                            }
                        },
                        beginSMaskGroup: function() {
                            var t = this.current.activeSMask,
                                e = t.canvas.width,
                                n = t.canvas.height,
                                r = "smaskGroupAt" + this.groupLevel,
                                a = this.cachedCanvases.getCanvas(r, e, n, !0),
                                s = this.ctx,
                                o = s.mozCurrentTransform;
                            this.ctx.save();
                            var c = a.context;
                            c.scale(1 / t.scaleX, 1 / t.scaleY), c.translate(-t.offsetX, -t.offsetY), c.transform.apply(c, o), t.startTransformInverse = c.mozCurrentTransformInverse, i(s, c), this.ctx = c, this.setGState([
                                ["BM", "Normal"],
                                ["ca", 1],
                                ["CA", 1]
                            ]), this.groupStack.push(s), this.groupLevel++
                        },
                        suspendSMaskGroup: function() {
                            var t = this.ctx;
                            this.groupLevel--, this.ctx = this.groupStack.pop(), R(this.ctx, this.current.activeSMask, t), this.ctx.restore(), this.ctx.save(), i(t, this.ctx), this.current.resumeSMaskCtx = t;
                            var e = f.transform(this.current.activeSMask.startTransformInverse, t.mozCurrentTransform);
                            this.ctx.transform.apply(this.ctx, e), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.clearRect(0, 0, t.canvas.width, t.canvas.height), t.restore()
                        },
                        resumeSMaskGroup: function() {
                            var t = this.current.resumeSMaskCtx,
                                e = this.ctx;
                            this.ctx = t, this.groupStack.push(e), this.groupLevel++
                        },
                        endSMaskGroup: function() {
                            var t = this.ctx;
                            this.groupLevel--, this.ctx = this.groupStack.pop(), R(this.ctx, this.current.activeSMask, t), this.ctx.restore(), i(t, this.ctx);
                            var e = f.transform(this.current.activeSMask.startTransformInverse, t.mozCurrentTransform);
                            this.ctx.transform.apply(this.ctx, e)
                        },
                        save: function() {
                            this.ctx.save();
                            var t = this.current;
                            this.stateStack.push(t), this.current = t.clone(), this.current.resumeSMaskCtx = null
                        },
                        restore: function() {
                            this.current.resumeSMaskCtx && this.resumeSMaskGroup(), null === this.current.activeSMask || 0 !== this.stateStack.length && this.stateStack[this.stateStack.length - 1].activeSMask === this.current.activeSMask || this.endSMaskGroup(), 0 !== this.stateStack.length && (this.current = this.stateStack.pop(), this.ctx.restore(), this.pendingClip = null, this.cachedGetSinglePixelWidth = null)
                        },
                        transform: function(t, e, n, i, r, a) {
                            this.ctx.transform(t, e, n, i, r, a), this.cachedGetSinglePixelWidth = null
                        },
                        constructPath: function(t, e) {
                            for (var n = this.ctx, i = this.current, r = i.x, a = i.y, s = 0, o = 0, c = t.length; s < c; s++) switch (0 | t[s]) {
                                case u.rectangle:
                                    r = e[o++], a = e[o++];
                                    var l = e[o++],
                                        h = e[o++];
                                    0 === l && (l = this.getSinglePixelWidth()), 0 === h && (h = this.getSinglePixelWidth());
                                    var d = r + l,
                                        p = a + h;
                                    this.ctx.moveTo(r, a), this.ctx.lineTo(d, a), this.ctx.lineTo(d, p), this.ctx.lineTo(r, p), this.ctx.lineTo(r, a), this.ctx.closePath();
                                    break;
                                case u.moveTo:
                                    r = e[o++], a = e[o++], n.moveTo(r, a);
                                    break;
                                case u.lineTo:
                                    r = e[o++], a = e[o++], n.lineTo(r, a);
                                    break;
                                case u.curveTo:
                                    r = e[o + 4], a = e[o + 5], n.bezierCurveTo(e[o], e[o + 1], e[o + 2], e[o + 3], r, a), o += 6;
                                    break;
                                case u.curveTo2:
                                    n.bezierCurveTo(r, a, e[o], e[o + 1], e[o + 2], e[o + 3]), r = e[o + 2], a = e[o + 3], o += 4;
                                    break;
                                case u.curveTo3:
                                    r = e[o + 2], a = e[o + 3], n.bezierCurveTo(e[o], e[o + 1], r, a, r, a), o += 4;
                                    break;
                                case u.closePath:
                                    n.closePath()
                            }
                            i.setCurrentPoint(r, a)
                        },
                        closePath: function() {
                            this.ctx.closePath()
                        },
                        stroke: function(t) {
                            t = void 0 === t || t;
                            var e = this.ctx,
                                n = this.current.strokeColor;
                            e.lineWidth = Math.max(.65 * this.getSinglePixelWidth(), this.current.lineWidth), e.globalAlpha = this.current.strokeAlpha, n && n.hasOwnProperty("type") && "Pattern" === n.type ? (e.save(), e.strokeStyle = n.getPattern(e, this), e.stroke(), e.restore()) : e.stroke(), t && this.consumePath(), e.globalAlpha = this.current.fillAlpha
                        },
                        closeStroke: function() {
                            this.closePath(), this.stroke()
                        },
                        fill: function(t) {
                            t = void 0 === t || t;
                            var e = this.ctx,
                                n = this.current.fillColor,
                                i = this.current.patternFill,
                                r = !1;
                            i && (e.save(), this.baseTransform && e.setTransform.apply(e, this.baseTransform), e.fillStyle = n.getPattern(e, this), r = !0), this.pendingEOFill ? (void 0 !== e.mozFillRule ? (e.mozFillRule = "evenodd", e.fill(), e.mozFillRule = "nonzero") : e.fill("evenodd"), this.pendingEOFill = !1) : e.fill(), r && e.restore(), t && this.consumePath()
                        },
                        eoFill: function() {
                            this.pendingEOFill = !0, this.fill()
                        },
                        fillStroke: function() {
                            this.fill(!1), this.stroke(!1), this.consumePath()
                        },
                        eoFillStroke: function() {
                            this.pendingEOFill = !0, this.fillStroke()
                        },
                        closeFillStroke: function() {
                            this.closePath(), this.fillStroke()
                        },
                        closeEOFillStroke: function() {
                            this.pendingEOFill = !0, this.closePath(), this.fillStroke()
                        },
                        endPath: function() {
                            this.consumePath()
                        },
                        clip: function() {
                            this.pendingClip = j
                        },
                        eoClip: function() {
                            this.pendingClip = O
                        },
                        beginText: function() {
                            this.current.textMatrix = l, this.current.textMatrixScale = 1, this.current.x = this.current.lineX = 0, this.current.y = this.current.lineY = 0
                        },
                        endText: function() {
                            var t = this.pendingTextPaths,
                                e = this.ctx;
                            if (void 0 === t) return void e.beginPath();
                            e.save(), e.beginPath();
                            for (var n = 0; n < t.length; n++) {
                                var i = t[n];
                                e.setTransform.apply(e, i.transform), e.translate(i.x, i.y), i.addToPath(e, i.fontSize)
                            }
                            e.restore(), e.clip(), e.beginPath(), delete this.pendingTextPaths
                        },
                        setCharSpacing: function(t) {
                            this.current.charSpacing = t
                        },
                        setWordSpacing: function(t) {
                            this.current.wordSpacing = t
                        },
                        setHScale: function(t) {
                            this.current.textHScale = t / 100
                        },
                        setLeading: function(t) {
                            this.current.leading = -t
                        },
                        setFont: function(t, e) {
                            var n = this.commonObjs.get(t),
                                i = this.current;
                            if (n || y("Can't find font for " + t), i.fontMatrix = n.fontMatrix ? n.fontMatrix : c, 0 !== i.fontMatrix[0] && 0 !== i.fontMatrix[3] || S("Invalid font matrix for font " + t), e < 0 ? (e = -e, i.fontDirection = -1) : i.fontDirection = 1, this.current.font = n, this.current.fontSize = e, !n.isType3Font) {
                                var r = n.loadedName || "sans-serif",
                                    a = n.black ? n.bold ? "900" : "bold" : n.bold ? "bold" : "normal",
                                    s = n.italic ? "italic" : "normal",
                                    o = '"' + r + '", ' + n.fallbackName,
                                    l = e < 16 ? 16 : e > 100 ? 100 : e;
                                this.current.fontSizeScale = e / l;
                                var h = s + " " + a + " " + l + "px " + o;
                                this.ctx.font = h
                            }
                        },
                        setTextRenderingMode: function(t) {
                            this.current.textRenderingMode = t
                        },
                        setTextRise: function(t) {
                            this.current.textRise = t
                        },
                        moveText: function(t, e) {
                            this.current.x = this.current.lineX += t, this.current.y = this.current.lineY += e
                        },
                        setLeadingMoveText: function(t, e) {
                            this.setLeading(-e), this.moveText(t, e)
                        },
                        setTextMatrix: function(t, e, n, i, r, a) {
                            this.current.textMatrix = [t, e, n, i, r, a], this.current.textMatrixScale = Math.sqrt(t * t + e * e), this.current.x = this.current.lineX = 0, this.current.y = this.current.lineY = 0
                        },
                        nextLine: function() {
                            this.moveText(0, this.current.leading)
                        },
                        paintChar: function(t, e, n) {
                            var i, r = this.ctx,
                                a = this.current,
                                s = a.font,
                                o = a.textRenderingMode,
                                c = a.fontSize / a.fontSizeScale,
                                l = o & d.FILL_STROKE_MASK,
                                h = !!(o & d.ADD_TO_PATH_FLAG);
                            if ((s.disableFontFace || h) && (i = s.getPathGenerator(this.commonObjs, t)), s.disableFontFace ? (r.save(), r.translate(e, n), r.beginPath(), i(r, c), l !== d.FILL && l !== d.FILL_STROKE || r.fill(), l !== d.STROKE && l !== d.FILL_STROKE || r.stroke(), r.restore()) : (l !== d.FILL && l !== d.FILL_STROKE || r.fillText(t, e, n), l !== d.STROKE && l !== d.FILL_STROKE || r.strokeText(t, e, n)), h) {
                                (this.pendingTextPaths || (this.pendingTextPaths = [])).push({
                                    transform: r.mozCurrentTransform,
                                    x: e,
                                    y: n,
                                    fontSize: c,
                                    addToPath: i
                                })
                            }
                        },
                        get isFontSubpixelAAEnabled() {
                            var t = document.createElement("canvas").getContext("2d");
                            t.scale(1.5, 1), t.fillText("I", 0, 10);
                            for (var e = t.getImageData(0, 0, 10, 10).data, n = !1, i = 3; i < e.length; i += 4)
                                if (e[i] > 0 && e[i] < 255) {
                                    n = !0;
                                    break
                                } return x(this, "isFontSubpixelAAEnabled", n)
                        },
                        showText: function(t) {
                            var e = this.current,
                                n = e.font;
                            if (n.isType3Font) return this.showType3Text(t);
                            var i = e.fontSize;
                            if (0 !== i) {
                                var r = this.ctx,
                                    a = e.fontSizeScale,
                                    s = e.charSpacing,
                                    o = e.wordSpacing,
                                    c = e.fontDirection,
                                    l = e.textHScale * c,
                                    h = t.length,
                                    u = n.vertical,
                                    p = u ? 1 : -1,
                                    f = n.defaultVMetrics,
                                    g = i * e.fontMatrix[0],
                                    m = e.textRenderingMode === d.FILL && !n.disableFontFace;
                                r.save(), r.transform.apply(r, e.textMatrix), r.translate(e.x, e.y + e.textRise), e.patternFill && (r.fillStyle = e.fillColor.getPattern(r, this)), c > 0 ? r.scale(l, -1) : r.scale(l, 1);
                                var v = e.lineWidth,
                                    b = e.textMatrixScale;
                                if (0 === b || 0 === v) {
                                    var y = e.textRenderingMode & d.FILL_STROKE_MASK;
                                    y !== d.STROKE && y !== d.FILL_STROKE || (this.cachedGetSinglePixelWidth = null, v = .65 * this.getSinglePixelWidth())
                                } else v /= b;
                                1 !== a && (r.scale(a, a), v /= a), r.lineWidth = v;
                                var x, S = 0;
                                for (x = 0; x < h; ++x) {
                                    var k = t[x];
                                    if (A(k)) S += p * k * i / 1e3;
                                    else {
                                        var C, _, w, T, L = !1,
                                            P = (k.isSpace ? o : 0) + s,
                                            E = k.fontChar,
                                            R = k.accent,
                                            I = k.width;
                                        if (u) {
                                            var D, j, O;
                                            D = k.vmetric || f, j = k.vmetric ? D[1] : .5 * I, j = -j * g, O = D[2] * g, I = D ? -D[0] : I, C = j / a, _ = (S + O) / a
                                        } else C = S / a, _ = 0;
                                        if (n.remeasure && I > 0) {
                                            var M = 1e3 * r.measureText(E).width / i * a;
                                            if (I < M && this.isFontSubpixelAAEnabled) {
                                                var F = I / M;
                                                L = !0, r.save(), r.scale(F, 1), C /= F
                                            } else I !== M && (C += (I - M) / 2e3 * i / a)
                                        }(k.isInFont || n.missingFile) && (m && !R ? r.fillText(E, C, _) : (this.paintChar(E, C, _), R && (w = C + R.offset.x / a, T = _ - R.offset.y / a, this.paintChar(R.fontChar, w, T))));
                                        S += I * g + P * c, L && r.restore()
                                    }
                                }
                                u ? e.y -= S * l : e.x += S * l, r.restore()
                            }
                        },
                        showType3Text: function(t) {
                            var e, n, i, r, a = this.ctx,
                                s = this.current,
                                o = s.font,
                                l = s.fontSize,
                                h = s.fontDirection,
                                u = o.vertical ? 1 : -1,
                                p = s.charSpacing,
                                g = s.wordSpacing,
                                m = s.textHScale * h,
                                v = s.fontMatrix || c,
                                b = t.length,
                                y = s.textRenderingMode === d.INVISIBLE;
                            if (!y && 0 !== l) {
                                for (this.cachedGetSinglePixelWidth = null, a.save(), a.transform.apply(a, s.textMatrix), a.translate(s.x, s.y), a.scale(m, h), e = 0; e < b; ++e)
                                    if (n = t[e], A(n)) r = u * n * l / 1e3, this.ctx.translate(r, 0), s.x += r * m;
                                    else {
                                        var x = (n.isSpace ? g : 0) + p,
                                            k = o.charProcOperatorList[n.operatorListId];
                                        if (k) {
                                            this.processingType3 = n, this.save(), a.scale(l, l), a.transform.apply(a, v), this.executeOperatorList(k), this.restore();
                                            var C = f.applyTransform([n.width, 0], v);
                                            i = C[0] * l + x, a.translate(i, 0), s.x += i * m
                                        } else S('Type3 character "' + n.operatorListId + '" is not available')
                                    } a.restore(), this.processingType3 = null
                            }
                        },
                        setCharWidth: function(t, e) {},
                        setCharWidthAndBounds: function(t, e, n, i, r, a) {
                            this.ctx.rect(n, i, r - n, a - i), this.clip(), this.endPath()
                        },
                        getColorN_Pattern: function(e) {
                            var n;
                            if ("TilingPattern" === e[0]) {
                                var i = e[1],
                                    r = this.baseTransform || this.ctx.mozCurrentTransform.slice(),
                                    a = this,
                                    s = {
                                        createCanvasGraphics: function(e) {
                                            return new t(e, a.commonObjs, a.objs)
                                        }
                                    };
                                n = new k(e, i, this.ctx, s, r)
                            } else n = C(e);
                            return n
                        },
                        setStrokeColorN: function() {
                            this.current.strokeColor = this.getColorN_Pattern(arguments)
                        },
                        setFillColorN: function() {
                            this.current.fillColor = this.getColorN_Pattern(arguments), this.current.patternFill = !0
                        },
                        setStrokeRGBColor: function(t, e, n) {
                            var i = f.makeCssRgb(t, e, n);
                            this.ctx.strokeStyle = i, this.current.strokeColor = i
                        },
                        setFillRGBColor: function(t, e, n) {
                            var i = f.makeCssRgb(t, e, n);
                            this.ctx.fillStyle = i, this.current.fillColor = i, this.current.patternFill = !1
                        },
                        shadingFill: function(t) {
                            var e = this.ctx;
                            this.save();
                            var n = C(t);
                            e.fillStyle = n.getPattern(e, this, !0);
                            var i = e.mozCurrentTransformInverse;
                            if (i) {
                                var r = e.canvas,
                                    a = r.width,
                                    s = r.height,
                                    o = f.applyTransform([0, 0], i),
                                    c = f.applyTransform([0, s], i),
                                    l = f.applyTransform([a, 0], i),
                                    h = f.applyTransform([a, s], i),
                                    u = Math.min(o[0], c[0], l[0], h[0]),
                                    d = Math.min(o[1], c[1], l[1], h[1]),
                                    p = Math.max(o[0], c[0], l[0], h[0]),
                                    g = Math.max(o[1], c[1], l[1], h[1]);
                                this.ctx.fillRect(u, d, p - u, g - d)
                            } else this.ctx.fillRect(-1e10, -1e10, 2e10, 2e10);
                            this.restore()
                        },
                        beginInlineImage: function() {
                            y("Should not call beginInlineImage")
                        },
                        beginImageData: function() {
                            y("Should not call beginImageData")
                        },
                        paintFormXObjectBegin: function(t, e) {
                            if (this.save(), this.baseTransformStack.push(this.baseTransform), v(t) && 6 === t.length && this.transform.apply(this, t), this.baseTransform = this.ctx.mozCurrentTransform, v(e) && 4 === e.length) {
                                var n = e[2] - e[0],
                                    i = e[3] - e[1];
                                this.ctx.rect(e[0], e[1], n, i), this.clip(), this.endPath()
                            }
                        },
                        paintFormXObjectEnd: function() {
                            this.restore(), this.baseTransform = this.baseTransformStack.pop()
                        },
                        beginGroup: function(t) {
                            this.save();
                            var e = this.ctx;
                            t.isolated || m("TODO: Support non-isolated groups."), t.knockout && S("Knockout groups not supported.");
                            var n = e.mozCurrentTransform;
                            t.matrix && e.transform.apply(e, t.matrix), g(t.bbox, "Bounding box is required.");
                            var r = f.getAxialAlignedBoundingBox(t.bbox, e.mozCurrentTransform),
                                a = [0, 0, e.canvas.width, e.canvas.height];
                            r = f.intersect(r, a) || [0, 0, 0, 0];
                            var s = Math.floor(r[0]),
                                o = Math.floor(r[1]),
                                c = Math.max(Math.ceil(r[2]) - s, 1),
                                l = Math.max(Math.ceil(r[3]) - o, 1),
                                h = 1,
                                u = 1;
                            c > 4096 && (h = c / 4096, c = 4096), l > 4096 && (u = l / 4096, l = 4096);
                            var d = "groupAt" + this.groupLevel;
                            t.smask && (d += "_smask_" + this.smaskCounter++ % 2);
                            var p = this.cachedCanvases.getCanvas(d, c, l, !0),
                                A = p.context;
                            A.scale(1 / h, 1 / u), A.translate(-s, -o), A.transform.apply(A, n), t.smask ? this.smaskStack.push({
                                canvas: p.canvas,
                                context: A,
                                offsetX: s,
                                offsetY: o,
                                scaleX: h,
                                scaleY: u,
                                subtype: t.smask.subtype,
                                backdrop: t.smask.backdrop,
                                transferMap: t.smask.transferMap || null,
                                startTransformInverse: null
                            }) : (e.setTransform(1, 0, 0, 1, 0, 0), e.translate(s, o), e.scale(h, u)), i(e, A), this.ctx = A, this.setGState([
                                ["BM", "Normal"],
                                ["ca", 1],
                                ["CA", 1]
                            ]), this.groupStack.push(e), this.groupLevel++, this.current.activeSMask = null
                        },
                        endGroup: function(t) {
                            this.groupLevel--;
                            var e = this.ctx;
                            this.ctx = this.groupStack.pop(), void 0 !== this.ctx.imageSmoothingEnabled ? this.ctx.imageSmoothingEnabled = !1 : this.ctx.mozImageSmoothingEnabled = !1, t.smask ? this.tempSMask = this.smaskStack.pop() : this.ctx.drawImage(e.canvas, 0, 0), this.restore()
                        },
                        beginAnnotations: function() {
                            this.save(), this.current = new E, this.baseTransform && this.ctx.setTransform.apply(this.ctx, this.baseTransform)
                        },
                        endAnnotations: function() {
                            this.restore()
                        },
                        beginAnnotation: function(t, e, n) {
                            if (this.save(), v(t) && 4 === t.length) {
                                var i = t[2] - t[0],
                                    r = t[3] - t[1];
                                this.ctx.rect(t[0], t[1], i, r), this.clip(), this.endPath()
                            }
                            this.transform.apply(this, e), this.transform.apply(this, n)
                        },
                        endAnnotation: function() {
                            this.restore()
                        },
                        paintJpegXObject: function(t, e, n) {
                            var i = this.objs.get(t);
                            if (!i) return void S("Dependent image isn't ready yet");
                            this.save();
                            var r = this.ctx;
                            if (r.scale(1 / e, -1 / n), r.drawImage(i, 0, 0, i.width, i.height, 0, -n, e, n), this.imageLayer) {
                                var a = r.mozCurrentTransformInverse,
                                    s = this.getCanvasPosition(0, 0);
                                this.imageLayer.appendImage({
                                    objId: t,
                                    left: s[0],
                                    top: s[1],
                                    width: e / a[0],
                                    height: n / a[3]
                                })
                            }
                            this.restore()
                        },
                        paintImageMaskXObject: function(t) {
                            var e = this.ctx,
                                i = t.width,
                                r = t.height,
                                a = this.current.fillColor,
                                s = this.current.patternFill,
                                c = this.processingType3;
                            if (c && void 0 === c.compiled && (c.compiled = i <= 1e3 && r <= 1e3 ? o({
                                    data: t.data,
                                    width: i,
                                    height: r
                                }) : null), c && c.compiled) return void c.compiled(e);
                            var l = this.cachedCanvases.getCanvas("maskCanvas", i, r),
                                h = l.context;
                            h.save(), n(h, t), h.globalCompositeOperation = "source-in", h.fillStyle = s ? a.getPattern(h, this) : a, h.fillRect(0, 0, i, r), h.restore(), this.paintInlineImageXObject(l.canvas)
                        },
                        paintImageMaskXObjectRepeat: function(t, e, i, r) {
                            var a = t.width,
                                s = t.height,
                                o = this.current.fillColor,
                                c = this.current.patternFill,
                                l = this.cachedCanvases.getCanvas("maskCanvas", a, s),
                                h = l.context;
                            h.save(), n(h, t), h.globalCompositeOperation = "source-in", h.fillStyle = c ? o.getPattern(h, this) : o, h.fillRect(0, 0, a, s), h.restore();
                            for (var u = this.ctx, d = 0, p = r.length; d < p; d += 2) u.save(), u.transform(e, 0, 0, i, r[d], r[d + 1]), u.scale(1, -1), u.drawImage(l.canvas, 0, 0, a, s, 0, -1, 1, 1), u.restore()
                        },
                        paintImageMaskXObjectGroup: function(t) {
                            for (var e = this.ctx, i = this.current.fillColor, r = this.current.patternFill, a = 0, s = t.length; a < s; a++) {
                                var o = t[a],
                                    c = o.width,
                                    l = o.height,
                                    h = this.cachedCanvases.getCanvas("maskCanvas", c, l),
                                    u = h.context;
                                u.save(), n(u, o), u.globalCompositeOperation = "source-in", u.fillStyle = r ? i.getPattern(u, this) : i, u.fillRect(0, 0, c, l), u.restore(), e.save(), e.transform.apply(e, o.transform), e.scale(1, -1), e.drawImage(h.canvas, 0, 0, c, l, 0, -1, 1, 1), e.restore()
                            }
                        },
                        paintImageXObject: function(t) {
                            var e = this.objs.get(t);
                            if (!e) return void S("Dependent image isn't ready yet");
                            this.paintInlineImageXObject(e)
                        },
                        paintImageXObjectRepeat: function(t, e, n, i) {
                            var r = this.objs.get(t);
                            if (!r) return void S("Dependent image isn't ready yet");
                            for (var a = r.width, s = r.height, o = [], c = 0, l = i.length; c < l; c += 2) o.push({
                                transform: [e, 0, 0, n, i[c], i[c + 1]],
                                x: 0,
                                y: 0,
                                w: a,
                                h: s
                            });
                            this.paintInlineImageXObjectGroup(r, o)
                        },
                        paintInlineImageXObject: function(t) {
                            var n = t.width,
                                i = t.height,
                                r = this.ctx;
                            this.save(), r.scale(1 / n, -1 / i);
                            var a, s, o = r.mozCurrentTransformInverse,
                                c = o[0],
                                l = o[1],
                                h = Math.max(Math.sqrt(c * c + l * l), 1),
                                u = o[2],
                                d = o[3],
                                p = Math.max(Math.sqrt(u * u + d * d), 1);
                            if (t instanceof HTMLElement || !t.data) a = t;
                            else {
                                s = this.cachedCanvases.getCanvas("inlineImage", n, i);
                                var f = s.context;
                                e(f, t), a = s.canvas
                            }
                            for (var g = n, m = i, A = "prescale1"; h > 2 && g > 1 || p > 2 && m > 1;) {
                                var v = g,
                                    b = m;
                                h > 2 && g > 1 && (v = Math.ceil(g / 2), h /= g / v), p > 2 && m > 1 && (b = Math.ceil(m / 2), p /= m / b), s = this.cachedCanvases.getCanvas(A, v, b), f = s.context, f.clearRect(0, 0, v, b), f.drawImage(a, 0, 0, g, m, 0, 0, v, b), a = s.canvas, g = v, m = b, A = "prescale1" === A ? "prescale2" : "prescale1"
                            }
                            if (r.drawImage(a, 0, 0, g, m, 0, -i, n, i), this.imageLayer) {
                                var y = this.getCanvasPosition(0, -i);
                                this.imageLayer.appendImage({
                                    imgData: t,
                                    left: y[0],
                                    top: y[1],
                                    width: n / o[0],
                                    height: i / o[3]
                                })
                            }
                            this.restore()
                        },
                        paintInlineImageXObjectGroup: function(t, n) {
                            var i = this.ctx,
                                r = t.width,
                                a = t.height,
                                s = this.cachedCanvases.getCanvas("inlineImage", r, a);
                            e(s.context, t);
                            for (var o = 0, c = n.length; o < c; o++) {
                                var l = n[o];
                                if (i.save(), i.transform.apply(i, l.transform), i.scale(1, -1), i.drawImage(s.canvas, l.x, l.y, l.w, l.h, 0, -1, 1, 1), this.imageLayer) {
                                    var h = this.getCanvasPosition(l.x, l.y);
                                    this.imageLayer.appendImage({
                                        imgData: t,
                                        left: h[0],
                                        top: h[1],
                                        width: r,
                                        height: a
                                    })
                                }
                                i.restore()
                            }
                        },
                        paintSolidColorImageMask: function() {
                            this.ctx.fillRect(0, 0, 1, 1)
                        },
                        paintXObject: function() {
                            S("Unsupported 'paintXObject' command.")
                        },
                        markPoint: function(t) {},
                        markPointProps: function(t, e) {},
                        beginMarkedContent: function(t) {},
                        beginMarkedContentProps: function(t, e) {},
                        endMarkedContent: function() {},
                        beginCompat: function() {},
                        endCompat: function() {},
                        consumePath: function() {
                            var t = this.ctx;
                            this.pendingClip && (this.pendingClip === O ? void 0 !== t.mozFillRule ? (t.mozFillRule = "evenodd", t.clip(), t.mozFillRule = "nonzero") : t.clip("evenodd") : t.clip(), this.pendingClip = null), t.beginPath()
                        },
                        getSinglePixelWidth: function(t) {
                            if (null === this.cachedGetSinglePixelWidth) {
                                this.ctx.save();
                                var e = this.ctx.mozCurrentTransformInverse;
                                this.ctx.restore(), this.cachedGetSinglePixelWidth = Math.sqrt(Math.max(e[0] * e[0] + e[1] * e[1], e[2] * e[2] + e[3] * e[3]))
                            }
                            return this.cachedGetSinglePixelWidth
                        },
                        getCanvasPosition: function(t, e) {
                            var n = this.ctx.mozCurrentTransform;
                            return [n[0] * t + n[2] * e + n[4], n[1] * t + n[3] * e + n[5]]
                        }
                    };
                    for (var M in u) t.prototype[u[M]] = t.prototype[M];
                    return t
                }();
            t.CanvasGraphics = R, t.createScratchCanvas = a
        }),
        function(t, e) {
            e(t.pdfjsDisplayAPI = {}, t.pdfjsSharedUtil, t.pdfjsDisplayFontLoader, t.pdfjsDisplayCanvas, t.pdfjsDisplayMetadata, t.pdfjsDisplayDOMUtils)
        }(this, function(t, n, i, r, a, s, o) {
            function c(t, e, n, i) {
                var r = new H;
                arguments.length > 1 && k("getDocument is called with pdfDataRangeTransport, passwordCallback or progressCallback argument"), e && (e instanceof Y || (e = Object.create(e), e.length = t.length, e.initialData = t.initialData, e.abort || (e.abort = function() {})), t = Object.create(t), t.range = e), r.onPassword = n || null, r.onProgress = i || null;
                var a;
                "string" == typeof t ? a = {
                    url: t
                } : L(t) ? a = {
                    data: t
                } : t instanceof Y ? a = {
                    range: t
                } : ("object" != typeof t && S("Invalid parameter in getDocument, need either Uint8Array, string or a parameter object"), t.url || t.data || t.range || S("Invalid parameter object: need either .data, .range or .url"), a = t);
                var s = {},
                    o = null,
                    c = null;
                for (var h in a)
                    if ("url" !== h || "undefined" == typeof window)
                        if ("range" !== h)
                            if ("worker" !== h)
                                if ("data" !== h || a[h] instanceof Uint8Array) s[h] = a[h];
                                else {
                                    var u = a[h];
                                    "string" == typeof u ? s[h] = R(u) : "object" != typeof u || null === u || isNaN(u.length) ? L(u) ? s[h] = new Uint8Array(u) : S("Invalid PDF binary data: either typed array, string or array-like object is expected in the data property.") : s[h] = new Uint8Array(u)
                                }
                else c = a[h];
                else o = a[h];
                else s[h] = new URL(a[h], window.location).href;
                s.rangeChunkSize = s.rangeChunkSize || 65536, c || (c = new J, r._worker = c);
                var p = r.docId;
                return c.promise.then(function() {
                    if (r.destroyed) throw new Error("Loading aborted");
                    return l(c, s, o, p).then(function(t) {
                        if (r.destroyed) throw new Error("Loading aborted");
                        var e = new d(p, t, c.port),
                            n = new Q(e, r, o);
                        r._transport = n, e.send("Ready", null)
                    })
                }).catch(r._capability.reject), r
            }

            function l(t, e, n, i) {
                return t.destroyed ? Promise.reject(new Error("Worker was destroyed")) : (e.disableAutoFetch = U("disableAutoFetch"), e.disableStream = U("disableStream"), e.chunkedViewerLoading = !!n, n && (e.length = n.length, e.initialData = n.initialData), t.messageHandler.sendWithPromise("GetDocRequest", {
                    docId: i,
                    source: e,
                    disableRange: U("disableRange"),
                    maxImageSize: U("maxImageSize"),
                    cMapUrl: U("cMapUrl"),
                    cMapPacked: U("cMapPacked"),
                    disableFontFace: U("disableFontFace"),
                    disableCreateObjectURL: U("disableCreateObjectURL"),
                    postMessageTransfers: U("postMessageTransfers") && !W
                }).then(function(e) {
                    if (t.destroyed) throw new Error("Worker was destroyed");
                    return e
                }))
            }
            var h, u = n.InvalidPDFException,
                d = n.MessageHandler,
                p = n.MissingPDFException,
                f = n.PageViewport,
                g = n.PasswordResponses,
                m = n.PasswordException,
                A = n.StatTimer,
                v = n.UnexpectedResponseException,
                b = n.UnknownErrorException,
                y = n.Util,
                x = n.createPromiseCapability,
                S = n.error,
                k = n.deprecated,
                C = n.getVerbosityLevel,
                _ = n.info,
                w = n.isInt,
                T = n.isArray,
                L = n.isArrayBuffer,
                P = n.isSameOrigin,
                E = n.loadJpegStream,
                R = n.stringToBytes,
                I = n.globalScope,
                D = n.warn,
                j = i.FontFaceObject,
                O = i.FontLoader,
                M = r.CanvasGraphics,
                F = r.createScratchCanvas,
                N = a.Metadata,
                U = s.getDefaultSetting,
                B = !1,
                W = !1,
                G = !1;
            "undefined" == typeof window && (B = !0, void 0 === require.ensure && (require.ensure = require("node-ensure")), G = !0), "undefined" != typeof __webpack_require__ && (G = !0), "undefined" != typeof requirejs && requirejs.toUrl && (h = requirejs.toUrl("pdfjs-dist/build/pdf.worker.js"));
            var X = "undefined" != typeof requirejs && requirejs.load,
                z = G ? function(t) {
                    require.ensure([], function() {
                        t(require("./pdf.worker.js").WorkerMessageHandler)
                    })
                } : X ? function(t) {
                    requirejs(["pdfjs-dist/build/pdf.worker"], function(e) {
                        t(e.WorkerMessageHandler)
                    })
                } : null,
                H = function() {
                    function t() {
                        this._capability = x(), this._transport = null, this._worker = null, this.docId = "d" + e++, this.destroyed = !1, this.onPassword = null, this.onProgress = null, this.onUnsupportedFeature = null
                    }
                    var e = Math.floor(1e6 * Math.random());
                    return t.prototype = {
                        get promise() {
                            return this._capability.promise
                        },
                        destroy: function() {
                            return this.destroyed = !0, (this._transport ? this._transport.destroy() : Promise.resolve()).then(function() {
                                this._transport = null, this._worker && (this._worker.destroy(), this._worker = null)
                            }.bind(this))
                        },
                        then: function(t, e) {
                            return this.promise.then.apply(this.promise, arguments)
                        }
                    }, t
                }(),
                Y = function() {
                    function t(t, e) {
                        this.length = t, this.initialData = e, this._rangeListeners = [], this._progressListeners = [], this._progressiveReadListeners = [], this._readyCapability = x()
                    }
                    return t.prototype = {
                        addRangeListener: function(t) {
                            this._rangeListeners.push(t)
                        },
                        addProgressListener: function(t) {
                            this._progressListeners.push(t)
                        },
                        addProgressiveReadListener: function(t) {
                            this._progressiveReadListeners.push(t)
                        },
                        onDataRange: function(t, e) {
                            for (var n = this._rangeListeners, i = 0, r = n.length; i < r; ++i) n[i](t, e)
                        },
                        onDataProgress: function(t) {
                            this._readyCapability.promise.then(function() {
                                for (var e = this._progressListeners, n = 0, i = e.length; n < i; ++n) e[n](t)
                            }.bind(this))
                        },
                        onDataProgressiveRead: function(t) {
                            this._readyCapability.promise.then(function() {
                                for (var e = this._progressiveReadListeners, n = 0, i = e.length; n < i; ++n) e[n](t)
                            }.bind(this))
                        },
                        transportReady: function() {
                            this._readyCapability.resolve()
                        },
                        requestDataRange: function(t, e) {
                            throw new Error("Abstract method PDFDataRangeTransport.requestDataRange")
                        },
                        abort: function() {}
                    }, t
                }(),
                q = function() {
                    function t(t, e, n) {
                        this.pdfInfo = t, this.transport = e, this.loadingTask = n
                    }
                    return t.prototype = {
                        get numPages() {
                            return this.pdfInfo.numPages
                        },
                        get fingerprint() {
                            return this.pdfInfo.fingerprint
                        },
                        getPage: function(t) {
                            return this.transport.getPage(t)
                        },
                        getPageIndex: function(t) {
                            return this.transport.getPageIndex(t)
                        },
                        getDestinations: function() {
                            return this.transport.getDestinations()
                        },
                        getDestination: function(t) {
                            return this.transport.getDestination(t)
                        },
                        getPageLabels: function() {
                            return this.transport.getPageLabels()
                        },
                        getAttachments: function() {
                            return this.transport.getAttachments()
                        },
                        getJavaScript: function() {
                            return this.transport.getJavaScript()
                        },
                        getOutline: function() {
                            return this.transport.getOutline()
                        },
                        getMetadata: function() {
                            return this.transport.getMetadata()
                        },
                        getData: function() {
                            return this.transport.getData()
                        },
                        getDownloadInfo: function() {
                            return this.transport.downloadInfoCapability.promise
                        },
                        getStats: function() {
                            return this.transport.getStats()
                        },
                        cleanup: function() {
                            this.transport.startCleanup()
                        },
                        destroy: function() {
                            return this.loadingTask.destroy()
                        }
                    }, t
                }(),
                V = function() {
                    function t(t, e, n) {
                        this.pageIndex = t, this.pageInfo = e, this.transport = n, this.stats = new A, this.stats.enabled = U("enableStats"), this.commonObjs = n.commonObjs, this.objs = new K, this.cleanupAfterRender = !1, this.pendingCleanup = !1, this.intentStates = Object.create(null), this.destroyed = !1
                    }
                    return t.prototype = {
                        get pageNumber() {
                            return this.pageIndex + 1
                        },
                        get rotate() {
                            return this.pageInfo.rotate
                        },
                        get ref() {
                            return this.pageInfo.ref
                        },
                        get view() {
                            return this.pageInfo.view
                        },
                        getViewport: function(t, e) {
                            return arguments.length < 2 && (e = this.rotate), new f(this.view, t, e, 0, 0)
                        },
                        getAnnotations: function(t) {
                            var e = t && t.intent || null;
                            return this.annotationsPromise && this.annotationsIntent === e || (this.annotationsPromise = this.transport.getAnnotations(this.pageIndex, e), this.annotationsIntent = e), this.annotationsPromise
                        },
                        render: function(t) {
                            function e(t) {
                                var e = a.renderTasks.indexOf(s);
                                e >= 0 && a.renderTasks.splice(e, 1), c.cleanupAfterRender && (c.pendingCleanup = !0), c._tryCleanup(), t ? s.capability.reject(t) : s.capability.resolve(), n.timeEnd("Rendering"), n.timeEnd("Overall")
                            }
                            var n = this.stats;
                            n.time("Overall"), this.pendingCleanup = !1;
                            var i = "print" === t.intent ? "print" : "display",
                                r = t.renderInteractiveForms === !0;
                            this.intentStates[i] || (this.intentStates[i] = Object.create(null));
                            var a = this.intentStates[i];
                            a.displayReadyCapability || (a.receivingOperatorList = !0, a.displayReadyCapability = x(), a.operatorList = {
                                fnArray: [],
                                argsArray: [],
                                lastChunk: !1
                            }, this.stats.time("Page Request"), this.transport.messageHandler.send("RenderPageRequest", {
                                pageIndex: this.pageNumber - 1,
                                intent: i,
                                renderInteractiveForms: r
                            }));
                            var s = new $(e, t, this.objs, this.commonObjs, a.operatorList, this.pageNumber);
                            s.useRequestAnimationFrame = "print" !== i, a.renderTasks || (a.renderTasks = []), a.renderTasks.push(s);
                            var o = s.task;
                            t.continueCallback && (k("render is used with continueCallback parameter"), o.onContinue = t.continueCallback);
                            var c = this;
                            return a.displayReadyCapability.promise.then(function(t) {
                                if (c.pendingCleanup) return void e();
                                n.time("Rendering"), s.initializeGraphics(t), s.operatorListChanged()
                            }, function(t) {
                                e(t)
                            }), o
                        },
                        getOperatorList: function() {
                            function t() {
                                if (n.operatorList.lastChunk) {
                                    n.opListReadCapability.resolve(n.operatorList);
                                    var t = n.renderTasks.indexOf(e);
                                    t >= 0 && n.renderTasks.splice(t, 1)
                                }
                            }
                            this.intentStates.oplist || (this.intentStates.oplist = Object.create(null));
                            var e, n = this.intentStates.oplist;
                            return n.opListReadCapability || (e = {}, e.operatorListChanged = t, n.receivingOperatorList = !0, n.opListReadCapability = x(), n.renderTasks = [], n.renderTasks.push(e), n.operatorList = {
                                fnArray: [],
                                argsArray: [],
                                lastChunk: !1
                            }, this.transport.messageHandler.send("RenderPageRequest", {
                                pageIndex: this.pageIndex,
                                intent: "oplist"
                            })), n.opListReadCapability.promise
                        },
                        getTextContent: function(t) {
                            return this.transport.messageHandler.sendWithPromise("GetTextContent", {
                                pageIndex: this.pageNumber - 1,
                                normalizeWhitespace: !(!t || t.normalizeWhitespace !== !0),
                                combineTextItems: !t || t.disableCombineTextItems !== !0
                            })
                        },
                        _destroy: function() {
                            this.destroyed = !0, this.transport.pageCache[this.pageIndex] = null;
                            var t = [];
                            return Object.keys(this.intentStates).forEach(function(e) {
                                if ("oplist" !== e) {
                                    this.intentStates[e].renderTasks.forEach(function(e) {
                                        var n = e.capability.promise.catch(function() {});
                                        t.push(n), e.cancel()
                                    })
                                }
                            }, this), this.objs.clear(), this.annotationsPromise = null, this.pendingCleanup = !1, Promise.all(t)
                        },
                        destroy: function() {
                            k("page destroy method, use cleanup() instead"), this.cleanup()
                        },
                        cleanup: function() {
                            this.pendingCleanup = !0, this._tryCleanup()
                        },
                        _tryCleanup: function() {
                            this.pendingCleanup && !Object.keys(this.intentStates).some(function(t) {
                                var e = this.intentStates[t];
                                return 0 !== e.renderTasks.length || e.receivingOperatorList
                            }, this) && (Object.keys(this.intentStates).forEach(function(t) {
                                delete this.intentStates[t]
                            }, this), this.objs.clear(), this.annotationsPromise = null, this.pendingCleanup = !1)
                        },
                        _startRenderPage: function(t, e) {
                            var n = this.intentStates[e];
                            n.displayReadyCapability && n.displayReadyCapability.resolve(t)
                        },
                        _renderPageChunk: function(t, e) {
                            var n, i, r = this.intentStates[e];
                            for (n = 0, i = t.length; n < i; n++) r.operatorList.fnArray.push(t.fnArray[n]), r.operatorList.argsArray.push(t.argsArray[n]);
                            for (r.operatorList.lastChunk = t.lastChunk, n = 0; n < r.renderTasks.length; n++) r.renderTasks[n].operatorListChanged();
                            t.lastChunk && (r.receivingOperatorList = !1, this._tryCleanup())
                        }
                    }, t
                }(),
                J = function() {
                    function t() {
                        return void 0 !== h ? h : U("workerSrc") ? U("workerSrc") : e ? e.replace(/\.js$/i, ".worker.js") : void S("No PDFJS.workerSrc specified")
                    }

                    function n() {
                        if (!s) {
                            s = x();
                            (z || function(e) {
                                y.loadScript(t(), function() {
                                    e(window.pdfjsDistBuildPdfWorker.WorkerMessageHandler)
                                })
                            })(s.resolve)
                        }
                        return s.promise
                    }

                    function i(t) {
                        this._listeners = [], this._defer = t, this._deferred = Promise.resolve(void 0)
                    }

                    function r(t) {
                        var e = "importScripts('" + t + "');";
                        return URL.createObjectURL(new Blob([e]))
                    }

                    function a(t) {
                        this.name = t, this.destroyed = !1, this._readyCapability = x(), this._port = null, this._webWorker = null, this._messageHandler = null, this._initialize()
                    }
                    var s, o = 0;
                    return i.prototype = {
                        postMessage: function(t, e) {
                            function n(t) {
                                if ("object" != typeof t || null === t) return t;
                                if (i.has(t)) return i.get(t);
                                var r, a;
                                if ((a = t.buffer) && L(a)) {
                                    var s = e && e.indexOf(a) >= 0;
                                    return r = t === a ? t : s ? new t.constructor(a, t.byteOffset, t.byteLength) : new t.constructor(t), i.set(t, r), r
                                }
                                r = T(t) ? [] : {}, i.set(t, r);
                                for (var o in t) {
                                    for (var c, l = t; !(c = Object.getOwnPropertyDescriptor(l, o));) l = Object.getPrototypeOf(l);
                                    void 0 !== c.value && "function" != typeof c.value && (r[o] = n(c.value))
                                }
                                return r
                            }
                            if (!this._defer) return void this._listeners.forEach(function(e) {
                                e.call(this, {
                                    data: t
                                })
                            }, this);
                            var i = new WeakMap,
                                r = {
                                    data: n(t)
                                };
                            this._deferred.then(function() {
                                this._listeners.forEach(function(t) {
                                    t.call(this, r)
                                }, this)
                            }.bind(this))
                        },
                        addEventListener: function(t, e) {
                            this._listeners.push(e)
                        },
                        removeEventListener: function(t, e) {
                            var n = this._listeners.indexOf(e);
                            this._listeners.splice(n, 1)
                        },
                        terminate: function() {
                            this._listeners = []
                        }
                    }, a.prototype = {
                        get promise() {
                            return this._readyCapability.promise
                        },
                        get port() {
                            return this._port
                        },
                        get messageHandler() {
                            return this._messageHandler
                        },
                        _initialize: function() {
                            if (!B && !U("disableWorker") && "undefined" != typeof Worker) {
                                var e = t();
                                try {
                                    P(window.location.href, e) || (e = r(new URL(e, window.location).href));
                                    var n = new Worker(e),
                                        i = new d("main", "worker", n),
                                        a = function() {
                                            n.removeEventListener("error", s), i.destroy(), n.terminate(), this.destroyed ? this._readyCapability.reject(new Error("Worker was destroyed")) : this._setupFakeWorker()
                                        }.bind(this),
                                        s = function(t) {
                                            this._webWorker || a()
                                        }.bind(this);
                                    n.addEventListener("error", s), i.on("test", function(t) {
                                        if (n.removeEventListener("error", s), this.destroyed) return void a();
                                        t && t.supportTypedArray ? (this._messageHandler = i, this._port = n, this._webWorker = n, t.supportTransfers || (W = !0), this._readyCapability.resolve(), i.send("configure", {
                                            verbosity: C()
                                        })) : (this._setupFakeWorker(), i.destroy(), n.terminate())
                                    }.bind(this)), i.on("console_log", function(t) {
                                        console.log.apply(console, t)
                                    }), i.on("console_error", function(t) {
                                        console.error.apply(console, t)
                                    }), i.on("ready", function(t) {
                                        if (n.removeEventListener("error", s), this.destroyed) return void a();
                                        try {
                                            o()
                                        } catch (t) {
                                            this._setupFakeWorker()
                                        }
                                    }.bind(this));
                                    var o = function() {
                                        var t = U("postMessageTransfers") && !W,
                                            e = new Uint8Array([t ? 255 : 0]);
                                        try {
                                            i.send("test", e, [e.buffer])
                                        } catch (t) {
                                            _("Cannot use postMessage transfers"), e[0] = 0, i.send("test", e)
                                        }
                                    };
                                    return void o()
                                } catch (t) {
                                    _("The worker has been disabled.")
                                }
                            }
                            this._setupFakeWorker()
                        },
                        _setupFakeWorker: function() {
                            B || U("disableWorker") || (D("Setting up fake worker."), B = !0), n().then(function(t) {
                                if (this.destroyed) return void this._readyCapability.reject(new Error("Worker was destroyed"));
                                var e = Uint8Array !== Float32Array,
                                    n = new i(e);
                                this._port = n;
                                var r = "fake" + o++,
                                    a = new d(r + "_worker", r, n);
                                t.setup(a, n);
                                var s = new d(r, r + "_worker", n);
                                this._messageHandler = s, this._readyCapability.resolve()
                            }.bind(this))
                        },
                        destroy: function() {
                            this.destroyed = !0, this._webWorker && (this._webWorker.terminate(), this._webWorker = null), this._port = null, this._messageHandler && (this._messageHandler.destroy(), this._messageHandler = null)
                        }
                    }, a
                }(),
                Q = function() {
                    function t(t, e, n) {
                        this.messageHandler = t, this.loadingTask = e, this.pdfDataRangeTransport = n, this.commonObjs = new K, this.fontLoader = new O(e.docId), this.destroyed = !1, this.destroyCapability = null, this.pageCache = [], this.pagePromises = [], this.downloadInfoCapability = x(), this.setupMessageHandler()
                    }
                    return t.prototype = {
                        destroy: function() {
                            if (this.destroyCapability) return this.destroyCapability.promise;
                            this.destroyed = !0, this.destroyCapability = x();
                            var t = [];
                            this.pageCache.forEach(function(e) {
                                e && t.push(e._destroy())
                            }), this.pageCache = [], this.pagePromises = [];
                            var e = this,
                                n = this.messageHandler.sendWithPromise("Terminate", null);
                            return t.push(n), Promise.all(t).then(function() {
                                e.fontLoader.clear(), e.pdfDataRangeTransport && (e.pdfDataRangeTransport.abort(), e.pdfDataRangeTransport = null), e.messageHandler && (e.messageHandler.destroy(), e.messageHandler = null), e.destroyCapability.resolve()
                            }, this.destroyCapability.reject), this.destroyCapability.promise
                        },
                        setupMessageHandler: function() {
                            function t(t) {
                                e.send("UpdatePassword", t)
                            }
                            var e = this.messageHandler,
                                n = this.pdfDataRangeTransport;
                            n && (n.addRangeListener(function(t, n) {
                                e.send("OnDataRange", {
                                    begin: t,
                                    chunk: n
                                })
                            }), n.addProgressListener(function(t) {
                                e.send("OnDataProgress", {
                                    loaded: t
                                })
                            }), n.addProgressiveReadListener(function(t) {
                                e.send("OnDataRange", {
                                    chunk: t
                                })
                            }), e.on("RequestDataRange", function(t) {
                                n.requestDataRange(t.begin, t.end)
                            }, this)), e.on("GetDoc", function(t) {
                                var e = t.pdfInfo;
                                this.numPages = t.pdfInfo.numPages;
                                var n = this.loadingTask,
                                    i = new q(e, this, n);
                                this.pdfDocument = i, n._capability.resolve(i)
                            }, this), e.on("NeedPassword", function(e) {
                                var n = this.loadingTask;
                                if (n.onPassword) return n.onPassword(t, g.NEED_PASSWORD);
                                n._capability.reject(new m(e.message, e.code))
                            }, this), e.on("IncorrectPassword", function(e) {
                                var n = this.loadingTask;
                                if (n.onPassword) return n.onPassword(t, g.INCORRECT_PASSWORD);
                                n._capability.reject(new m(e.message, e.code))
                            }, this), e.on("InvalidPDF", function(t) {
                                this.loadingTask._capability.reject(new u(t.message))
                            }, this), e.on("MissingPDF", function(t) {
                                this.loadingTask._capability.reject(new p(t.message))
                            }, this), e.on("UnexpectedResponse", function(t) {
                                this.loadingTask._capability.reject(new v(t.message, t.status))
                            }, this), e.on("UnknownError", function(t) {
                                this.loadingTask._capability.reject(new b(t.message, t.details))
                            }, this), e.on("DataLoaded", function(t) {
                                this.downloadInfoCapability.resolve(t)
                            }, this), e.on("PDFManagerReady", function(t) {
                                this.pdfDataRangeTransport && this.pdfDataRangeTransport.transportReady()
                            }, this), e.on("StartRenderPage", function(t) {
                                if (!this.destroyed) {
                                    var e = this.pageCache[t.pageIndex];
                                    e.stats.timeEnd("Page Request"), e._startRenderPage(t.transparency, t.intent)
                                }
                            }, this), e.on("RenderPageChunk", function(t) {
                                if (!this.destroyed) {
                                    this.pageCache[t.pageIndex]._renderPageChunk(t.operatorList, t.intent)
                                }
                            }, this), e.on("commonobj", function(t) {
                                if (!this.destroyed) {
                                    var e = t[0],
                                        n = t[1];
                                    if (!this.commonObjs.hasData(e)) switch (n) {
                                        case "Font":
                                            var i = t[2];
                                            if ("error" in i) {
                                                var r = i.error;
                                                D("Error during font loading: " + r), this.commonObjs.resolve(e, r);
                                                break
                                            }
                                            var a = null;
                                            U("pdfBug") && I.FontInspector && I.FontInspector.enabled && (a = {
                                                registerFont: function(t, e) {
                                                    I.FontInspector.fontAdded(t, e)
                                                }
                                            });
                                            var s = new j(i, {
                                                isEvalSuported: U("isEvalSupported"),
                                                disableFontFace: U("disableFontFace"),
                                                fontRegistry: a
                                            });
                                            this.fontLoader.bind([s], function(t) {
                                                this.commonObjs.resolve(e, s)
                                            }.bind(this));
                                            break;
                                        case "FontPath":
                                            this.commonObjs.resolve(e, t[2]);
                                            break;
                                        default:
                                            S("Got unknown common object type " + n)
                                    }
                                }
                            }, this), e.on("obj", function(t) {
                                if (!this.destroyed) {
                                    var e, n = t[0],
                                        i = t[1],
                                        r = t[2],
                                        a = this.pageCache[i];
                                    if (!a.objs.hasData(n)) switch (r) {
                                        case "JpegStream":
                                            e = t[3], E(n, e, a.objs);
                                            break;
                                        case "Image":
                                            e = t[3], a.objs.resolve(n, e);
                                            e && "data" in e && e.data.length > 8e6 && (a.cleanupAfterRender = !0);
                                            break;
                                        default:
                                            S("Got unknown object type " + r)
                                    }
                                }
                            }, this), e.on("DocProgress", function(t) {
                                if (!this.destroyed) {
                                    var e = this.loadingTask;
                                    e.onProgress && e.onProgress({
                                        loaded: t.loaded,
                                        total: t.total
                                    })
                                }
                            }, this), e.on("PageError", function(t) {
                                if (!this.destroyed) {
                                    var e = this.pageCache[t.pageNum - 1],
                                        n = e.intentStates[t.intent];
                                    if (n.displayReadyCapability ? n.displayReadyCapability.reject(t.error) : S(t.error), n.operatorList) {
                                        n.operatorList.lastChunk = !0;
                                        for (var i = 0; i < n.renderTasks.length; i++) n.renderTasks[i].operatorListChanged()
                                    }
                                }
                            }, this), e.on("UnsupportedFeature", function(t) {
                                if (!this.destroyed) {
                                    var e = t.featureId,
                                        n = this.loadingTask;
                                    n.onUnsupportedFeature && n.onUnsupportedFeature(e), tt.notify(e)
                                }
                            }, this), e.on("JpegDecode", function(t) {
                                if (this.destroyed) return Promise.reject(new Error("Worker was destroyed"));
                                var e = t[0],
                                    n = t[1];
                                return 3 !== n && 1 !== n ? Promise.reject(new Error("Only 3 components or 1 component can be returned")) : new Promise(function(t, i) {
                                    var r = new Image;
                                    r.onload = function() {
                                        var e = r.width,
                                            i = r.height,
                                            a = e * i,
                                            s = 4 * a,
                                            o = new Uint8Array(a * n),
                                            c = F(e, i),
                                            l = c.getContext("2d");
                                        l.drawImage(r, 0, 0);
                                        var h, u, d = l.getImageData(0, 0, e, i).data;
                                        if (3 === n)
                                            for (h = 0, u = 0; h < s; h += 4, u += 3) o[u] = d[h], o[u + 1] = d[h + 1], o[u + 2] = d[h + 2];
                                        else if (1 === n)
                                            for (h = 0, u = 0; h < s; h += 4, u++) o[u] = d[h];
                                        t({
                                            data: o,
                                            width: e,
                                            height: i
                                        })
                                    }, r.onerror = function() {
                                        i(new Error("JpegDecode failed to load image"))
                                    }, r.src = e
                                })
                            }, this)
                        },
                        getData: function() {
                            return this.messageHandler.sendWithPromise("GetData", null)
                        },
                        getPage: function(t, e) {
                            if (!w(t) || t <= 0 || t > this.numPages) return Promise.reject(new Error("Invalid page request"));
                            var n = t - 1;
                            if (n in this.pagePromises) return this.pagePromises[n];
                            var i = this.messageHandler.sendWithPromise("GetPage", {
                                pageIndex: n
                            }).then(function(t) {
                                if (this.destroyed) throw new Error("Transport destroyed");
                                var e = new V(n, t, this);
                                return this.pageCache[n] = e, e
                            }.bind(this));
                            return this.pagePromises[n] = i, i
                        },
                        getPageIndex: function(t) {
                            return this.messageHandler.sendWithPromise("GetPageIndex", {
                                ref: t
                            }).catch(function(t) {
                                return Promise.reject(new Error(t))
                            })
                        },
                        getAnnotations: function(t, e) {
                            return this.messageHandler.sendWithPromise("GetAnnotations", {
                                pageIndex: t,
                                intent: e
                            })
                        },
                        getDestinations: function() {
                            return this.messageHandler.sendWithPromise("GetDestinations", null)
                        },
                        getDestination: function(t) {
                            return this.messageHandler.sendWithPromise("GetDestination", {
                                id: t
                            })
                        },
                        getPageLabels: function() {
                            return this.messageHandler.sendWithPromise("GetPageLabels", null)
                        },
                        getAttachments: function() {
                            return this.messageHandler.sendWithPromise("GetAttachments", null)
                        },
                        getJavaScript: function() {
                            return this.messageHandler.sendWithPromise("GetJavaScript", null)
                        },
                        getOutline: function() {
                            return this.messageHandler.sendWithPromise("GetOutline", null)
                        },
                        getMetadata: function() {
                            return this.messageHandler.sendWithPromise("GetMetadata", null).then(function(t) {
                                return {
                                    info: t[0],
                                    metadata: t[1] ? new N(t[1]) : null
                                }
                            })
                        },
                        getStats: function() {
                            return this.messageHandler.sendWithPromise("GetStats", null)
                        },
                        startCleanup: function() {
                            this.messageHandler.sendWithPromise("Cleanup", null).then(function() {
                                for (var t = 0, e = this.pageCache.length; t < e; t++) {
                                    var n = this.pageCache[t];
                                    n && n.cleanup()
                                }
                                this.commonObjs.clear(), this.fontLoader.clear()
                            }.bind(this))
                        }
                    }, t
                }(),
                K = function() {
                    function t() {
                        this.objs = Object.create(null)
                    }
                    return t.prototype = {
                        ensureObj: function(t) {
                            if (this.objs[t]) return this.objs[t];
                            var e = {
                                capability: x(),
                                data: null,
                                resolved: !1
                            };
                            return this.objs[t] = e, e
                        },
                        get: function(t, e) {
                            if (e) return this.ensureObj(t).capability.promise.then(e), null;
                            var n = this.objs[t];
                            return n && n.resolved || S("Requesting object that isn't resolved yet " + t), n.data
                        },
                        resolve: function(t, e) {
                            var n = this.ensureObj(t);
                            n.resolved = !0, n.data = e, n.capability.resolve(e)
                        },
                        isResolved: function(t) {
                            var e = this.objs;
                            return !!e[t] && e[t].resolved
                        },
                        hasData: function(t) {
                            return this.isResolved(t)
                        },
                        getData: function(t) {
                            var e = this.objs;
                            return e[t] && e[t].resolved ? e[t].data : null
                        },
                        clear: function() {
                            this.objs = Object.create(null)
                        }
                    }, t
                }(),
                Z = function() {
                    function t(t) {
                        this._internalRenderTask = t, this.onContinue = null
                    }
                    return t.prototype = {
                        get promise() {
                            return this._internalRenderTask.capability.promise
                        },
                        cancel: function() {
                            this._internalRenderTask.cancel()
                        },
                        then: function(t, e) {
                            return this.promise.then.apply(this.promise, arguments)
                        }
                    }, t
                }(),
                $ = function() {
                    function t(t, e, n, i, r, a) {
                        this.callback = t, this.params = e, this.objs = n, this.commonObjs = i, this.operatorListIdx = null, this.operatorList = r, this.pageNumber = a, this.running = !1, this.graphicsReadyCallback = null, this.graphicsReady = !1, this.useRequestAnimationFrame = !1, this.cancelled = !1, this.capability = x(), this.task = new Z(this), this._continueBound = this._continue.bind(this), this._scheduleNextBound = this._scheduleNext.bind(this), this._nextBound = this._next.bind(this)
                    }
                    return t.prototype = {
                        initializeGraphics: function(t) {
                            if (!this.cancelled) {
                                U("pdfBug") && I.StepperManager && I.StepperManager.enabled && (this.stepper = I.StepperManager.create(this.pageNumber - 1), this.stepper.init(this.operatorList), this.stepper.nextBreakPoint = this.stepper.getNextBreakPoint());
                                var e = this.params;
                                this.gfx = new M(e.canvasContext, this.commonObjs, this.objs, e.imageLayer), this.gfx.beginDrawing(e.transform, e.viewport, t), this.operatorListIdx = 0, this.graphicsReady = !0, this.graphicsReadyCallback && this.graphicsReadyCallback()
                            }
                        },
                        cancel: function() {
                            this.running = !1, this.cancelled = !0, this.callback("cancelled")
                        },
                        operatorListChanged: function() {
                            if (!this.graphicsReady) return void(this.graphicsReadyCallback || (this.graphicsReadyCallback = this._continueBound));
                            this.stepper && this.stepper.updateOperatorList(this.operatorList), this.running || this._continue()
                        },
                        _continue: function() {
                            this.running = !0, this.cancelled || (this.task.onContinue ? this.task.onContinue.call(this.task, this._scheduleNextBound) : this._scheduleNext())
                        },
                        _scheduleNext: function() {
                            this.useRequestAnimationFrame && "undefined" != typeof window ? window.requestAnimationFrame(this._nextBound) : Promise.resolve(void 0).then(this._nextBound)
                        },
                        _next: function() {
                            this.cancelled || (this.operatorListIdx = this.gfx.executeOperatorList(this.operatorList, this.operatorListIdx, this._continueBound, this.stepper), this.operatorListIdx === this.operatorList.argsArray.length && (this.running = !1, this.operatorList.lastChunk && (this.gfx.endDrawing(), this.callback())))
                        }
                    }, t
                }(),
                tt = function() {
                    var t = [];
                    return {
                        listen: function(e) {
                            k("Global UnsupportedManager.listen is used:  use PDFDocumentLoadingTask.onUnsupportedFeature instead"), t.push(e)
                        },
                        notify: function(e) {
                            for (var n = 0, i = t.length; n < i; n++) t[n](e)
                        }
                    }
                }();
            t.version = "1.6.214", t.build = "86bdfab", t.getDocument = c, t.PDFDataRangeTransport = Y, t.PDFWorker = J, t.PDFDocumentProxy = q, t.PDFPageProxy = V, t._UnsupportedManager = tt
        }),
        function(t, e) {
            e(t.pdfjsDisplayGlobal = {}, t.pdfjsSharedUtil, t.pdfjsDisplayDOMUtils, t.pdfjsDisplayAPI, t.pdfjsDisplayAnnotationLayer, t.pdfjsDisplayTextLayer, t.pdfjsDisplayMetadata, t.pdfjsDisplaySVG)
        }(this, function(t, e, n, i, r, a, s, o) {
            var c = e.globalScope,
                l = e.deprecated,
                h = e.warn,
                u = n.LinkTarget,
                d = "undefined" == typeof window;
            c.PDFJS || (c.PDFJS = {});
            var p = c.PDFJS;
            p.version = "1.6.214", p.build = "86bdfab", p.pdfBug = !1, void 0 !== p.verbosity && e.setVerbosityLevel(p.verbosity), delete p.verbosity, Object.defineProperty(p, "verbosity", {
                get: function() {
                    return e.getVerbosityLevel()
                },
                set: function(t) {
                    e.setVerbosityLevel(t)
                },
                enumerable: !0,
                configurable: !0
            }), p.VERBOSITY_LEVELS = e.VERBOSITY_LEVELS, p.OPS = e.OPS, p.UNSUPPORTED_FEATURES = e.UNSUPPORTED_FEATURES, p.isValidUrl = e.isValidUrl, p.shadow = e.shadow, p.createBlob = e.createBlob, p.createObjectURL = function(t, n) {
                return e.createObjectURL(t, n, p.disableCreateObjectURL)
            }, Object.defineProperty(p, "isLittleEndian", {
                configurable: !0,
                get: function() {
                    var t = e.isLittleEndian();
                    return e.shadow(p, "isLittleEndian", t)
                }
            }), p.removeNullCharacters = e.removeNullCharacters, p.PasswordResponses = e.PasswordResponses, p.PasswordException = e.PasswordException, p.UnknownErrorException = e.UnknownErrorException, p.InvalidPDFException = e.InvalidPDFException, p.MissingPDFException = e.MissingPDFException, p.UnexpectedResponseException = e.UnexpectedResponseException, p.Util = e.Util, p.PageViewport = e.PageViewport, p.createPromiseCapability = e.createPromiseCapability, p.maxImageSize = void 0 === p.maxImageSize ? -1 : p.maxImageSize, p.cMapUrl = void 0 === p.cMapUrl ? null : p.cMapUrl, p.cMapPacked = void 0 !== p.cMapPacked && p.cMapPacked, p.disableFontFace = void 0 !== p.disableFontFace && p.disableFontFace, p.imageResourcesPath = void 0 === p.imageResourcesPath ? "" : p.imageResourcesPath, p.disableWorker = void 0 !== p.disableWorker && p.disableWorker, p.workerSrc = void 0 === p.workerSrc ? null : p.workerSrc, p.disableRange = void 0 !== p.disableRange && p.disableRange, p.disableStream = void 0 !== p.disableStream && p.disableStream, p.disableAutoFetch = void 0 !== p.disableAutoFetch && p.disableAutoFetch, p.pdfBug = void 0 !== p.pdfBug && p.pdfBug, p.postMessageTransfers = void 0 === p.postMessageTransfers || p.postMessageTransfers, p.disableCreateObjectURL = void 0 !== p.disableCreateObjectURL && p.disableCreateObjectURL, p.disableWebGL = void 0 === p.disableWebGL || p.disableWebGL, p.externalLinkTarget = void 0 === p.externalLinkTarget ? u.NONE : p.externalLinkTarget, p.externalLinkRel = void 0 === p.externalLinkRel ? "noreferrer" : p.externalLinkRel, p.isEvalSupported = void 0 === p.isEvalSupported || p.isEvalSupported;
            var f = p.openExternalLinksInNewWindow;
            delete p.openExternalLinksInNewWindow, Object.defineProperty(p, "openExternalLinksInNewWindow", {
                get: function() {
                    return p.externalLinkTarget === u.BLANK
                },
                set: function(t) {
                    if (t && l('PDFJS.openExternalLinksInNewWindow, please use "PDFJS.externalLinkTarget = PDFJS.LinkTarget.BLANK" instead.'), p.externalLinkTarget !== u.NONE) return void h("PDFJS.externalLinkTarget is already initialized");
                    p.externalLinkTarget = t ? u.BLANK : u.NONE
                },
                enumerable: !0,
                configurable: !0
            }), f && (p.openExternalLinksInNewWindow = f), p.getDocument = i.getDocument, p.PDFDataRangeTransport = i.PDFDataRangeTransport, p.PDFWorker = i.PDFWorker, Object.defineProperty(p, "hasCanvasTypedArrays", {
                configurable: !0,
                get: function() {
                    var t = n.hasCanvasTypedArrays();
                    return e.shadow(p, "hasCanvasTypedArrays", t)
                }
            }), p.CustomStyle = n.CustomStyle, p.LinkTarget = u, p.addLinkAttributes = n.addLinkAttributes, p.getFilenameFromUrl = n.getFilenameFromUrl, p.isExternalLinkTargetSet = n.isExternalLinkTargetSet, p.AnnotationLayer = r.AnnotationLayer, p.renderTextLayer = a.renderTextLayer, p.Metadata = s.Metadata, p.SVGGraphics = o.SVGGraphics, p.UnsupportedManager = i._UnsupportedManager, t.globalScope = c, t.isWorker = d, t.PDFJS = c.PDFJS
        })
    }).call(n), t.PDFJS = n.pdfjsDisplayGlobal.PDFJS, t.build = n.pdfjsDisplayAPI.build, t.version = n.pdfjsDisplayAPI.version, t.getDocument = n.pdfjsDisplayAPI.getDocument, t.PDFDataRangeTransport = n.pdfjsDisplayAPI.PDFDataRangeTransport, t.PDFWorker = n.pdfjsDisplayAPI.PDFWorker, t.renderTextLayer = n.pdfjsDisplayTextLayer.renderTextLayer, t.AnnotationLayer = n.pdfjsDisplayAnnotationLayer.AnnotationLayer, t.CustomStyle = n.pdfjsDisplayDOMUtils.CustomStyle, t.PasswordResponses = n.pdfjsSharedUtil.PasswordResponses, t.InvalidPDFException = n.pdfjsSharedUtil.InvalidPDFException, t.MissingPDFException = n.pdfjsSharedUtil.MissingPDFException, t.SVGGraphics = n.pdfjsDisplaySVG.SVGGraphics, t.UnexpectedResponseException = n.pdfjsSharedUtil.UnexpectedResponseException, t.OPS = n.pdfjsSharedUtil.OPS, t.UNSUPPORTED_FEATURES = n.pdfjsSharedUtil.UNSUPPORTED_FEATURES, t.isValidUrl = n.pdfjsSharedUtil.isValidUrl, t.createObjectURL = n.pdfjsSharedUtil.createObjectURL, t.removeNullCharacters = n.pdfjsSharedUtil.removeNullCharacters, t.shadow = n.pdfjsSharedUtil.shadow, t.createBlob = n.pdfjsSharedUtil.createBlob, t.getFilenameFromUrl = n.pdfjsDisplayDOMUtils.getFilenameFromUrl, t.addLinkAttributes = n.pdfjsDisplayDOMUtils.addLinkAttributes
});
(function() {
    var e;

    function aa(a) {
        var b = 0;
        return function() {
            return b < a.length ? {
                done: !1,
                value: a[b++]
            } : {
                done: !0
            }
        }
    }

    function l(a) {
        var b = "undefined" != typeof Symbol && Symbol.iterator && a[Symbol.iterator];
        return b ? b.call(a) : {
            next: aa(a)
        }
    }

    function ba(a) {
        if (!(a instanceof Array)) {
            a = l(a);
            for (var b, c = []; !(b = a.next()).done;) c.push(b.value);
            a = c
        }
        return a
    }
    var ca = "function" == typeof Object.create ? Object.create : function(a) {
            function b() {}
            b.prototype = a;
            return new b
        },
        da;
    if ("function" == typeof Object.setPrototypeOf) da = Object.setPrototypeOf;
    else {
        var fa;
        a: {
            var ha = {
                    Nr: !0
                },
                ia = {};
            try {
                ia.__proto__ = ha;
                fa = ia.Nr;
                break a
            } catch (a) {}
            fa = !1
        }
        da = fa ? function(a, b) {
            a.__proto__ = b;
            if (a.__proto__ !== b) throw new TypeError(a + " is not extensible");
            return a
        } : null
    }
    var ja = da;

    function m(a, b) {
        a.prototype = ca(b.prototype);
        a.prototype.constructor = a;
        if (ja) ja(a, b);
        else
            for (var c in b)
                if ("prototype" != c)
                    if (Object.defineProperties) {
                        var d = Object.getOwnPropertyDescriptor(b, c);
                        d && Object.defineProperty(a, c, d)
                    } else a[c] = b[c];
        a.V = b.prototype
    }

    function ka(a, b, c) {
        a instanceof String && (a = String(a));
        for (var d = a.length, f = 0; f < d; f++) {
            var g = a[f];
            if (b.call(c, g, f, a)) return {
                fp: f,
                Hp: g
            }
        }
        return {
            fp: -1,
            Hp: void 0
        }
    }
    var la = "function" == typeof Object.defineProperties ? Object.defineProperty : function(a, b, c) {
            a != Array.prototype && a != Object.prototype && (a[b] = c.value)
        },
        ma = "undefined" != typeof window && window === this ? this : "undefined" != typeof global && null != global ? global : this;

    function na(a, b) {
        if (b) {
            var c = ma;
            a = a.split(".");
            for (var d = 0; d < a.length - 1; d++) {
                var f = a[d];
                f in c || (c[f] = {});
                c = c[f]
            }
            a = a[a.length - 1];
            d = c[a];
            b = b(d);
            b != d && null != b && la(c, a, {
                configurable: !0,
                writable: !0,
                value: b
            })
        }
    }
    na("Array.prototype.findIndex", function(a) {
        return a ? a : function(a, c) {
            return ka(this, a, c).fp
        }
    });
    na("Array.prototype.find", function(a) {
        return a ? a : function(a, c) {
            return ka(this, a, c).Hp
        }
    });
    na("Object.is", function(a) {
        return a ? a : function(a, c) {
            return a === c ? 0 !== a || 1 / a === 1 / c : a !== a && c !== c
        }
    });

    function oa(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b)
    }
    na("WeakMap", function(a) {
        function b(a) {
            this.za = (h += Math.random() + 1).toString();
            if (a) {
                a = l(a);
                for (var b; !(b = a.next()).done;) b = b.value, this.set(b[0], b[1])
            }
        }

        function c() {}

        function d(a) {
            oa(a, g) || la(a, g, {
                value: new c
            })
        }

        function f(a) {
            var b = Object[a];
            b && (Object[a] = function(a) {
                if (a instanceof c) return a;
                d(a);
                return b(a)
            })
        }
        if (function() {
                if (!a || !Object.seal) return !1;
                try {
                    var b = Object.seal({}),
                        c = Object.seal({}),
                        d = new a([
                            [b, 2],
                            [c, 3]
                        ]);
                    if (2 != d.get(b) || 3 != d.get(c)) return !1;
                    d.delete(b);
                    d.set(c, 4);
                    return !d.has(b) &&
                        4 == d.get(c)
                } catch (y) {
                    return !1
                }
            }()) return a;
        var g = "$jscomp_hidden_" + Math.random();
        f("freeze");
        f("preventExtensions");
        f("seal");
        var h = 0;
        b.prototype.set = function(a, b) {
            d(a);
            if (!oa(a, g)) throw Error("WeakMap key fail: " + a);
            a[g][this.za] = b;
            return this
        };
        b.prototype.get = function(a) {
            return oa(a, g) ? a[g][this.za] : void 0
        };
        b.prototype.has = function(a) {
            return oa(a, g) && oa(a[g], this.za)
        };
        b.prototype.delete = function(a) {
            return oa(a, g) && oa(a[g], this.za) ? delete a[g][this.za] : !1
        };
        return b
    });

    function pa() {
        pa = function() {};
        ma.Symbol || (ma.Symbol = qa)
    }
    var qa = function() {
        var a = 0;
        return function(b) {
            return "jscomp_symbol_" + (b || "") + a++
        }
    }();

    function ra() {
        pa();
        var a = ma.Symbol.iterator;
        a || (a = ma.Symbol.iterator = ma.Symbol("iterator"));
        "function" != typeof Array.prototype[a] && la(Array.prototype, a, {
            configurable: !0,
            writable: !0,
            value: function() {
                return sa(aa(this))
            }
        });
        ra = function() {}
    }

    function sa(a) {
        ra();
        a = {
            next: a
        };
        a[ma.Symbol.iterator] = function() {
            return this
        };
        return a
    }
    na("Promise", function(a) {
        function b(a) {
            this.qb = 0;
            this.Am = void 0;
            this.gg = [];
            var b = this.dm();
            try {
                a(b.resolve, b.reject)
            } catch (u) {
                b.reject(u)
            }
        }

        function c() {
            this.he = null
        }

        function d(a) {
            return a instanceof b ? a : new b(function(b) {
                b(a)
            })
        }
        if (a) return a;
        c.prototype.Wo = function(a) {
            null == this.he && (this.he = [], this.Rr());
            this.he.push(a)
        };
        c.prototype.Rr = function() {
            var a = this;
            this.Xo(function() {
                a.Yr()
            })
        };
        var f = ma.setTimeout;
        c.prototype.Xo = function(a) {
            f(a, 0)
        };
        c.prototype.Yr = function() {
            for (; this.he && this.he.length;) {
                var a =
                    this.he;
                this.he = [];
                for (var b = 0; b < a.length; ++b) {
                    var c = a[b];
                    a[b] = null;
                    try {
                        c()
                    } catch (q) {
                        this.Sr(q)
                    }
                }
            }
            this.he = null
        };
        c.prototype.Sr = function(a) {
            this.Xo(function() {
                throw a;
            })
        };
        b.prototype.dm = function() {
            function a(a) {
                return function(d) {
                    c || (c = !0, a.call(b, d))
                }
            }
            var b = this,
                c = !1;
            return {
                resolve: a(this.Bs),
                reject: a(this.xm)
            }
        };
        b.prototype.Bs = function(a) {
            if (a === this) this.xm(new TypeError("A Promise cannot resolve to itself"));
            else if (a instanceof b) this.Gs(a);
            else {
                a: switch (typeof a) {
                    case "object":
                        var c = null != a;
                        break a;
                    case "function":
                        c = !0;
                        break a;
                    default:
                        c = !1
                }
                c ? this.As(a) : this.cp(a)
            }
        };
        b.prototype.As = function(a) {
            var b = void 0;
            try {
                b = a.then
            } catch (u) {
                this.xm(u);
                return
            }
            "function" == typeof b ? this.Hs(b, a) : this.cp(a)
        };
        b.prototype.xm = function(a) {
            this.Ap(2, a)
        };
        b.prototype.cp = function(a) {
            this.Ap(1, a)
        };
        b.prototype.Ap = function(a, b) {
            if (0 != this.qb) throw Error("Cannot settle(" + a + ", " + b + "): Promise already settled in state" + this.qb);
            this.qb = a;
            this.Am = b;
            this.Zr()
        };
        b.prototype.Zr = function() {
            if (null != this.gg) {
                for (var a = 0; a < this.gg.length; ++a) g.Wo(this.gg[a]);
                this.gg = null
            }
        };
        var g = new c;
        b.prototype.Gs = function(a) {
            var b = this.dm();
            a.zj(b.resolve, b.reject)
        };
        b.prototype.Hs = function(a, b) {
            var c = this.dm();
            try {
                a.call(b, c.resolve, c.reject)
            } catch (q) {
                c.reject(q)
            }
        };
        b.prototype.then = function(a, c) {
            function d(a, b) {
                return "function" == typeof a ? function(b) {
                    try {
                        f(a(b))
                    } catch (P) {
                        g(P)
                    }
                } : b
            }
            var f, g, h = new b(function(a, b) {
                f = a;
                g = b
            });
            this.zj(d(a, f), d(c, g));
            return h
        };
        b.prototype.catch = function(a) {
            return this.then(void 0, a)
        };
        b.prototype.zj = function(a, b) {
            function c() {
                switch (d.qb) {
                    case 1:
                        a(d.Am);
                        break;
                    case 2:
                        b(d.Am);
                        break;
                    default:
                        throw Error("Unexpected state: " + d.qb);
                }
            }
            var d = this;
            null == this.gg ? g.Wo(c) : this.gg.push(c)
        };
        b.resolve = d;
        b.reject = function(a) {
            return new b(function(b, c) {
                c(a)
            })
        };
        b.race = function(a) {
            return new b(function(b, c) {
                for (var f = l(a), g = f.next(); !g.done; g = f.next()) d(g.value).zj(b, c)
            })
        };
        b.all = function(a) {
            var c = l(a),
                f = c.next();
            return f.done ? d([]) : new b(function(a, b) {
                function g(b) {
                    return function(c) {
                        h[b] = c;
                        k--;
                        0 == k && a(h)
                    }
                }
                var h = [],
                    k = 0;
                do h.push(void 0), k++, d(f.value).zj(g(h.length -
                    1), b), f = c.next(); while (!f.done)
            })
        };
        return b
    });
    var ta = "function" == typeof Object.assign ? Object.assign : function(a, b) {
        for (var c = 1; c < arguments.length; c++) {
            var d = arguments[c];
            if (d)
                for (var f in d) oa(d, f) && (a[f] = d[f])
        }
        return a
    };
    na("Object.assign", function(a) {
        return a || ta
    });
    na("Map", function(a) {
        function b() {
            var a = {};
            return a.Ed = a.next = a.head = a
        }

        function c(a, b) {
            var c = a.Cd;
            return sa(function() {
                if (c) {
                    for (; c.head != a.Cd;) c = c.Ed;
                    for (; c.next != c.head;) return c = c.next, {
                        done: !1,
                        value: b(c)
                    };
                    c = null
                }
                return {
                    done: !0,
                    value: void 0
                }
            })
        }

        function d(a, b) {
            var c = b && typeof b;
            "object" == c || "function" == c ? g.has(b) ? c = g.get(b) : (c = "" + ++h, g.set(b, c)) : c = "p_" + b;
            var d = a.Nh[c];
            if (d && oa(a.Nh, c))
                for (a = 0; a < d.length; a++) {
                    var f = d[a];
                    if (b !== b && f.key !== f.key || b === f.key) return {
                        id: c,
                        list: d,
                        index: a,
                        wb: f
                    }
                }
            return {
                id: c,
                list: d,
                index: -1,
                wb: void 0
            }
        }

        function f(a) {
            this.Nh = {};
            this.Cd = b();
            this.size = 0;
            if (a) {
                a = l(a);
                for (var c; !(c = a.next()).done;) c = c.value, this.set(c[0], c[1])
            }
        }
        if (function() {
                if (!a || "function" != typeof a || !a.prototype.entries || "function" != typeof Object.seal) return !1;
                try {
                    var b = Object.seal({
                            x: 4
                        }),
                        c = new a(l([
                            [b, "s"]
                        ]));
                    if ("s" != c.get(b) || 1 != c.size || c.get({
                            x: 4
                        }) || c.set({
                            x: 4
                        }, "t") != c || 2 != c.size) return !1;
                    var d = c.entries(),
                        f = d.next();
                    if (f.done || f.value[0] != b || "s" != f.value[1]) return !1;
                    f = d.next();
                    return f.done || 4 != f.value[0].x ||
                        "t" != f.value[1] || !d.next().done ? !1 : !0
                } catch (I) {
                    return !1
                }
            }()) return a;
        ra();
        var g = new WeakMap;
        f.prototype.set = function(a, b) {
            a = 0 === a ? 0 : a;
            var c = d(this, a);
            c.list || (c.list = this.Nh[c.id] = []);
            c.wb ? c.wb.value = b : (c.wb = {
                next: this.Cd,
                Ed: this.Cd.Ed,
                head: this.Cd,
                key: a,
                value: b
            }, c.list.push(c.wb), this.Cd.Ed.next = c.wb, this.Cd.Ed = c.wb, this.size++);
            return this
        };
        f.prototype.delete = function(a) {
            a = d(this, a);
            return a.wb && a.list ? (a.list.splice(a.index, 1), a.list.length || delete this.Nh[a.id], a.wb.Ed.next = a.wb.next, a.wb.next.Ed =
                a.wb.Ed, a.wb.head = null, this.size--, !0) : !1
        };
        f.prototype.clear = function() {
            this.Nh = {};
            this.Cd = this.Cd.Ed = b();
            this.size = 0
        };
        f.prototype.has = function(a) {
            return !!d(this, a).wb
        };
        f.prototype.get = function(a) {
            return (a = d(this, a).wb) && a.value
        };
        f.prototype.entries = function() {
            return c(this, function(a) {
                return [a.key, a.value]
            })
        };
        f.prototype.keys = function() {
            return c(this, function(a) {
                return a.key
            })
        };
        f.prototype.values = function() {
            return c(this, function(a) {
                return a.value
            })
        };
        f.prototype.forEach = function(a, b) {
            for (var c = this.entries(),
                    d; !(d = c.next()).done;) d = d.value, a.call(b, d[1], d[0], this)
        };
        f.prototype[Symbol.iterator] = f.prototype.entries;
        var h = 0;
        return f
    });
    na("Array.prototype.fill", function(a) {
        return a ? a : function(a, c, d) {
            var b = this.length || 0;
            0 > c && (c = Math.max(0, b + c));
            if (null == d || d > b) d = b;
            d = Number(d);
            0 > d && (d = Math.max(0, b + d));
            for (c = Number(c || 0); c < d; c++) this[c] = a;
            return this
        }
    });
    var n = this;

    function p(a) {
        return void 0 !== a
    }

    function r(a) {
        return "string" == typeof a
    }

    function t(a) {
        return "number" == typeof a
    }

    function ua() {}

    function va(a) {
        var b = typeof a;
        if ("object" == b)
            if (a) {
                if (a instanceof Array) return "array";
                if (a instanceof Object) return b;
                var c = Object.prototype.toString.call(a);
                if ("[object Window]" == c) return "object";
                if ("[object Array]" == c || "number" == typeof a.length && "undefined" != typeof a.splice && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("splice")) return "array";
                if ("[object Function]" == c || "undefined" != typeof a.call && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("call")) return "function"
            } else return "null";
        else if ("function" == b && "undefined" == typeof a.call) return "object";
        return b
    }

    function wa(a) {
        return "array" == va(a)
    }

    function xa(a) {
        var b = va(a);
        return "array" == b || "object" == b && "number" == typeof a.length
    }

    function ya(a) {
        return "function" == va(a)
    }

    function za(a) {
        var b = typeof a;
        return "object" == b && null != a || "function" == b
    }

    function Aa(a) {
        return a[Ba] || (a[Ba] = ++Ca)
    }
    var Ba = "closure_uid_" + (1E9 * Math.random() >>> 0),
        Ca = 0;

    function Da(a, b, c) {
        return a.call.apply(a.bind, arguments)
    }

    function Ea(a, b, c) {
        if (!a) throw Error();
        if (2 < arguments.length) {
            var d = Array.prototype.slice.call(arguments, 2);
            return function() {
                var c = Array.prototype.slice.call(arguments);
                Array.prototype.unshift.apply(c, d);
                return a.apply(b, c)
            }
        }
        return function() {
            return a.apply(b, arguments)
        }
    }

    function Fa(a, b, c) {
        Fa = Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? Da : Ea;
        return Fa.apply(null, arguments)
    }
    var Ga = Date.now || function() {
        return +new Date
    };

    function Ha(a, b) {
        a = a.split(".");
        var c = n;
        a[0] in c || "undefined" == typeof c.execScript || c.execScript("var " + a[0]);
        for (var d; a.length && (d = a.shift());) !a.length && p(b) ? c[d] = b : c = c[d] && c[d] !== Object.prototype[d] ? c[d] : c[d] = {}
    }

    function v(a, b) {
        function c() {}
        c.prototype = b.prototype;
        a.V = b.prototype;
        a.prototype = new c;
        a.prototype.constructor = a;
        a.Mt = function(a, c, g) {
            for (var d = Array(arguments.length - 2), f = 2; f < arguments.length; f++) d[f - 2] = arguments[f];
            return b.prototype[c].apply(a, d)
        }
    };

    function Ia(a) {
        if (Error.captureStackTrace) Error.captureStackTrace(this, Ia);
        else {
            var b = Error().stack;
            b && (this.stack = b)
        }
        a && (this.message = String(a))
    }
    v(Ia, Error);
    Ia.prototype.name = "CustomError";
    var Ja;

    function Ka(a, b) {
        a = a.split("%s");
        for (var c = "", d = a.length - 1, f = 0; f < d; f++) c += a[f] + (f < b.length ? b[f] : "%s");
        Ia.call(this, c + a[d])
    }
    v(Ka, Ia);
    Ka.prototype.name = "AssertionError";

    function La(a) {
        throw a;
    }

    function Ma(a, b, c, d) {
        var f = "Assertion failed";
        if (c) {
            f += ": " + c;
            var g = d
        } else a && (f += ": " + a, g = b);
        a = new Ka("" + f, g || []);
        La(a)
    }

    function w(a, b, c) {
        a || Ma("", null, b, Array.prototype.slice.call(arguments, 2));
        return a
    }

    function Na(a, b) {
        La(new Ka("Failure" + (a ? ": " + a : ""), Array.prototype.slice.call(arguments, 1)))
    }

    function Oa(a, b, c) {
        t(a) || Ma("Expected number but got %s: %s.", [va(a), a], b, Array.prototype.slice.call(arguments, 2));
        return a
    }

    function Pa(a, b, c) {
        r(a) || Ma("Expected string but got %s: %s.", [va(a), a], b, Array.prototype.slice.call(arguments, 2));
        return a
    }

    function Qa(a, b, c, d) {
        a instanceof b || Ma("Expected instanceof %s but got %s.", [Ra(b), Ra(a)], c, Array.prototype.slice.call(arguments, 3));
        return a
    }

    function Ra(a) {
        return a instanceof Function ? a.displayName || a.name || "unknown type name" : a instanceof Object ? a.constructor.displayName || a.constructor.name || Object.prototype.toString.call(a) : null === a ? "null" : typeof a
    };
    var Sa = Array.prototype.indexOf ? function(a, b) {
            w(null != a.length);
            return Array.prototype.indexOf.call(a, b, void 0)
        } : function(a, b) {
            if (r(a)) return r(b) && 1 == b.length ? a.indexOf(b, 0) : -1;
            for (var c = 0; c < a.length; c++)
                if (c in a && a[c] === b) return c;
            return -1
        },
        Ta = Array.prototype.forEach ? function(a, b, c) {
            w(null != a.length);
            Array.prototype.forEach.call(a, b, c)
        } : function(a, b, c) {
            for (var d = a.length, f = r(a) ? a.split("") : a, g = 0; g < d; g++) g in f && b.call(c, f[g], g, a)
        },
        Ua = Array.prototype.filter ? function(a, b) {
            w(null != a.length);
            return Array.prototype.filter.call(a,
                b, void 0)
        } : function(a, b) {
            for (var c = a.length, d = [], f = 0, g = r(a) ? a.split("") : a, h = 0; h < c; h++)
                if (h in g) {
                    var k = g[h];
                    b.call(void 0, k, h, a) && (d[f++] = k)
                } return d
        };

    function Va(a, b) {
        a: {
            for (var c = a.length, d = r(a) ? a.split("") : a, f = 0; f < c; f++)
                if (f in d && b.call(void 0, d[f], f, a)) {
                    b = f;
                    break a
                } b = -1
        }
        return 0 > b ? null : r(a) ? a.charAt(b) : a[b]
    }

    function Wa(a, b) {
        b = Sa(a, b);
        var c;
        (c = 0 <= b) && Xa(a, b);
        return c
    }

    function Xa(a, b) {
        w(null != a.length);
        Array.prototype.splice.call(a, b, 1)
    }

    function Ya(a) {
        var b = a.length;
        if (0 < b) {
            for (var c = Array(b), d = 0; d < b; d++) c[d] = a[d];
            return c
        }
        return []
    }

    function Za(a, b) {
        for (var c = 1; c < arguments.length; c++) {
            var d = arguments[c];
            if (xa(d)) {
                var f = a.length || 0,
                    g = d.length || 0;
                a.length = f + g;
                for (var h = 0; h < g; h++) a[f + h] = d[h]
            } else a.push(d)
        }
    }

    function $a(a, b, c, d) {
        w(null != a.length);
        Array.prototype.splice.apply(a, ab(arguments, 1))
    }

    function ab(a, b, c) {
        w(null != a.length);
        return 2 >= arguments.length ? Array.prototype.slice.call(a, b) : Array.prototype.slice.call(a, b, c)
    };

    function bb(a) {
        var b = b || 0;
        return function() {
            return a.apply(this, Array.prototype.slice.call(arguments, 0, b))
        }
    };

    function cb(a, b, c) {
        return Math.min(Math.max(a, b), c)
    }

    function db(a) {
        return 0 < a ? 1 : 0 > a ? -1 : a
    };
    var eb = "StopIteration" in n ? n.StopIteration : {
        message: "StopIteration",
        stack: ""
    };

    function fb() {}
    fb.prototype.next = function() {
        throw eb;
    };
    fb.prototype.jd = function() {
        return this
    };

    function gb(a) {
        if (a instanceof fb) return a;
        if ("function" == typeof a.jd) return a.jd(!1);
        if (xa(a)) {
            var b = 0,
                c = new fb;
            c.next = function() {
                for (;;) {
                    if (b >= a.length) throw eb;
                    if (b in a) return a[b++];
                    b++
                }
            };
            return c
        }
        throw Error("Not implemented");
    }

    function hb(a, b, c) {
        if (xa(a)) try {
            Ta(a, b, c)
        } catch (d) {
            if (d !== eb) throw d;
        } else {
            a = gb(a);
            try {
                for (;;) b.call(c, a.next(), void 0, a)
            } catch (d) {
                if (d !== eb) throw d;
            }
        }
    }

    function ib(a) {
        if (xa(a)) return Ya(a);
        a = gb(a);
        var b = [];
        hb(a, function(a) {
            b.push(a)
        });
        return b
    };
    var x = {
        Qt: 96 / 72,
        Bm: !0,
        yb: 640,
        $h: 480,
        Mp: .2,
        Xe: 0,
        We: 1,
        Vr: 4,
        rs: 2628E3,
        Ps: 250,
        Ds: 200,
        Is: 350,
        Ks: 200,
        zm: 200,
        Wr: 500,
        Ls: "data/thumbs",
        Gp: .1,
        Im: 35,
        ks: 20,
        St: !1,
        bb: 50,
        fu: .7,
        Ht: {
            bu: 7,
            au: 3,
            Rt: 200,
            minWidth: 150,
            maxWidth: 400,
            eu: 25
        },
        fk: {
            className: "lineSpreadThumbnail",
            mb: 8,
            Jp: .12,
            animationDuration: 200,
            Yc: 10,
            Ue: 40,
            Zf: 2,
            lg: 5,
            ai: 3,
            hc: 2,
            oi: 2,
            $f: 24,
            Yh: 15,
            ig: 2,
            minHeight: 70,
            ii: 2
        },
        ek: {
            className: "linePageThumbnail",
            mb: 15,
            Jp: .12,
            animationDuration: 200,
            cm: 30,
            Yc: 10,
            Ue: 10,
            Zf: 2,
            $o: 5,
            lg: 5,
            ai: 3,
            hc: 2,
            oi: 2,
            $f: 24,
            Yh: 15,
            ig: 2,
            minHeight: 70,
            ii: 2
        },
        pe: {
            className: "pageViewer",
            Ip: "pages",
            Ea: 9
        },
        df: {
            className: "bookViewer",
            Hm: 9,
            Kp: 50
        },
        Bt: {
            className: "slideViewer",
            Ea: 9,
            ck: 30
        },
        tg: {
            className: "slideWithTransitionViewer",
            Ea: 0,
            $r: 5,
            Ur: 2,
            ck: 4,
            Lp: 200
        }
    };

    function jb(a, b) {
        return (new kb(b)).Cm(a)
    }

    function kb(a) {
        this.Rj = a
    }
    kb.prototype.Cm = function(a) {
        var b = [];
        lb(this, a, b);
        return b.join("")
    };

    function lb(a, b, c) {
        if (null == b) c.push("null");
        else {
            if ("object" == typeof b) {
                if (wa(b)) {
                    var d = b;
                    b = d.length;
                    c.push("[");
                    for (var f = "", g = 0; g < b; g++) c.push(f), f = d[g], lb(a, a.Rj ? a.Rj.call(d, String(g), f) : f, c), f = ",";
                    c.push("]");
                    return
                }
                if (b instanceof String || b instanceof Number || b instanceof Boolean) b = b.valueOf();
                else {
                    c.push("{");
                    g = "";
                    for (d in b) Object.prototype.hasOwnProperty.call(b, d) && (f = b[d], "function" != typeof f && (c.push(g), mb(d, c), c.push(":"), lb(a, a.Rj ? a.Rj.call(b, d, f) : f, c), g = ","));
                    c.push("}");
                    return
                }
            }
            switch (typeof b) {
                case "string":
                    mb(b,
                        c);
                    break;
                case "number":
                    c.push(isFinite(b) && !isNaN(b) ? String(b) : "null");
                    break;
                case "boolean":
                    c.push(String(b));
                    break;
                case "function":
                    c.push("null");
                    break;
                default:
                    throw Error("Unknown type: " + typeof b);
            }
        }
    }
    var nb = {
            '"': '\\"',
            "\\": "\\\\",
            "/": "\\/",
            "\b": "\\b",
            "\f": "\\f",
            "\n": "\\n",
            "\r": "\\r",
            "\t": "\\t",
            "\x0B": "\\u000b"
        },
        ob = /\uffff/.test("\uffff") ? /[\\"\x00-\x1f\x7f-\uffff]/g : /[\\"\x00-\x1f\x7f-\xff]/g;

    function mb(a, b) {
        b.push('"', a.replace(ob, function(a) {
            var b = nb[a];
            b || (b = "\\u" + (a.charCodeAt(0) | 65536).toString(16).substr(1), nb[a] = b);
            return b
        }), '"')
    };

    function pb(a) {
        this.Kj = a
    }
    pb.prototype.set = function(a, b) {
        p(b) ? this.Kj.set(a, jb(b)) : this.Kj.remove(a)
    };
    pb.prototype.get = function(a) {
        try {
            var b = this.Kj.get(a)
        } catch (c) {
            return
        }
        if (null !== b) try {
            return JSON.parse(b)
        } catch (c) {
            throw "Storage: Invalid value was encountered";
        }
    };
    pb.prototype.remove = function(a) {
        this.Kj.remove(a)
    };

    function qb() {};

    function rb() {}
    v(rb, qb);
    rb.prototype.clear = function() {
        var a = ib(this.jd(!0)),
            b = this;
        Ta(a, function(a) {
            b.remove(a)
        })
    };

    function sb(a) {
        this.Lc = a
    }
    v(sb, rb);
    e = sb.prototype;
    e.qm = function() {
        if (!this.Lc) return !1;
        try {
            return this.Lc.setItem("__sak", "1"), this.Lc.removeItem("__sak"), !0
        } catch (a) {
            return !1
        }
    };
    e.set = function(a, b) {
        try {
            this.Lc.setItem(a, b)
        } catch (c) {
            if (0 == this.Lc.length) throw "Storage mechanism: Storage disabled";
            throw "Storage mechanism: Quota exceeded";
        }
    };
    e.get = function(a) {
        a = this.Lc.getItem(a);
        if (!r(a) && null !== a) throw "Storage mechanism: Invalid value was encountered";
        return a
    };
    e.remove = function(a) {
        this.Lc.removeItem(a)
    };
    e.jd = function(a) {
        var b = 0,
            c = this.Lc,
            d = new fb;
        d.next = function() {
            if (b >= c.length) throw eb;
            var d = Pa(c.key(b++));
            if (a) return d;
            d = c.getItem(d);
            if (!r(d)) throw "Storage mechanism: Invalid value was encountered";
            return d
        };
        return d
    };
    e.clear = function() {
        this.Lc.clear()
    };
    e.key = function(a) {
        return this.Lc.key(a)
    };

    function tb() {
        var a = null;
        try {
            a = window.localStorage || null
        } catch (b) {}
        this.Lc = a
    }
    v(tb, sb);

    function ub(a, b) {
        this.Dd = {};
        this.nb = [];
        this.mi = this.ag = 0;
        var c = arguments.length;
        if (1 < c) {
            if (c % 2) throw Error("Uneven number of arguments");
            for (var d = 0; d < c; d += 2) this.set(arguments[d], arguments[d + 1])
        } else a && this.addAll(a)
    }

    function vb(a) {
        wb(a);
        return a.nb.concat()
    }
    e = ub.prototype;
    e.clear = function() {
        this.Dd = {};
        this.mi = this.ag = this.nb.length = 0
    };
    e.remove = function(a) {
        return Object.prototype.hasOwnProperty.call(this.Dd, a) ? (delete this.Dd[a], this.ag--, this.mi++, this.nb.length > 2 * this.ag && wb(this), !0) : !1
    };

    function wb(a) {
        if (a.ag != a.nb.length) {
            for (var b = 0, c = 0; b < a.nb.length;) {
                var d = a.nb[b];
                Object.prototype.hasOwnProperty.call(a.Dd, d) && (a.nb[c++] = d);
                b++
            }
            a.nb.length = c
        }
        if (a.ag != a.nb.length) {
            var f = {};
            for (c = b = 0; b < a.nb.length;) d = a.nb[b], Object.prototype.hasOwnProperty.call(f, d) || (a.nb[c++] = d, f[d] = 1), b++;
            a.nb.length = c
        }
    }
    e.get = function(a, b) {
        return Object.prototype.hasOwnProperty.call(this.Dd, a) ? this.Dd[a] : b
    };
    e.set = function(a, b) {
        Object.prototype.hasOwnProperty.call(this.Dd, a) || (this.ag++, this.nb.push(a), this.mi++);
        this.Dd[a] = b
    };
    e.addAll = function(a) {
        if (a instanceof ub)
            for (var b = vb(a), c = 0; c < b.length; c++) this.set(b[c], a.get(b[c]));
        else
            for (b in a) this.set(b, a[b])
    };
    e.forEach = function(a, b) {
        for (var c = vb(this), d = 0; d < c.length; d++) {
            var f = c[d],
                g = this.get(f);
            a.call(b, g, f, this)
        }
    };
    e.clone = function() {
        return new ub(this)
    };
    e.jd = function(a) {
        wb(this);
        var b = 0,
            c = this.mi,
            d = this,
            f = new fb;
        f.next = function() {
            if (c != d.mi) throw Error("The map has changed since the iterator was created");
            if (b >= d.nb.length) throw eb;
            var f = d.nb[b++];
            return a ? f : d.Dd[f]
        };
        return f
    };
    var xb = String.prototype.trim ? function(a) {
        return a.trim()
    } : function(a) {
        return /^[\s\xa0]*([\s\S]*?)[\s\xa0]*$/.exec(a)[1]
    };

    function yb(a) {
        if (!zb.test(a)) return a; - 1 != a.indexOf("&") && (a = a.replace(Ab, "&amp;")); - 1 != a.indexOf("<") && (a = a.replace(Bb, "&lt;")); - 1 != a.indexOf(">") && (a = a.replace(Cb, "&gt;")); - 1 != a.indexOf('"') && (a = a.replace(Db, "&quot;")); - 1 != a.indexOf("'") && (a = a.replace(Eb, "&#39;")); - 1 != a.indexOf("\x00") && (a = a.replace(Fb, "&#0;"));
        return a
    }
    var Ab = /&/g,
        Bb = /</g,
        Cb = />/g,
        Db = /"/g,
        Eb = /'/g,
        Fb = /\x00/g,
        zb = /[\x00&<>"']/;

    function Gb(a, b) {
        var c = 0;
        a = xb(String(a)).split(".");
        b = xb(String(b)).split(".");
        for (var d = Math.max(a.length, b.length), f = 0; 0 == c && f < d; f++) {
            var g = a[f] || "",
                h = b[f] || "";
            do {
                g = /(\d*)(\D*)(.*)/.exec(g) || ["", "", "", ""];
                h = /(\d*)(\D*)(.*)/.exec(h) || ["", "", "", ""];
                if (0 == g[0].length && 0 == h[0].length) break;
                c = Hb(0 == g[1].length ? 0 : parseInt(g[1], 10), 0 == h[1].length ? 0 : parseInt(h[1], 10)) || Hb(0 == g[2].length, 0 == h[2].length) || Hb(g[2], h[2]);
                g = g[3];
                h = h[3]
            } while (0 == c)
        }
        return c
    }

    function Hb(a, b) {
        return a < b ? -1 : a > b ? 1 : 0
    }

    function Ib(a) {
        return String(a).replace(/\-([a-z])/g, function(a, c) {
            return c.toUpperCase()
        })
    }

    function Jb(a) {
        var b = r(void 0) ? "undefined".replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08") : "\\s";
        return a.replace(new RegExp("(^" + (b ? "|[" + b + "]+" : "") + ")([a-z])", "g"), function(a, b, f) {
            return b + f.toUpperCase()
        })
    };
    var Kb;
    a: {
        var Lb = n.navigator;
        if (Lb) {
            var Mb = Lb.userAgent;
            if (Mb) {
                Kb = Mb;
                break a
            }
        }
        Kb = ""
    }

    function z(a) {
        return -1 != Kb.indexOf(a)
    };

    function Nb(a, b) {
        for (var c in a) b.call(void 0, a[c], c, a)
    }

    function Ob(a, b) {
        var c = {},
            d;
        for (d in a) b.call(void 0, a[d], d, a) && (c[d] = a[d]);
        return c
    }

    function Pb(a) {
        var b = [],
            c = 0,
            d;
        for (d in a) b[c++] = a[d];
        return b
    }

    function Qb(a, b) {
        for (var c in a)
            if (b.call(void 0, a[c], c, a)) return c
    }

    function Rb() {
        var a = Sb,
            b;
        for (b in a) return !1;
        return !0
    }

    function Tb(a, b) {
        for (var c in a)
            if (!(c in b) || a[c] !== b[c]) return !1;
        for (c in b)
            if (!(c in a)) return !1;
        return !0
    }

    function Ub() {
        var a = {},
            b;
        for (b in x) a[b] = x[b];
        return a
    }
    var Vb = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");

    function Wb(a, b) {
        for (var c, d, f = 1; f < arguments.length; f++) {
            d = arguments[f];
            for (c in d) a[c] = d[c];
            for (var g = 0; g < Vb.length; g++) c = Vb[g], Object.prototype.hasOwnProperty.call(d, c) && (a[c] = d[c])
        }
    }

    function Xb(a) {
        var b = arguments.length;
        if (1 == b && wa(arguments[0])) return Xb.apply(null, arguments[0]);
        for (var c = {}, d = 0; d < b; d++) c[arguments[d]] = !0;
        return c
    };

    function Yb() {
        return (z("Chrome") || z("CriOS")) && !z("Edge")
    };

    function Zb() {
        return z("iPhone") && !z("iPod") && !z("iPad")
    }

    function $b() {
        return Zb() || z("iPad") || z("iPod")
    };

    function ac(a) {
        ac[" "](a);
        return a
    }
    ac[" "] = ua;

    function bc(a, b) {
        var c = cc;
        return Object.prototype.hasOwnProperty.call(c, a) ? c[a] : c[a] = b(a)
    };
    var dc = z("Opera"),
        A = z("Trident") || z("MSIE"),
        ec = z("Edge"),
        fc = ec || A,
        gc = z("Gecko") && !(-1 != Kb.toLowerCase().indexOf("webkit") && !z("Edge")) && !(z("Trident") || z("MSIE")) && !z("Edge"),
        hc = -1 != Kb.toLowerCase().indexOf("webkit") && !z("Edge"),
        ic = z("Macintosh"),
        jc = z("Windows"),
        kc = z("Linux") || z("CrOS"),
        lc = z("Android"),
        mc = Zb(),
        nc = z("iPad"),
        oc = z("iPod"),
        pc = $b();

    function qc() {
        var a = n.document;
        return a ? a.documentMode : void 0
    }
    var rc;
    a: {
        var sc = "",
            tc = function() {
                var a = Kb;
                if (gc) return /rv:([^\);]+)(\)|;)/.exec(a);
                if (ec) return /Edge\/([\d\.]+)/.exec(a);
                if (A) return /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(a);
                if (hc) return /WebKit\/(\S+)/.exec(a);
                if (dc) return /(?:Version)[ \/]?(\S+)/.exec(a)
            }();tc && (sc = tc ? tc[1] : "");
        if (A) {
            var uc = qc();
            if (null != uc && uc > parseFloat(sc)) {
                rc = String(uc);
                break a
            }
        }
        rc = sc
    }
    var cc = {};

    function vc(a) {
        return bc(a, function() {
            return 0 <= Gb(rc, a)
        })
    }
    var wc;
    var xc = n.document;
    wc = xc && A ? qc() || ("CSS1Compat" == xc.compatMode ? parseInt(rc, 10) : 5) : void 0;

    function yc(a, b) {
        this.Dp = a;
        this.rb = null;
        if (A && !(9 <= Number(wc))) {
            zc || (zc = new ub);
            this.rb = zc.get(a);
            this.rb || (b ? this.rb = document.getElementById(b) : (this.rb = document.createElement("userdata"), this.rb.addBehavior("#default#userData"), document.body.appendChild(this.rb)), zc.set(a, this.rb));
            try {
                this.rb.load(this.Dp)
            } catch (c) {
                this.rb = null
            }
        }
    }
    v(yc, rb);
    var Ac = {
            ".": ".2E",
            "!": ".21",
            "~": ".7E",
            "*": ".2A",
            "'": ".27",
            "(": ".28",
            ")": ".29",
            "%": "."
        },
        zc = null;

    function Bc(a) {
        return "_" + encodeURIComponent(a).replace(/[.!~*'()%]/g, function(a) {
            return Ac[a]
        })
    }
    e = yc.prototype;
    e.qm = function() {
        return !!this.rb
    };
    e.set = function(a, b) {
        this.rb.setAttribute(Bc(a), b);
        Cc(this)
    };
    e.get = function(a) {
        a = this.rb.getAttribute(Bc(a));
        if (!r(a) && null !== a) throw "Storage mechanism: Invalid value was encountered";
        return a
    };
    e.remove = function(a) {
        this.rb.removeAttribute(Bc(a));
        Cc(this)
    };
    e.jd = function(a) {
        var b = 0,
            c = this.rb.XMLDocument.documentElement.attributes,
            d = new fb;
        d.next = function() {
            if (b >= c.length) throw eb;
            var d = w(c[b++]);
            if (a) return decodeURIComponent(d.nodeName.replace(/\./g, "%")).substr(1);
            d = d.nodeValue;
            if (!r(d)) throw "Storage mechanism: Invalid value was encountered";
            return d
        };
        return d
    };
    e.clear = function() {
        for (var a = this.rb.XMLDocument.documentElement, b = a.attributes.length; 0 < b; b--) a.removeAttribute(a.attributes[b - 1].nodeName);
        Cc(this)
    };

    function Cc(a) {
        try {
            a.rb.save(a.Dp)
        } catch (b) {
            throw "Storage mechanism: Quota exceeded";
        }
    };

    function Dc(a, b) {
        this.Wh = a;
        this.jg = b + "::"
    }
    v(Dc, rb);
    Dc.prototype.set = function(a, b) {
        this.Wh.set(this.jg + a, b)
    };
    Dc.prototype.get = function(a) {
        return this.Wh.get(this.jg + a)
    };
    Dc.prototype.remove = function(a) {
        this.Wh.remove(this.jg + a)
    };
    Dc.prototype.jd = function(a) {
        var b = this.Wh.jd(!0),
            c = this,
            d = new fb;
        d.next = function() {
            for (var d = b.next(); d.substr(0, c.jg.length) != c.jg;) d = b.next();
            return a ? d.substr(c.jg.length) : c.Wh.get(d)
        };
        return d
    };

    function Ec() {}
    v(Ec, qb);
    Ec.prototype.set = function() {};
    Ec.prototype.get = function() {
        return null
    };
    Ec.prototype.remove = function() {};

    function Fc(a, b) {
        var c = Gc();
        try {
            c.set(a, b)
        } catch (d) {}
    }

    function Hc(a) {
        Gc().remove(a)
    }
    var Ic = null;

    function Gc() {
        if (!Ic) {
            var a = new tb;
            (a = a.qm() ? new Dc(a, "ispring") : null) || (a = new yc("ispring"), a = a.qm() ? a : null);
            Ic = new pb(a || new Ec)
        }
        return Ic
    };

    function Jc(a, b) {
        this.lk = Kc + b + "/" + a
    }
    var Kc = "book/";
    Jc.prototype.getState = function() {
        return Lc(this.lk)
    };

    function Mc(a) {
        var b = null,
            c = null,
            d = !0,
            f = Math.floor(Date.now() / 1E3),
            g = Gc();
        g instanceof rb && (hb(g.jd(!0), function(a) {
            var g = Lc(a);
            g && (g.updated + x.rs < f && (Hc(a), d = !1), d && (null == b || g.updated < b) && (b = g.updated, c = a))
        }, a), d && Hc(c))
    }

    function Lc(a) {
        a = Gc().get(a);
        a = p(a) ? a : null;
        return null == a ? null : JSON.parse(a)
    };

    function Nc(a) {
        this.Yk = a
    }
    Nc.prototype.ya = function(a, b, c) {
        c = this.Yk.hasOwnProperty(a) ? this.Yk[a] : c;
        if (p(c)) {
            if (p(b)) {
                a = this.hq;
                for (var d in b)
                    if (b.hasOwnProperty(d)) {
                        var f = b[d];
                        a && (d = a(d));
                        c = c.replace(new RegExp(d, "g"), f)
                    }
            }
            return c
        }
        Na("unknown message id: " + a);
        return a
    };
    Nc.prototype.messages = function() {
        return this.Yk
    };
    Nc.prototype.hq = function(a) {
        return "%" + a.toUpperCase() + "%"
    };
    Nc.prototype.getMessage = Nc.prototype.ya;
    var Oc = !A || 9 <= Number(wc),
        Pc = A && !vc("9"),
        Qc = function() {
            if (!n.addEventListener || !Object.defineProperty) return !1;
            var a = !1,
                b = Object.defineProperty({}, "passive", {
                    get: function() {
                        a = !0
                    }
                });
            try {
                n.addEventListener("test", ua, b), n.removeEventListener("test", ua, b)
            } catch (c) {}
            return a
        }();

    function Rc() {
        0 != Sc && (Tc[Aa(this)] = this);
        this.Aj = this.Aj;
        this.fg = this.fg
    }
    var Sc = 0,
        Tc = {};
    Rc.prototype.Aj = !1;
    Rc.prototype.bg = function() {
        if (!this.Aj && (this.Aj = !0, this.cc(), 0 != Sc)) {
            var a = Aa(this);
            if (0 != Sc && this.fg && 0 < this.fg.length) throw Error(this + " did not empty its onDisposeCallbacks queue. This probably means it overrode dispose() or disposeInternal() without calling the superclass' method.");
            delete Tc[a]
        }
    };
    Rc.prototype.cc = function() {
        if (this.fg)
            for (; this.fg.length;) this.fg.shift()()
    };

    function Uc() {
        this.id = "mousewheel"
    }
    Uc.prototype.toString = function() {
        return this.id
    };

    function Vc(a, b) {
        this.type = a instanceof Uc ? String(a) : a;
        this.currentTarget = this.target = b;
        this.defaultPrevented = this.Ze = !1;
        this.pp = !0
    }
    Vc.prototype.stopPropagation = function() {
        this.Ze = !0
    };
    Vc.prototype.preventDefault = function() {
        this.defaultPrevented = !0;
        this.pp = !1
    };

    function Wc(a, b) {
        Vc.call(this, a ? a.type : "");
        this.relatedTarget = this.currentTarget = this.target = null;
        this.button = this.screenY = this.screenX = this.clientY = this.clientX = this.offsetY = this.offsetX = 0;
        this.key = "";
        this.charCode = this.keyCode = 0;
        this.metaKey = this.shiftKey = this.altKey = this.ctrlKey = !1;
        this.state = null;
        this.pointerId = 0;
        this.pointerType = "";
        this.Oa = null;
        if (a) {
            var c = this.type = a.type,
                d = a.changedTouches && a.changedTouches.length ? a.changedTouches[0] : null;
            this.target = a.target || a.srcElement;
            this.currentTarget =
                b;
            if (b = a.relatedTarget) {
                if (gc) {
                    a: {
                        try {
                            ac(b.nodeName);
                            var f = !0;
                            break a
                        } catch (g) {}
                        f = !1
                    }
                    f || (b = null)
                }
            } else "mouseover" == c ? b = a.fromElement : "mouseout" == c && (b = a.toElement);
            this.relatedTarget = b;
            d ? (this.clientX = void 0 !== d.clientX ? d.clientX : d.pageX, this.clientY = void 0 !== d.clientY ? d.clientY : d.pageY, this.screenX = d.screenX || 0, this.screenY = d.screenY || 0) : (this.offsetX = hc || void 0 !== a.offsetX ? a.offsetX : a.layerX, this.offsetY = hc || void 0 !== a.offsetY ? a.offsetY : a.layerY, this.clientX = void 0 !== a.clientX ? a.clientX : a.pageX,
                this.clientY = void 0 !== a.clientY ? a.clientY : a.pageY, this.screenX = a.screenX || 0, this.screenY = a.screenY || 0);
            this.button = a.button;
            this.keyCode = a.keyCode || 0;
            this.key = a.key || "";
            this.charCode = a.charCode || ("keypress" == c ? a.keyCode : 0);
            this.ctrlKey = a.ctrlKey;
            this.altKey = a.altKey;
            this.shiftKey = a.shiftKey;
            this.metaKey = a.metaKey;
            this.pointerId = a.pointerId || 0;
            this.pointerType = r(a.pointerType) ? a.pointerType : Xc[a.pointerType] || "";
            this.state = a.state;
            this.Oa = a;
            a.defaultPrevented && this.preventDefault()
        }
    }
    v(Wc, Vc);
    var Xc = {
        2: "touch",
        3: "pen",
        4: "mouse"
    };
    Wc.prototype.stopPropagation = function() {
        Wc.V.stopPropagation.call(this);
        this.Oa.stopPropagation ? this.Oa.stopPropagation() : this.Oa.cancelBubble = !0
    };
    Wc.prototype.preventDefault = function() {
        Wc.V.preventDefault.call(this);
        var a = this.Oa;
        if (a.preventDefault) a.preventDefault();
        else if (a.returnValue = !1, Pc) try {
            if (a.ctrlKey || 112 <= a.keyCode && 123 >= a.keyCode) a.keyCode = -1
        } catch (b) {}
    };
    var Yc = "closure_listenable_" + (1E6 * Math.random() | 0);

    function Zc(a) {
        return !(!a || !a[Yc])
    }
    var $c = 0;

    function ad(a, b, c, d, f) {
        this.listener = a;
        this.proxy = null;
        this.src = b;
        this.type = c;
        this.capture = !!d;
        this.Ej = f;
        this.key = ++$c;
        this.kg = this.yj = !1
    }

    function bd(a) {
        a.kg = !0;
        a.listener = null;
        a.proxy = null;
        a.src = null;
        a.Ej = null
    };

    function cd(a) {
        this.src = a;
        this.xb = {};
        this.li = 0
    }
    cd.prototype.add = function(a, b, c, d, f) {
        var g = a.toString();
        a = this.xb[g];
        a || (a = this.xb[g] = [], this.li++);
        var h = dd(a, b, d, f); - 1 < h ? (b = a[h], c || (b.yj = !1)) : (b = new ad(b, this.src, g, !!d, f), b.yj = c, a.push(b));
        return b
    };
    cd.prototype.remove = function(a, b, c, d) {
        a = a.toString();
        if (!(a in this.xb)) return !1;
        var f = this.xb[a];
        b = dd(f, b, c, d);
        return -1 < b ? (bd(f[b]), Xa(f, b), 0 == f.length && (delete this.xb[a], this.li--), !0) : !1
    };

    function ed(a, b) {
        var c = b.type;
        if (!(c in a.xb)) return !1;
        var d = Wa(a.xb[c], b);
        d && (bd(b), 0 == a.xb[c].length && (delete a.xb[c], a.li--));
        return d
    }
    cd.prototype.Rh = function(a, b, c, d) {
        a = this.xb[a.toString()];
        var f = -1;
        a && (f = dd(a, b, c, d));
        return -1 < f ? a[f] : null
    };

    function dd(a, b, c, d) {
        for (var f = 0; f < a.length; ++f) {
            var g = a[f];
            if (!g.kg && g.listener == b && g.capture == !!c && g.Ej == d) return f
        }
        return -1
    };
    var fd = "closure_lm_" + (1E6 * Math.random() | 0),
        gd = {},
        hd = 0;

    function B(a, b, c, d, f) {
        if (d && d.once) return id(a, b, c, d, f);
        if (wa(b)) {
            for (var g = 0; g < b.length; g++) B(a, b[g], c, d, f);
            return null
        }
        c = jd(c);
        Zc(a) ? (d = za(d) ? !!d.capture : !!d, kd(a), a = a.$c.add(String(b), c, !1, d, f)) : a = ld(a, b, c, !1, d, f);
        return a
    }

    function ld(a, b, c, d, f, g) {
        if (!b) throw Error("Invalid event type");
        var h = za(f) ? !!f.capture : !!f,
            k = md(a);
        k || (a[fd] = k = new cd(a));
        c = k.add(b, c, d, h, g);
        if (c.proxy) return c;
        d = nd();
        c.proxy = d;
        d.src = a;
        d.listener = c;
        if (a.addEventListener) Qc || (f = h), void 0 === f && (f = !1), a.addEventListener(b.toString(), d, f);
        else if (a.attachEvent) a.attachEvent(od(b.toString()), d);
        else if (a.addListener && a.removeListener) w("change" === b, "MediaQueryList only has a change event"), a.addListener(d);
        else throw Error("addEventListener and attachEvent are unavailable.");
        hd++;
        return c
    }

    function nd() {
        var a = pd,
            b = Oc ? function(c) {
                return a.call(b.src, b.listener, c)
            } : function(c) {
                c = a.call(b.src, b.listener, c);
                if (!c) return c
            };
        return b
    }

    function id(a, b, c, d, f) {
        if (wa(b)) {
            for (var g = 0; g < b.length; g++) id(a, b[g], c, d, f);
            return null
        }
        c = jd(c);
        return Zc(a) ? a.$c.add(String(b), c, !0, za(d) ? !!d.capture : !!d, f) : ld(a, b, c, !0, d, f)
    }

    function qd(a, b, c, d, f) {
        if (wa(b))
            for (var g = 0; g < b.length; g++) qd(a, b[g], c, d, f);
        else d = za(d) ? !!d.capture : !!d, c = jd(c), Zc(a) ? a.$c.remove(String(b), c, d, f) : a && (a = md(a)) && (b = a.Rh(b, c, d, f)) && rd(b)
    }

    function rd(a) {
        if (t(a) || !a || a.kg) return !1;
        var b = a.src;
        if (Zc(b)) return ed(b.$c, a);
        var c = a.type,
            d = a.proxy;
        b.removeEventListener ? b.removeEventListener(c, d, a.capture) : b.detachEvent ? b.detachEvent(od(c), d) : b.addListener && b.removeListener && b.removeListener(d);
        hd--;
        (c = md(b)) ? (ed(c, a), 0 == c.li && (c.src = null, b[fd] = null)) : bd(a);
        return !0
    }

    function od(a) {
        return a in gd ? gd[a] : gd[a] = "on" + a
    }

    function sd(a, b, c, d) {
        var f = !0;
        if (a = md(a))
            if (b = a.xb[b.toString()])
                for (b = b.concat(), a = 0; a < b.length; a++) {
                    var g = b[a];
                    g && g.capture == c && !g.kg && (g = td(g, d), f = f && !1 !== g)
                }
        return f
    }

    function td(a, b) {
        var c = a.listener,
            d = a.Ej || a.src;
        a.yj && rd(a);
        return c.call(d, b)
    }

    function pd(a, b) {
        if (a.kg) return !0;
        if (!Oc) {
            if (!b) a: {
                b = ["window", "event"];
                for (var c = n, d = 0; d < b.length; d++)
                    if (c = c[b[d]], null == c) {
                        b = null;
                        break a
                    } b = c
            }
            d = b;
            b = new Wc(d, this);
            c = !0;
            if (!(0 > d.keyCode || void 0 != d.returnValue)) {
                a: {
                    var f = !1;
                    if (0 == d.keyCode) try {
                        d.keyCode = -1;
                        break a
                    } catch (h) {
                        f = !0
                    }
                    if (f || void 0 == d.returnValue) d.returnValue = !0
                }
                d = [];
                for (f = b.currentTarget; f; f = f.parentNode) d.push(f);a = a.type;
                for (f = d.length - 1; !b.Ze && 0 <= f; f--) {
                    b.currentTarget = d[f];
                    var g = sd(d[f], a, !0, b);
                    c = c && g
                }
                for (f = 0; !b.Ze && f < d.length; f++) b.currentTarget =
                    d[f],
                g = sd(d[f], a, !1, b),
                c = c && g
            }
            return c
        }
        return td(a, new Wc(b, this))
    }

    function md(a) {
        a = a[fd];
        return a instanceof cd ? a : null
    }
    var ud = "__closure_events_fn_" + (1E9 * Math.random() >>> 0);

    function jd(a) {
        w(a, "Listener can not be null.");
        if (ya(a)) return a;
        w(a.handleEvent, "An object listener must have handleEvent method.");
        a[ud] || (a[ud] = function(b) {
            return a.handleEvent(b)
        });
        return a[ud]
    };

    function vd() {
        Rc.call(this);
        this.$c = new cd(this);
        this.Or = this;
        this.vm = null
    }
    v(vd, Rc);
    vd.prototype[Yc] = !0;
    e = vd.prototype;
    e.addEventListener = function(a, b, c, d) {
        B(this, a, b, c, d)
    };
    e.removeEventListener = function(a, b, c, d) {
        qd(this, a, b, c, d)
    };
    e.dispatchEvent = function(a) {
        kd(this);
        var b = this.vm;
        if (b) {
            var c = [];
            for (var d = 1; b; b = b.vm) c.push(b), w(1E3 > ++d, "infinite loop")
        }
        b = this.Or;
        d = a.type || a;
        if (r(a)) a = new Vc(a, b);
        else if (a instanceof Vc) a.target = a.target || b;
        else {
            var f = a;
            a = new Vc(d, b);
            Wb(a, f)
        }
        f = !0;
        if (c)
            for (var g = c.length - 1; !a.Ze && 0 <= g; g--) {
                var h = a.currentTarget = c[g];
                f = wd(h, d, !0, a) && f
            }
        a.Ze || (h = a.currentTarget = b, f = wd(h, d, !0, a) && f, a.Ze || (f = wd(h, d, !1, a) && f));
        if (c)
            for (g = 0; !a.Ze && g < c.length; g++) h = a.currentTarget = c[g], f = wd(h, d, !1, a) && f;
        return f
    };
    e.cc = function() {
        vd.V.cc.call(this);
        if (this.$c) {
            var a = this.$c,
                b = 0,
                c;
            for (c in a.xb) {
                for (var d = a.xb[c], f = 0; f < d.length; f++) ++b, bd(d[f]);
                delete a.xb[c];
                a.li--
            }
        }
        this.vm = null
    };

    function wd(a, b, c, d) {
        b = a.$c.xb[String(b)];
        if (!b) return !0;
        b = b.concat();
        for (var f = !0, g = 0; g < b.length; ++g) {
            var h = b[g];
            if (h && !h.kg && h.capture == c) {
                var k = h.listener,
                    u = h.Ej || h.src;
                h.yj && ed(a.$c, h);
                f = !1 !== k.call(u, d) && f
            }
        }
        return f && 0 != d.pp
    }
    e.Rh = function(a, b, c, d) {
        return this.$c.Rh(String(a), b, c, d)
    };

    function kd(a) {
        w(a.$c, "Event target is not initialized. Did you call the superclass (goog.events.EventTarget) constructor?")
    };
    var xd = 0;

    function yd() {
        this.Hg = this.Nd = this.ic = this.fb = null
    }
    e = yd.prototype;
    e.bg = function() {
        this.kf();
        if (this.Nd)
            for (var a = l(this.Nd), b = a.next(); !b.done; b = a.next()) zd(b.value);
        if (this.fb) {
            a = l(this.fb);
            for (b = a.next(); !b.done; b = a.next())
                if (b = b.value, wa(b)) {
                    b = l(b);
                    for (var c = b.next(); !c.done; c = b.next()) rd(c.value)
                } else rd(b);
            this.fb = null
        }
        if (this.ic)
            for (a = l(Object.keys(this.ic)), b = a.next(); !b.done; b = a.next()) Ad(this, b.value)
    };

    function C(a, b, c, d, f, g) {
        f = void 0 === f ? null : f;
        g = void 0 === g ? !1 : g;
        a.fb = a.fb || [];
        if (wa(c)) {
            var h = [];
            c = l(c);
            for (var k = c.next(); !k.done; k = c.next()) k = k.value, k = B(Bd(b), k, d, g, f), h.push(k);
            a.fb.push(h)
        } else b = B(Bd(b), c, d, g, f), a.fb.push(b)
    }

    function Cd(a, b, c, d, f) {
        if (wa(c)) {
            var g = !1;
            c = l(c);
            for (var h = c.next(); !h.done; h = c.next()) g = Cd(a, b, h.value, d, f) || g;
            return g
        }
        b = Bd(b);
        d = jd(d);
        f = Zc(b) ? b.Rh(c, d, !1, f) : b ? (b = md(b)) ? b.Rh(c, d, !1, f) : null : null;
        return !!f && Dd(a, f)
    }

    function Dd(a, b) {
        if (wa(b)) {
            var c = !1;
            b = l(b);
            for (var d = b.next(); !d.done; d = b.next()) c = Dd(a, d.value) || c;
            return c
        }
        Wa(a.fb, b);
        return rd(b)
    }

    function D(a, b, c, d, f) {
        a.ic = a.ic || {};
        b.addHandler(c, d, f);
        var g = ++xd;
        a.ic[g] = {
            em: b,
            dg: c,
            context: d,
            priority: f
        };
        return g
    }

    function Ed(a, b, c, d) {
        function f(g) {
            for (var h = [], k = 0; k < arguments.length; ++k) h[k - 0] = arguments[k];
            c.apply(d, h);
            Fd(a, b, f, d)
        }
        D(a, b, f, d, void 0)
    }

    function Fd(a, b, c, d) {
        var f = Qb(a.ic, function(a) {
            return Tb(a, {
                em: b,
                dg: c,
                context: d,
                priority: void 0
            })
        });
        f && Ad(a, f)
    }

    function Ad(a, b) {
        if (a.ic && a.ic[b]) {
            var c = a.ic[b];
            c.em.removeHandler(c.dg, c.context, c.priority);
            delete a.ic[b]
        } else Na("unknown handler key")
    }

    function Gd(a, b) {
        if (b) {
            if (a.ic) {
                var c = Ob(a.ic, function(a) {
                        return a.em.Vn == b
                    }),
                    d = l(Object.keys(c));
                for (c = d.next(); !c.done; c = d.next()) Ad(a, c.value)
            }
            if (a.fb) {
                var f = Bd(b);
                c = Ua(a.fb, function(a) {
                    return a.src == f
                });
                d = l(c);
                for (c = d.next(); !c.done; c = d.next()) Dd(a, c.value)
            }
        }
    }

    function E(a, b, c) {
        a.Nd = a.Nd || [];
        c && (a.Hg = a.Hg || {}, a.Hg[c] = a.Hg[c] || [], a.Hg[c].push(b));
        a.Nd.push(b);
        return b
    }
    e.mh = function(a) {
        for (var b = [], c = 0; c < arguments.length; ++c) b[c - 0] = arguments[c];
        if (this.Nd)
            for (b = l(b), c = b.next(); !c.done; c = b.next())
                if (c = c.value) {
                    this.Ci(c);
                    var d = Sa(this.Nd, c);
                    0 <= d && (this.Nd.splice(d, 1), zd(c))
                }
    };
    e.Ci = function(a) {
        Gd(this, a)
    };
    e.Wm = function(a) {
        for (var b = [], c = 0; c < arguments.length; ++c) b[c - 0] = arguments[c];
        b = l(b);
        for (c = b.next(); !c.done; c = b.next())(c = c.value) && this.Ci(c)
    };

    function Bd(a) {
        return p(a.displayObject) ? a.displayObject() : a
    }
    e.kf = function() {};

    function Hd() {}
    Ha("ispring.events.IEventDispatcher", Hd);
    Hd.prototype.addHandler = function() {};
    Hd.prototype.addHandler = Hd.prototype.addHandler;
    Hd.prototype.removeHandler = function() {};
    Hd.prototype.removeHandler = Hd.prototype.removeHandler;

    function Id() {
        this.Wf = this.Pe = this.hj = null
    }
    Id.prototype.push = function(a, b) {
        if (0 == b) this.Wf = this.Wf || [];
        else if (this.hj = this.hj || [0], this.Pe = this.Pe || {}, !(b in this.Pe)) {
            this.Pe[b] = [];
            var c = this.hj;
            var d = 0;
            for (var f = c.length, g; d < f;) {
                var h = d + f >> 1;
                var k = c[h];
                k = b > k ? 1 : b < k ? -1 : 0;
                0 < k ? d = h + 1 : (f = h, g = !k)
            }
            d = g ? d : ~d;
            0 > d && $a(c, -(d + 1), 0, b)
        }
        b = Jd(this, b);
        w(b).push(a)
    };
    Id.prototype.remove = function(a, b) {
        (b = Jd(this, b)) && Wa(b, a)
    };

    function Kd(a, b) {
        return 0 == b ? a.Wf || [] : b in w(a.Pe) ? w(Jd(a, b)) : []
    }

    function Ld(a) {
        if (!a.Pe) return a.Wf ? a.Wf.slice() : [];
        for (var b = [], c = w(a.hj), d = 0; d < c.length; ++d) {
            var f = Jd(a, c[d]);
            f && Za(b, f)
        }
        return b
    }

    function Jd(a, b) {
        return 0 == b ? a.Wf : w(a.Pe)[b]
    };

    function F(a) {
        a = void 0 === a ? null : a;
        yd.call(this);
        this.Vd = this.Ja = null;
        this.Vn = a
    }
    m(F, yd);
    e = F.prototype;
    e.Xr = function() {
        return this.Vn
    };
    e.addHandler = function(a, b, c) {
        this.Ja = this.Ja || new Id;
        this.Ja.push({
            dg: a,
            context: b
        }, c || 0)
    };
    e.removeHandler = function(a, b, c) {
        c = c || 0;
        if (this.Ja)
            for (var d = Kd(this.Ja, c), f = d.length, g = 0; g < f; ++g) {
                var h = d[g];
                if (h.dg == a && h.context == b) {
                    a = g;
                    (c = Jd(this.Ja, c)) && Xa(c, a);
                    break
                }
            } else Na("EventDispatcher has no handlers!")
    };
    e.fs = function(a, b, c) {
        if (!this.Ja) return !1;
        c = Kd(this.Ja, c || 0);
        for (var d = c.length, f = 0; f < d; ++f) {
            var g = c[f];
            if (g.dg == a && g.context == b) return !0
        }
        return !1
    };
    e.f = function(a) {
        for (var b = [], c = 0; c < arguments.length; ++c) b[c - 0] = arguments[c];
        if (this.Ja) {
            c = Ld(this.Ja);
            for (var d = c.length, f = 0; f < d; ++f) {
                var g = c[f];
                if (-1 != Sa(Ld(this.Ja), g)) try {
                    g.dg.apply(g.context, arguments)
                } catch (h) {
                    Md(h, !0)
                }
            }
        }
        this.Vd && this.Vd.forEach(function(a) {
            a.f.apply(a, ba(b))
        })
    };

    function Nd(a) {
        return a.Ja ? Ld(a.Ja).length : 0
    }
    e.kf = function() {
        yd.prototype.kf.call(this)
    };
    F.prototype.dispatch = F.prototype.f;
    F.prototype.hasHandler = F.prototype.fs;
    F.prototype.removeHandler = F.prototype.removeHandler;
    F.prototype.addHandler = F.prototype.addHandler;
    F.prototype.eventOwner = F.prototype.Xr;

    function Od(a, b, c) {
        this.Ee = a;
        this.Rc = b;
        this.Hf = null;
        this.Me = c
    }
    e = Od.prototype;
    e.getViewport = function(a) {
        return this.Ee.getViewport(a)
    };
    e.getTextContent = function(a) {
        return this.Ee.getTextContent(a)
    };
    e.render = function(a, b) {
        var c = this;
        this.Hf = a = this.Ee.render(a);
        a.promise.then(function() {
            c.Hf = null;
            b && b(null)
        }, function(a) {
            console.warn("render", a);
            b && b(a)
        })
    };
    e.renderTextLayer = function(a, b) {
        this.Me ? this.Me.renderTextLayer(this.Ee, a, b) : b()
    };

    function Pd(a, b, c) {
        var d = b.viewport.clone({
            dontFlip: !0
        });
        a.Ee.getAnnotations({
            intent: "display"
        }).then(function(f) {
            if (0 < f.length) {
                for (var g = 0; g < f.length; ++g) 2 == f[g].annotationType && (f[g].newWindow = !0);
                PDFJS.AnnotationLayer.render({
                    viewport: d,
                    div: b.container,
                    annotations: f,
                    page: a.Ee,
                    linkService: a.Rc
                })
            }
            c()
        })
    }
    e.cleanup = function() {
        this.Ee.cleanup()
    };

    function G(a, b) {
        this.x = p(a) ? a : 0;
        this.y = p(b) ? b : 0
    }
    e = G.prototype;
    e.clone = function() {
        return new G(this.x, this.y)
    };

    function Qd(a, b) {
        var c = a.x - b.x;
        a = a.y - b.y;
        return c * c + a * a
    }

    function Rd(a, b) {
        return new G(a.x - b.x, a.y - b.y)
    }
    e.ceil = function() {
        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        return this
    };
    e.floor = function() {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this
    };
    e.round = function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this
    };
    e.translate = function(a, b) {
        a instanceof G ? (this.x += a.x, this.y += a.y) : (this.x += Number(a), t(b) && (this.y += b));
        return this
    };
    e.scale = function(a, b) {
        b = t(b) ? b : a;
        this.x *= a;
        this.y *= b;
        return this
    };

    function Sd(a, b, c, d) {
        this.top = a;
        this.right = b;
        this.bottom = c;
        this.left = d
    }
    e = Sd.prototype;
    e.clone = function() {
        return new Sd(this.top, this.right, this.bottom, this.left)
    };
    e.contains = function(a) {
        return this && a ? a instanceof Sd ? a.left >= this.left && a.right <= this.right && a.top >= this.top && a.bottom <= this.bottom : a.x >= this.left && a.x <= this.right && a.y >= this.top && a.y <= this.bottom : !1
    };
    e.expand = function(a, b, c, d) {
        za(a) ? (this.top -= a.top, this.right += a.right, this.bottom += a.bottom, this.left -= a.left) : (this.top -= a, this.right += Number(b), this.bottom += Number(c), this.left -= Number(d));
        return this
    };
    e.ceil = function() {
        this.top = Math.ceil(this.top);
        this.right = Math.ceil(this.right);
        this.bottom = Math.ceil(this.bottom);
        this.left = Math.ceil(this.left);
        return this
    };
    e.floor = function() {
        this.top = Math.floor(this.top);
        this.right = Math.floor(this.right);
        this.bottom = Math.floor(this.bottom);
        this.left = Math.floor(this.left);
        return this
    };
    e.round = function() {
        this.top = Math.round(this.top);
        this.right = Math.round(this.right);
        this.bottom = Math.round(this.bottom);
        this.left = Math.round(this.left);
        return this
    };
    e.translate = function(a, b) {
        a instanceof G ? (this.left += a.x, this.right += a.x, this.top += a.y, this.bottom += a.y) : (Oa(a), this.left += a, this.right += a, t(b) && (this.top += b, this.bottom += b));
        return this
    };
    e.scale = function(a, b) {
        b = t(b) ? b : a;
        this.left *= a;
        this.right *= a;
        this.top *= b;
        this.bottom *= b;
        return this
    };
    var Td = /\S/;

    function Ud(a, b) {
        return new G(a[0] * b[0] + a[1] * b[2] + b[4], a[0] * b[1] + a[1] * b[3] + b[5])
    }

    function Vd(a, b, c) {
        var d = null;
        a.forEach(function(a) {
            if (Td.test(a.str)) {
                var f = c.transform,
                    h = a.transform;
                var k = [f[0] * h[0] + f[2] * h[1], f[1] * h[0] + f[3] * h[1], f[0] * h[2] + f[2] * h[3], f[1] * h[2] + f[3] * h[3], f[0] * h[4] + f[2] * h[5] + f[4], f[1] * h[4] + f[3] * h[5] + f[5]];
                h = Math.atan2(k[1], k[0]);
                var u = b[a.fontName];
                u.vertical && (h += Math.PI / 2);
                var q = Math.sqrt(k[2] * k[2] + k[3] * k[3]),
                    y = q;
                u.ascent ? y *= u.ascent : u.descent && (y *= 1 + u.descent);
                0 === h ? (f = k[4], k = k[5] - y) : (f = k[4] + y * Math.sin(h), k = k[5] - y * Math.cos(h));
                y = 1;
                var I = 0;
                0 !== h && (y = Math.cos(h),
                    I = Math.sin(h));
                a = (u.vertical ? a.height : a.width) * c.scale;
                0 !== h ? (a = [0, 0, a, q], u = [y, I, -I, y, f, k], f = Ud(a, u), h = Ud(a.slice(2, 4), u), q = Ud([a[0], a[3]], u), a = Ud([a[2], a[1]], u), a = new Sd(Math.min(f.y, h.y, q.y, a.y), Math.max(f.x, h.x, q.x, a.x), Math.max(f.y, h.y, q.y, a.y), Math.min(f.x, h.x, q.x, a.x))) : a = new Sd(k, f + a, k + q, f);
                a = new Wd(a.left, a.top, a.right - a.left, a.bottom - a.top)
            } else a = null;
            a && (d && (d && a ? (f = new Wd(d.left, d.top, d.width, d.height), h = Math.max(f.left + f.width, a.left + a.width), q = Math.max(f.top + f.height, a.top + a.height),
                f.left = Math.min(f.left, a.left), f.top = Math.min(f.top, a.top), f.width = h - f.left, f.height = q - f.top, a = f) : a = null), d = a)
        });
        return d
    };

    function Xd(a, b, c, d, f) {
        this.kq = a;
        this.Tp = b;
        this.Up = c;
        this.ir = d;
        this.jr = f
    }
    e = Xd.prototype;
    e.id = function() {
        return this.kq
    };
    e.clientX = function() {
        return this.Tp
    };
    e.clientY = function() {
        return this.Up
    };
    e.screenX = function() {
        return this.ir
    };
    e.screenY = function() {
        return this.jr
    };

    function Yd(a, b) {
        this.Pd = a;
        this.zr = b
    }

    function Zd(a) {
        w(0 < a.length);
        for (var b = [], c = 0; c < a.length; ++c) {
            var d = a[c];
            b.push(new Xd(d.pointerId, d.clientX, d.clientY, d.screenX, d.screenY))
        }
        return new Yd(a[0], b)
    }
    Yd.prototype.touches = function() {
        return this.zr
    };
    Yd.prototype.scale = function() {
        return this.Pd.scale
    };
    Yd.prototype.rotation = function() {
        return this.Pd.rotation
    };
    var $d = ["touchstart", "mousedown"],
        ae = ["touchend", "mouseup"],
        be = ["touchmove", "mousemove"];
    var ce = {
            passive: !1
        },
        de = {
            passive: !0
        };

    function ee(a) {
        this.Md = a;
        this.kd = {};
        this.xe = {}
    }
    e = ee.prototype;
    e.Ch = !1;
    e.Oi = -1;

    function fe(a) {
        var b = a.Md;
        window.navigator.msPointerEnabled ? (B(b, "MSPointerDown", a.Kn, !1, a), B(b, "MSPointerUp", a.Mn, !1, a), B(b, "MSPointerMove", a.Ln, !1, a)) : (B(b, $d, a.Un, ce, a), B(b, ae, a.Sn, !1, a), B(b, be, a.Tn, ce, a))
    }

    function ge(a) {
        var b = a.Md;
        window.navigator.msPointerEnabled ? (qd(b, "MSPointerDown", a.Kn, !1, a), qd(b, "MSPointerUp", a.Mn, !1, a), qd(b, "MSPointerMove", a.Ln, !1, a)) : (qd(b, $d, a.Un, ce, a), qd(b, ae, a.Sn, !1, a), qd(b, be, a.Tn, ce, a))
    }
    e.Un = function(a) {
        var b = a.Oa;
        w(b);
        if (!this.Ch || b.touches && 1 == b.touches.length) this.Ch = !0, a = he(a), ie(this, "touchStart", a)
    };
    e.Sn = function(a) {
        if (this.Ch) {
            this.Ch = !1;
            var b = he(a);
            if (ie(this, "touchEnd", b)) {
                if (b = a.target)
                    if ("TEXTAREA" == b.nodeName) b = !0;
                    else {
                        var c = b.getAttribute("type");
                        b = "INPUT" == b.nodeName && (!c || "text" == c || "number" == c)
                    }
                else b = !1;
                b || je(a.target) || ke(a.target) || a.preventDefault()
            }
        }
    };
    e.Tn = function(a) {
        !ke(a.target) && this.Ch && (a = he(a), ie(this, "touchMove", a))
    };

    function he(a) {
        a = a.Oa;
        w(a);
        if (p(window.TouchEvent) && a instanceof TouchEvent) {
            w(a.touches);
            for (var b = [], c = 0; c < a.touches.length; ++c) {
                var d = a.touches[c];
                b.push(new Xd(d.identifier, d.clientX, d.clientY, d.screenX, d.screenY))
            }
            a = new Yd(a, b)
        } else b = [], b.push(new Xd(0, a.clientX, a.clientY, a.screenX, a.screenY)), a = new Yd(a, b);
        return a
    }
    e.Kn = function(a) {
        var b = a.Oa;
        this.kd[b.pointerId] = b;
        le(this, a);
        b = Pb(this.kd);
        a = 1 == b.length ? "touchStart" : "touchMove";
        b = Zd(b);
        ie(this, a, b)
    };
    e.Mn = function(a) {
        var b = a.Oa;
        if (b.pointerId in this.kd) {
            delete this.kd[b.pointerId];
            le(this, a);
            var c = Pb(this.kd);
            a = 0 < c.length ? "touchMove" : "touchEnd";
            0 == c.length && (c = [b]);
            c = Zd(c);
            ie(this, a, c) && b.preventDefault()
        }
    };
    e.Ln = function(a) {
        var b = a.Oa;
        b.pointerId in this.kd && (this.kd[b.pointerId] = b, le(this, a), a = Zd(Pb(this.kd)), ie(this, "touchMove", a))
    };

    function le(a, b) {
        "touch" == b.pointerType && (0 < a.Oi && clearTimeout(a.Oi), a.Oi = setTimeout(Fa(a.lq, a), 200))
    }
    e.lq = function() {
        this.kd = {};
        this.Oi = -1;
        for (var a in this.xe) this.xe.hasOwnProperty(a) && this.xe[a].ie()
    };

    function ie(a, b, c) {
        var d = 0,
            f = null,
            g;
        for (g in a.xe)
            if (a.xe.hasOwnProperty(g)) {
                var h = a.xe[g],
                    k = h.Dj(b, c);
                k > d && (d = k, f = h)
            } return f ? (c.Pd.defaultPrevented ? f.ie() : f.wj(c), !0) : !1
    }

    function me(a, b) {
        a.xe[b.Qh()] = b
    };

    function ne() {
        this.qj = new F;
        this.dn = new F;
        this.Al = new F;
        this.zl = new F
    }
    e = ne.prototype;
    e.Nb = null;
    e.tj = !1;
    e.Qh = function() {
        return "tap"
    };
    e.Dj = function(a, b) {
        if ("touchEnd" == a) return this.tj ? 1 : 0;
        var c = new G(b.touches()[0].clientX(), b.touches()[0].clientY());
        if ("touchStart" == a && 1 == b.touches().length) return this.Nb = c, this.tj = !0, this.Al.f(), oe || B(window, "scroll", this.ie, !1, this), 0;
        if (!this.Nb) return 0;
        50 >= Qd(c, this.Nb) || this.tj && this.ie();
        return 0
    };
    e.wj = function(a) {
        w(this.Nb);
        this.qj.f(this.Nb.x, this.Nb.y, a.Pd);
        var b = !1,
            c = Ga();
        this.Wk && (w(this.tn), 1E3 > c - this.Wk && 50 >= Qd(this.tn, this.Nb) && (b = !0, this.dn.f(this.Nb.x, this.Nb.y, a.Pd)));
        this.Wk = b ? null : c;
        this.tn = this.Nb
    };
    e.ie = function() {
        qd(window, "scroll", this.ie, !1, this);
        this.tj = !1;
        this.zl.f()
    };
    var pe;
    var qe = {
        Ts: "activedescendant",
        Us: "atomic",
        Vs: "autocomplete",
        Ws: "busy",
        Xs: "checked",
        Ys: "colindex",
        Zs: "controls",
        $s: "describedby",
        at: "disabled",
        bt: "dropeffect",
        ct: "expanded",
        dt: "flowto",
        et: "grabbed",
        ft: "haspopup",
        gt: "hidden",
        ht: "invalid",
        jt: "label",
        kt: "labelledby",
        lt: "level",
        mt: "live",
        nt: "multiline",
        ot: "multiselectable",
        qt: "orientation",
        rt: "owns",
        st: "posinset",
        tt: "pressed",
        ut: "readonly",
        vt: "relevant",
        wt: "required",
        xt: "rowindex",
        yt: "selected",
        zt: "setsize",
        At: "sort",
        Dt: "valuemax",
        Et: "valuemin",
        Ft: "valuenow",
        Gt: "valuetext"
    };
    var re = !A || 9 <= Number(wc),
        se = A && !vc("9");

    function te(a, b) {
        this.width = a;
        this.height = b
    }
    e = te.prototype;
    e.clone = function() {
        return new te(this.width, this.height)
    };
    e.aspectRatio = function() {
        return this.width / this.height
    };
    e.ceil = function() {
        this.width = Math.ceil(this.width);
        this.height = Math.ceil(this.height);
        return this
    };
    e.floor = function() {
        this.width = Math.floor(this.width);
        this.height = Math.floor(this.height);
        return this
    };
    e.round = function() {
        this.width = Math.round(this.width);
        this.height = Math.round(this.height);
        return this
    };
    e.scale = function(a, b) {
        b = t(b) ? b : a;
        this.width *= a;
        this.height *= b;
        return this
    };

    function ue(a, b) {
        Nb(b, function(b, d) {
            b && "object" == typeof b && b.Wt && (b = b.Vt());
            "style" == d ? a.style.cssText = b : "class" == d ? a.className = b : "for" == d ? a.htmlFor = b : ve.hasOwnProperty(d) ? a.setAttribute(ve[d], b) : 0 == d.lastIndexOf("aria-", 0) || 0 == d.lastIndexOf("data-", 0) ? a.setAttribute(d, b) : a[d] = b
        })
    }
    var ve = {
        cellpadding: "cellPadding",
        cellspacing: "cellSpacing",
        colspan: "colSpan",
        frameborder: "frameBorder",
        height: "height",
        maxlength: "maxLength",
        nonce: "nonce",
        role: "role",
        rowspan: "rowSpan",
        type: "type",
        usemap: "useMap",
        valign: "vAlign",
        width: "width"
    };

    function we(a, b, c) {
        var d = arguments,
            f = document,
            g = String(d[0]),
            h = d[1];
        if (!re && h && (h.name || h.type)) {
            g = ["<", g];
            h.name && g.push(' name="', yb(h.name), '"');
            if (h.type) {
                g.push(' type="', yb(h.type), '"');
                var k = {};
                Wb(k, h);
                delete k.type;
                h = k
            }
            g.push(">");
            g = g.join("")
        }
        g = f.createElement(g);
        h && (r(h) ? g.className = h : wa(h) ? g.className = h.join(" ") : ue(g, h));
        2 < d.length && xe(f, g, d, 2);
        return g
    }

    function xe(a, b, c, d) {
        function f(c) {
            c && b.appendChild(r(c) ? a.createTextNode(c) : c)
        }
        for (; d < c.length; d++) {
            var g = c[d];
            !xa(g) || za(g) && 0 < g.nodeType ? f(g) : Ta(ye(g) ? Ya(g) : g, f)
        }
    }

    function ze(a, b) {
        w(null != a && null != b, "goog.dom.appendChild expects non-null arguments");
        a.appendChild(b)
    }

    function Ae(a, b) {
        xe(Be(a), a, arguments, 1)
    }

    function Ce(a, b, c) {
        w(null != a, "goog.dom.insertChildAt expects a non-null parent");
        a.insertBefore(b, a.childNodes[c] || null)
    }

    function De(a) {
        return a && a.parentNode ? a.parentNode.removeChild(a) : null
    }

    function Ee(a, b) {
        if (!a || !b) return !1;
        if (a.contains && 1 == b.nodeType) return a == b || a.contains(b);
        if ("undefined" != typeof a.compareDocumentPosition) return a == b || !!(a.compareDocumentPosition(b) & 16);
        for (; b && a != b;) b = b.parentNode;
        return b == a
    }

    function Be(a) {
        w(a, "Node cannot be null or undefined.");
        return 9 == a.nodeType ? a : a.ownerDocument || a.document
    }

    function Fe(a, b) {
        w(null != a, "goog.dom.setTextContent expects a non-null value for node");
        if ("textContent" in a) a.textContent = b;
        else if (3 == a.nodeType) a.data = String(b);
        else if (a.firstChild && 3 == a.firstChild.nodeType) {
            for (; a.lastChild != a.firstChild;) a.removeChild(w(a.lastChild));
            a.firstChild.data = String(b)
        } else {
            for (var c; c = a.firstChild;) a.removeChild(c);
            c = Be(a);
            a.appendChild(c.createTextNode(String(b)))
        }
    }
    var Ge = {
            SCRIPT: 1,
            STYLE: 1,
            HEAD: 1,
            IFRAME: 1,
            OBJECT: 1
        },
        He = {
            IMG: " ",
            BR: "\n"
        };

    function Ie(a, b, c) {
        if (!(a.nodeName in Ge))
            if (3 == a.nodeType) c ? b.push(String(a.nodeValue).replace(/(\r\n|\r|\n)/g, "")) : b.push(a.nodeValue);
            else if (a.nodeName in He) b.push(He[a.nodeName]);
        else
            for (a = a.firstChild; a;) Ie(a, b, c), a = a.nextSibling
    }

    function ye(a) {
        if (a && "number" == typeof a.length) {
            if (za(a)) return "function" == typeof a.item || "string" == typeof a.item;
            if (ya(a)) return "function" == typeof a.item
        }
        return !1
    }

    function Je() {
        var a = document;
        try {
            var b = a && a.activeElement;
            return b && b.nodeName ? b : null
        } catch (c) {
            return null
        }
    }

    function Ke(a) {
        this.cg = a || n.document || document
    }
    e = Ke.prototype;
    e.ab = function(a) {
        this.cg = a
    };
    e.getDocument = function() {
        return this.cg
    };
    e.getElementsByTagName = function(a, b) {
        return (b || this.cg).getElementsByTagName(String(a))
    };
    e.createElement = function(a) {
        return this.cg.createElement(String(a))
    };
    e.createTextNode = function(a) {
        return this.cg.createTextNode(String(a))
    };
    e.appendChild = ze;
    e.append = Ae;
    e.canHaveChildren = function(a) {
        if (1 != a.nodeType) return !1;
        switch (a.tagName) {
            case "APPLET":
            case "AREA":
            case "BASE":
            case "BR":
            case "COL":
            case "COMMAND":
            case "EMBED":
            case "FRAME":
            case "HR":
            case "IMG":
            case "INPUT":
            case "IFRAME":
            case "ISINDEX":
            case "KEYGEN":
            case "LINK":
            case "NOFRAMES":
            case "NOSCRIPT":
            case "META":
            case "OBJECT":
            case "PARAM":
            case "SCRIPT":
            case "SOURCE":
            case "STYLE":
            case "TRACK":
            case "WBR":
                return !1
        }
        return !0
    };
    e.removeNode = De;
    e.contains = Ee;
    e.U = Fe;
    e.getTextContent = function(a) {
        if (se && null !== a && "innerText" in a) a = a.innerText.replace(/(\r\n|\r|\n)/g, "\n");
        else {
            var b = [];
            Ie(a, b, !0);
            a = b.join("")
        }
        a = a.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
        a = a.replace(/\u200B/g, "");
        se || (a = a.replace(/ +/g, " "));
        " " != a && (a = a.replace(/^\s*/, ""));
        return a
    };
    Xb("A AREA BUTTON HEAD INPUT LINK MENU META OPTGROUP OPTION PROGRESS STYLE SELECT SOURCE TEXTAREA TITLE TRACK".split(" "));

    function Le(a, b, c) {
        wa(c) && (c = c.join(" "));
        var d = Me(b);
        "" === c || void 0 == c ? (pe || (pe = {
            atomic: !1,
            autocomplete: "none",
            dropeffect: "none",
            haspopup: !1,
            live: "off",
            multiline: !1,
            multiselectable: !1,
            orientation: "vertical",
            readonly: !1,
            relevant: "additions text",
            required: !1,
            sort: "none",
            busy: !1,
            disabled: !1,
            hidden: !1,
            invalid: "false"
        }), c = pe, b in c ? a.setAttribute(d, c[b]) : a.removeAttribute(d)) : a.setAttribute(d, c)
    }

    function Me(a) {
        w(a, "ARIA attribute cannot be empty.");
        a: {
            for (b in qe)
                if (qe[b] == a) {
                    var b = !0;
                    break a
                } b = !1
        }
        w(b, "No such ARIA attribute " + a);
        return "aria-" + a
    };

    function Wd(a, b, c, d) {
        this.left = a;
        this.top = b;
        this.width = c;
        this.height = d
    }
    e = Wd.prototype;
    e.clone = function() {
        return new Wd(this.left, this.top, this.width, this.height)
    };
    e.contains = function(a) {
        return a instanceof G ? a.x >= this.left && a.x <= this.left + this.width && a.y >= this.top && a.y <= this.top + this.height : this.left <= a.left && this.left + this.width >= a.left + a.width && this.top <= a.top && this.top + this.height >= a.top + a.height
    };
    e.ceil = function() {
        this.left = Math.ceil(this.left);
        this.top = Math.ceil(this.top);
        this.width = Math.ceil(this.width);
        this.height = Math.ceil(this.height);
        return this
    };
    e.floor = function() {
        this.left = Math.floor(this.left);
        this.top = Math.floor(this.top);
        this.width = Math.floor(this.width);
        this.height = Math.floor(this.height);
        return this
    };
    e.round = function() {
        this.left = Math.round(this.left);
        this.top = Math.round(this.top);
        this.width = Math.round(this.width);
        this.height = Math.round(this.height);
        return this
    };
    e.translate = function(a, b) {
        a instanceof G ? (this.left += a.x, this.top += a.y) : (this.left += Oa(a), t(b) && (this.top += b));
        return this
    };
    e.scale = function(a, b) {
        b = t(b) ? b : a;
        this.left *= a;
        this.width *= a;
        this.top *= b;
        this.height *= b;
        return this
    };

    function Ne(a, b, c) {
        if (r(b))(b = Oe(a, b)) && (a.style[b] = c);
        else
            for (var d in b) {
                c = a;
                var f = b[d],
                    g = Oe(c, d);
                g && (c.style[g] = f)
            }
    }
    var Pe = {};

    function Oe(a, b) {
        var c = Pe[b];
        if (!c) {
            var d = Ib(b);
            c = d;
            void 0 === a.style[d] && (d = (hc ? "Webkit" : gc ? "Moz" : A ? "ms" : dc ? "O" : null) + Jb(d), void 0 !== a.style[d] && (c = d));
            Pe[b] = c
        }
        return c
    }

    function Qe(a, b) {
        var c = Be(a);
        return c.defaultView && c.defaultView.getComputedStyle && (a = c.defaultView.getComputedStyle(a, null)) ? a[b] || a.getPropertyValue(b) || "" : ""
    }

    function Re(a) {
        return Qe(a, "direction") || (a.currentStyle ? a.currentStyle.direction : null) || a.style && a.style.direction
    }

    function Se(a) {
        return new G(a.offsetLeft, a.offsetTop)
    }

    function Te(a) {
        w(a);
        if (1 == a.nodeType) {
            a: {
                try {
                    var b = a.getBoundingClientRect()
                } catch (c) {
                    b = {
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0
                    };
                    break a
                }
                A && a.ownerDocument.body && (a = a.ownerDocument, b.left -= a.documentElement.clientLeft + a.body.clientLeft, b.top -= a.documentElement.clientTop + a.body.clientTop)
            }
            return new G(b.left, b.top)
        }
        b = a.changedTouches ? a.changedTouches[0] : a;
        return new G(b.clientX, b.clientY)
    }

    function Ue(a) {
        "number" == typeof a && (a = Math.round(a) + "px");
        return a
    }

    function Ve(a) {
        return new te(a.offsetWidth, a.offsetHeight)
    }

    function We(a, b, c, d) {
        if (/^\d+px?$/.test(b)) return parseInt(b, 10);
        var f = a.style[c],
            g = a.runtimeStyle[c];
        a.runtimeStyle[c] = a.currentStyle[c];
        a.style[c] = b;
        b = a.style[d];
        a.style[c] = f;
        a.runtimeStyle[c] = g;
        return +b
    }

    function Xe(a, b) {
        return (b = a.currentStyle ? a.currentStyle[b] : null) ? We(a, b, "left", "pixelLeft") : 0
    }
    var Ye = {
        thin: 2,
        medium: 4,
        thick: 6
    };

    function Ze(a, b) {
        if ("none" == (a.currentStyle ? a.currentStyle[b + "Style"] : null)) return 0;
        b = a.currentStyle ? a.currentStyle[b + "Width"] : null;
        return b in Ye ? Ye[b] : We(a, b, "left", "pixelLeft")
    };

    function $e(a) {
        if (a.classList) return a.classList;
        a = a.className;
        return r(a) && a.match(/\S+/g) || []
    }

    function af(a, b) {
        a.classList ? b = a.classList.contains(b) : (a = $e(a), b = 0 <= Sa(a, b));
        return b
    }

    function H(a, b) {
        a.classList ? a.classList.add(b) : af(a, b) || (a.className += 0 < a.className.length ? " " + b : b)
    }

    function J(a, b) {
        a.classList ? a.classList.remove(b) : af(a, b) && (a.className = Ua($e(a), function(a) {
            return a != b
        }).join(" "))
    };

    function bf(a, b) {
        this.kk = a;
        this.Od = b
    }
    bf.prototype.className = function() {
        return this.Od ? this.kk + "__" + this.Od : this.kk
    };

    function cf(a, b) {
        return a.className() + "_" + b
    }

    function df(a, b, c) {
        return cf(a, b) + "_" + c
    }

    function ef(a, b, c) {
        b = $e(b);
        var d = df(a, c, "");
        return Va(b, function(a) {
            return 0 == a.indexOf(d)
        })
    };
    var ff = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || setTimeout;

    function gf(a, b) {
        a.className.baseVal = b
    }

    function hf(a) {
        return r(a.className) ? $e(a) : (a = a.className.baseVal, r(a) && a.match(/\S+/g) || [])
    }

    function jf(a, b) {
        r(a.className) ? b = af(a, b) : (a = hf(a), b = 0 <= Sa(a, b));
        return b
    }

    function kf(a, b) {
        if (r(a.className)) H(a, b);
        else if (!jf(a, b)) {
            var c = a.className.baseVal;
            c += 0 < a.className.baseVal.length ? " " + b : b;
            gf(a, c)
        }
    }

    function lf(a, b) {
        r(a.className) ? J(a, b) : jf(a, b) && gf(a, Ua(hf(a), function(a) {
            return a != b
        }).join(" "))
    };

    function K(a) {
        yd.apply(this, arguments)
    }
    m(K, yd);

    function L(a, b) {
        var c = new F(a);
        E(a, c);
        if (b)
            if (wa(b))
                for (a = l(b), b = a.next(); !b.done; b = a.next()) b = b.value, b.Vd || (b.Vd = []), b.Vd.push(c);
            else b.Vd || (b.Vd = []), b.Vd.push(c);
        return c
    };

    function mf(a) {
        F.call(this, a);
        this.Pg = E(this, new F);
        this.Jk = E(this, new F)
    }
    m(mf, F);
    mf.prototype.addHandler = function(a, b, c) {
        F.prototype.addHandler.call(this, a, b, c);
        this.Pg.f()
    };
    mf.prototype.removeHandler = function(a, b, c) {
        F.prototype.removeHandler.call(this, a, b, c);
        this.Jk.f()
    };
    var nf = z("Firefox"),
        of = Zb() || z("iPod"),
        pf = z("iPad"),
        qf = z("Android") && !(Yb() || z("Firefox") || z("Opera") || z("Silk")),
        rf = Yb(),
        sf = z("Safari") && !(Yb() || z("Coast") || z("Opera") || z("Edge") || z("Silk") || z("Android")) && !$b();
    var tf;

    function uf(a) {
        a instanceof Wc && (a = a.Oa);
        w(a);
        tf || (tf = new WeakMap);
        return tf.has(a)
    }

    function vf(a) {
        a instanceof Wc && (a = a.Oa);
        w(a);
        return a.defaultPrevented ? !0 : uf(a)
    };

    function wf(a, b) {
        vd.call(this);
        this.eg = a || 1;
        this.ji = b || n;
        this.Zo = Fa(this.Ms, this);
        this.hp = Ga()
    }
    v(wf, vd);
    e = wf.prototype;
    e.enabled = !1;
    e.Mc = null;
    e.setInterval = function(a) {
        this.eg = a;
        this.Mc && this.enabled ? (this.stop(), this.start()) : this.Mc && this.stop()
    };
    e.Ms = function() {
        if (this.enabled) {
            var a = Ga() - this.hp;
            0 < a && a < .8 * this.eg ? this.Mc = this.ji.setTimeout(this.Zo, this.eg - a) : (this.Mc && (this.ji.clearTimeout(this.Mc), this.Mc = null), this.dispatchEvent("tick"), this.enabled && (this.stop(), this.start()))
        }
    };
    e.start = function() {
        this.enabled = !0;
        this.Mc || (this.Mc = this.ji.setTimeout(this.Zo, this.eg), this.hp = Ga())
    };
    e.stop = function() {
        this.enabled = !1;
        this.Mc && (this.ji.clearTimeout(this.Mc), this.Mc = null)
    };
    e.cc = function() {
        wf.V.cc.call(this);
        this.stop();
        delete this.ji
    };

    function xf(a, b) {
        if (!ya(a))
            if (a && "function" == typeof a.handleEvent) a = Fa(a.handleEvent, a);
            else throw Error("Invalid listener argument");
        return 2147483647 < Number(b) ? -1 : n.setTimeout(a, b || 0)
    };
    var yf = null,
        zf = null,
        Af = gc || hc && !sf || dc || "function" == typeof n.btoa;

    function Bf(a) {
        var b = [];
        Cf(a, function(a) {
            b.push(a)
        });
        return b
    }

    function Cf(a, b) {
        function c(b) {
            for (; d < a.length;) {
                var c = a.charAt(d++),
                    f = zf[c];
                if (null != f) return f;
                if (!/^[\s\xa0]*$/.test(c)) throw Error("Unknown base64 encoding at char: " + c);
            }
            return b
        }
        Df();
        for (var d = 0;;) {
            var f = c(-1),
                g = c(0),
                h = c(64),
                k = c(64);
            if (64 === k && -1 === f) break;
            b(f << 2 | g >> 4);
            64 != h && (b(g << 4 & 240 | h >> 2), 64 != k && b(h << 6 & 192 | k))
        }
    }

    function Df() {
        if (!yf) {
            yf = {};
            zf = {};
            for (var a = 0; 65 > a; a++) yf[a] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(a), zf[yf[a]] = a, 62 <= a && (zf["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.".charAt(a)] = a)
        }
    };

    function Ef(a, b) {
        this.Er = a;
        this.Qp = b || []
    }
    Ha("iSpring.ios.mobile.MobileAppCommand", Ef);
    Ef.prototype.id = function() {
        return Aa(this)
    };

    function Ff(a) {
        try {
            var b = document.createElement("iframe");
            Ne(b, {
                width: "1px",
                height: "1px",
                border: "0"
            });
            b.src = a;
            ze(document.body, b);
            xf(function() {
                De(b)
            }, 100)
        } catch (c) {}
    };

    function Gf(a) {
        this.length = a.length || a;
        for (var b = 0; b < this.length; b++) this[b] = a[b] || 0
    }
    Gf.prototype.BYTES_PER_ELEMENT = 4;
    Gf.prototype.set = function(a, b) {
        b = b || 0;
        for (var c = 0; c < a.length && b + c < this.length; c++) this[b + c] = a[c]
    };
    Gf.prototype.toString = Array.prototype.join;
    "undefined" == typeof Float32Array && (Gf.BYTES_PER_ELEMENT = 4, Gf.prototype.BYTES_PER_ELEMENT = Gf.prototype.BYTES_PER_ELEMENT, Gf.prototype.set = Gf.prototype.set, Gf.prototype.toString = Gf.prototype.toString, Ha("Float32Array", Gf));

    function Hf(a) {
        this.length = a.length || a;
        for (var b = 0; b < this.length; b++) this[b] = a[b] || 0
    }
    Hf.prototype.BYTES_PER_ELEMENT = 8;
    Hf.prototype.set = function(a, b) {
        b = b || 0;
        for (var c = 0; c < a.length && b + c < this.length; c++) this[b + c] = a[c]
    };
    Hf.prototype.toString = Array.prototype.join;
    if ("undefined" == typeof Float64Array) {
        try {
            Hf.BYTES_PER_ELEMENT = 8
        } catch (a) {}
        Hf.prototype.BYTES_PER_ELEMENT = Hf.prototype.BYTES_PER_ELEMENT;
        Hf.prototype.set = Hf.prototype.set;
        Hf.prototype.toString = Hf.prototype.toString;
        Ha("Float64Array", Hf)
    };

    function If(a, b) {
        a: {
            var c = ["transformOrigin", "webkitTransformOrigin", "msTransformOrigin", "MozTransformOrigin", "OTransformOrigin"];
            for (var d = 0; d < c.length; ++d)
                if (p(a.style[c[d]])) {
                    c = c[d];
                    break a
                } throw Error("browser doesn't support css style " + c[0]);
        }
        Ne(a, c, b)
    };

    function Jf(a, b, c, d) {
        c = c || 0;
        var f = Array.prototype.slice.call(arguments, 3);
        setTimeout(function() {
            a.apply(b || null, f)
        }, c)
    }

    function Kf() {
        if (Lf) return new te(document.documentElement.clientWidth, document.documentElement.clientHeight);
        if (M && A) return new te(screen.width, screen.height);
        var a = p(window.devicePixelRatio) ? window.devicePixelRatio : 1;
        return Mf ? new te(screen.width / a, screen.height / a) : M ? Nf && (a = Math.max(screen.width, screen.height), document.documentElement.clientWidth > a) ? new te(Math.max(document.documentElement.clientWidth, a), Math.max(document.documentElement.clientHeight, Math.min(screen.width, screen.height))) : new te(screen.width,
            screen.height) : new te(screen.width * a, screen.height * a)
    }

    function Of(a) {
        var b = window.location.search.substr(1);
        if (!b) return {};
        var c = {};
        b = b.split("&");
        for (var d = 0; d < b.length; ++d) {
            var f = b[d].split("=");
            if (2 == f.length) {
                try {
                    var g = decodeURIComponent(f[0].replace(/\+/g, " "))
                } catch (k) {
                    g = f[0]
                }
                try {
                    var h = decodeURIComponent(f[1].replace(/\+/g, " "))
                } catch (k) {
                    h = f[1]
                }
                a || (g = g.toLowerCase());
                c[g] = h
            }
        }
        return c
    }

    function je(a) {
        if (!a) return !1;
        for (; a;) {
            if ("A" == a.nodeName.toLocaleUpperCase()) return !0;
            a = a.parentNode
        }
        return !1
    }

    function ke(a) {
        return a && "VIDEO" == a.nodeName && a.controls
    };
    (function() {
        function a(a) {
            try {
                return a.ISPlayer && (window.ISPlayer = a.ISPlayer), a.ISPVideoPlayer && (window.ISPVideoPlayer = a.ISPVideoPlayer), a.ISPQuizPlayer && (window.ISPQuizPlayer = a.ISPQuizPlayer), a.ISPInteractionPlayerCore && (window.ISPInteractionPlayerCore = a.ISPInteractionPlayerCore), a.ISPBookPlayer && (window.ISPBookPlayer = a.ISPBookPlayer), a.ISPScenarioPlayer && (window.ISPScenarioPlayer = a.ISPScenarioPlayer), a.ISPFlipPlayer && (window.ISPFlipPlayer = a.ISPFlipPlayer), !0
            } catch (f) {
                return !1
            }
        }
        if (function() {
                try {
                    var a =
                        window.frameElement
                } catch (f) {}
                return null != a
            }())
            for (var b = window, c = 7; b && b.parent != b && 0 != c-- && !a(b.parent);) b = b.parent
    })();
    var Pf, Qf = Of(void 0).user_agent;
    Pf = Qf ? Qf : Kb || "";
    var Nf = pf || of ,
        Lf = "1" == Of(void 0).small_screen,
        Rf = "1" == Of(void 0).tablet_screen,
        Sf, Tf;
    try {
        Tf = window.top.location.href ? window.frameElement : null
    } catch (a) {}
    var Vf = (Sf = null != Tf) && window.frameElement && window.frameElement.parentNode && "FRAMESET" == window.frameElement.parentNode.tagName ? !0 : !1,
        Wf = of && Sf;

    function Xf() {
        var a = Pf.toLowerCase();
        return -1 != a.indexOf("android") || -1 != a.indexOf("mobile") || -1 != a.indexOf("wpdesktop") || Lf || Rf
    }
    var Yf = -1 != Pf.toLowerCase().indexOf("chrome"),
        Zf = -1 == Pf.toLowerCase().indexOf("windows phone") && -1 != Pf.toLowerCase().indexOf("android"),
        M = Xf(),
        $f = M && (Xf() ? "ontouchstart" in window || p(window.DocumentTouch) && document instanceof window.DocumentTouch || -1 != Pf.toLowerCase().indexOf("touch") : !1),
        ag = "";
    if (Nf) {
        var bg = /CPU.+OS\s(\d+)_(\d+)/.exec(Pf);
        ag = bg ? bg[1] + "." + bg[2] : ""
    }
    var cg = parseInt(ag, 10),
        dg = Nf && 12 <= cg,
        eg = A && "9." == rc.substr(0, 2),
        oe = fg && A,
        Mf = Zf && !Yf && !nf && !dc,
        gg = -1 != Pf.toLowerCase().indexOf("micromessenger"),
        hg = -1 != Pf.indexOf("ismobile"),
        ig;
    if (ig = !window._ispringFullsizeSkin) {
        var jg;
        if (!(jg = Lf))
            if (window._ispringFullsizeSkin) jg = !1;
            else {
                var kg = Kf();
                jg = ( of || 700 > Math.min(kg.width, kg.height)) && !Rf
            } ig = jg
    }
    var fg = ig,
        lg = p(window.ISPlayer),
        mg = document.createElement("audio"),
        ng = mg.play && mg.play();
    ng && ng.then(function() {
        mg.pause()
    }, function() {});
    Of(void 0);
    Of(void 0);

    function og() {
        return 1 == window._ispringDebug || "1" == Of(void 0).isdebug
    }
    if (z("Windows")) {
        var pg = Kb,
            qg;
        if (z("Windows")) {
            qg = /Windows (?:NT|Phone) ([0-9.]+)/;
            var rg = qg.exec(pg)
        } else $b() ? (qg = /(?:iPhone|iPod|iPad|CPU)\s+OS\s+(\S+)/, (rg = qg.exec(pg)) && rg[1].replace(/_/g, ".")) : z("Macintosh") ? (qg = /Mac OS X ([0-9_.]+)/, (rg = qg.exec(pg)) && rg[1].replace(/_/g, ".")) : z("Android") ? (qg = /Android\s+([^\);]+)(\)|;)/, rg = qg.exec(pg)) : z("CrOS") && (qg = /(?:CrOS\s+(?:i686|x86_64)\s+([0-9.]+))/, rg = qg.exec(pg))
    }
    setTimeout(function() {
        sg = og
    }, 0);

    function tg(a, b, c, d, f, g) {
        if (6 == arguments.length) this.setTransform(a, b, c, d, f, g);
        else {
            if (0 != arguments.length) throw Error("Insufficient matrix parameters");
            this.dc = this.gc = 1;
            this.fc = this.ec = this.rc = this.sc = 0
        }
    }
    e = tg.prototype;
    e.clone = function() {
        return new tg(this.dc, this.fc, this.ec, this.gc, this.rc, this.sc)
    };
    e.setTransform = function(a, b, c, d, f, g) {
        if (!(t(a) && t(b) && t(c) && t(d) && t(f) && t(g))) throw Error("Invalid transform parameters");
        this.dc = a;
        this.fc = b;
        this.ec = c;
        this.gc = d;
        this.rc = f;
        this.sc = g;
        return this
    };
    e.scale = function(a, b) {
        this.dc *= a;
        this.fc *= a;
        this.ec *= b;
        this.gc *= b;
        return this
    };
    e.translate = function(a, b) {
        this.rc += a * this.dc + b * this.ec;
        this.sc += a * this.fc + b * this.gc;
        return this
    };
    e.rotate = function(a, b, c) {
        var d = new tg,
            f = Math.cos(a);
        a = Math.sin(a);
        b = d.setTransform(f, a, -a, f, b - b * f + c * a, c - b * a - c * f);
        c = this.dc;
        d = this.ec;
        this.dc = b.dc * c + b.fc * d;
        this.ec = b.ec * c + b.gc * d;
        this.rc += b.rc * c + b.sc * d;
        c = this.fc;
        d = this.gc;
        this.fc = b.dc * c + b.fc * d;
        this.gc = b.ec * c + b.gc * d;
        this.sc += b.rc * c + b.sc * d;
        return this
    };
    e.toString = function() {
        return "matrix(" + [this.dc, this.fc, this.ec, this.gc, this.rc, this.sc].join() + ")"
    };
    e.transform = function(a, b, c, d, f) {
        var g = b;
        for (b += 2 * f; g < b;) {
            f = a[g++];
            var h = a[g++];
            c[d++] = f * this.dc + h * this.ec + this.rc;
            c[d++] = f * this.fc + h * this.gc + this.sc
        }
    };

    function ug(a, b, c) {
        c = c || b;
        b = (new tg).setTransform(b, 0, 0, c, 0, 0);
        if (vg) c = vg;
        else {
            c = null;
            for (var d = we("DIV"), f = [
                        ["transform", wg, {
                            transform: "transform",
                            transformOrigin: "transformOrigin"
                        }],
                        ["webkitTransform", wg, {
                            transform: "webkitTransform",
                            transformOrigin: "webkitTransformOrigin"
                        }],
                        ["msTransform", wg, {
                            transform: "msTransform",
                            transformOrigin: "msTransformOrigin"
                        }],
                        ["MozTransform", xg, {
                            transform: "MozTransform",
                            transformOrigin: "MozTransformOrigin"
                        }],
                        ["OTransform", wg, {
                            transform: "OTransform",
                            transformOrigin: "OTransformOrigin"
                        }]
                    ],
                    g = 0; g < f.length; ++g)
                if (p(d.style[f[g][0]])) {
                    c = new f[g][1](f[g][2]);
                    break
                } if (!c) throw Error("browser doesn't support css matrix transformation");
            vg = c
        }
        a.style[c.Zn.transform] = 1 == b.dc && 0 == b.fc && 0 == b.ec && 1 == b.gc && 0 == b.rc && 0 == b.sc ? "" : "matrix(" + c.Gl(b).join(",") + ")"
    }

    function yg(a) {
        return Math.floor(1E6 * a) / 1E6
    }
    var vg = null;

    function wg(a) {
        this.Zn = a
    }
    wg.prototype.Gl = function(a) {
        return [yg(a.dc), yg(a.fc), yg(a.ec), yg(a.gc), yg(a.rc), yg(a.sc)]
    };

    function xg(a) {
        this.Zn = a
    }
    v(xg, wg);
    xg.prototype.Gl = function(a) {
        a = xg.V.Gl.call(this, a);
        a[4] += "px";
        a[5] += "px";
        return a
    };
    var zg, Ag = [];
    if (window.MutationObserver) {
        zg = new MutationObserver(function(a) {
            a && a.forEach(function(a) {
                w(a);
                a = l(a.removedNodes);
                for (var b = a.next(); !b.done; b = a.next()) {
                    b = b.value;
                    for (var d = l(Ag), f = d.next(); !f.done; f = d.next()) f = f.value, ya(b.contains) && b.contains(f.displayObject()) && f.Cc()
                }
            })
        });
        var Bg = {
            subtree: !0,
            childList: !0
        };
        ff(function() {
            zg.observe(document.body, Bg)
        })
    }

    function N(a) {
        var b = a || {};
        a = b.J;
        var c = b.S,
            d = b.ap,
            f = b.Yo,
            g = b.Xf,
            h = b.op,
            k = b.Vo,
            u = b.Tt,
            q = b.Id,
            y = b.rp,
            I = b.tabIndex;
        b = b.Pr;
        K.call(this);
        var O = this;
        f || (f = we(g || "DIV"));
        this.g = f;
        this.Bi = [];
        if (a || c) a = a || new bf(w(c), d), Cg(this, a);
        this.kh = p(h) ? h : !0;
        this.Ef = this.zc = this.Gc = this.ge = this.fe = this.jf = void 0;
        this.fh = 1;
        this.Fo = {};
        this.Pl = null;
        q && (this.Je = Dg(this));
        (this.wl = y) && this.gi(!1);
        p(I) && this.xp(I);
        this.C = E(this, new mf(this));
        Eg(this, this.C);
        u && D(this, this.C, ua);
        b && Fg(this);
        this.Ie = L(this);
        if (!1 === k) {
            var Q = !1;
            C(this, this.displayObject(), "mousedown", function() {
                Q = !0
            });
            C(this, this.displayObject(), "focusout", function(a) {
                a.target == a.currentTarget && (Q = !1)
            });
            C(this, this.displayObject(), "focusin", function(a) {
                Q && a.target == a.currentTarget && ff(function() {
                    O.displayObject().blur()
                })
            })
        }
    }
    m(N, K);
    e = N.prototype;
    e.focus = function() {
        this.g.focus()
    };
    e.getAttribute = function(a) {
        return this.g.getAttribute(a)
    };
    e.setAttribute = function(a, b) {
        this.g.setAttribute(a, b)
    };
    e.removeAttribute = function(a) {
        this.g.removeAttribute(a)
    };
    e.xp = function(a) {
        this.jf = a;
        this.sh(a)
    };
    e.ha = function(a) {
        this.fe = a;
        this.g.style.left = a + "px"
    };
    e.Kc = function(a) {
        this.ge = a;
        this.g.style.top = a + "px"
    };
    e.move = function(a, b) {
        this.ha(a);
        this.Kc(b)
    };
    e.Z = function(a) {
        this.resize(a)
    };
    e.pa = function(a) {
        this.resize(void 0, a)
    };
    e.resize = function(a, b) {
        this.rl(a, b);
        p(a) && (this.Gc = a);
        p(b) && (this.zc = b);
        this.ga(this.width(), this.height());
        this.Ie.f(this)
    };
    e.Pa = function(a) {
        p(this.jf) && this.sh(a ? this.jf : -1);
        a ? this.g.removeAttribute("disabled") : this.g.setAttribute("disabled", "")
    };
    e.yp = function(a) {
        this.Pl = null;
        this.g.style.display = a ? "" : "none"
    };
    e.ed = function(a) {
        this.ua("opacity", a);
        this.Ef = a
    };
    e.c = function(a) {
        a = this.Db(a);
        ze(this.g, a)
    };

    function Gg(a, b) {
        E(a, b, void 0);
        a.c(b)
    }
    e.uj = function(a, b) {
        a = this.Db(a);
        this.g == a.parentNode && this.g.childNodes[b] == a || Ce(this.g, a, b)
    };
    e.removeChild = function(a) {
        a = this.Db(a);
        this.om(a) && this.g.removeChild(a)
    };
    e.U = function(a) {
        Fe(this.g, a)
    };
    e.ci = function(a) {
        this.g.innerHTML = a
    };
    e.ua = function(a, b) {
        Ne(this.g, a, b)
    };
    e.tp = function(a) {
        this.bi("label", a)
    };
    e.bi = function(a, b) {
        Le(this.g, a, b)
    };

    function Hg(a, b) {
        a = a.g.getAttribute(Me(b));
        return null == a || void 0 == a ? "" : String(a)
    }

    function Ig(a, b) {
        b instanceof bf || (b = new bf(b, void 0));
        Cg(a, b)
    }
    e.Y = function(a, b) {
        var c = this;
        if (this.Bi.length)
            for (var d = {}, f = l(this.Bi), g = f.next(); !g.done; d = {
                    si: d.si,
                    ri: d.ri,
                    dk: d.dk
                }, g = f.next()) g = g.value, r(b) ? (d.si = ef(g, this.g, a), d.si && (delete this.Fo[a], function(a) {
                return function() {
                    lf(c.g, w(a.si))
                }
            }(d)()), b && (d.ri = df(g, a, b), this.Fo[a] = d.ri, function(a) {
                return function() {
                    kf(c.g, a.ri)
                }
            }(d)())) : (d.dk = cf(g, a), function(a) {
                return function() {
                    var d = c.g,
                        f = a.dk;
                    b ? H(d, f) : J(d, f)
                }
            }(d)());
        else(function() {
            var d = c.g;
            b ? H(d, a) : J(d, a)
        })(), Na("component has no bemInfo")
    };
    e.gi = function(a) {
        w(this.wl);
        this.bi("selected", a)
    };
    e.selected = function() {
        w(this.wl);
        return "true" == Hg(this, "selected")
    };

    function R(a, b) {
        a = w(a.Bi[0]);
        w(!a.Od);
        return new bf(a.kk, b)
    }

    function Jg(a) {
        a.ga(a.width(), a.height());
        a.Ie.f()
    }
    e.om = function(a) {
        return this.Db(a).parentNode == this.displayObject()
    };
    e.x = function() {
        return p(this.fe) ? this.fe : Se(this.displayObject()).x
    };
    e.y = function() {
        return p(this.ge) ? this.ge : Se(this.displayObject()).y
    };
    e.width = function() {
        return p(this.Gc) ? this.Gc : this.Ak()
    };
    e.height = function() {
        return p(this.zc) ? this.zc : this.zk()
    };
    e.enabled = function() {
        return !this.g.hasAttribute("disabled")
    };
    e.visible = function() {
        return "boolean" == typeof this.Pl ? this.Pl : "none" != this.displayObject().style.display
    };
    e.opacity = function() {
        if (p(this.Ef)) return this.Ef;
        var a = this.g;
        w(a);
        var b = a.style;
        a = "";
        "opacity" in b ? a = b.opacity : "MozOpacity" in b ? a = b.MozOpacity : "filter" in b && (b = b.filter.match(/alpha\(opacity=([\d.]+)\)/)) && (a = String(b[1] / 100));
        a = "" == a ? a : Number(a);
        return t(a) ? a : 1
    };
    e.displayObject = function() {
        return this.g
    };
    e.Xj = function(a) {
        this.g.scrollTop = a
    };
    e.G = function(a) {
        var b = void 0 === b ? "0 0" : b;
        ug(this.g, a, a);
        If(this.g, w(b))
    };
    e.Fm = function(a) {
        this.fh = a
    };
    e.contains = function(a) {
        if (!a) return !1;
        a = this.Db(a);
        return Ee(this.g, a)
    };
    e.Ci = function(a) {
        (a instanceof Node || ya(a.displayObject)) && this.removeChild(a);
        K.prototype.Ci.call(this, a)
    };
    e.Db = function(a) {
        return a instanceof Node ? a : a.displayObject()
    };
    e.Ak = function() {
        var a = this.g;
        return a.tagName.toUpperCase() == "SVG".toString() ? a.width.baseVal.value : Ve(a).width
    };
    e.zk = function() {
        var a = this.g;
        return a.tagName.toUpperCase() == "SVG".toString() ? a.height.baseVal.value : Ve(a).height
    };
    e.rl = function(a, b) {
        p(a) && (this.g.style.width = Ue(a));
        p(b) && (this.g.style.height = Ue(b))
    };
    e.ga = function() {};

    function Dg(a) {
        var b = new ResizeObserver(function(b) {
            b = l(b);
            for (var c = b.next(); !c.done; c = b.next()) c = c.value, p(c.target) && 0 < c.contentRect.width && 0 < c.contentRect.height && (a.ga(a.g.clientWidth, a.g.clientHeight), a.Ie.f(a))
        });
        b.observe(a.g);
        return b
    }

    function Eg(a, b) {
        var c = E(a, new ee(a.g));
        D(a, b.Pg, function() {
            1 == Nd(b) && fe(c);
            C(a, a.g, "mouseover", function() {
                a.enabled() && 0 < Nd(a.C) && a.ug()
            });
            C(a, a.g, "mouseout", function() {
                a.Cc()
            })
        });
        D(a, b.Jk, function() {
            0 == Nd(b) && ge(c)
        });
        var d = new ne;
        D(a, d.qj, function(b, c, d) {
            a.Cc();
            a.enabled() && a.mf(d);
            a.kh && d.target == a.g && d.preventDefault()
        });
        D(a, d.zl, function() {
            a.Cc()
        });
        D(a, d.Al, function() {
            a.enabled() && a.ug()
        });
        me(c, d)
    }
    e.mf = function(a) {
        this.C.f(this, a)
    };

    function Cg(a, b) {
        a.Bi.push(b);
        kf(a.g, b.className())
    }
    e.ug = function() {
        this.Y("active", !0)
    };
    e.Cc = function() {
        this.Y("active", !1)
    };
    e.Om = function() {
        C(this, this.g, "keydown", this.fl, this)
    };
    e.fl = function(a) {
        document.activeElement != this.displayObject() || a.defaultPrevented || 13 != a.keyCode && 32 != a.keyCode || (a.preventDefault(), this.mf())
    };

    function Fg(a) {
        zg ? Ag.push(a) : A ? C(a, window, "DOMNodeRemoved", function(b) {
            Ee(b.target, a.g) && a.Cc()
        }) : C(a, a.g, "DOMNodeRemovedFromDocument", function() {
            a.Cc()
        })
    }
    e.sh = function(a) {
        this.setAttribute("tabindex", a + "")
    };
    e.kf = function() {
        this.Je && this.Je.disconnect();
        var a = Ag.indexOf(this);
        0 <= a && Ag.splice(a, 1)
    };

    function Kg(a) {
        za(a) && 1 == a.nodeType ? this.ra = this.g = a : (this.g = we("DIV", Lg("component_container", a)), this.ra = we("DIV", Lg("component_base", a)), ze(this.g, this.ra));
        this.fb = [];
        this.kh = !1;
        if ($f) {
            var b = new ee(this.displayObject());
            this.C = new mf;
            this.C.Pg.addHandler(function() {
                1 == Nd(this.C) && fe(b)
            }, this);
            this.C.Jk.addHandler(function() {
                0 == Nd(this.C) && ge(b)
            }, this);
            a = new ne;
            a.qj.addHandler(function(a, b, f) {
                this.Cc();
                this.kh && f.preventDefault();
                this.enabled() && this.mf(f)
            }, this);
            a.zl.addHandler(function() {
                    this.Cc()
                },
                this);
            a.Al.addHandler(function() {
                this.enabled() && this.ug()
            }, this);
            me(b, a)
        } else this.kh = !0, this.C = new mf, this.C.Pg.addHandler(function d() {
            Qa(this.C, mf);
            this.C.Pg.removeHandler(d, this);
            var a = B(this.displayObject(), "mouseover", function() {
                this.enabled() && 0 < Nd(this.C) && this.ug()
            }, !1, this);
            this.fb.push(a);
            a = B(this.displayObject(), "mouseout", function() {
                this.Cc()
            }, !1, this);
            this.fb.push(a);
            a = B(this.displayObject(), "click", function(a) {
                this.Cc();
                this.kh && 0 < Nd(this.C) && (a.preventDefault(), a.stopPropagation());
                this.mf(a)
            }, !1, this);
            this.fb.push(a)
        }, this);
        this.Ie = new F
    }
    e = Kg.prototype;
    e.Ef = 1;
    e.Op = !0;
    e.mf = function(a) {
        !this.Op && a && (this.displayObject().blur(), this.ra.blur());
        this.C.f(this, a)
    };
    e.setAttribute = function(a, b) {
        this.displayObject().setAttribute(a, b)
    };
    e.removeAttribute = function(a) {
        this.displayObject().removeAttribute(a)
    };
    e.xp = function(a) {
        this.jf = a;
        this.sh(a)
    };
    e.Id = function() {
        var a = this;
        this.zc = this.Gc = void 0;
        this.Je = new ResizeObserver(function(b) {
            b = l(b);
            for (var c = b.next(); !c.done; c = b.next()) c = c.value, p(c.target) && (c = c.contentRect, a.Gc = c.width, a.zc = c.height, a.ga(c.width, c.height), a.Ie.f(a))
        });
        this.Je.observe(this.g);
        this.ga(parseInt(this.g.style.width, 10), parseInt(this.g.style.height, 10));
        this.Ie.f(this)
    };
    e.ug = function() {
        this.Y("active", !0)
    };
    e.Cc = function() {
        this.Y("active", !1)
    };
    e.Yo = function() {
        return this.ra
    };
    Kg.prototype.baseElement = Kg.prototype.Yo;
    Kg.prototype.displayObject = function() {
        return this.g
    };
    Kg.prototype.displayObject = Kg.prototype.displayObject;
    e = Kg.prototype;
    e.width = function() {
        return p(this.Gc) ? this.Gc : this.Ak(this.ra)
    };
    e.Ak = function(a) {
        return "SVG" == a.tagName.toUpperCase() ? a.width.baseVal.value : Ve(a).width
    };
    e.Z = function(a) {
        this.resize(a)
    };
    e.height = function() {
        return p(this.zc) ? this.zc : this.zk(this.ra)
    };
    e.zk = function(a) {
        return "SVG" == a.tagName.toUpperCase() ? a.height.baseVal.value : Ve(a).height
    };
    e.pa = function(a) {
        this.resize(void 0, a)
    };
    e.resize = function(a, b) {
        if (p(this.Je)) throw Error("ResizeObserver is turned on");
        this.rl(a, b);
        p(a) && (this.Gc = a);
        p(b) && (this.zc = b);
        this.Ie.f(this)
    };
    e.rl = function(a, b) {
        p(a) && (this.displayObject().style.width = Ue(a), this.ra.style.width = Ue(a));
        p(b) && (this.displayObject().style.height = Ue(b), this.ra.style.height = Ue(b));
        p(a) && p(b) && this.ga(a, b)
    };
    e.ga = function() {};
    e.x = function() {
        return p(this.fe) ? this.fe : Se(this.displayObject()).x
    };
    e.ha = function(a) {
        this.fe = a;
        this.displayObject().style.left = a + "px"
    };
    e.y = function() {
        return p(this.ge) ? this.ge : Se(this.displayObject()).y
    };
    e.Kc = function(a) {
        this.ge = a;
        this.displayObject().style.top = a + "px"
    };
    e.move = function(a, b) {
        this.ha(a);
        this.Kc(b)
    };
    e.enabled = function() {
        return !this.ra.hasAttribute("disabled")
    };
    e.Pa = function(a) {
        p(this.jf) && this.sh(a ? this.jf : -1);
        a ? this.ra.removeAttribute("disabled") : this.ra.setAttribute("disabled", "")
    };
    e.visible = function() {
        return "none" != this.displayObject().style.display
    };
    e.yp = function(a) {
        this.displayObject().style.display = a ? "" : "none"
    };
    e.opacity = function() {
        return this.Ef
    };
    e.ed = function(a) {
        S(this, "opacity", a);
        this.Ef = a
    };
    e.c = function(a) {
        a = this.Db(a);
        ze(this.displayObject(), a)
    };
    e.uj = function(a, b) {
        a = this.Db(a);
        Ce(this.displayObject(), a, b)
    };
    e.removeChild = function(a) {
        a = this.Db(a);
        this.om(a) && this.displayObject().removeChild(a)
    };
    e.om = function(a) {
        return (a instanceof Kg ? a.displayObject() : a).parentNode == this.displayObject()
    };
    e.U = function(a) {
        Fe(this.ra, a)
    };
    e.ci = function(a) {
        this.ra.innerHTML = a
    };

    function S(a, b, c) {
        Ne(a.displayObject(), b, c)
    }
    e.tp = function(a) {
        this.bi("label", a)
    };
    e.bi = function(a, b) {
        Le(this.Jt ? this.ra : this.g, a, b)
    };

    function Lg(a, b) {
        return p(b) ? b instanceof Array ? (b = Ya(b), b.push(a), b) : [a, b] : a
    }
    e.Y = function(a, b) {
        a = this.Rp ? cf(this.Rp, a) : a;
        var c = this.g;
        b ? H(c, a) : J(c, a);
        this.g != this.ra && (c = this.ra, b ? H(c, a) : J(c, a))
    };
    e.H = function(a) {
        var b = this.displayObject();
        H(b, a)
    };
    e.T = function(a) {
        var b = this.displayObject();
        J(b, a)
    };
    e.Om = function() {
        B(this.displayObject(), "keydown", this.fl, !1, this)
    };
    e.fl = function(a) {
        document.activeElement != this.displayObject() || a.defaultPrevented || 13 != a.keyCode && 32 != a.keyCode || (a.preventDefault(), this.mf(null))
    };
    e.sh = function(a) {
        this.setAttribute("tabindex", a + "")
    };
    e.bg = function() {
        for (var a = 0; a < this.fb.length; ++a) {
            var b = this.fb[a];
            b && rd(b)
        }
        this.Je && this.Je.disconnect()
    };
    e.Db = function(a) {
        return a instanceof Kg || a instanceof N ? a.displayObject() : a
    };

    function T(a, b) {
        Kg.call(this, we(b || "DIV", a))
    }
    v(T, Kg);

    function Mg(a, b, c) {
        T.call(this, "page");
        this.va = a;
        this.Sa = b;
        this.Vf = this.Sa.scale / c;
        this.v = b;
        this.If = this.K = null;
        this.X = 0;
        this.fa = this.M = null;
        this.Bg = {
            top: 0,
            left: 0
        };
        this.Yi = 0;
        this.Za = new F;
        this.hf = new T("canvasWrapper", "DIV");
        this.c(this.hf);
        this.jc = this.pc = null;
        this.sn = 0;
        this.Xk = new T("loadingIcon", "DIV");
        this.c(this.Xk);
        this.Z(this.Sa.width);
        this.pa(this.Sa.height)
    }
    m(Mg, T);
    e = Mg.prototype;
    e.pageNumber = function() {
        return this.va
    };
    e.Bd = function() {
        return this.Sa
    };
    e.ad = function() {
        w(this.K);
        return this.K
    };
    e.Sh = function() {
        return null !== this.fa
    };
    e.ei = function(a) {
        this.fa = a;
        this.K = a.getViewport(1);
        w(this.K);
        a = this.Ua(this.Sa, this.K);
        this.v = this.K.clone({
            scale: a
        })
    };
    e.Z = function(a) {
        T.prototype.Z.call(this, Math.floor(a))
    };
    e.pa = function(a) {
        T.prototype.pa.call(this, Math.floor(a))
    };
    e.ua = function(a, b) {
        S(this, a, b)
    };
    e.G = function(a) {
        this.Sa = this.Sa.clone({
            scale: this.Vf * a
        });
        this.Z(this.Sa.width);
        this.pa(this.Sa.height);
        null !== this.K && (a = this.Ua(this.Sa, this.K), this.v = this.K.clone({
            scale: a
        }));
        null !== this.M && (Ng(this), Og(this))
    };
    e.$ = function(a, b) {
        this.Vf = a.scale / b;
        this.Sa = a;
        this.Z(this.Sa.width);
        this.pa(this.Sa.height);
        this.K && (a = this.Ua(this.Sa, this.K), this.v = this.K.clone({
            scale: a
        }), null !== this.M && (Ng(this), Og(this)))
    };
    e.render = function() {
        var a = this;
        if (0 !== this.X) throw Error("Page renderingState is wrong");
        this.X = 1;
        var b = Date.now();
        this.sn = b;
        var c = null !== this.M ? this.M : null,
            d = this.v,
            f = document.createElement("canvas"),
            g = w(f.getContext("2d")),
            h = Pg(g),
            k = h.Ep,
            u = h.Fp;
        h = h.Cs;
        this.If = this.v;
        if (0 < PDFJS.maxCanvasPixels) {
            var q = (Math.floor(d.width) * k | 0) * (Math.floor(d.height) * u | 0);
            q > PDFJS.maxCanvasPixels && (q = PDFJS.maxCanvasPixels / (k * u), this.If = d.clone({
                scale: Math.floor(Math.sqrt(1 / (d.width / d.height) * q)) / d.height * this.v.scale *
                    .9
            }))
        }
        q = Qg(k);
        var y = Qg(u);
        f.width = Rg(this.If.width * k, q[0]);
        f.height = Rg(this.If.height * u, y[0]);
        f.style.width = Rg(d.width, q[1]) + "px";
        f.style.height = Rg(d.height, y[1]) + "px";
        f.className = "content";
        f.setAttribute("hidden", "hidden");
        this.hf.c(f);
        this.M = f;
        Ng(this);
        this.fa.render({
            canvasContext: g,
            transform: h ? [k, 0, 0, u, 0, 0] : null,
            viewport: this.If
        }, function(d) {
            null !== d ? a.X = 0 : (a.M.removeAttribute("hidden"), null !== c && (c.width = 0, c.height = 0, a.hf.removeChild(c), c = null), b == a.sn && (a.Xk && a.removeChild(a.Xk), a.X = 3, a.Za.f(),
                Sg(a), Tg(a)))
        })
    };
    e.reset = function() {
        this.X = 0;
        this.pc && this.removeChild(this.pc);
        this.jc && this.removeChild(this.jc)
    };
    e.destroy = function() {
        this.reset();
        if (this.fa) {
            var a = this.fa;
            null !== a.Hf && a.Hf.cancel();
            this.fa.cleanup()
        }
        this.M && (this.M.width = 0, this.M.height = 0, this.hf.removeChild(this.M), this.M = null)
    };

    function Ug(a, b) {
        if (a.Yi != b) {
            var c = Math.floor((a.Sa.width - a.v.width) / 2);
            if (0 < c) {
                var d = 0 == a.Yi ? "left" : "right";
                a.M.style[d] = "";
                a.pc && S(a.pc, d, "");
                a.jc && S(a.jc, d, "");
                Vg(a, b, c)
            }
            a.Yi = b
        }
    }

    function Og(a) {
        var b = a.v.width / a.If.width;
        a.M.style.width = a.v.width + "px";
        a.M.style.height = a.v.height + "px";
        a.pc && (Ne(a.pc.ra, "transform", "scale(" + b + ", " + b + ") "), Ne(a.pc.ra, "transformOrigin", "0% 0%"));
        a.jc && (Ne(a.jc.ra, "transform", "scale(" + b + ", " + b + ") "), Ne(a.jc.ra, "transformOrigin", "0% 0%"))
    }

    function Ng(a) {
        var b = Math.floor((a.Sa.height - a.v.height) / 2);
        0 < b && (a.Bg.top = b, a.M.style.top = b + "px", a.pc && S(a.pc, "top", b + "px"), a.jc && S(a.jc, "top", b + "px"));
        b = Math.floor((a.Sa.width - a.v.width) / 2);
        0 < b && (a.Bg.left = b, Vg(a, a.Yi, b))
    }

    function Vg(a, b, c) {
        b = 0 == b ? "left" : "right";
        a.M.style[b] = c + "px";
        a.pc && S(a.pc, b, c + "px");
        a.jc && S(a.jc, b, c + "px")
    }
    e.Ua = function(a, b) {
        return Math.min(a.height / b.height, a.width / b.width)
    };

    function Sg(a) {
        var b = new T("textLayer"),
            c = {
                viewport: a.v,
                container: b.displayObject(),
                timeout: x.Ks
            };
        a.fa.renderTextLayer(c, function() {
            0 < b.displayObject().childElementCount && (a.pc = b, a.c(b))
        })
    }

    function Tg(a) {
        var b = new T("annotationsLayer"),
            c = {
                viewport: a.v,
                container: b.displayObject()
            };
        Pd(a.fa, c, function() {
            0 < b.displayObject().childElementCount && (a.jc = b, a.c(b))
        })
    }

    function Pg(a) {
        a = (window.devicePixelRatio || 1) / (a.gu || a.Xt || a.Yt || a.Zt || a.Lt || 1);
        return {
            Ep: a,
            Fp: a,
            Cs: 1 !== a
        }
    }
    e.nm = function() {
        var a = this;
        return this.fa.getTextContent({}).then(function(b) {
            return Vd(b.items, b.styles, a.v)
        })
    };

    function Qg(a) {
        if (Math.floor(a) === a) return [a, 1];
        var b = 1 / a;
        if (8 < b) return [1, 8];
        if (Math.floor(b) === b) return [1, b];
        b = 1 < a ? b : a;
        for (var c = 0, d = 1, f = 1, g = 1;;) {
            var h = c + f,
                k = d + g;
            if (8 < k) break;
            b <= h / k ? (f = h, g = k) : (c = h, d = k)
        }
        return b - c / d < f / g - b ? b === a ? [c, d] : [d, c] : b === a ? [f, g] : [g, f]
    }

    function Rg(a, b) {
        var c = a % b;
        return 0 === c ? a : Math.round(a - c + b)
    };

    function Wg(a, b) {
        var c = new Image;
        c.src = a;
        this.Eb = c;
        this.Fr = b
    }
    Wg.prototype.render = function(a, b, c, d) {
        b = d || {
            top: 0,
            left: 0
        };
        c = .31 * a.width();
        d = c * this.Eb.height / this.Eb.width;
        for (var f = a.hf.displayObject(), g = 0; g < f.childElementCount; ++g) {
            var h = f.childNodes[g];
            if ("content" == h.className) {
                var k = w(h.getContext("2d")),
                    u = Pg(k),
                    q = u.Ep;
                k.drawImage(this.Eb, h.width - c * q, 0, c * q, d * u.Fp)
            }
        }
        a: {
            f = a.displayObject();
            for (g = 0; g < f.childElementCount; ++g)
                if ("ispring" == f.childNodes[g].className) {
                    f = f.childNodes[g];
                    break a
                } f = null
        }
        f || (f = document.createElement("a"), f.className = "ispring", f.href =
            this.Fr, f.target = "_blank", a.c(f));
        f.style.width = c + "px";
        f.style.height = d + "px";
        b.top && (f.style.top = b.top + "px");
        b.left && (f.style.right = b.left + "px")
    };

    function Xg(a, b, c) {
        this.zo = a;
        this.fn = b;
        this.ea = c
    }

    function Yg(a) {
        return a.fn - a.zo + 1
    }
    Xg.prototype.inRange = function(a) {
        return this.zo <= a && a <= this.fn
    };
    Xg.prototype.size = function() {
        return this.ea
    };
    Xg.prototype.getViewport = function() {
        var a = [0, 0, this.ea.width(), this.ea.height()];
        return new PDFJS.PageViewport(a, 1, 0, 0, 0, !1)
    };

    function U(a, b) {
        this.Gc = Math.floor(a);
        this.zc = Math.floor(b)
    }
    U.prototype.width = function() {
        return this.Gc
    };
    U.prototype.height = function() {
        return this.zc
    };
    U.prototype.isEqual = function(a) {
        return this.Gc == a.width() && this.zc == a.height()
    };

    function Zg(a) {
        this.Hb = [];
        this.bj(a);
        this.Zk = this.$k = -1
    }

    function $g(a, b) {
        for (var c = null, d = 0; d < a.Hb.length; ++d) a.Hb[d].inRange(b) && (c = a.Hb[d].getViewport());
        w(c);
        return c
    }

    function ah(a) {
        if (-1 == a.$k) {
            if (1 == a.Hb.length) var b = 0;
            else {
                b = Yg(a.Hb[0]);
                for (var c = 0, d = 1; d < a.Hb.length; ++d) Yg(a.Hb[d]) > b && (b = Yg(a.Hb[d]), c = d);
                b = c
            }
            a.$k = b
        }
        return a.Hb[a.$k].getViewport()
    }
    Zg.prototype.bj = function(a) {
        for (var b = 0; b < a.length; ++b) {
            var c = a[b];
            this.Hb.push(new Xg(c.range[0], c.range[1], new U(c.size[0], c.size[1])))
        }
    };
    var bh = function() {
        function a() {
            throw Error("stream error");
        }

        function b(a) {
            return "undefined" == typeof a
        }

        function c(b) {
            var c = 0,
                d = b[c++],
                f = b[c++];
            (-1 == d || -1 == f || 8 != (d & 15) || 0 != ((d << 8) + f) % 31 || f & 32) && a();
            this.am = b;
            this.Yf = c;
            this.Jh = this.Lh = this.Mh = 0;
            this.hm = !1;
            this.xj = null
        }
        var d = [],
            f = [],
            g = [],
            h, k;
        (function() {
            var a = [],
                b, c = 2;
            for (b = 0; 8 > b; ++b) a.push(c), c += 1 << (b >> 1);
            for (b = 0; 3 > b; ++b) d.push(b + 16);
            for (b = 0; 7 >= b; ++b) d.push((8 - b) % 8), d.push(8 + b);
            for (b = 1; 3 > b; ++b) f.push(b);
            for (b = 0; 28 > b; ++b) {
                var h = b >> 1 << 16;
                c = b % 8;
                h += (a[c] <<
                    (b - c) / 2) + 1;
                f.push(h)
            }
            for (b = 3; 7 > b; ++b) g.push(b);
            c = 7;
            for (b = 0; 24 > b; ++b) a = b >> 2, h = (a << 16) + c, c += 1 << a, g.push(h);
            for (b = 0; 3 > b; ++b) g.push(258)
        })();
        c.prototype.gm = function(a) {
            var b = this.xj,
                c = b ? b.length : 0;
            if (a < c) return b;
            for (var d = 1024; d < a;) d <<= 1;
            a = Array(d);
            for (d = 0; d < c; ++d) a[d] = b[d];
            return this.xj = a
        };
        c.prototype.ds = function() {
            for (; !this.hm;) this.ws();
            return this.xj.slice(0, this.Jh)
        };
        c.prototype.je = function(c) {
            for (var d = this.Mh, f = this.Lh, g = this.am, h = this.Yf, k; d < c;) b(k = g[h++]) && a(), f |= k << d, d += 8;
            this.Lh = f >> c;
            this.Mh =
                d - c;
            this.Yf = h;
            return f & (1 << c) - 1
        };
        c.prototype.lm = function(c) {
            var d = c[0],
                f = c[1];
            c = this.Mh;
            for (var g = this.Lh, h = this.am, k = this.Yf; c < f;) {
                var u;
                b(u = h[k++]) && a();
                g |= u << c;
                c += 8
            }
            f = d[g & (1 << f) - 1];
            d = f >> 16;
            f &= 65535;
            (0 == c || c < d || 0 == d) && a();
            this.Lh = g >> d;
            this.Mh = c - d;
            this.Yf = k;
            return f
        };
        c.prototype.Ph = function(a) {
            for (var b = a.length, c = 0, d = 0; d < b; ++d) a[d] > c && (c = a[d]);
            for (var f = 1 << c, g = Array(f), h = 1, k = 0, u = 2; h <= c; ++h, k <<= 1, u <<= 1)
                for (var Z = 0; Z < b; ++Z)
                    if (a[Z] == h) {
                        var Uf = 0,
                            Yi = k;
                        for (d = 0; d < h; ++d) Uf = Uf << 1 | Yi & 1, Yi >>= 1;
                        for (d = Uf; d <
                            f; d += u) g[d] = h << 16 | Z;
                        ++k
                    } return [g, c]
        };
        c.prototype.ws = function() {
            function c(a, b, c, d, f) {
                for (a = a.je(c) + d; 0 < a--;) b[P++] = f
            }
            var q = this.je(3);
            q & 1 && (this.hm = !0);
            q >>= 1;
            if (0 == q) {
                var y = this.am,
                    I = this.Yf,
                    O;
                b(O = y[I++]) && a();
                var Q = O;
                b(O = y[I++]) && a();
                Q |= O << 8;
                b(O = y[I++]) && a();
                q = O;
                b(O = y[I++]) && a();
                (q | O << 8) != (~Q & 65535) && a();
                this.Mh = this.Lh = 0;
                O = this.Jh;
                q = this.gm(O + Q);
                this.Jh = Q = O + Q;
                for (var V = O; V < Q; ++V) {
                    if (b(O = y[I++])) {
                        this.hm = !0;
                        break
                    }
                    q[V] = O
                }
                this.Yf = I
            } else {
                if (1 == q) {
                    if (!h) {
                        y = Array(288);
                        for (var P = 0; 143 >= P; ++P) y[P] = 8;
                        for (; 255 >=
                            P; ++P) y[P] = 9;
                        for (; 279 >= P; ++P) y[P] = 7;
                        for (; 287 >= P; ++P) y[P] = 8;
                        h = this.Ph(y);
                        q = Array(31);
                        for (P = 0; 32 > P; ++P) q[P] = 5;
                        k = this.Ph(q);
                        k[0][15] = 0;
                        k[0][31] = 0
                    }
                    I = h;
                    O = k
                } else if (2 == q) {
                    q = this.je(5) + 257;
                    O = this.je(5) + 1;
                    I = this.je(4) + 4;
                    y = Array(d.length);
                    for (P = 0; P < I;) y[d[P++]] = this.je(3);
                    I = this.Ph(y);
                    P = y = 0;
                    O = q + O;
                    for (Q = Array(O); P < O;) V = this.lm(I), 16 == V ? c(this, Q, 2, 3, y) : 17 == V ? c(this, Q, 3, 3, y = 0) : 18 == V ? c(this, Q, 7, 11, y = 0) : Q[P++] = y = V;
                    I = this.Ph(Q.slice(0, q));
                    O = this.Ph(Q.slice(q, O))
                } else a();
                Q = (q = this.xj) ? q.length : 0;
                for (V = this.Jh;;) {
                    var ea =
                        this.lm(I);
                    if (256 > ea) V + 1 >= Q && (q = this.gm(V + 1), Q = q.length), q[V++] = ea;
                    else {
                        if (256 == ea) {
                            this.Jh = V;
                            break
                        }
                        ea -= 257;
                        ea = g[ea];
                        var Z = ea >> 16;
                        0 < Z && (Z = this.je(Z));
                        y = (ea & 65535) + Z;
                        ea = this.lm(O);
                        ea = f[ea];
                        Z = ea >> 16;
                        0 < Z && (Z = this.je(Z));
                        ea = (ea & 65535) + Z;
                        V + y >= Q && (q = this.gm(V + y), Q = q.length);
                        for (Z = 0; Z < y; ++Z, ++V) q[V] = q[V - ea]
                    }
                }
            }
        };
        return c
    }();

    function ch(a, b) {
        a = Bf(a);
        a = (new bh(a)).ds();
        for (var c = [], d = 0, f, g, h, k = -1, u = a.length; d < u;)(f = a[d]) ? 128 > f ? (c[++k] = String.fromCharCode(f), ++d) : 191 < f && 224 > f ? (g = a[d + 1], c[++k] = String.fromCharCode((f & 31) << 6 | g & 63), d += 2) : (g = a[d + 1], h = a[d + 2], c[++k] = String.fromCharCode((f & 15) << 12 | (g & 63) << 6 | h & 63), d += 3) : ++d;
        b(c.join(""))
    };

    function dh(a) {
        var b = this;
        this.kb = "FlippingBook";
        this.vb = null;
        this.nn = !1;
        this.nh = "";
        this.aa = null;
        this.hn = "";
        this.on = this.$n = !1;
        this.Na = null;
        this.Tk = !1;
        r(a) ? ch(a, function(a) {
            a = JSON.parse(a);
            b.bj(a)
        }) : this.bj(a)
    }
    e = dh.prototype;
    e.title = function() {
        w(this.kb);
        return this.kb
    };
    e.Ye = function() {
        w(this.vb);
        return this.vb
    };
    e.ke = function() {
        w(this.aa);
        return this.aa
    };
    e.pi = function() {
        return this.Na
    };
    e.bj = function(a) {
        this.kb = a.title;
        this.nn = a.hasLocalVersion;
        a.pageSizes && (this.vb = new Zg(a.pageSizes));
        this.nh = a.salt;
        this.aa = new Nc(a.i18n);
        this.hn = a.fingerprint;
        this.$n = a.protectFromCopying;
        this.on = a.hasPassword;
        this.Tk = a.ispringPlayIntegration;
        if (a = a.watermark) this.Na = new Wg(a.image, a.url)
    };

    function eh(a) {
        T.call(this, "banner");
        var b = new T("no-local-view");
        this.c(b);
        b = new T("message");
        var c = new T("title");
        c.U(a.ya("PB_UNAVAILABLE_BANNER_TITLE"));
        b.c(c);
        c = new T("text");
        c.U(a.ya("PB_UNAVAILABLE_BANNER_TEXT"));
        b.c(c);
        this.c(b)
    }
    v(eh, T);

    function fh() {
        for (var a = document.location.search.split("+").join(" "), b = {}, c, d = /[?&]?([^=]+)=([^&]*)/g; c = d.exec(a);) b[decodeURIComponent(c[1])] = decodeURIComponent(c[2]);
        return b
    }

    function gh(a, b) {
        var c = document.createElement("script");
        c.src = a;
        c.onload = function() {
            b(window.PDF_DATA)
        };
        document.head.appendChild(c)
    };

    function hh() {
        return !ih() && p(window.orientation) ? !!(window.orientation % 180) : window.innerWidth > window.innerHeight
    }

    function ih() {
        return 0 <= window.location.search.indexOf("ispringpreview=1")
    };
    var jh = {
        1: "resume",
        2: "startover"
    };

    function kh() {
        K.call(this);
        this.eb = [];
        this.se = L(this)
    }
    m(kh, K);
    kh.prototype.bc = function() {
        return this.eb.slice()
    };

    function lh(a, b) {
        a.eb.splice(b, 1);
        a.se.f()
    };

    function mh() {
        this.ol = Object.create(null);
        this.i = this.R = null
    }
    mh.prototype.ab = function(a) {
        this.R = a
    };
    mh.prototype.Zj = function(a) {
        this.i = a
    };
    mh.prototype.es = function(a) {
        return a instanceof Array ? "#page=" + this.Ng(a[0]) : ""
    };
    mh.prototype.getDestinationHash = mh.prototype.es;
    mh.prototype.os = function(a) {
        var b = function(a) {
            a instanceof Array && nh(this, a[0])
        }.bind(this);
        "string" === typeof a ? this.R.getDestination(a, b) : b(a)
    };
    mh.prototype.navigateTo = mh.prototype.os;
    mh.prototype.Ng = function(a) {
        return a instanceof Object ? this.ol[oh(a)] : parseInt(a, 10) + 1
    };

    function oh(a) {
        return a.num + " " + a.gen + " R"
    }

    function nh(a, b) {
        var c = a.Ng(b);
        c ? (c > a.R.o() && (c = a.R.o()), a.i.u(c)) : a.R.getPageIndex(b, function(c) {
            a.ol[oh(b)] = c + 1;
            nh(a, b)
        })
    };

    function ph(a, b, c) {
        this.Uk = a;
        this.va = b;
        this.Qi = c
    }
    ph.prototype.label = function() {
        return this.Uk
    };
    ph.prototype.pageNumber = function() {
        return this.va
    };
    ph.prototype.items = function() {
        return this.Qi
    };

    function qh() {
        this.Ah = {}
    }
    qh.prototype.renderTextLayer = function(a, b, c) {
        var d = this,
            f = a.pageNumber;
        a.getTextContent({
            normalizeWhitespace: !0
        }).then(function(a) {
            if (0 == a.items.length) c();
            else {
                d.Ah[f] && d.Ah[f].cancel();
                var g = document.createDocumentFragment();
                d.Ah[f] = PDFJS.renderTextLayer({
                    textContent: a,
                    container: g,
                    viewport: b.viewport,
                    timeout: b.timeout
                });
                d.Ah[f].promise.then(function() {
                        b.container.appendChild(g);
                        var a = document.createElement("div");
                        a.className = "endOfContent";
                        b.container.appendChild(a);
                        rh(b.container);
                        c();
                        delete d.Ah[f]
                    },
                    function() {})
            }
        })
    };

    function rh(a) {
        a.addEventListener("mousedown", function(b) {
            var c = a.querySelector(".endOfContent");
            if (c) {
                if (b.target !== a && "none" !== window.getComputedStyle(c).getPropertyValue("-moz-user-select")) {
                    var d = a.getBoundingClientRect();
                    c.style.top = (100 * Math.max(0, (b.pageY - d.top) / d.height)).toFixed(2) + "%"
                }
                H(c, "active")
            }
        });
        a.addEventListener("mouseup", function() {
            var b = a.querySelector(".endOfContent");
            b && (b.style.top = "", J(b, "active"))
        })
    };

    function sh(a) {
        this.De = a;
        this.Me = this.Rc = null
    }
    e = sh.prototype;
    e.o = function() {
        return this.De.numPages
    };

    function th(a, b) {
        b.ab(a);
        a.Rc = b
    }
    e.getPage = function(a, b) {
        var c = this;
        this.De.getPage(a).then(function(d) {
            c.Rc.ol[oh(d.ref)] = a;
            b(new Od(d, c.Rc, c.Me), a)
        })
    };
    e.getPageIndex = function(a, b) {
        this.De.getPageIndex(a).then(function(a) {
            b(a)
        })
    };
    e.getDestination = function(a, b) {
        this.De.getDestination(a).then(function(a) {
            b(a)
        })
    };
    e.getOutline = function() {
        var a = this;
        return this.De.getOutline().then(function(b) {
            return b ? uh(a, b, !1) : null
        })
    };

    function uh(a, b, c) {
        b = b.map(function(b) {
            var d = vh(a, b),
                g = c || !b.items ? Promise.resolve(null) : uh(a, b.items, !0);
            return Promise.all([d, g]).then(function(a) {
                var c = l(a);
                a = c.next().value;
                c = c.next().value;
                return new ph(b.title, a, c)
            }).catch(function() {
                return null
            })
        });
        return Promise.all(b).then(function(a) {
            return a.filter(function(a) {
                return !!a
            }).sort(function(a, b) {
                return a.pageNumber() - b.pageNumber()
            })
        })
    }

    function vh(a, b) {
        b = b.dest;
        return wa(b) ? wh(a, b) : r(b) ? (Pa(b), a.De.getDestination(b).then(function(b) {
            return wh(a, b)
        })) : Promise.reject()
    }

    function wh(a, b) {
        return b ? a.De.getPageIndex(b[0]).then(function(a) {
            return a + 1
        }) : Promise.reject()
    };
    var xh = hc || ec ? "webkitfullscreenchange" : gc ? "mozfullscreenchange" : A ? "MSFullscreenChange" : "fullscreenchange";

    function yh(a) {
        a.mozRequestFullScreenWithKeys ? a.mozRequestFullScreenWithKeys() : a.webkitRequestFullscreen ? a.webkitRequestFullscreen() : a.webkitRequestFullscreen ? a.webkitRequestFullscreen() : a.mozRequestFullScreen ? a.mozRequestFullScreen() : a.msRequestFullscreen ? a.msRequestFullscreen() : a.requestFullscreen && a.requestFullscreen()
    }

    function zh() {
        var a = Ah();
        a.webkitCancelFullScreen ? a.webkitCancelFullScreen() : a.mozCancelFullScreen ? a.mozCancelFullScreen() : a.msExitFullscreen ? a.msExitFullscreen() : a.exitFullscreen && a.exitFullscreen()
    }

    function Bh() {
        var a = Ah();
        return !!(a.webkitIsFullScreen || a.mozFullScreen || a.msFullscreenElement || a.fullscreenElement)
    }

    function Ah() {
        return (Ja || (Ja = new Ke)).getDocument()
    };

    function Ch() {
        this.we = new F;
        B(document, xh, function() {
            this.we.f(Bh())
        }, !1, this)
    }
    Ch.prototype.up = function(a) {
        a ? (w(document.body), yh(document.body)) : zh()
    };
    Ch.prototype.Pb = function() {
        return this.we
    };

    function Dh(a) {
        Ch.call(this);
        this.a = a;
        this.Od = a.displayObject();
        this.yk = this.Rk = !1;
        if (hg || gg || dg || Vf) a = 0;
        else {
            a = Ah();
            var b = a.body;
            a = !!(b.webkitRequestFullscreen || b.mozRequestFullScreen && a.mozFullScreenEnabled || b.msRequestFullscreen && a.msFullscreenEnabled || b.requestFullscreen && a.fullscreenEnabled)
        }
        a || this.a.bd();
        this.Pb().addHandler(this.nd, this)
    }
    v(Dh, Ch);
    Dh.prototype.toggle = function() {
        this.yk || (this.yk = !0, this.up(!this.Rk))
    };
    Dh.prototype.up = function(a) {
        a ? yh(this.Od) : zh()
    };
    Dh.prototype.nd = function(a) {
        this.Rk = a;
        this.yk = !1;
        this.a.dd(this.Rk)
    };

    function Eh() {
        this.Ig = new F;
        this.Sm = new F;
        this.Hi = new F;
        this.vk = new F
    }
    e = Eh.prototype;
    e.qf = !1;
    e.pf = !1;
    e.uh = null;
    e.Ff = null;
    e.Qh = function() {
        return "drag"
    };
    e.Dj = function(a, b) {
        if (1 == b.touches().length) {
            if ("touchStart" == a) return this.qf && (this.pf = this.qf = !1), this.pf = !1, 1;
            if ("touchMove" == a && this.pf) return 1
        }
        this.qf && (w(this.Ff), this.pf = this.qf = !1, this.vk.f(this.Ff.x, this.Ff.y));
        return 0
    };
    e.wj = function(a) {
        a = new G(a.touches()[0].clientX(), a.touches()[0].clientY());
        if (this.pf) {
            a = Rd(a, this.uh);
            var b = this.Ff;
            a == b || a && b && a.x == b.x && a.y == b.y || (this.qf || (w(this.uh), this.qf = !0, this.Hi.f(this.uh.x, this.uh.y)), this.Ff = a, this.Ig.f(a.x, a.y))
        } else this.pf = !0, this.uh = a, this.Ff = new G, this.Sm.f()
    };
    e.Ve = function() {
        return this.Ig
    };
    e.ie = function() {};

    function Fh() {
        this.mo = new F;
        this.lo = new F;
        this.ul = new F;
        this.Ig = new F;
        this.yo = this.Ug = null;
        this.tl = !1
    }
    e = Fh.prototype;
    e.Vg = -1;
    e.Ni = 0;
    e.Qh = function() {
        return "scale"
    };
    e.Dj = function(a, b) {
        a = 2 == b.touches().length;
        var c = !a && 0 < this.Vg;
        a != this.tl && (this.tl || (this.yo = Gh(b), this.mo.f()), this.tl = a);
        return a || c ? 1 : 0
    };
    e.wj = function(a) {
        if (2 == a.touches().length) {
            var b = Gh(a);
            if (this.Ug && b) {
                var c = Rd(b.Cj, this.Ug.Cj),
                    d = Rd(b.Uj, this.Ug.Uj),
                    f = 0 > c.x && 0 > d.x || 0 < c.x && 0 < d.x;
                (0 > c.y && 0 > d.y || 0 < c.y && 0 < d.y || f) && this.Ig.f(Math.abs(c.x) < Math.abs(d.x) ? c.x : d.x, Math.abs(c.y) < Math.abs(d.y) ? c.y : d.y)
            }
            this.Ug = b;
            b = a.scale();
            p(b) || (b = a.touches()[0], c = a.touches()[1], a = new G(b.clientX(), b.clientY()), c = new G(c.clientX(), c.clientY()), b = a.x - c.x, a = a.y - c.y, a = Math.sqrt(b * b + a * a), this.Ni ? b = a / this.Ni : (b = 1, this.Ni = a));
            a = b;
            this.lo.f(a);
            this.Vg = a
        } else 0 <
            this.Vg && (this.ul.f(this.Vg), this.Ug = null, this.Vg = -1, this.Ni = 0)
    };

    function Gh(a) {
        a = a.touches();
        return 2 != a.length ? null : {
            Cj: new G(a[0].clientX(), a[0].clientY()),
            Uj: new G(a[1].clientX(), a[1].clientY())
        }
    }
    e.Ve = function() {
        return this.Ig
    };
    e.ie = function() {};

    function Hh() {
        this.vl = new F
    }
    e = Hh.prototype;
    e.zh = null;
    e.Wd = null;
    e.Oe = !1;
    e.Dj = function(a, b) {
        if ("touchEnd" == a) return this.Oe && this.zh && this.Wd ? this.Oo(this.Wd, this.zh) ? 1 : 0 : 0;
        if (1 != b.touches().length || uf(b.Pd)) return this.Oe = !1, 0;
        var c = new G(b.touches()[0].screenX(), b.touches()[0].screenY());
        if ("touchStart" == a) {
            if (vf(b.Pd)) return this.Oe = !1, 0;
            this.zh = this.Wd = c;
            this.Oe = !0;
            return 0
        }
        if (!this.Oe || !this.zh || !this.Wd) return 0;
        (this.Oe = this.zh == this.Wd ? this.Po(c, this.Wd) : this.Qo(c, this.Wd)) && b.Pd.preventDefault();
        this.Wd = c;
        return 0
    };
    e.wj = function() {
        this.vl.f()
    };
    e.ie = function() {};

    function Ih(a) {
        Hh.apply(this, arguments)
    }
    m(Ih, Hh);
    Ih.prototype.Qh = function() {
        return "scrollLeft"
    };
    Ih.prototype.Qo = function(a, b) {
        return a.x - 20 <= b.x
    };
    Ih.prototype.Po = function(a, b) {
        return b.x - a.x >= Math.abs(a.y - b.y)
    };
    Ih.prototype.Oo = function(a, b) {
        var c = b.x - a.x;
        return 80 < c && .7 * c >= Math.abs(a.y - b.y)
    };

    function Jh(a) {
        Hh.apply(this, arguments)
    }
    m(Jh, Hh);
    Jh.prototype.Qh = function() {
        return "scrollRight"
    };
    Jh.prototype.Qo = function(a, b) {
        return a.x + 20 >= b.x
    };
    Jh.prototype.Po = function(a, b) {
        return a.x - b.x >= Math.abs(a.y - b.y)
    };
    Jh.prototype.Oo = function(a, b) {
        var c = a.x - b.x;
        return 80 < c && .7 * c >= Math.abs(a.y - b.y)
    };

    function Kh(a) {
        K.call(this);
        var b = this;
        this.g = a;
        this.Xl = L(this);
        this.qd = !1;
        var c = new ee(a.displayObject());
        this.Ke = new Fh;
        D(this, this.Ke.mo, this.gr, this);
        me(c, this.Ke);
        this.Xg = this.de = null;
        this.Cf = new ee(a.displayObject());
        var d = new Eh;
        me(this.Cf, d);
        this.wr = L(this, d.Hi);
        this.Fn = L(this);
        D(this, d.vk, this.Kq, this);
        this.Bq = L(this, d.Ve());
        fe(this.Cf);
        this.rj = new ne;
        me(c, this.rj);
        this.kn = L(this);
        D(this, this.rj.qj, this.Vq, this);
        D(this, this.rj.dn, function(a, c) {
            b.de && (clearTimeout(b.de), b.de = null);
            b.kn.f(a,
                c)
        }, this);
        fe(c);
        this.Ae = new ee(a.displayObject());
        a = new Ih;
        me(this.Ae, a);
        this.Ec = L(this);
        D(this, a.vl, function() {
            b.Xg && clearTimeout(b.Xg);
            b.Ec.f(!0)
        });
        a = new Jh;
        me(this.Ae, a);
        D(this, a.vl, function() {
            b.Xg && clearTimeout(b.Xg);
            b.yd.f(!0)
        });
        this.yd = L(this);
        fe(this.Ae);
        this.Vm = L(this);
        this.Sd = this.qd = !0
    }
    m(Kh, K);
    e = Kh.prototype;
    e.Kq = function() {
        var a = this;
        this.Xg = setTimeout(function() {
            a.Fn.f()
        }, 0)
    };
    e.Ve = function() {
        return this.Ke.Ve()
    };
    e.sg = function() {
        return this.Ke.lo
    };
    e.Ra = function() {
        return this.yd
    };
    e.Qa = function() {
        return this.Ec
    };
    e.gr = function() {
        var a = w(this.Ke.yo);
        this.Xl.f((a.Cj.x + a.Uj.x) / 2, (a.Cj.y + a.Uj.y) / 2)
    };
    e.Vq = function(a) {
        var b = this;
        if (this.de) clearTimeout(this.de), this.de = null;
        else {
            var c = this.g.displayObject().getBoundingClientRect(),
                d = hh() ? a > c.width - 120 : a > c.width - 70,
                f = hh() ? 120 > a : 70 > a;
            this.de = setTimeout(function() {
                f ? b.yd.f(!1) : d ? b.Ec.f(!1) : b.Vm.f();
                b.rj.Wk = null;
                b.de = null
            }, f || d ? 300 : 500)
        }
    };

    function Lh() {
        B(window, "keydown", this.xf, !1, this);
        this.W = 0;
        this.yd = new F;
        this.Ec = new F;
        this.Vc = new F;
        this.we = new F;
        this.Pk = !1
    }
    e = Lh.prototype;
    e.qa = function(a) {
        this.W = a
    };
    e.Ra = function() {
        return this.yd
    };
    e.Qa = function() {
        return this.Ec
    };
    e.Pb = function() {
        return this.we
    };
    e.zb = function() {
        return this.Vc
    };
    e.xf = function(a) {
        if (this.Pk) a.preventDefault();
        else {
            var b = (a.ctrlKey ? 1 : 0) | (a.altKey ? 2 : 0) | (a.shiftKey ? 4 : 0) | (a.metaKey ? 8 : 0);
            if (1 !== b && 8 !== b || !Mh(a)) {
                var c;
                if (c = 4 === b) a: {
                    switch (a.keyCode) {
                        case 32:
                            this.yd.f();
                            c = !0;
                            break a
                    }
                    c = !1
                }
                if (c) a.preventDefault();
                else {
                    if (!(c = 3 !== b && 10 !== b)) {
                        a: {
                            switch (a.keyCode) {
                                case 70:
                                    this.we.f();
                                    c = !0;
                                    break a
                            }
                            c = !1
                        }
                        c = !c
                    }
                    c ? 0 === b && Nh(this, a) && a.preventDefault() : a.preventDefault()
                }
            } else a.preventDefault()
        }
    };

    function Mh(a) {
        switch (a.keyCode) {
            case 61:
            case 107:
            case 187:
            case 171:
                return !0;
            case 173:
            case 109:
            case 189:
                return !0;
            case 48:
            case 96:
                return !0
        }
        return !1
    }

    function Nh(a, b) {
        switch (b.keyCode) {
            case 8:
            case 37:
                return a.yd.f(), !0;
            case 32:
            case 39:
                return a.Ec.f(), !0;
            case 36:
                return a.Vc.f(1), !0;
            case 35:
                return a.Vc.f(a.W), !0;
            case 38:
            case 40:
                return A
        }
        return !1
    };

    function Oh() {
        vd.call(this);
        this.qb = Ph;
        this.endTime = this.startTime = null
    }
    v(Oh, vd);
    var Ph = 0;
    Oh.prototype.Ij = function() {
        return 1 == this.qb
    };
    Oh.prototype.Mj = function() {
        this.Zc("begin")
    };
    Oh.prototype.Xh = function() {
        this.Zc("end")
    };
    Oh.prototype.Zc = function(a) {
        this.dispatchEvent(a)
    };

    function Qh(a, b, c) {
        Rc.call(this);
        this.za = null;
        this.Jm = !1;
        this.Vh = a;
        this.Fj = c;
        this.hd = b || window;
        this.Kh = Fa(this.fm, this)
    }
    v(Qh, Rc);
    e = Qh.prototype;
    e.start = function() {
        this.stop();
        this.Jm = !1;
        var a = Rh(this),
            b = Sh(this);
        a && !b && this.hd.mozRequestAnimationFrame ? (this.za = B(this.hd, "MozBeforePaint", this.Kh), this.hd.mozRequestAnimationFrame(null), this.Jm = !0) : this.za = a && b ? a.call(this.hd, this.Kh) : this.hd.setTimeout(bb(this.Kh), 20)
    };
    e.stop = function() {
        if (this.Qb()) {
            var a = Rh(this),
                b = Sh(this);
            a && !b && this.hd.mozRequestAnimationFrame ? rd(this.za) : a && b ? b.call(this.hd, this.za) : this.hd.clearTimeout(this.za)
        }
        this.za = null
    };
    e.Qb = function() {
        return null != this.za
    };
    e.fm = function() {
        this.Jm && this.za && rd(this.za);
        this.za = null;
        this.Vh.call(this.Fj, Ga())
    };
    e.cc = function() {
        this.stop();
        Qh.V.cc.call(this)
    };

    function Rh(a) {
        a = a.hd;
        return a.requestAnimationFrame || a.webkitRequestAnimationFrame || a.mozRequestAnimationFrame || a.oRequestAnimationFrame || a.msRequestAnimationFrame || null
    }

    function Sh(a) {
        a = a.hd;
        return a.cancelAnimationFrame || a.cancelRequestAnimationFrame || a.webkitCancelRequestAnimationFrame || a.mozCancelRequestAnimationFrame || a.oCancelRequestAnimationFrame || a.msCancelRequestAnimationFrame || null
    };

    function Th(a, b, c) {
        Rc.call(this);
        this.Vh = a;
        this.eg = b || 0;
        this.Fj = c;
        this.Kh = Fa(this.fm, this)
    }
    v(Th, Rc);
    e = Th.prototype;
    e.za = 0;
    e.cc = function() {
        Th.V.cc.call(this);
        this.stop();
        delete this.Vh;
        delete this.Fj
    };
    e.start = function(a) {
        this.stop();
        this.za = xf(this.Kh, p(a) ? a : this.eg)
    };
    e.stop = function() {
        this.Qb() && n.clearTimeout(this.za);
        this.za = 0
    };
    e.Qb = function() {
        return 0 != this.za
    };
    e.fm = function() {
        this.za = 0;
        this.Vh && this.Vh.call(this.Fj)
    };
    var Sb = {},
        Uh = null;

    function Vh(a) {
        a = Aa(a);
        delete Sb[a];
        Rb() && Uh && Uh.stop()
    }

    function Wh() {
        Uh || (Uh = new Th(function() {
            Xh()
        }, 20));
        var a = Uh;
        a.Qb() || a.start()
    }

    function Xh() {
        var a = Ga();
        Nb(Sb, function(b) {
            Yh(b, a)
        });
        Rb() || Wh()
    };

    function Zh(a, b, c, d) {
        Oh.call(this);
        if (!wa(a) || !wa(b)) throw Error("Start and end parameters must be arrays");
        if (a.length != b.length) throw Error("Start and end points must be the same length");
        this.pg = a;
        this.bp = b;
        this.duration = c;
        this.To = d;
        this.coords = [];
        this.Qs = !1;
        this.tc = 0;
        this.sm = null
    }
    v(Zh, Oh);
    e = Zh.prototype;
    e.play = function(a) {
        if (a || this.qb == Ph) this.tc = 0, this.coords = this.pg;
        else if (this.Ij()) return !1;
        Vh(this);
        this.startTime = a = Ga(); - 1 == this.qb && (this.startTime -= this.duration * this.tc);
        this.endTime = this.startTime + this.duration;
        this.sm = this.startTime;
        this.tc || this.Mj();
        this.Zc("play"); - 1 == this.qb && this.Zc("resume");
        this.qb = 1;
        var b = Aa(this);
        b in Sb || (Sb[b] = this);
        Wh();
        Yh(this, a);
        return !0
    };
    e.stop = function(a) {
        Vh(this);
        this.qb = Ph;
        a && (this.tc = 1);
        $h(this, this.tc);
        this.Zc("stop");
        this.Xh()
    };
    e.pause = function() {
        this.Ij() && (Vh(this), this.qb = -1, this.Zc("pause"))
    };
    e.cc = function() {
        this.qb == Ph || this.stop(!1);
        this.lp();
        Zh.V.cc.call(this)
    };
    e.destroy = function() {
        this.bg()
    };

    function Yh(a, b) {
        Oa(a.startTime);
        Oa(a.endTime);
        Oa(a.sm);
        b < a.startTime && (a.endTime = b + a.endTime - a.startTime, a.startTime = b);
        a.tc = (b - a.startTime) / (a.endTime - a.startTime);
        1 < a.tc && (a.tc = 1);
        a.sm = b;
        $h(a, a.tc);
        1 == a.tc ? (a.qb = Ph, Vh(a), a.Zc("finish"), a.Xh()) : a.Ij() && a.Lj()
    }

    function $h(a, b) {
        ya(a.To) && (b = a.To(b));
        a.coords = Array(a.pg.length);
        for (var c = 0; c < a.pg.length; c++) a.coords[c] = (a.bp[c] - a.pg[c]) * b + a.pg[c]
    }
    e.Lj = function() {
        this.Zc("animate")
    };
    e.lp = function() {
        this.Zc("destroy")
    };
    e.Zc = function(a) {
        this.dispatchEvent(new ai(a, this))
    };

    function ai(a, b) {
        Vc.call(this, a);
        this.coords = b.coords;
        this.x = b.coords[0];
        this.y = b.coords[1];
        this.z = b.coords[2];
        this.duration = b.duration;
        this.tc = b.tc;
        this.state = b.qb
    }
    v(ai, Vc);

    function W(a, b, c, d) {
        Zh.call(this, a, b, c, d);
        this.jk = new F;
        this.Pp = new F;
        this.ia = new F
    }
    v(W, Zh);
    e = W.prototype;
    e.lb = function(a) {
        this.xg && this.xg.Kt(a)
    };
    e.Ge = function() {
        this.xg && this.xg.$t()
    };
    e.wd = function() {
        this.xg && this.xg.Ot()
    };
    e.Lj = function() {
        w(this.coords);
        this.lb(this.coords);
        this.Pp.f()
    };
    e.lp = function() {};
    e.Xh = function() {
        w(this.coords);
        this.lb(this.coords);
        this.wd();
        this.ia.f()
    };
    e.Mj = function() {
        w(this.coords);
        this.jk.f();
        this.Ge();
        this.lb(this.coords)
    };

    function bi(a) {
        var b = a.Ic,
            c = a.nextPage,
            d = a.Hc,
            f = a.ps,
            g = a.Tr,
            h = a.vs;
        W.call(this, [0], [1], a.duration);
        this.w = b;
        this.B = d;
        this.Pf = (this.F = c) ? this.F.x() : 0;
        this.$g = f - this.Pf;
        this.Of = this.B ? this.B.x() : 0;
        this.Eg = g - this.Of;
        this.Qf = this.w ? this.w.x() : 0;
        this.jh = h - this.Qf
    }
    m(bi, W);
    bi.prototype.lb = function(a) {
        a = a[0];
        this.w.ha(this.Qf + this.jh * a);
        this.B.ha(this.Of + this.Eg * a);
        this.F.ha(this.Pf + this.$g * a)
    };

    function ci() {
        K.call(this);
        this.Rg = !1;
        this.vh = L(this);
        this.Yg = L(this);
        this.ia = L(this)
    }
    m(ci, K);
    ci.prototype.uk = function(a, b) {
        this.vh.f(a, b)
    };
    ci.prototype.tk = function(a, b) {
        this.Yg.f(a, b)
    };

    function di() {
        K.call(this);
        this.O = null;
        this.Tb = new G(0, 0);
        this.dj = new G(0, 0);
        this.Pi = !1;
        this.Rb = new G(0, 0);
        this.pj = ei(this)
    }
    m(di, K);
    di.prototype.Hd = function(a) {
        this.O = a
    };

    function ei(a) {
        return new Qh(function() {
            if (!a.Pi) {
                a.Tb.x = .5 * -db(a.Tb.x);
                a.Tb.y += .5 * -db(a.Tb.y);
                a.Rb = a.Rb.translate(a.Tb);
                a.O.scrollTo(a.Rb.x, a.Rb.y);
                var b = a.O.scrollTop(),
                    c = a.O.scrollLeft();
                b = 0 == b || b >= a.O.scrollHeight();
                c = 0 == c || c >= a.O.scrollWidth();
                b && c ? a.pj.stop() : .5 > Math.abs(a.Tb.x) && .5 > Math.abs(a.Tb.y) || .5 >= Math.abs(a.Tb.x) && .5 >= Math.abs(a.Tb.y) || a.pj.start()
            }
        })
    };

    function fi() {
        ci.call(this);
        this.Ta = this.R = this.Fa = null;
        this.wk = this.xi = this.yi = !1;
        this.vg = new G(0, 0);
        this.Bf = new di;
        E(this, this.Bf)
    }
    m(fi, ci);
    e = fi.prototype;
    e.enable = function(a) {
        var b = this;
        this.Fa = a;
        this.R = a.ownerDocument;
        this.Ta = new ee(this.Fa);
        E(this, this.Ta);
        a = new Eh;
        D(this, a.Sm, function() {
            var a = b.Bf;
            a.Pi = !0;
            a.pj.stop()
        }, this);
        D(this, a.Hi, this.Jq, this);
        D(this, a.Ve(), this.Iq, this);
        D(this, a.vk, this.Hq, this);
        me(this.Ta, a);
        fe(this.Ta)
    };
    e.disable = function() {
        this.Ta && (ge(this.Ta), this.mh(this.Ta), this.Ta = null)
    };
    e.Hd = function(a) {
        this.Bf.Hd(a)
    };
    e.Jq = function(a, b) {
        this.wk = !1;
        this.vg = new G(0, 0);
        var c = this.Bf;
        c.Pi = !0;
        c.Tb = new G(0, 0);
        c.dj = new G(0, 0);
        this.uk(a, b)
    };
    e.Iq = function(a, b) {
        this.wk || (this.yi = Math.abs(b) > Math.abs(a), this.xi = Math.abs(a) > Math.abs(b));
        this.wk = !0;
        this.yi && 70 < Math.abs(a) && (this.yi = !1, this.vg = new G(a, 0));
        this.xi && 70 < Math.abs(b) && (this.xi = !1, this.vg = new G(0, b));
        a = this.yi ? 0 : a - this.vg.x;
        b = this.xi ? 0 : b - this.vg.y;
        this.tk(a, b);
        var c = this.Bf,
            d = a - c.dj.x,
            f = b - c.dj.y;
        5 > Math.abs(d) && 5 > Math.abs(f) ? c.Tb = new G(0, 0) : (c.Tb = new G(-db(d) * cb(Math.abs(d), 0, 25), -db(f) * cb(Math.abs(f), 0, 25)), c.dj = new G(a, b))
    };
    e.Hq = function() {
        var a = this.Bf;
        a.Pi = !1;
        a.Rb = new G(a.O.scrollLeft(), a.O.scrollTop());
        a.pj.start();
        this.ia.f()
    };

    function gi() {
        ci.call(this);
        this.R = this.Fa = null;
        this.Nb = new G(0, 0)
    }
    m(gi, ci);
    e = gi.prototype;
    e.enable = function(a) {
        this.Fa = a;
        this.R = a.ownerDocument;
        this.Rg = !1;
        B(this.Fa, "mousedown", this.An, !0, this);
        B(this.R, "mousemove", this.Bn, !0, this);
        B(this.R, "mouseup", this.Dn, !0, this)
    };
    e.disable = function() {
        qd(this.Fa, "mousedown", this.An, !0, this);
        qd(this.R, "mousemove", this.Bn, !0, this);
        qd(this.R, "mouseup", this.Dn, !0, this)
    };
    e.An = function(a) {
        a.preventDefault();
        0 == a.button && (H(this.Fa, "holdHand"), this.Nb = new G(a.clientX, a.clientY), this.uk(a.clientX, a.clientY), this.Rg = !0)
    };
    e.Bn = function(a) {
        this.Rg && this.tk(a.clientX - this.Nb.x, a.clientY - this.Nb.y)
    };
    e.Dn = function() {
        this.Rg && (J(this.Fa, "holdHand"), this.Rg = !1)
    };

    function hi() {
        ci.call(this);
        this.Ta = this.R = this.Fa = null
    }
    m(hi, ci);
    hi.prototype.enable = function(a) {
        this.Fa = a;
        this.R = a.ownerDocument;
        this.Ta = new ee(this.Fa);
        E(this, this.Ta);
        a = new Eh;
        D(this, a.Hi, this.uk, this);
        D(this, a.Ve(), this.tk, this);
        me(this.Ta, a);
        fe(this.Ta)
    };
    hi.prototype.disable = function() {
        this.Ta && (ge(this.Ta), this.mh(this.Ta), this.Ta = null)
    };

    function ii(a, b) {
        K.call(this);
        this.g = a;
        this.Fa = null;
        this.Qg = !1;
        this.te = b && fg ? new fi : b ? new hi : new gi;
        D(this, this.te.vh, this.vr, this);
        D(this, this.te.Yg, this.Aq, this);
        D(this, this.te.ia, this.aq, this);
        this.yh = this.xh = 0;
        this.Gn = L(this);
        this.Yg = L(this);
        this.En = L(this)
    }
    m(ii, K);
    e = ii.prototype;
    e.Qb = function() {
        return this.Qg
    };
    e.Hd = function(a) {
        this.te instanceof fi && this.te.Hd(a)
    };
    e.enable = function() {
        if (this.Qg) throw Error("HandMotion already enable");
        w(this.Fa);
        H(this.Fa, "handMotionOverlay");
        this.te.enable(this.Fa);
        this.Qg = !0
    };
    e.disable = function() {
        if (!this.Qg) throw Error("HandMotion already disable");
        J(this.Fa, "handMotionOverlay");
        this.te.disable();
        this.Qg = !1
    };
    e.vr = function() {
        this.xh = this.g.scrollLeft;
        this.yh = this.g.scrollTop;
        this.Gn.f()
    };
    e.Aq = function(a, b) {
        a = this.xh - a;
        b = this.yh - b;
        this.g.scrollLeft = a;
        this.g.scrollTop = b;
        this.Yg.f(this.g.scrollLeft - a, this.g.scrollTop - b)
    };
    e.aq = function() {
        this.En.f()
    };

    function ji(a) {
        var b = a.scrollTop,
            c = a.scrollLeft,
            d = a.scale,
            f = a.Jc,
            g = a.oe;
        W.call(this, [0], [1], a.duration);
        this.i = g;
        this.O = f;
        this.yh = this.O.scrollTop();
        this.lr = this.yh - b;
        this.xh = this.O.scrollLeft();
        this.kr = this.xh - c;
        this.Ao = this.i.scale();
        this.fr = this.Ao - d
    }
    m(ji, W);
    ji.prototype.lb = function(a) {
        a = a[0];
        this.i.G(this.Ao - this.fr * a);
        this.O.scrollTo(this.xh - this.kr * a, this.yh - this.lr * a)
    };

    function ki(a, b) {
        this.fe = a;
        this.ge = b
    }
    ki.prototype.x = function() {
        return this.fe
    };
    ki.prototype.y = function() {
        return this.ge
    };

    function li(a) {
        var b = Math.pow(10, 2);
        return Math.round(a * b) / b
    }

    function mi(a) {
        var b = x.Mp;
        return a == x.We ? a : li(Math.min(a + b, x.We))
    }

    function ni(a) {
        var b = x.Mp;
        return a == x.Xe ? a : li(Math.max(a - b, x.Xe))
    }

    function oi(a) {
        var b = Kf();
        return Math.max(a.width / b.width, a.height / b.height)
    };

    function pi(a) {
        this.g = a;
        this.K = null;
        this.Bb = this.Zb = 0;
        this.N = 1;
        this.D = 0;
        this.ba = this.Aa = null;
        this.$a = x.Vr;
        this.W = 0;
        this.R = null;
        this.Vb = !1;
        this.Wa = new F;
        this.Mf = new F;
        this.Fc = new F
    }
    e = pi.prototype;
    e.container = function() {
        return this.g
    };

    function qi(a) {
        return a.g.displayObject()
    }
    e.o = function() {
        return this.W
    };
    e.document = function() {
        return this.R
    };
    e.ab = function(a) {
        this.R = a;
        this.W = a.o()
    };
    e.ad = function() {
        return this.K
    };
    e.Da = function() {
        return this.D
    };
    e.scale = function() {
        return this.Bb
    };
    e.Fd = function() {
        return this.N
    };
    e.Oj = function() {
        return this.Wa
    };
    e.disable = function() {
        this.ba.Qb() && this.ba.disable();
        this.Vb = !1;
        this.Bb = 0;
        this.N = 1;
        this.D = 0
    };
    e.kc = function() {
        this.Wa.f(this.D)
    };

    function ri(a) {
        a.Vb = !0;
        a.Fc.f()
    }

    function si(a, b) {
        return a.R && a.D != b && 0 < b && b <= a.o()
    };

    function ti(a) {
        pi.call(this, a);
        this.Na = this.lc = null
    }
    v(ti, pi);
    ti.prototype.Wj = function(a) {
        this.lc = a
    };
    ti.prototype.im = function() {};

    function ui() {}
    e = ui.prototype;
    e.pageNumber = function() {
        return 0
    };
    e.Bd = function() {};
    e.ad = function() {};
    e.H = function() {};
    e.T = function() {};
    e.reset = function() {};
    e.destroy = function() {};
    e.ha = function() {};
    e.x = function() {
        return 0
    };
    e.Kc = function() {};
    e.y = function() {
        return 0
    };
    e.$ = function() {};
    e.G = function() {};
    e.nm = function() {
        return Promise.resolve(null)
    };
    e.ua = function() {};
    e.displayObject = function() {};

    function vi(a) {
        this.i = a
    }
    e = vi.prototype;
    e.Xj = function(a) {
        this.i.container().displayObject().scrollTop = a
    };
    e.scrollTo = function(a, b) {
        this.i.container().displayObject().scrollLeft = a;
        this.Xj(b)
    };
    e.scrollTop = function() {
        return this.Db().scrollTop
    };
    e.scrollLeft = function() {
        return this.Db().scrollLeft
    };
    e.scrollWidth = function() {
        return this.Db().scrollWidth
    };
    e.scrollHeight = function() {
        return this.Db().scrollHeight
    };
    e.Db = function() {
        return this.i.container().displayObject()
    };

    function wi() {
        this.qe = [];
        this.jk = new F;
        this.ia = new F
    }
    e = wi.prototype;
    e.add = function(a) {
        this.qe.push(a);
        a.ia.addHandler(this.Hn, this)
    };
    e.remove = function(a) {
        var b = this.qe.indexOf(a); - 1 != b && (this.qe.splice(b, 1), a.ia.removeHandler(this.Hn, this))
    };
    e.play = function(a) {
        this.jk.f();
        this.qe.length && (this.jn = 0, this.Xn = !0, Ta(this.qe, function(b) {
            b.play(p(a) ? a : !0)
        }, this));
        return !0
    };
    e.stop = function(a) {
        Ta(this.qe, function(b) {
            b.stop(p(a) ? a : !0)
        }, this)
    };
    e.Ij = function() {
        return this.Xn
    };
    e.Hn = function() {
        ++this.jn;
        this.jn == this.qe.length && (this.Xn = !1, this.ia.f())
    };

    function xi(a, b, c, d) {
        return function(f) {
            if (a != b || c != d) {
                for (var g = f, h = 0; 4 > h; ++h) {
                    var k = 3 * (1 - 3 * c + 3 * a) * g * g + 2 * (3 * c - 6 * a) * g + 3 * a;
                    if (0 == k) break;
                    g -= ((((1 - 3 * c + 3 * a) * g + (3 * c - 6 * a)) * g + 3 * a) * g - f) / k
                }
                f = g;
                f *= ((1 - 3 * d + 3 * b) * f + (3 * d - 6 * b)) * f + 3 * b
            }
            return f
        }
    }
    var yi = xi(.25, .1, .25, 1),
        zi = xi(0, 0, .58, 1);
    var Ai = xi(.64, .04, .35, 1),
        Bi = xi(.09, .74, .35, 1),
        Ci = xi(.35, .02, .67, .19);
    var Di = x.tg;

    function Ei(a) {
        var b = a.ob,
            c = a.Ic,
            d = a.Hc,
            f = a.nextPage,
            g = a.bs;
        W.call(this, [0], [1], a.duration, Ai);
        this.Ga = b;
        this.w = c;
        this.B = d;
        this.F = f;
        this.Kg = g;
        a = this.yc(this.Kg);
        this.Kg.ha(this.Ga.width() + a);
        a = this.yc(this.w);
        this.ej = this.w.x();
        this.jh = a;
        a = this.yc(this.B);
        this.Fg = this.B.x();
        this.Eg = this.Fg - -a;
        a = this.yc(this.F);
        a = Math.floor(this.Ga.width() / 2 - a / 2);
        a = Math.max(a, 0);
        this.Ui = this.F.x();
        this.$g = this.Ui - a;
        a = this.yc(this.Kg);
        this.eq = this.Kg.x();
        this.cq = a
    }
    m(Ei, W);
    Ei.prototype.lb = function(a) {
        a = a[0];
        this.w.ha(this.ej - this.jh * a);
        this.B.ha(this.Fg - this.Eg * a);
        this.F.ha(this.Ui - this.$g * a);
        this.Kg.ha(this.eq - this.cq * a)
    };
    Ei.prototype.yc = function(a) {
        return 0 == a.pageNumber() ? 0 : a.Bd().width + 2 * Di.Ea
    };
    var Fi = x.tg;

    function Gi(a) {
        var b = a.ob,
            c = a.Ic,
            d = a.Hc,
            f = a.nextPage,
            g = a.cs;
        W.call(this, [0], [1], a.duration, Ai);
        this.Ga = b;
        this.w = c;
        this.B = d;
        this.F = f;
        this.Lg = g;
        a = this.yc(this.Lg);
        this.Lg.ha(-2 * a);
        a = this.yc(this.F);
        this.Ui = this.F.x();
        this.$g = a;
        this.Fg = this.B.x();
        this.Eg = this.Ga.width() - this.Fg;
        a = this.yc(this.w);
        a = Math.floor(this.Ga.width() / 2 - a / 2);
        a = Math.max(a, 0);
        this.ej = this.w.x();
        this.jh = a - this.ej;
        a = this.yc(this.Lg);
        this.gq = this.Lg.x();
        this.fq = a
    }
    m(Gi, W);
    Gi.prototype.lb = function(a) {
        a = a[0];
        this.F.ha(this.Ui + this.$g * a);
        this.B.ha(this.Fg + this.Eg * a);
        this.w.ha(this.ej + this.jh * a);
        this.Lg.ha(this.gq + this.fq * a)
    };
    Gi.prototype.yc = function(a) {
        return 0 == a.pageNumber() ? 0 : a.Bd().width + 2 * Fi.Ea
    };

    function Hi(a, b, c) {
        return b && c ? new G(b, c) : new G(a.width() / 2, a.height() / 2)
    }

    function Ii(a) {
        return a.scale() * (a.$a - 1) + 1
    }

    function Ji(a) {
        var b = a.oe,
            c = a.page,
            d = a.qg,
            f = a.zp,
            g = a.clientX;
        a = a.clientY;
        var h = Hi(b.container(), g, a);
        g = f.Ur;
        c = c.displayObject().getBoundingClientRect();
        d && (h = b.container().displayObject().getBoundingClientRect(), f = 2 * f.$r, b = Ii(b), g = (h.width - f) * b / d.width, b = b / g * (h.height - f), f = c.top + d.top + .5 * b, h = new G(c.left + d.left + d.width / 2, cb(a || f, f, c.top + (new Sd(d.top, d.left + d.width, d.top + d.height, d.left)).bottom - .5 * b)));
        return {
            scale: g,
            position: new G(Math.max(h.x - c.left, 0), Math.max(h.y - c.top, 0))
        }
    }

    function Ki(a) {
        var b = a.oe,
            c = a.scale;
        a = a.position;
        var d = Ii(b),
            f = (c - 1) / (b.$a - 1);
        c /= d;
        b = b.container().displayObject().getBoundingClientRect();
        return {
            Fd: f,
            scrollTop: a.y * c - b.height / 2,
            scrollLeft: a.x * c - b.width / 2
        }
    };
    var Li = x.tg;

    function Mi(a, b, c) {
        K.call(this);
        this.i = b;
        this.Ii = a;
        this.wg = null;
        this.O = c;
        this.Qd = null;
        this.zi = L(this);
        this.He = this.ze = null
    }
    m(Mi, K);
    e = Mi.prototype;
    e.Em = function(a) {
        this.Qd = a
    };
    e.playing = function() {
        return !!this.ze || !!this.He
    };

    function Ni(a, b, c, d, f) {
        if (!a.ze) {
            a.wg = f;
            c || Oi(a);
            a.Wm(a.ze);
            f = a.Ii;
            var g = a.i.view();
            b = new Ei({
                duration: f,
                ob: g.ob(),
                Ic: a.i.Ic(),
                Hc: a.i.Hc(),
                nextPage: a.i.nextPage(),
                bs: b
            });
            c = a.Ei({
                duration: a.Ii,
                qp: c,
                qg: d,
                mp: a.i.nextPage()
            });
            d = new wi;
            d.add(b);
            d.add(c);
            a.ze = d;
            D(a, a.ze.ia, a.Pm, a);
            a.ze.play()
        }
    }

    function Pi(a, b, c, d, f) {
        if (!a.He) {
            a.wg = f;
            c || Oi(a);
            a.Wm(a.He);
            f = a.Ii;
            var g = a.i.view();
            b = new Gi({
                duration: f,
                ob: g.ob(),
                Ic: a.i.Ic(),
                Hc: a.i.Hc(),
                nextPage: a.i.nextPage(),
                cs: b
            });
            c = a.Ei({
                duration: a.Ii,
                qp: c,
                mp: a.i.Ic(),
                qg: d
            });
            d = new wi;
            d.add(b);
            d.add(c);
            a.He = d;
            D(a, a.He.ia, a.Pm, a);
            a.He.play()
        }
    }

    function Oi(a) {
        a.i.Hc().ua("transform", "translateY(-" + a.O.scrollTop() + "px)");
        a.O.Xj(0)
    }
    e.Pm = function() {
        null !== this.wg && (this.wg(), this.wg = null);
        this.He = this.ze = null
    };
    e.hk = function() {
        this.zi.f()
    };
    e.Ei = function(a) {
        var b = a.duration;
        var c = a.qp;
        var d = a.qg;
        this.Qd && this.Qd.rf && d ? (a = Ji({
            oe: this.i,
            page: a.mp,
            zp: Li,
            qg: d
        }), d = Ki({
            oe: this.i,
            position: a.position,
            scale: a.scale,
            qg: d
        }), a = d.scrollTop, c = {
            scale: d.Fd,
            scrollLeft: d.scrollLeft,
            scrollTop: c ? a : 0
        }) : c = {
            scrollLeft: this.O.scrollLeft(),
            scrollTop: c ? 0 : this.O.scrollTop(),
            scale: this.i.scale()
        };
        return new ji({
            duration: b,
            scrollTop: c.scrollTop,
            scrollLeft: c.scrollLeft,
            scale: c.scale,
            Jc: this.O,
            oe: this.i
        })
    };

    function Qi() {
        this.Jb = []
    }
    Qi.prototype.render = function(a) {
        var b = this,
            c = this.Mg(a);
        c && !this.Tg(c) && (c.Sh() ? this.Yd(c) : (a = c.pageNumber(), this.Jb[a] || (this.Jb[a] = !0, this.R().getPage(a, function(a, f) {
            c.ei(a);
            b.Jb[f] = !1;
            b.Yd(c)
        }))))
    };
    Qi.prototype.Sg = function(a) {
        return 3 == a.X
    };
    Qi.prototype.Tg = function(a) {
        return 1 == a.X
    };
    Qi.prototype.Mg = function(a) {
        for (var b = 0; b < a.length; ++b)
            if (!this.Sg(a[b].page)) return a[b].page;
        return null
    };

    function Ri(a) {
        this.Jb = [];
        this.i = a
    }
    v(Ri, Qi);
    Ri.prototype.Ha = function() {
        var a = [],
            b = this.i.Hc();
        a.push({
            le: b.pageNumber(),
            page: b
        });
        b = this.i.nextPage();
        0 != b.pageNumber() && a.push({
            le: b.pageNumber(),
            page: b
        });
        b = this.i.Ic();
        0 != b.pageNumber() && a.push({
            le: b.pageNumber(),
            page: b
        });
        return {
            Pc: a
        }
    };
    Ri.prototype.update = function() {
        this.i.Hc().reset();
        this.i.nextPage().reset();
        this.i.Ic().reset();
        var a = this.Ha();
        this.render(a.Pc)
    };
    Ri.prototype.Yd = function(a) {
        var b = this;
        switch (a.X) {
            case 3:
                break;
            case 2:
                break;
            case 1:
                break;
            case 0:
                a.Za.addHandler(function() {
                    var a = b.Ha();
                    b.render(a.Pc)
                }, this);
                a.render();
                break;
            default:
                throw Error("renderingState is wrong");
        }
    };
    Ri.prototype.R = function() {
        var a = this.i.document();
        w(a);
        return a
    };

    function Si() {
        T.call(this, ["viewer", x.tg.className]);
        this.Ga = new T("pageContainer");
        this.c(this.Ga);
        this.i = null
    }
    v(Si, T);
    e = Si.prototype;
    e.hi = function(a) {
        this.i = a
    };
    e.ob = function() {
        return this.Ga
    };
    e.Z = function(a) {
        this.Ga.Z(a)
    };
    e.width = function() {
        return this.Ga.width()
    };
    e.pa = function(a) {
        this.Ga.pa(a)
    };
    e.height = function() {
        return this.Ga.height()
    };
    var X = x.tg;

    function Ti(a) {
        ti.call(this, a);
        this.O = new vi(this);
        this.F = this.B = this.w = this.a = this.Qd = null;
        this.ef = 0;
        this.sk = !0;
        this.nc = 0;
        this.Tl = null;
        this.Qf = this.Pf = this.Of = 0;
        this.Ya = new Ri(this);
        this.Nf = new Mi(x.Is, this, this.O);
        this.ye = null;
        this.xc = new ki(0, 0);
        this.ue = new ki(0, 0);
        this.Le = new te(0, 0);
        this.Fc.addHandler(function() {
            var a = this.a.displayObject();
            this.ba.Fa = a
        }, this)
    }
    m(Ti, ti);
    e = Ti.prototype;
    e.Jc = function() {
        return this.O
    };
    e.Em = function(a) {
        this.Qd = a;
        this.Nf.Em(a)
    };
    e.Ic = function() {
        w(this.w);
        return this.w
    };
    e.Hc = function() {
        w(this.B);
        return this.B
    };
    e.nextPage = function() {
        w(this.F);
        return this.F
    };
    e.view = function() {
        w(this.a);
        return this.a
    };
    e.u = function(a, b) {
        b = void 0 === b ? !0 : b;
        if (si(this, a) && 0 == this.nc)
            if (this.nc = a, Ui(this), this.sk) Vi(this, a), ri(this), this.sk = !1;
            else {
                this.ye && (this.ye.pause(), this.ye = null);
                switch (this.Hk(a)) {
                    case 0:
                        var c = this.sr;
                        break;
                    case 2:
                        c = this.tr;
                        break;
                    case 1:
                        c = this.pq;
                        break;
                    case 3:
                        c = this.rq;
                        break;
                    default:
                        throw Error("TransitionType is wrong");
                }
                c.call(this, a, b)
            }
    };
    e.af = function(a) {
        1 >= this.D || this.u(this.D - 1, void 0 === a ? !0 : a)
    };
    e.$e = function(a) {
        a = void 0 === a ? !0 : a;
        this.D >= this.o() || this.u(this.D + 1, a)
    };

    function Wi(a) {
        a.Of = a.B.x();
        a.Pf = a.F ? a.F.x() : 0;
        a.Qf = a.w ? a.w.x() : 0
    }

    function Xi(a, b, c) {
        0 > b && a.D >= a.o() || 0 < b && 1 >= a.D || (c ? Zi(a, b) : ((c = a.B) && c.ha(a.Of + b), (c = a.F) && c.ha(a.Pf + b), (c = a.w) && c.ha(a.Qf + b), b = a.Jc().scrollTop(), a.w.ua("transform", "translate(-1px, " + b + "px)"), a.F.ua("transform", "translate(1px, " + b + "px)")))
    }

    function Zi(a, b) {
        a.Nf.playing() || (a.ye = new bi({
            duration: 150,
            Hc: a.B,
            nextPage: a.F,
            Ic: a.w,
            ps: a.Pf + b,
            Tr: a.Of + b,
            vs: a.Qf + b
        }), a.ye.ia.addHandler(function() {
            a.ye = null;
            Ui(a)
        }), a.ye.play())
    }

    function Ui(a) {
        $i(a.B);
        $i(a.w);
        $i(a.F)
    }

    function $i(a) {
        a && a.ua("transform", "")
    }
    e.G = function(a) {
        this.Bb != a && 0 == this.nc && (this.Bb = a, this.N = a * (this.$a - 1) + 1, this.B.G(this.N), aj(this, this.B, 1), bj(this), this.F.G(this.N), aj(this, this.F, 2), this.w.G(this.N), aj(this, this.w, 0), this.Mf.f(this.Bb))
    };
    e.me = function(a) {
        this.G(a);
        var b = this.B.displayObject().getBoundingClientRect();
        a = b.width / this.Le.width;
        b = b.height / this.Le.height;
        a *= this.ue.x();
        b *= this.ue.y();
        a = a - this.xc.x() + X.Ea;
        b = b - this.xc.y() + X.Ea;
        this.O.scrollTo(a, b)
    };
    e.Gd = function(a, b) {
        var c = this.B.displayObject().getBoundingClientRect();
        this.xc = new ki(a, b);
        this.ue = new ki(Math.max(a - c.left, 0), Math.max(b - c.top, 0));
        this.Le = new te(c.width, c.height)
    };
    e.resize = function(a) {
        this.Aa = a;
        this.Jl();
        this.Vb && (this.N = this.Bb * (this.$a - 1) + 1, w(this.B), cj(this, this.B, 1), bj(this), w(this.F), cj(this, this.F, 2), w(this.w), cj(this, this.w, 0))
    };
    e.enable = function(a) {
        this.a = new Si;
        this.a.hi(this);
        this.container().c(this.a);
        this.u(a)
    };
    e.disable = function() {
        ti.prototype.disable.call(this);
        w(this.a);
        this.container().removeChild(this.a);
        this.a = null;
        this.sk = !0
    };
    e.update = function() {
        this.Ya.update()
    };
    e.Oc = function() {
        return [this.D - 1]
    };
    e.im = function(a) {
        var b = this,
            c = a.clientX,
            d = a.clientY,
            f = a.Uo;
        this.Tl || (this.Qd.rf ? this.B.nm().then(function(a) {
            a = Ji({
                oe: b,
                zp: X,
                page: w(b.B),
                qg: a,
                clientX: c,
                clientY: d
            });
            dj(b, a.scale, a.position, f)
        }) : dj(this, 1, Hi(this.g, c, d), !f))
    };

    function dj(a, b, c, d) {
        b = Ki({
            oe: a,
            scale: b,
            position: c
        });
        a.Tl = a.Ei(b.scrollLeft, b.scrollTop, b.Fd, d)
    }
    e.Ei = function(a, b, c, d) {
        var f = this;
        a = new ji({
            oe: this,
            Jc: this.O,
            scrollLeft: a,
            scrollTop: b,
            scale: c,
            duration: d ? X.Lp / 2 : X.Lp
        });
        a.play();
        a.ia.addHandler(function() {
            f.Tl = null;
            f.update()
        });
        return a
    };

    function Vi(a, b) {
        a.B = ej(a, b);
        a.B.H("current");
        aj(a, a.B, 1);
        a.w = ej(a, b - 1);
        aj(a, a.w, 0);
        a.F = ej(a, b + 1);
        aj(a, a.F, 2);
        bj(a);
        fj(a)
    }
    e.sr = function(a, b) {
        var c = this,
            d = ej(this, a + 1);
        d.H("future-next");
        gj(this, this.F).then(function(a) {
            Ni(c.Nf, d, b, a, function() {
                c.hb(c.w);
                c.B.T("current");
                c.B.H("prev");
                c.w = c.B;
                c.F.T("next");
                c.F.H("current");
                c.B = c.F;
                d.T("future-next");
                d.H("next");
                c.F = d;
                fj(c)
            })
        })
    };
    e.tr = function(a, b) {
        var c = this,
            d = ej(this, a - 1);
        d.H("future-prev");
        gj(this, this.w).then(function(a) {
            Pi(c.Nf, d, b, a, function() {
                c.hb(c.F);
                c.B.T("current");
                c.B.H("next");
                c.F = c.B;
                c.w.T("prev");
                c.w.H("current");
                c.B = c.w;
                d.T("future-prev");
                d.H("prev");
                c.w = d;
                fj(c)
            })
        })
    };
    e.pq = function(a, b) {
        var c = this;
        this.hb(this.F);
        this.F = ej(this, a);
        this.F.ha(this.a.width());
        var d = ej(this, a + 1);
        gj(this, this.F).then(function(f) {
            Ni(c.Nf, d, b, f, function() {
                c.hb(c.w);
                c.hb(c.B);
                c.w = ej(c, a - 1);
                c.w.ha(-(c.w.Bd().width + 2 * X.Ea));
                c.w.H("prev");
                c.F.T("next");
                c.F.H("current");
                c.B = c.F;
                d.H("next");
                c.F = d;
                fj(c)
            })
        })
    };
    e.rq = function(a, b) {
        var c = this;
        this.hb(this.w);
        this.w = ej(this, a);
        this.w.ha(-(this.w.Bd().width + 2 * X.Ea));
        var d = ej(this, a - 1);
        gj(this, this.w).then(function(f) {
            Pi(c.Nf, d, b, f, function() {
                c.hb(c.F);
                c.hb(c.B);
                c.F = ej(c, a + 1);
                c.F.ha(c.a.width());
                c.w.T("prev");
                c.w.H("current");
                c.B = c.w;
                d.H("prev");
                c.w = d;
                fj(c);
                Ui(c)
            })
        })
    };

    function gj(a, b) {
        return b && a.Qd && a.Qd.rf ? b.nm() : Promise.resolve(null)
    }

    function fj(a) {
        a.D = a.nc;
        a.kc();
        a.Yb();
        a.nc = 0;
        Ui(a)
    }
    e.Hk = function(a) {
        var b = this.D;
        return a > b ? a == b + 1 ? 0 : 1 : a == b - 1 ? 2 : 3
    };

    function ej(a, b) {
        if (0 >= b || b > a.o()) {
            var c = $g(a.lc, 1);
            return new ui
        }
        var d = $g(a.lc, b);
        c = a.Ua(d);
        c = d.clone({
            scale: c * a.N
        });
        b = new Mg(b, c, a.N);
        b.K = d;
        c = c.height + 2 * X.Ea;
        b.Kc(Math.max((a.Aa.height() - c) / 2, 0));
        a.a.Ga.c(b.displayObject());
        a.Na && b.Za.addHandler(function(a, b) {
            b = this.Ua(b) * oi(b);
            this.Na.render(a, this.N, b)
        }.bind(a, b, d));
        return b
    }

    function cj(a, b, c) {
        if (0 != b.pageNumber()) {
            var d = b.ad(),
                f = a.Ua(d);
            d = d.clone({
                scale: f * a.N
            });
            b.$(d, a.N);
            aj(a, b, c)
        }
    }
    e.hb = function(a) {
        a && 0 != a.pageNumber() && (this.a.Ga.removeChild(a.displayObject()), a.destroy())
    };
    e.Yb = function() {
        var a = this.Ya.Ha().Pc;
        this.Ya.render(a)
    };
    e.Ua = function(a) {
        var b = 2 * (X.Ea + X.ck),
            c = (this.Aa.width() - b) / a.width;
        a = (this.Aa.height() - b) / a.height;
        return Math.min(a, c)
    };

    function aj(a, b, c) {
        if (0 != b.pageNumber()) {
            var d = b.Bd().width + 2 * X.Ea;
            switch (c) {
                case 0:
                    b.ha(-d);
                    break;
                case 1:
                    b.ha(Math.max(a.Aa.width() / 2 - d / 2, 0));
                    break;
                case 2:
                    b.ha(a.a.width());
                    break;
                default:
                    throw Error("slidePath is wrong");
            }
            c = b.Bd().height + 2 * X.Ea;
            b.Kc(Math.max((a.Aa.height() - c) / 2, 0))
        }
    }

    function bj(a) {
        var b = a.B.Bd(),
            c = a.Aa.width(),
            d = b.width + 2 * (X.Ea + X.ck);
        d > c && (c = d);
        a.a.Z(c);
        c = a.Aa.height();
        b = b.height + 2 * (X.Ea + X.ck);
        b > c && (c = b);
        a.a.pa(c)
    }
    e.Jl = function() {
        var a = ah(this.lc),
            b = this.Ua(a);
        a = a.clone({
            scale: b
        });
        a = a.width + 2 * X.Ea;
        a = this.Aa.width() / a * 2;
        this.$a = Math.max(a, this.$a);
        if (Nf) {
            a = this.lc;
            if (-1 == a.Zk) {
                if (1 == a.Hb.length) b = 0;
                else {
                    for (var c = b = 0, d = 1; d < a.Hb.length; ++d) {
                        var f = a.Hb[d].size();
                        f = f.width() * f.height();
                        f > b && (b = f, c = d)
                    }
                    b = c
                }
                a.Zk = b
            }
            a = a.Hb[a.Zk].getViewport();
            b = this.Ua(a);
            a = a.clone({
                scale: b
            });
            a = a.width * a.height * this.$a;
            a > PDFJS.maxCanvasPixels && (this.$a *= PDFJS.maxCanvasPixels / a)
        }
    };
    e.yc = function(a) {
        return 0 == a.pageNumber() ? 0 : a.Bd().width + 2 * X.Ea
    };

    function hj() {
        K.call(this);
        this.j = null;
        this.Vk = 0;
        this.Wa = L(this)
    }
    m(hj, K);
    hj.prototype.Oj = function() {
        return this.Wa
    };

    function ij(a) {
        var b = Object.assign({}, a),
            c = {},
            d;
        for (d in b) "object" == typeof b[d] && (b[d] = ij(b[d]), a = b[d], a._d && (c[a._d] = a));
        b.toString = function() {
            return b._
        };
        b.Ut = function(a) {
            return c[a]
        };
        return b
    };
    var jj = {
            title: {
                _: "t"
            },
            creationTime: {
                _: "ct"
            },
            pageNumber: {
                _: "pn"
            }
        },
        kj = {},
        lj;
    for (lj in jj) jj.hasOwnProperty(lj) && (kj[lj] = ij(jj[lj]));

    function mj() {}
    mj.prototype.Cm = function(a) {
        return a.bc().map(function(a) {
            var b = {};
            return b[kj.title] = a.title(), b[kj.creationTime] = a.creationTime(), b[kj.pageNumber] = a.pageNumber(), b
        })
    };

    function nj(a, b, c) {
        p(b) && (a = Math.max(a, b));
        p(c) && (a = Math.min(a, c));
        return a
    };

    function oj() {
        this.wn = new F;
        this.vq = new F;
        this.Zp = new F;
        this.cl = new F;
        this.kb = null
    }
    e = oj.prototype;
    e.Jj = function(a, b) {
        this.kb = a.split("/").pop();
        a = PDFJS.getDocument(a);
        a.onProgress = this.yn.bind(this);
        a.onPassword = function(a) {
            b ? a(b) : this.cl.f(a)
        }.bind(this);
        a.promise.then(this.vn.bind(this), this.xn.bind(this))
    };
    e.um = function(a, b, c) {
        this.kb = b;
        b = Object.create(null);
        b.data = a;
        a = PDFJS.getDocument(b);
        a.onProgress = this.yn.bind(this);
        a.onPassword = function(a) {
            c ? a(c) : this.cl.f(a)
        }.bind(this);
        a.promise.then(this.vn.bind(this), this.xn.bind(this))
    };
    e.yn = function(a) {
        this.vq.f(nj(a.loaded / a.total, 0, 1))
    };
    e.vn = function(a) {
        this.wn.f(new sh(a));
        a.getDownloadInfo().then(this.$p.bind(this))
    };
    e.xn = function(a) {
        var b = a && a.message,
            c = "An error occurred while loading the PDF.";
        a instanceof PDFJS.it ? c = "Invalid or corrupted PDF file." : a instanceof PDFJS.pt ? c = "Missing PDF file." : a instanceof PDFJS.Ct && (c = "Unexpected server response.");
        console.log(c, {
            message: b
        });
        throw Error(c);
    };
    e.$p = function() {
        this.Zp.f()
    };

    function pj(a, b, c) {
        T.call(this, "thumbnail");
        this.va = a;
        this.W = c;
        this.Eb = null;
        this.X = 0;
        this.Za = new F;
        this.K = null;
        this.Gb = b.width() / b.height();
        this.Xb = b.width() * x.Gp;
        this.Xb < b.width() && (this.Xb = b.width());
        this.Wg = Math.floor(this.Xb / this.Gb);
        this.Mi = this.Xb;
        this.Mk = this.Wg;
        this.Z(b.width());
        this.pa(b.height())
    }
    v(pj, T);
    e = pj.prototype;
    e.pageNumber = function() {
        return this.va
    };
    e.ei = function(a) {
        this.K = a.getViewport(1)
    };
    e.Sh = function() {
        return !0
    };
    e.ad = function() {
        return this.K
    };
    e.$ = function(a) {
        this.Z(a.width());
        this.pa(a.height());
        this.Mi = a.width();
        this.Mk = a.height();
        this.Mi < this.Xb && (this.Mi = this.Xb, this.Mk = this.Wg);
        null !== this.Eb && (this.Eb.style.width = a.width() + "px", this.Eb.style.height = a.height() + "px")
    };
    e.reset = function() {
        3 != this.X && (this.X = 0)
    };
    e.render = function() {
        if (0 != this.X) throw Error("Page renderingState is wrong");
        this.X = 1;
        var a = document.createElement("img");
        a.className = "content";
        a.width = this.Mi;
        a.height = this.Mk;
        a.style.width = this.width() + "px";
        a.style.height = this.height() + "px";
        a.setAttribute("hidden", "hidden");
        this.c(a);
        this.Eb = a;
        a.onload = function() {
            this.Eb.removeAttribute("hidden");
            this.X = 3;
            this.Za.f()
        }.bind(this);
        a.src = x.Ls + "/page-" + qj(this.va, this.W.toString().length) + ".jpg"
    };
    e.destroy = function() {
        this.X = 0;
        this.Eb && (this.Eb.width = 0, this.Eb.height = 0, this.removeChild(this.Eb), this.Eb = null)
    };

    function qj(a, b) {
        a = a.toString();
        b -= a.length;
        for (var c = 0; c < b; ++c) a = "0" + a;
        return a
    };

    function rj(a, b) {
        T.call(this, "thumbnail");
        this.va = a;
        this.fa = this.M = null;
        this.X = 0;
        this.Za = new F;
        this.K = null;
        this.Gb = b.width() / b.height();
        this.Xb = b.width() * x.Gp;
        this.Xb < b.width() && (this.Xb = b.width());
        this.Wg = Math.floor(this.Xb / this.Gb);
        this.gf = this.Xb;
        this.mk = this.Wg;
        this.sl = 0;
        this.Z(b.width());
        this.pa(b.height())
    }
    v(rj, T);
    e = rj.prototype;
    e.pageNumber = function() {
        return this.va
    };
    e.ei = function(a) {
        this.fa = a;
        this.K = a.getViewport(1);
        this.sl = this.gf / this.K.width
    };
    e.Sh = function() {
        return null !== this.fa
    };
    e.ad = function() {
        return this.K
    };
    e.$ = function(a) {
        this.Z(a.width());
        this.pa(a.height());
        this.gf = a.width();
        this.mk = a.height();
        this.gf < this.Xb && (this.gf = this.Xb, this.mk = this.Wg);
        null !== this.K && (this.sl = this.gf / this.K.width);
        null !== this.M && (this.M.style.width = a.width() + "px", this.M.style.height = a.height() + "px")
    };
    e.reset = function() {
        this.X = 0
    };
    e.render = function() {
        var a = this;
        if (0 != this.X) throw Error("Page renderingState is wrong");
        this.X = 1;
        var b = null !== this.M ? this.M : null,
            c = document.createElement("canvas");
        c.className = "content";
        c.width = this.gf;
        c.height = this.mk;
        c.style.width = this.width() + "px";
        c.style.height = this.height() + "px";
        c.setAttribute("hidden", "hidden");
        this.c(c);
        this.M = c;
        c = {
            canvasContext: c.getContext("2d"),
            viewport: this.K.clone({
                scale: this.sl
            })
        };
        this.fa.render(c, function(c) {
            null !== c ? a.X = 0 : (a.M.removeAttribute("hidden"), null !== b && (b.width =
                0, b.height = 0, a.removeChild(b), b = null), a.X = 3, a.Za.f())
        })
    };
    e.destroy = function() {
        this.X = 0;
        if (this.fa) {
            var a = this.fa;
            null !== a.Hf && a.Hf.cancel();
            this.fa.cleanup()
        }
        this.M && (this.M.width = 0, this.M.height = 0, this.removeChild(this.M), this.M = null)
    };

    function sj() {
        this.en = !1;
        this.W = 0
    }
    sj.prototype.Dm = function(a) {
        this.en = a
    };
    sj.prototype.qa = function(a) {
        this.W = a
    };

    function tj(a, b, c) {
        return a.en ? new rj(b, c) : new pj(b, c, a.W)
    };

    function uj(a) {
        var b = a.creationTime,
            c = a.pageNumber;
        this.kb = a.title;
        this.Xp = b;
        this.va = c
    }
    uj.prototype.title = function() {
        return this.kb
    };
    uj.prototype.pageNumber = function() {
        return this.va
    };
    uj.prototype.creationTime = function() {
        return this.Xp
    };

    function vj() {}
    vj.prototype.load = function(a, b) {
        a.forEach(function(a, d) {
            b.eb.splice(d || 0, 0, new uj({
                title: a[kj.title],
                creationTime: a[kj.creationTime],
                pageNumber: a[kj.pageNumber]
            }));
            b.se.f()
        })
    };

    function wj() {}
    wj.prototype.encode = function(a) {
        var b = a.ni,
            c = a.bc,
            d = {};
        return d.p = a.pageNumber, d.m = b, d.b = c, d
    };
    wj.prototype.decode = function(a) {
        return {
            pageNumber: a.p,
            ni: a.m,
            bc: a.b
        }
    };

    function xj() {
        this.Cg = [];
        this.Dg = 0
    }

    function yj(a, b) {
        B(b.displayObject(), "focus", a.Wp, !1, a);
        B(b.displayObject(), "blur", a.Vp, !1, a);
        a.Cg.push(b)
    }
    xj.prototype.Wp = function(a) {
        a = w(a.Oa);
        var b = Qa(a.currentTarget, Element);
        a: {
            var c = a.currentTarget;
            for (var d = 0; d < this.Cg.length; ++d)
                if (this.Cg[d].displayObject() == c) {
                    c = d;
                    break a
                } c = 0
        }
        this.Dg = c;
        "BUTTON" == a.currentTarget.tagName && H(b, "active")
    };
    xj.prototype.Vp = function(a) {
        a = w(a.Oa);
        var b = Qa(a.currentTarget, Element);
        "BUTTON" == a.currentTarget.tagName && J(b, "active")
    };

    function zj(a) {
        T.call(this, "dialogContainerOverlay");
        this.yl = new xj;
        this.qn = !1;
        this.aa = a;
        this.Rf = new F;
        this.vf = new F;
        var b = new T("dialogCenter");
        this.tb = new T(["dialog", "askPassword"]);
        var c = new T(["row", "text"]);
        c.U(a.ya("ED_ASK_PASSWORD_DIALOG_LABEL"));
        this.tb.c(c);
        c = new T(["row", "control"]);
        this.La = new T("passwordInput", "INPUT");
        yj(this.yl, this.La);
        this.La.displayObject().type = "password";
        c.c(this.La);
        this.tb.c(c);
        this.ve = new T(["row", "error", "hidden"]);
        this.ve.U(a.ya("ED_ASK_PASSWORD_DIALOG_INVALID_PASSWORD_LABEL"));
        this.tb.c(this.ve);
        this.pk(this.tb);
        b.c(this.tb);
        this.c(b);
        B(window, "keydown", this.xf, !0, this)
    }
    v(zj, T);
    e = zj.prototype;
    e.bg = function() {
        qd(window, "keydown", this.xf, !0, this)
    };
    e.wp = function(a) {
        this.qn = a
    };
    e.focus = function() {
        this.La.displayObject().focus()
    };
    e.$ = function(a) {
        if (this.qn) {
            var b = a.width() / x.yb,
                c = a.height() / x.$h;
            b = Math.min(b, c);
            1 > b ? (If(this.tb.displayObject(), "center center"), ug(this.tb.displayObject(), b), a.height() < this.tb.height() && S(this.tb, "margin-top", (a.height() - this.tb.height()) / 2 + "px"), a.width() < this.tb.width() && S(this.tb, "margin-left", (a.width() - this.tb.width()) / 2 + "px")) : (If(this.tb.displayObject(), ""), ug(this.tb.displayObject(), 1))
        }
    };
    e.vp = function() {
        this.ve.T("hidden")
    };
    e.pk = function(a) {
        var b = new T(["row", "control"]),
            c = new T(["submit"], "BUTTON");
        yj(this.yl, c);
        c.U(this.aa.ya("ED_OK"));
        c.C.addHandler(this.xl, this);
        b.c(c);
        a.c(b)
    };
    e.xf = function(a) {
        a.stopPropagation();
        13 == a.keyCode ? (a = this.La.displayObject().value, 0 < a.length && this.Rf.f(a)) : 9 == a.keyCode && (a.preventDefault(), a = this.yl, ++a.Dg, a.Dg >= a.Cg.length && (a.Dg = 0), a.Cg[a.Dg].displayObject().focus())
    };
    e.xl = function() {
        var a = this.La.displayObject().value;
        0 < a.length && this.Rf.f(a)
    };

    function Aj(a) {
        N.call(this, {
            S: "mobile-password-dialog-view"
        });
        var b = this;
        this.aa = a;
        this.Rf = L(this);
        this.vf = L(this);
        this.ub = new N({
            S: "ask-password-dialog-container"
        });
        var c = new N({
            J: R(this.ub, "header")
        });
        c.U(a.ya("ED_ASK_PASSWORD_DIALOG_LABEL"));
        this.ub.c(c);
        c = new N({
            J: R(this.ub, "password-container")
        });
        this.ub.c(c);
        this.La = new N({
            J: R(this.ub, "input"),
            Xf: "INPUT"
        });
        this.La.setAttribute("type", "password");
        var d = new N({
            J: R(this.ub, "password-placeholder")
        });
        c.c(d);
        d.U(this.aa.ya("ED_ASK_PASSWORD_DIALOG_PLACEHOLDER"));
        c.c(this.La);
        this.ve = new N({
            J: R(this.ub, "error")
        });
        this.ve.U(a.ya("ED_ASK_PASSWORD_DIALOG_INVALID_PASSWORD_LABEL"));
        this.ub.c(this.ve);
        this.pk();
        this.c(this.ub);
        C(this, this.La.displayObject(), "input", this.Nk, this);
        C(this, this.La.displayObject(), "focus", this.Nk, this);
        C(this, this.La.displayObject(), "focusout", function() {
            b.Nk();
            b.vf.f()
        }, this);
        C(this, this.La.displayObject(), "keydown", this.xf, this);
        this.Y("mobile-app", lg);
        this.ub.ua("margin-bottom", "50px")
    }
    m(Aj, N);
    e = Aj.prototype;
    e.focus = function() {
        this.La.focus()
    };
    e.$ = function() {
        this.Y("landscape", hh())
    };
    e.wp = function() {};
    e.vp = function() {
        this.ub.Y("incorrect-password", !0);
        this.ub.ua("margin-bottom", 50 - this.ve.height() + "px")
    };
    e.xf = function(a) {
        a.stopPropagation();
        13 == a.keyCode && (a = this.La.displayObject().value, 0 < a.length && this.Rf.f(a))
    };
    e.pk = function() {
        var a = new N({
            J: R(this.ub, "submit"),
            Xf: "BUTTON"
        });
        a.U(this.aa.ya("ED_OK"));
        D(this, a.C, this.xl, this);
        this.ub.c(a)
    };
    e.xl = function() {
        var a = this.La.displayObject().value;
        0 < a.length && this.Rf.f(a)
    };
    e.Nk = function() {
        var a = !!this.La.displayObject().value.length || document.activeElement == this.La.displayObject();
        this.ub.Y("hide-placeholder", a)
    };

    function Y(a, b, c, d, f, g) {
        this.ea = new U(a.clientWidth, a.clientHeight);
        this.Wb = b;
        this.Ia = null;
        this.xa = [];
        this.R = this.j = null;
        this.jb = [];
        this.P = null;
        this.Sb = c;
        this.ba = new ii(this.a.ka.displayObject(), $f);
        this.Rc = new mh;
        this.h = d;
        this.na = {
            ak: 0,
            Da: 1,
            Gj: !1
        };
        this.eb = f;
        this.Do = new wj;
        this.ee = new sj;
        this.Wa = new F;
        this.ce = new F;
        this.Co = new F;
        this.vf = new F;
        this.Ri = {};
        document.title = b.title();
        g && Bj(this, g);
        this.eb.se.addHandler(this.Kl, this);
        M && fg && (B(document.body, "focusin", function() {
            var a = Je();
            !a || "INPUT" != a.nodeName &&
                "TEXTAREA" != a.nodeName || H(document.body, "keyboard-showed")
        }, !1, this), B(document.body, "focusout", function() {
            J(document.body, "keyboard-showed")
        }, !1, this))
    }
    Y.prototype.ni = function() {
        return this.Sb
    };
    Y.prototype.viewMode = Y.prototype.ni;
    Y.prototype.Oj = function() {
        return this.Wa
    };
    Y.prototype.pageChangedEvent = Y.prototype.Oj;
    Y.prototype.Cp = function() {
        return this.ce
    };
    Y.prototype.stateChangedEvent = Y.prototype.Cp;
    Y.prototype.Js = function() {
        return this.Co
    };
    Y.prototype.startupCompletedEvent = Y.prototype.Js;
    Y.prototype.Jj = function(a) {
        Cj(this, "loadFromUrl", [a])
    };
    Y.prototype.um = function(a, b) {
        Cj(this, "loadBinary", [a, b])
    };
    Y.prototype.title = function() {
        return this.Wb.title()
    };
    Y.prototype.title = Y.prototype.title;
    Y.prototype.o = function() {
        w(this.R);
        return this.R.o()
    };
    Y.prototype.pagesCount = Y.prototype.o;
    Y.prototype.Fs = function(a) {
        this.na.Da = a
    };
    Y.prototype.setPageNumber = Y.prototype.Fs;
    Y.prototype.Dm = function() {
        this.a.cd(!1);
        this.ee.Dm(!0)
    };
    Y.prototype.ss = function() {
        return this.Ri
    };
    Y.prototype.persistState = Y.prototype.ss;
    e = Y.prototype;
    e.Kl = function() {
        var a = (new mj).Cm(this.eb);
        a = {
            pageNumber: this.j.Da(),
            ni: this.Sb,
            bc: a
        };
        a = this.Do.encode(a);
        Tb(a, this.Ri) || (this.Ri = a, this.ce.f())
    };
    e.kc = function(a) {
        this.Wa.f(a)
    };
    e.Bc = function(a, b) {
        this.xa[a] = new b(this.a.ka);
        this.xa[a].Wj(this.Wb.Ye());
        this.xa[a].ba = this.ba;
        this.xa[a].Wa.addHandler(this.Se, this)
    };
    e.Xd = function(a, b, c) {
        this.jb[a] = new b(this.a, c, this.ee);
        this.jb[a].Wj(this.Wb.Ye())
    };
    e.Ub = function(a) {
        this.j && this.j.disable();
        this.P && this.P.disable();
        this.j = this.xa[a];
        this.jb[a] && (this.P = this.jb[a]);
        this.Sb = a;
        this.Rc.Zj(this.j)
    };

    function Bj(a, b) {
        b = a.Do.decode(b);
        a.na.Da = b.pageNumber;
        a.Sb = b.ni;
        (b = b.bc) && (new vj).load(b, a.eb)
    }

    function Cj(a, b, c) {
        var d = new oj;
        d.wn.addHandler(a.rd, a);
        d.cl.addHandler(a.Cq, a);
        var f = "";
        a.Wb.on || "" == a.Wb.nh || (f = a.Wb.nh);
        c.push(f);
        "loadFromUrl" == b ? d.Jj.apply(d, ba(c)) : d.um.apply(d, ba(c))
    }
    e.Cq = function(a) {
        var b = this;
        Dj(this.a);
        this.a.Bj(!0);
        null == this.Ia ? (this.Ia = fg ? new Aj(this.Wb.ke()) : new zj(this.Wb.ke()), this.h.Bm && this.Ia.wp(!0), this.Ia.$(this.ea), this.Ia.vf.addHandler(this.cn, this), this.Ia.Rf.addHandler(function(c) {
            a(c + b.Wb.nh)
        }, this), this.a.c(this.Ia.displayObject()), M || this.Ia.focus()) : this.Ia.vp()
    };
    e.rd = function(a) {
        this.R = a;
        this.Ia && (this.a.Bj(!1), this.a.removeChild(this.Ia.displayObject()), zd(this.Ia));
        this.ee.qa(a.o());
        fg && (J(window.document.body, "keyboard-showed"), this.cn())
    };

    function Ej(a) {
        a.a.Gm();
        Dj(a.a);
        a.na.Gj = !0;
        a.Co.f()
    }
    e.Se = function(a) {
        this.na.Da = a;
        this.Kl()
    };
    e.cn = function() {
        this.vf.f()
    };
    var Fj = Ub();
    Fj.Bm = !1;

    function Gj(a, b) {
        vd.call(this);
        a = this.Oh = a;
        a = za(a) && 1 == a.nodeType ? this.Oh : this.Oh ? this.Oh.body : null;
        this.js = !!a && "rtl" == Re(a);
        this.ip = B(this.Oh, gc ? "DOMMouseScroll" : "mousewheel", this, b)
    }
    v(Gj, vd);
    Gj.prototype.handleEvent = function(a) {
        var b = 0,
            c = 0,
            d = a.Oa;
        "mousewheel" == d.type ? (a = Hj(-d.wheelDelta), p(d.wheelDeltaX) ? (b = Hj(-d.wheelDeltaX), c = Hj(-d.wheelDeltaY)) : c = a) : (a = d.detail, 100 < a ? a = 3 : -100 > a && (a = -3), p(d.axis) && d.axis === d.HORIZONTAL_AXIS ? b = a : c = a);
        t(this.jp) && (b = cb(b, -this.jp, this.jp));
        t(this.kp) && (c = cb(c, -this.kp, this.kp));
        this.js && (b = -b);
        b = new Ij(a, d, b, c);
        this.dispatchEvent(b)
    };

    function Hj(a) {
        return hc && (ic || kc) && 0 != a % 40 ? a : a / 40
    }
    Gj.prototype.cc = function() {
        Gj.V.cc.call(this);
        rd(this.ip);
        this.ip = null
    };

    function Ij(a, b, c, d) {
        Wc.call(this, b);
        this.type = "mousewheel";
        this.detail = a;
        this.deltaX = c;
        this.deltaY = d
    }
    v(Ij, Wc);

    function Jj(a) {
        N.call(this, {
            S: a.S,
            Id: !0
        });
        this.wq = 15;
        this.Ca = this.mc = this.sd = this.vb = 0;
        this.uq = a.qc || 1;
        this.ho = this.nl = 0;
        this.er = 100;
        this.Uf = E(this, new N({
            J: R(this, "up")
        }));
        this.c(this.Uf);
        this.Ma = E(this, new N({
            S: "thumb"
        }));
        this.c(this.Ma);
        this.Ma.c(E(this, new N({
            J: R(this.Ma, "background")
        })));
        this.nf = E(this, new N({
            J: R(this, "down")
        }));
        this.c(this.nf);
        this.ij = this.Jf = null;
        this.Zd = L(this);
        this.xr = L(this);
        this.Kf = new wf(this.er);
        C(this, this.Kf, "tick", this.Sq, this);
        C(this, this, $d, this.No, this, de);
        C(this,
            this.Uf, $d, this.Wq, this, de);
        C(this, this.Ma, $d, this.jl, this, de);
        C(this, this.nf, $d, this.Gq, this, de);
        C(this, document.body, ae, this.Lq, this)
    }
    m(Jj, N);
    e = Jj.prototype;
    e.ne = function(a) {
        Kj(this, a)
    };
    e.qc = function() {
        return this.uq
    };
    e.Ye = function() {
        return this.vb
    };
    e.scale = function() {
        return this.fh
    };
    e.G = function(a) {
        this.Fm(a)
    };
    e.ng = function(a, b, c, d) {
        d = void 0 === d ? 0 : d;
        w(b <= c);
        this.vb = a;
        this.sd = b;
        this.mc = c;
        this.nl = d;
        Lj(this);
        this.ne(this.Ca)
    };

    function Kj(a, b) {
        b = nj(b, a.sd, a.mc);
        a.Ca != b && (a.Ca = b, Mj(a), a.Zd.f())
    }
    e.No = function() {};
    e.Wq = function(a) {
        a.preventDefault();
        a = -this.qc();
        Kj(this, this.Ca + a);
        Nj(this, this.Uf, -this.qc())
    };
    e.Gq = function(a) {
        a.preventDefault();
        a = this.qc();
        Kj(this, this.Ca + a);
        Nj(this, this.nf, this.qc())
    };

    function Nj(a, b, c) {
        a.Jf = b;
        C(a, a.Jf, "mouseover", a.Pn, a);
        C(a, a.Jf, "mouseout", a.On, a);
        C(a, document, ae, a.io, a);
        a.Kf.stop();
        a.ij = function() {
            Kj(this, this.Ca + this.ho)
        };
        a.ho = c;
        a.Kf.start()
    }
    e.io = function() {
        w(this.Jf);
        Cd(this, this.Jf, "mouseover", this.Pn, this);
        Cd(this, this.Jf, "mouseout", this.On, this);
        Cd(this, document, ae, this.io, this);
        this.Kf.stop();
        this.ij = null
    };
    e.Pn = function() {
        this.Kf.start()
    };
    e.On = function() {
        this.Kf.stop()
    };
    e.Sq = function() {
        this.ij && this.ij()
    };
    e.jl = function(a) {
        this.xr.f();
        a.preventDefault();
        C(this, document.body, be, this.Zi, this);
        this.Ll(!0)
    };
    e.Ll = function(a) {
        this.Ma.Y("active", a)
    };
    e.Lq = function() {
        Cd(this, document.body, be, this.Zi, this);
        this.Ll(!1)
    };
    e.Zi = function() {};
    e.ga = function() {
        Lj(this)
    };

    function Oj(a) {
        Jj.call(this, a);
        this.Cn = 0
    }
    m(Oj, Jj);

    function Lj(a) {
        var b = a.height() - a.Uf.height() - a.nf.height();
        b = 0 == a.mc - a.sd ? b : Math.max(a.wq, Math.ceil(b * (a.Ye() / (a.mc - a.sd + a.Ye()))));
        a.Ma.pa(b);
        Mj(a)
    }

    function Mj(a) {
        var b = Pj(a);
        0 == a.mc - a.sd ? a.Ma.Kc(b.top) : a.Ma.Kc(b.top + Math.round((a.Ca - a.sd) / (a.mc - a.sd) * b.height));
        a.Uf.Pa(!!a.Ca);
        a.nf.Pa(a.Ca != a.mc)
    }

    function Pj(a) {
        var b = new Wd(0, 0, 0, 0);
        b.top = a.Uf.height();
        b.height = a.height() - a.nf.height() - a.Ma.height() - b.top;
        b.left = a.Ma.x();
        return b
    }
    Oj.prototype.No = function(a) {
        var b;
        if (b = !a.defaultPrevented) b = this.Ma.displayObject().getBoundingClientRect(), b = !(a.clientY >= b.top && a.clientY <= b.top + b.height);
        if (b) {
            b = this.displayObject().getBoundingClientRect();
            var c = Pj(this);
            a = (a.clientY - (b.top - c.top)) / this.fh;
            b = 0 == this.nl ? this.Ye() : this.nl;
            a = a <= this.Ma.y() ? -b : b;
            this.ne(this.Ca + a)
        }
    };
    Oj.prototype.jl = function(a) {
        Jj.prototype.jl.call(this, a);
        var b = this.Ma.displayObject().getBoundingClientRect();
        this.Cn = a.clientY - Math.round(b.top);
        this.Zi(a)
    };
    Oj.prototype.Zi = function(a) {
        var b = this.displayObject().getBoundingClientRect(),
            c = Pj(this);
        Kj(this, (a.clientY - b.top - c.top * this.fh - this.Cn) / (c.height * this.fh) * (this.mc - this.sd) + this.sd)
    };
    var Qj = new Uc;

    function Rj(a) {
        var b = a.Qj,
            c = a.gs,
            d = void 0 === a.Tj ? null : a.Tj;
        Oj.call(this, {
            S: a.S,
            qc: a.qc
        });
        var f = this;
        this.Gf = b;
        this.al = this.Io = !1;
        this.iq = c;
        this.ph = d;
        b.ua("overflow", "hidden");
        D(this, this.Zd, function() {
            b.displayObject().scrollTop = f.Ca
        });
        C(this, b, "scroll", function() {
            f.ne(b.displayObject().scrollTop)
        }, this);
        this.ph ? Sj(this, this.ph) : (Sj(this, this.Gf), Sj(this, this));
        c ? (this.ed(0), this.ph ? (C(this, this.ph, "mouseenter", this.il, this), C(this, this.ph, "mouseleave", this.hl, this)) : (C(this, this.Gf, "mouseover", this.il,
            this), C(this, this, "mouseover", this.il, this), C(this, this.Gf, "mouseout", this.hl, this), C(this, this, "mouseout", this.hl, this))) : this.ed(1)
    }
    m(Rj, Oj);
    e = Rj.prototype;
    e.ng = function(a, b, c, d) {
        d = void 0 === d ? 0 : d;
        this.yp(0 < c);
        Oj.prototype.ng.call(this, a, b, c, d)
    };
    e.Hj = function() {
        this.ne(this.Gf.displayObject().scrollTop)
    };
    e.Ll = function(a) {
        this.Io = a;
        Tj(this)
    };
    e.il = function(a) {
        a && (this.contains(a.relatedTarget) || this.Gf.contains(a.relatedTarget)) || (this.al = !0, Tj(this))
    };
    e.hl = function(a) {
        a && (null == a.relatedTarget || this.contains(a.relatedTarget) || this.Gf.contains(a.relatedTarget)) || (this.al = !1, Tj(this))
    };

    function Tj(a) {
        a.iq && a.ed(a.Io || a.al ? .5 : 0)
    }

    function Sj(a, b) {
        b = new Gj(b.displayObject(), {
            passive: !0
        });
        C(a, b, Qj, function(b) {
            !vf(b.Oa) && b.deltaY && (b = 0 < b.deltaY ? a.qc() : -a.qc(), a.ne(a.Ca + b))
        }, a)
    };

    function Uj(a) {
        N.call(this, {
            S: a
        });
        a = new N({
            J: R(this, "thumb")
        });
        Gg(this, a)
    }
    m(Uj, N);

    function Vj(a, b) {
        this.od = a;
        this.Zd = b
    }
    Vj.prototype.scrollY = function() {
        var a = this.od.getComputedPosition().y;
        return isNaN(a) ? 0 : -a
    };
    Vj.prototype.Nj = function() {
        return this.Zd
    };
    Vj.prototype.Yj = function(a) {
        this.scrollY() != a && this.od.scrollTo(0, -a)
    };

    function Wj(a) {
        K.call(this);
        var b = this;
        this.g = a;
        this.ah = L(this);
        C(this, a, "scroll", function() {
            b.ah.f()
        })
    }
    m(Wj, K);
    Wj.prototype.scrollY = function() {
        return this.g.scrollTop
    };
    Wj.prototype.Nj = function() {
        return this.ah
    };
    Wj.prototype.Yj = function(a) {
        this.g.scrollTop = a
    };

    function Xj(a) {
        var b = void 0 === a.S ? "vertical-scrollbar" : a.S,
            c = void 0 === a.ms ? "mobile-vertical-scrollbar" : a.ms,
            d = a.Qj,
            f = a.du,
            g = a.Nt,
            h = void 0 === a.Tj ? null : a.Tj;
        a = void 0 === a.qc ? 20 : a.qc;
        K.call(this);
        this.ta = this.od = null;
        this.Mo = f || null;
        this.Tm = g || null;
        this.mc = 0;
        if (M) {
            var k = L(this);
            b = {
                fadeScrollbars: !0,
                scrollX: !1,
                scrollY: !0,
                bounce: !1,
                deceleration: .006,
                useTransition: !1,
                preventDefault: !0,
                disablePointer: !0,
                disableTouch: !1,
                disableMouse: !1,
                onScrollHandler: function() {
                    k.f()
                }
            };
            c = new Uj(c);
            b.indicators = {
                el: c.displayObject(),
                shrink: "scale"
            };
            this.od = new IScroll(d.displayObject(), b);
            this.O = new Vj(this.od, k)
        } else this.ta = E(this, new Rj({
            S: b,
            qc: a,
            Qj: d,
            gs: !0,
            Tj: h
        })), this.O = new Wj(d.displayObject(), this.ta), c = this.ta;
        D(this, this.O.Nj(), this.ao, this);
        this.po = w(c)
    }
    m(Xj, K);
    e = Xj.prototype;
    e.Jc = function() {
        return this.O
    };
    e.ng = function(a, b) {
        this.mc = Math.max(0, b - a);
        this.od ? this.od.setScrollHeight(b) : this.ta && this.ta.ng(a, 0, Math.max(this.mc, 0));
        this.ao()
    };
    e.Fm = function(a) {
        this.ta && this.ta.Fm(a)
    };
    e.Hj = function() {
        this.ta && this.ta.Hj()
    };
    e.ao = function() {
        if (this.Mo) {
            var a = Math.min(this.Jc().scrollY(), 60);
            this.Mo.style.height = Ue(a)
        }
        this.Tm && (a = this.mc - this.Jc().scrollY(), this.Tm.style.height = Ue(Math.min(a, 60)))
    };
    e.kf = function() {
        K.prototype.kf.call(this);
        this.od && this.od.destroy()
    };

    function Yj(a) {
        K.call(this);
        var b = this;
        this.g = a;
        this.ah = L(this);
        C(this, this.g, "scroll", function() {
            b.ah.f()
        })
    }
    m(Yj, K);
    Yj.prototype.scrollY = function() {
        return this.g.scrollTop
    };
    Yj.prototype.Nj = function() {
        return this.ah
    };
    Yj.prototype.Yj = function(a) {
        this.g.scrollTop = a
    };

    function Zj(a) {
        var b = a.np,
            c = a.Pt;
        N.call(this, {
            S: a.S,
            Id: a.Id,
            tabIndex: -1
        });
        this.Gh = new Map;
        this.$m = c || this;
        this.Md = new N;
        Gg(this.$m, this.Md);
        this.Hd(new Yj(this.$m.displayObject()));
        this.gb = b;
        D(this, this.gb.se, this.Rq, this)
    }
    m(Zj, N);
    Zj.prototype.Jc = function() {
        return this.O
    };
    Zj.prototype.Hd = function(a) {
        var b = this;
        this.mh(this.O);
        this.O = a;
        E(this, this.O);
        D(this, this.O.Nj(), function() {
            document.body.contains(b.displayObject()) && b.gb.ne(b.O.scrollY())
        })
    };
    Zj.prototype.ga = function() {
        var a = this.displayObject();
        var b = Be(a),
            c = A && a.currentStyle;
        if (c && "CSS1Compat" == (b ? new Ke(Be(b)) : Ja || (Ja = new Ke)).cg.compatMode && "auto" != c.width && "auto" != c.height && !c.boxSizing) b = We(a, c.width, "width", "pixelWidth"), a = We(a, c.height, "height", "pixelHeight"), a = new te(b, a);
        else {
            c = Ve(a);
            if (A) {
                b = Xe(a, "paddingLeft");
                var d = Xe(a, "paddingRight"),
                    f = Xe(a, "paddingTop"),
                    g = Xe(a, "paddingBottom");
                b = new Sd(f, d, g, b)
            } else b = Qe(a, "paddingLeft"), d = Qe(a, "paddingRight"), f = Qe(a, "paddingTop"), g = Qe(a,
                "paddingBottom"), b = new Sd(parseFloat(f), parseFloat(d), parseFloat(g), parseFloat(b));
            !A || 9 <= Number(wc) ? (d = Qe(a, "borderLeftWidth"), f = Qe(a, "borderRightWidth"), g = Qe(a, "borderTopWidth"), a = Qe(a, "borderBottomWidth"), a = new Sd(parseFloat(g), parseFloat(f), parseFloat(a), parseFloat(d))) : (d = Ze(a, "borderLeft"), f = Ze(a, "borderRight"), g = Ze(a, "borderTop"), a = Ze(a, "borderBottom"), a = new Sd(g, f, a, d));
            a = new te(c.width - a.left - b.left - b.right - a.right, c.height - a.top - b.top - b.bottom - a.bottom)
        }
        c = this.gb;
        c.Qe = isNaN(a.height) ? 0 :
            a.height;
        ak(c)
    };
    Zj.prototype.Rq = function() {
        this.Y("with-scroll", this.gb.Ne > this.gb.Qe);
        this.Md.pa(this.gb.Ne);
        this.O.Yj(this.gb.Ca);
        this.Md.ua("padding-top", this.gb.Kk + "px");
        bk(this)
    };

    function bk(a) {
        var b = ck(a.gb);
        a.Gh.forEach(function(c, d) {
            0 > b.indexOf(d) && (a.Gh.delete(d), a.Md.removeChild(c), a.mh(c))
        });
        for (var c = 0; c < b.length; ++c) {
            var d = b[c],
                f = void 0;
            a.Gh.has(d) ? f = a.Gh.get(d) : (f = a.an(d), E(a, f), a.Gh.set(d, f));
            a.Md.uj(f, c);
            f.pa(a.gb.wf)
        }
        a.O.Yj(a.gb.Ca)
    };

    function dk() {
        K.call(this);
        this.wf = this.Ne = this.Qe = this.Ca = 0;
        this.Qi = [];
        this.rn = this.Ji = this.Kk = 0;
        this.se = L(this)
    }
    m(dk, K);
    dk.prototype.invalidate = function() {
        this.pd()
    };

    function ek(a, b, c) {
        c && (a.wf = c);
        a.Qi = b;
        a.Ne = a.wf * b.length;
        a.pd()
    }

    function ck(a) {
        return a.Qi.slice(a.Ji, a.Ji + a.rn)
    }
    dk.prototype.ne = function(a) {
        p(this.Qe) && this.Ca != a && (this.Ca = a, ak(this))
    };

    function ak(a) {
        a.Ca = nj(a.Ca, 0, Math.max(a.Ne - a.Qe, 0));
        a.pd()
    }
    dk.prototype.pd = function() {
        this.Ji = Math.floor(Math.max(0, this.Ca - (M ? this.Qe : 0)) / this.wf);
        this.Kk = this.wf * this.Ji;
        this.rn = Math.ceil((Math.min(this.Ne, this.Ca + this.Qe + (M ? this.Qe : 0)) - this.Kk) / this.wf);
        this.se.f()
    };

    function fk(a, b) {
        N.call(this, b);
        this.oq = a
    }
    m(fk, N);
    fk.prototype.item = function() {
        return this.oq
    };

    function gk(a) {
        var b = a.ls,
            c = a.hs,
            d = a.days,
            f = a.ns,
            g = a.Ss,
            h = a.Qr;
        this.dr = a.zs;
        this.xq = b;
        this.jq = c;
        this.Yp = d;
        this.yq = f;
        this.Ir = g;
        this.Np = h
    }

    function hk(a, b, c) {
        var d = b - c;
        if (6E4 > d) return a.dr;
        var f = ik(b, c);
        if (1 == ik(b, c)) return a.Ir;
        if (36E5 > d) b = Math.floor(d / 6E4) + " " + a.xq;
        else if (864E5 > d) b = Math.floor(d / 36E5) + " " + a.jq;
        else if (7 > f) b = f + " " + a.Yp;
        else return b = new Date(c), b.getDate() + " " + a.yq[b.getMonth()] + " " + b.getFullYear();
        return b + " " + a.Np
    }

    function ik(a, b) {
        a = new Date(a);
        b = new Date(b);
        return Math.floor((new Date(a.getFullYear(), a.getMonth(), a.getDate()) - new Date(b.getFullYear(), b.getMonth(), b.getDate())) / 864E5)
    };

    function jk(a, b) {
        fk.call(this, a, {
            S: "bookmarks-item-view"
        });
        this.El = b;
        this.kb = new N({
            J: R(this, "title")
        });
        this.c(this.kb);
        this.kb.U(a.title());
        this.va = new N({
            J: R(this, "page-number")
        });
        this.c(this.va);
        this.va.U(a.pageNumber().toString());
        this.Jo = new N({
            J: R(this, "time-passed")
        });
        this.c(this.Jo);
        this.Jo.U(hk(this.El, Date.now(), a.creationTime()))
    }
    m(jk, fk);

    function kk(a, b) {
        var c = new dk;
        Zj.call(this, {
            S: "bookmarks-list-view",
            np: c
        });
        E(this, c);
        this.aa = a;
        this.El = new gk({
            zs: this.aa.ya("PB_RECENTLY_ADDED"),
            ls: this.aa.ya("PB_MINUTES_LABEL"),
            hs: this.aa.ya("PB_HOURS_LABEL"),
            days: this.aa.ya("PB_DAYS_LABEL"),
            ns: this.aa.ya("PB_MONTH_LABELS").split("|"),
            Ss: this.aa.ya("PB_YESTERDAY_LABEL"),
            Qr: this.aa.ya("PB_AGO_LABEL")
        });
        this.eb = b;
        this.ta = new Xj({
            Qj: this
        });
        E(this, this.ta);
        this.c(this.ta.po);
        this.$b = L(this);
        (a = this.ta.Jc()) && this.Hd(a);
        ek(this.gb, this.eb.bc(), 70)
    }
    m(kk, Zj);
    kk.prototype.an = function(a) {
        var b = this,
            c = new jk(a, this.El);
        D(this, c.C, function() {
            return b.$b.f(a.pageNumber())
        }, this);
        return c
    };
    kk.prototype.ga = function(a, b) {
        Zj.prototype.ga.call(this, a, b);
        a && b && this.Ok(b)
    };
    kk.prototype.Ok = function(a) {
        this.ta && (this.ta.ng(a, this.gb.Ne), this.ta.Hj())
    };

    function lk(a, b) {
        N.call(this, {
            S: "bookmarks-view"
        });
        this.aa = a;
        a = new N({
            S: "add-bookmark-container"
        });
        Ig(a, R(this, "add-bookmarks"));
        var c = new N({
            J: R(a, "header")
        });
        c.U(this.aa.ya("PB_ADD_BOOKMARK_HEADER"));
        a.c(c);
        c = new N({
            J: R(a, "text")
        });
        c.U(this.aa.ya("PB_ADD_BOOKMARK_TEXT"));
        a.c(c);
        this.gk = a;
        this.c(this.gk);
        this.Ac = new kk(this.aa, b);
        Ig(this.Ac, R(this, "bookmarks-list"));
        Gg(this, this.Ac);
        this.$b = L(this, this.Ac.$b);
        this.Y("without-bookmarks", !b.bc().length)
    }
    m(lk, N);
    lk.prototype.invalidate = function(a) {
        Jg(this);
        a = (this.height() - a - this.gk.height()) / 2;
        this.gk.Kc(a)
    };
    lk.prototype.ga = function(a, b) {
        N.prototype.ga.call(this, a, b);
        Jg(this.Ac)
    };
    lk.prototype.Sj = function() {};
    var mk = {},
        nk = (mk.outline = "PB_OUTLINE_TAB", mk.bookmarks = "PB_BOOKMARKS_TAB", mk);

    function ok(a) {
        N.call(this, {
            S: "popup-tabs"
        });
        this.aa = a;
        this.Go = L(this);
        this.wi = "outline";
        this.Ho = new Map;
        pk(this)
    }
    m(ok, N);

    function pk(a) {
        ["outline", "bookmarks"].forEach(function(b) {
            var c = new N({
                J: R(a, "tab"),
                rp: !0
            });
            Gg(a, c);
            D(a, c.C, function() {
                return qk(a, b)
            }, a);
            c.U(a.aa.ya(nk[b]));
            a.Ho.set(b, c);
            c.gi(b == a.wi)
        })
    }

    function qk(a, b) {
        a.wi != b && (a.wi = b, a.Ho.forEach(function(a, d) {
            a.gi(d == b)
        }), a.Go.f())
    };

    function rk(a, b, c) {
        var d = b.find(function(c, d) {
                if (d == b.length - 1) return !0;
                var f = c.pageNumber() <= a && b[d + 1].pageNumber() > a;
                return d ? f : c.pageNumber() >= a || f
            }),
            f = d.items();
        return c ? d.pageNumber() > a ? null : d : f && f.length ? rk(a, f, !0) || d : d
    };

    function sk(a) {
        var b = a.qs,
            c = a.rm,
            d = a.selected;
        this.Uk = a.label;
        this.va = b;
        this.nq = c;
        this.mr = d
    }
    sk.prototype.label = function() {
        return this.Uk
    };
    sk.prototype.pageNumber = function() {
        return this.va
    };
    sk.prototype.rm = function() {
        return this.nq
    };
    sk.prototype.selected = function() {
        return this.mr
    };

    function tk(a) {
        var b = void 0 === a.Rs ? !0 : a.Rs;
        N.call(this, {
            J: a.J,
            S: a.S,
            Id: void 0 === a.Id ? !0 : a.Id
        });
        this.Gr = b;
        this.Lk = this.Dh = !1;
        this.Ar = L(this)
    }
    m(tk, N);
    tk.prototype.ga = function(a, b) {
        N.prototype.ga.call(this, a, b);
        this.Lk = !0;
        a = this.Dh;
        var c = Hg(this, "label");
        uk(this, c, ec || A ? b + 1 : b);
        this.Lk = !1;
        a != this.Dh && (this.Gr && this.setAttribute("title", this.Dh ? c : ""), this.Ar.f())
    };

    function uk(a, b, c) {
        function d() {
            k = h < b.length ? b.substr(0, h) + "\u2026" : b;
            f.U(k)
        }
        a.Dh = !1;
        var f = a;
        f.U(b);
        if (p(c) && a.displayObject().parentNode) {
            f.displayObject().style.height = "";
            var g = f.displayObject().scrollHeight;
            g = A ? --g : g;
            if (!(c >= g)) {
                var h = Math.floor(c / f.displayObject().scrollHeight * b.length),
                    k = "";
                for (d(); f.displayObject().scrollHeight <= c;) h += 10, d();
                for (; 0 < h && f.displayObject().scrollHeight > c;) d(), --h;
                d();
                a.Dh = !0
            }
        }
    }
    tk.prototype.U = function(a) {
        N.prototype.U.call(this, a);
        this.Lk || (this.tp(a), Jg(this))
    };
    tk.prototype.ci = function() {
        throw Error("html text is not supported");
    };

    function vk(a) {
        fk.call(this, a, {
            S: "outline-item-view",
            rp: !0
        });
        this.kb = new tk({
            J: R(this, "title")
        });
        this.c(this.kb);
        this.kb.U(a.label());
        this.va = new N({
            J: R(this, "page-number")
        });
        this.c(this.va);
        this.va.U(a.pageNumber().toString());
        this.Y("subitem", a.rm());
        this.gi(a.selected())
    }
    m(vk, fk);
    vk.prototype.ga = function(a, b) {
        fk.prototype.ga.call(this, a, b);
        a && b && (a = (b - 1 - this.kb.height()) / 2, this.kb.Kc(a))
    };

    function wk() {
        var a = new dk;
        Zj.call(this, {
            S: "outline-list-view",
            np: a
        });
        E(this, a);
        this.ta = new Xj({
            Qj: this
        });
        E(this, this.ta);
        this.c(this.ta.po);
        this.pn = !1;
        this.kl = [];
        this.$b = L(this);
        a = this.ta.Jc();
        this.Hd(a)
    }
    m(wk, Zj);

    function xk(a, b, c) {
        a.pn = b.some(function(a) {
            return (a = a.items()) && !!a.length
        });
        c = w(rk(c, b, !1));
        a.kl = yk(a, b, !1, c);
        ek(a.gb, a.kl, 60)
    }
    wk.prototype.Sj = function() {
        var a = this.kl.findIndex(function(a) {
            return a.selected()
        });
        this.gb.ne(60 * (a - 2))
    };

    function yk(a, b, c, d) {
        var f = [];
        b = l(b);
        for (var g = b.next(); !g.done; g = b.next()) g = g.value, f.push(new sk({
            label: g.label(),
            qs: g.pageNumber(),
            rm: c,
            selected: g == d
        })), (g = g.items()) && !c && f.push.apply(f, ba(yk(a, g, !0, d)));
        return f
    }
    wk.prototype.an = function(a) {
        var b = this,
            c = new vk(a);
        c.Y("has-subitems", this.pn);
        D(this, c.C, function() {
            return b.$b.f(a.pageNumber())
        }, this);
        return c
    };
    wk.prototype.ga = function(a, b) {
        Zj.prototype.ga.call(this, a, b);
        a && b && this.Ok(b)
    };
    wk.prototype.Ok = function(a) {
        this.ta && (this.ta.ng(a, this.gb.Ne), this.ta.Hj())
    };

    function zk(a, b, c) {
        N.call(this, {
            S: "outline-view"
        });
        this.aa = a;
        this.Xi = new N({
            J: R(this, "no-outline-label")
        });
        this.c(this.Xi);
        this.Xi.U(this.aa.ya("PB_NO_OUTLINE"));
        this.Ac = new wk;
        Ig(this.Ac, R(this, "outline-list"));
        this.c(this.Ac);
        this.$b = L(this, this.Ac.$b);
        b && xk(this.Ac, b, c);
        this.Y("without-outline", !b)
    }
    m(zk, N);
    zk.prototype.invalidate = function(a) {
        Jg(this);
        a = (this.height() - a - this.Xi.height()) / 2;
        this.Xi.Kc(a)
    };
    zk.prototype.Sj = function() {
        this.Ac.Sj()
    };
    zk.prototype.ga = function(a, b) {
        N.prototype.ga.call(this, a, b);
        Jg(this.Ac)
    };

    function Ak(a, b) {
        N.call(this, {
            S: "popup-panel"
        });
        var c = this;
        this.aa = a;
        this.eb = b;
        this.D = 0;
        this.Tc = new N({
            S: "popup-menu"
        });
        Ig(this.Tc, R(this, "popup-menu"));
        Gg(this, this.Tc);
        this.Lo = new N({
            J: R(this.Tc, "title")
        });
        this.Tc.c(this.Lo);
        this.ih = new ok(a);
        Gg(this.Tc, this.ih);
        D(this, this.ih.Go, this.dl, this);
        this.Ym = new N({
            J: R(this.Tc, "close-button")
        });
        Gg(this.Tc, this.Ym);
        D(this, this.Ym.C, function() {
            return c.Zm.f()
        }, this);
        this.nk = new N({
            J: R(this, "content-view")
        });
        this.c(this.nk);
        this.dh = this.md = null;
        this.Zm = L(this);
        this.$b = L(this);
        this.dl()
    }
    m(Ak, N);
    e = Ak.prototype;
    e.di = function(a) {
        this.dh = a
    };
    e.u = function(a) {
        this.D = a
    };
    e.fi = function(a) {
        this.Lo.U(a || "")
    };
    e.ga = function(a, b) {
        N.prototype.ga.call(this, a, b);
        this.Y("landscape", hh());
        this.ih.Y("landscape", hh());
        this.Tc.Y("landscape", hh());
        this.md.invalidate(this.Tc.height())
    };
    e.dl = function() {
        var a = this.ih.wi;
        this.md && (this.nk.removeChild(this.md), this.mh(this.md));
        switch (a) {
            case "outline":
                a = new zk(this.aa, this.dh, this.D);
                E(this, a);
                D(this, a.$b, this.Rn, this);
                this.md = a;
                break;
            case "bookmarks":
                a = new lk(this.aa, this.eb);
                E(this, a);
                D(this, a.$b, this.Rn, this);
                this.md = a;
                break;
            default:
                throw Error("unknown tab type");
        }
        this.nk.c(this.md);
        this.md.invalidate(this.Tc.height());
        this.md.Sj()
    };
    e.Rn = function(a) {
        this.$b.f(a)
    };

    function Bk(a) {
        N.call(this, {
            S: a
        });
        this.B = new N({
            J: R(this, "current-page"),
            Xf: "SPAN"
        });
        this.c(this.B);
        this.B.U("0");
        a = new N({
            J: R(this, "separator"),
            Xf: "SPAN"
        });
        this.c(a);
        a.ci("&nbsp/&nbsp");
        this.W = new N({
            J: R(this, "pages-count"),
            Xf: "SPAN"
        });
        this.c(this.W);
        this.W.U("0")
    }
    m(Bk, N);
    Bk.prototype.u = function(a) {
        this.B.U(a.toString())
    };
    Bk.prototype.qa = function(a) {
        this.W.U(a.toString())
    };

    function Ck() {
        N.call(this, {
            S: "seek-bar"
        });
        this.ff = new N({
            J: R(this, "background")
        });
        this.c(this.ff);
        this.Yn = new N({
            J: R(this, "progress")
        });
        this.ff.c(this.Yn);
        this.Ma = new N({
            J: R(this, "thumb")
        });
        this.ff.c(this.Ma);
        this.W = this.Rb = 0;
        this.qo = L(this);
        this.Bo = L(this);
        this.gn = L(this);
        C(this, this.displayObject(), $d, this.Uq, this, ce)
    }
    m(Ck, N);
    e = Ck.prototype;
    e.Da = function() {
        return Math.min(Math.ceil(this.Rb * (this.W - 1)) + 1, this.W)
    };
    e.qa = function(a) {
        this.W = a
    };
    e.u = function(a) {
        this.Rb = 1 == this.W ? 1 : (a - 1) / (this.W - 1);
        this.pd()
    };
    e.ga = function(a, b) {
        N.prototype.ga.call(this, a, b);
        this.pd();
        this.Y("landscape", hh())
    };
    e.Uq = function(a) {
        this.enabled() && (C(this, document, be, this.In, this), C(this, document, ae, this.Jn, this), this.Rb = Dk(this, a), this.pd(), this.Ma.Y("dragged", !0), this.Bo.f(), a.preventDefault())
    };
    e.In = function(a) {
        this.Rb = Dk(this, a);
        this.pd();
        this.qo.f();
        a.preventDefault()
    };
    e.Jn = function(a) {
        Cd(this, document, be, this.In, this);
        Cd(this, document, ae, this.Jn, this);
        this.Rb = Dk(this, a);
        this.pd();
        this.Ma.Y("dragged", !1);
        this.gn.f();
        a.preventDefault()
    };

    function Dk(a, b) {
        var c = a.ff.g.getBoundingClientRect();
        a = a.ff.displayObject();
        b = Te(b);
        a = Te(a);
        return cb((new G(b.x - a.x, b.y - a.y)).x / c.width, 0, 1)
    }
    e.pd = function() {
        var a = this.ff.width();
        this.Ma.ua("transform", "translateX(" + this.Rb * a + "px)");
        this.Yn.Z(this.Rb * a)
    };

    function Ek(a) {
        N.call(this, {
            S: "bottom-toolbar"
        });
        this.Fe = a;
        this.Ce = new Bk("pages-count");
        Ig(this.Ce, R(this, "pages-count"));
        this.c(this.Ce);
        this.xd = new Ck;
        Gg(this, this.xd);
        D(this, this.xd.Bo, this.Qn, this);
        D(this, this.xd.qo, this.Qn, this);
        D(this, this.xd.gn, this.Tq, this);
        this.W = 0;
        this.Vc = L(this)
    }
    m(Ek, N);
    e = Ek.prototype;
    e.zb = function() {
        return this.Vc
    };
    e.Da = function() {
        return this.xd.Da()
    };
    e.u = function(a) {
        this.Ce.u(a);
        this.xd.u(a)
    };
    e.qa = function(a) {
        this.W = a;
        this.Ce.qa(a);
        this.xd.qa(a)
    };
    e.Qn = function() {
        var a = this.Fe,
            b = this.xd.Da(),
            c = this.W;
        Fk(a);
        var d = !a.Ib;
        a.Ib || (a.Ib = new Bk("pages-count-popup"), a.Tf.appendChild(a.Ib.displayObject()));
        a.Ib.u(b);
        a.Ib.qa(c);
        b = (a.a.width() - a.Ib.width()) / 2;
        c = a.a.height() - a.a.bb() - 58;
        a.Ib.ua("transform", "translate(" + b + "px, " + c + "px)");
        d && (a.Ib.ed(0), (new Gk(a.Ib, 150, !1)).play())
    };
    e.Tq = function() {
        Hk(this.Fe);
        this.Vc.f()
    };
    e.ga = function(a, b) {
        N.prototype.ga.call(this, a, b);
        Jg(this.xd)
    };

    function Gk(a, b, c) {
        W.call(this, [0], [1], b);
        this.Od = a;
        this.mq = c
    }
    m(Gk, W);
    Gk.prototype.lb = function(a) {
        a = yi(a[0]);
        this.mq ? this.Od.ed(1 - a) : this.Od.ed(a)
    };

    function Ik(a, b, c, d) {
        W.call(this, [0], [1], c, d);
        this.ma = a;
        this.vd = b
    }
    m(Ik, W);
    Ik.prototype.lb = function(a) {
        a = zi(a[0]);
        this.ma.ua("transform", "translateY(" + this.ma.height() * a + "px)");
        this.vd.ed(1 - a)
    };
    Ik.prototype.wd = function() {
        this.ma.ua("transform", "")
    };

    function Jk(a, b, c, d) {
        W.call(this, [0], [1], c, d);
        this.ma = a;
        this.vd = b
    }
    m(Jk, W);
    Jk.prototype.play = function() {
        this.ma.ua("top", "");
        return W.prototype.play.call(this)
    };
    Jk.prototype.lb = function(a) {
        a = zi(a[0]);
        this.ma.ua("transform", "translateY(" + this.ma.height() * (1 - a) + "px)");
        this.vd.ed(a)
    };
    Jk.prototype.wd = function() {
        this.ma.ua("transform", "")
    };

    function Kk(a) {
        var b = a.Ns,
            c = a.view;
        a = a.us;
        K.call(this);
        this.Tf = b;
        this.a = c;
        this.vd = new N({
            S: "popup-layer"
        });
        this.ma = a;
        this.vd.c(this.ma);
        D(this, this.ma.Zm, this.ep, this);
        D(this, this.ma.$b, this.ep, this);
        this.Li = this.Ki = this.Ib = null
    }
    m(Kk, K);

    function Hk(a) {
        Fk(a);
        a.Li = setTimeout(function() {
            if (a.Ib) {
                var b = new Gk(a.Ib, 250, !0);
                a.Ki = D(a, b.ia, function() {
                    Fk(a);
                    a.Tf.removeChild(a.Ib.displayObject());
                    a.Ib = null;
                    a.Li = null
                });
                b.play()
            }
        }, 500)
    }
    Kk.prototype.ep = function() {
        var a = this,
            b = new Ik(this.ma, this.vd, 350, Ci);
        Ed(this, b.ia, function() {
            a.Tf.removeChild(a.vd.displayObject());
            a.Tf.removeChild(a.ma.displayObject())
        }, this);
        b.play()
    };

    function Fk(a) {
        null != a.Ki && (Ad(a, a.Ki), a.Ki = null);
        a.Li && clearTimeout(a.Li)
    };

    function Lk(a) {
        var b = a.cu,
            c = a.toggle;
        N.call(this, {
            J: a.J,
            S: a.S,
            ap: a.ap,
            op: a.op,
            Vo: a.Vo,
            tabIndex: a.tabIndex,
            Xf: "BUTTON",
            Pr: !0,
            Id: a.Id
        });
        if (b) {
            a = b.top;
            var d = b.right,
                f = b.bottom;
            b = b.left;
            this.Xc = new N;
            Gg(this, this.Xc);
            this.Xc.ua("position", "absolute");
            this.Xc.ua("top", a ? -a + "px" : 0);
            this.Xc.ua("right", d ? -d + "px" : 0);
            this.Xc.ua("bottom", f ? -f + "px" : 0);
            this.Xc.ua("left", b ? -b + "px" : 0)
        }(this.Fl = c) && Mk(this, !1);
        this.Om()
    }
    m(Lk, N);

    function Mk(a, b) {
        w(a.Fl);
        a.bi("pressed", b)
    }
    e = Lk.prototype;
    e.selected = function() {
        return !1
    };
    e.gi = function() {};
    e.pressed = function() {
        w(this.Fl);
        return "true" == Hg(this, "pressed")
    };
    e.U = function(a) {
        N.prototype.U.call(this, a);
        this.Xc && this.uj(this.Xc, 0)
    };
    e.ci = function(a) {
        N.prototype.ci.call(this, a);
        this.Xc && this.uj(this.Xc, 0)
    };

    function Nk(a, b) {
        var c = b.bc().findIndex(function(b) {
            return b.pageNumber() == a
        });
        lh(b, c)
    };

    function Ok(a) {
        var b = a.ts,
            c = a.bc;
        a = a.ke;
        N.call(this, {
            S: "top-toolbar"
        });
        var d = this;
        this.Fe = b;
        this.eb = c;
        this.aa = a;
        this.dh = null;
        this.D = 0;
        b = new N({
            J: R(this, "container")
        });
        b.Y("position", "left");
        Gg(this, b);
        lg && (c = new Lk({
            J: R(this, "close-window-button")
        }), Gg(b, c), D(this, b.C, this.Fq, this), this.Y("mobile-app", !0));
        this.Ko = new N({
            J: R(this, "title")
        });
        b.c(this.Ko);
        this.jj = new N({
            J: R(this, "container")
        });
        this.jj.Y("position", "right");
        Gg(this, this.jj);
        this.vo = new Lk({
            J: R(this, "show-popup-button")
        });
        Gg(this.jj,
            this.vo);
        this.yg = new Lk({
            J: R(this, "bookmark-button"),
            toggle: !0
        });
        D(this, this.yg.C, this.Dq, this);
        Gg(this.jj, this.yg);
        D(this, this.vo.C, function() {
            var a = d.Fe;
            a.Tf.appendChild(a.vd.displayObject());
            a.Tf.appendChild(a.ma.displayObject());
            var b = new Jk(a.ma, a.vd, 350, Bi);
            a = a.ma;
            qk(a.ih, "outline");
            a.dl();
            b.play()
        })
    }
    m(Ok, N);
    e = Ok.prototype;
    e.di = function(a) {
        this.dh = a
    };
    e.fi = function(a) {
        this.Ko.U(a)
    };
    e.u = function(a) {
        this.D = a;
        Pk(this)
    };
    e.Dq = function() {
        var a = this.yg.pressed();
        if (a) Nk(this.D, this.eb);
        else {
            var b = this.D,
                c = this.eb,
                d = this.dh,
                f = this.aa;
            d = d ? w(rk(b, d, !1)).label() : f.ya("PB_PAGE_LABEL").replace("%PAGE_NUMBER%", b.toString());
            c.eb.splice(0, 0, new uj({
                title: d,
                pageNumber: b,
                creationTime: Date.now()
            }));
            c.se.f()
        }
        Mk(this.yg, !a)
    };

    function Pk(a) {
        var b = a.eb.bc().some(function(b) {
            return b.pageNumber() == a.D
        });
        Mk(a.yg, b)
    }
    e.Fq = function() {
        var a = new Ef("closeWindow");
        if (hg) {
            var b = a.Er,
                c = a.Qp;
            a = a.id();
            var d = jb(c, null);
            if (Af) c = n.btoa(d);
            else {
                c = [];
                for (var f = 0, g = 0; g < d.length; g++) {
                    var h = d.charCodeAt(g);
                    255 < h && (c[f++] = h & 255, h >>= 8);
                    c[f++] = h
                }
                w(xa(c), "encodeByteArray takes an array as a parameter");
                Df();
                d = yf;
                f = [];
                for (g = 0; g < c.length; g += 3) {
                    var k = c[g],
                        u = (h = g + 1 < c.length) ? c[g + 1] : 0,
                        q = g + 2 < c.length,
                        y = q ? c[g + 2] : 0,
                        I = k >> 2;
                    k = (k & 3) << 4 | u >> 4;
                    u = (u & 15) << 2 | y >> 6;
                    y &= 63;
                    q || (y = 64, h || (u = 64));
                    f.push(d[I], d[k], d[u], d[y])
                }
                c = f.join("")
            }
            Ff("isplayer://" +
                b + "/" + a + "/" + c)
        }
    };

    function Qk(a) {
        var b = a.width,
            c = a.height,
            d = a.ke;
        a = a.bc;
        T.call(this, ["mainContainer", "mobile"]);
        var f = this;
        this.Z(b);
        this.pa(c);
        this.ma = new Ak(d, a);
        this.ma.$b.addHandler(function(a) {
            return f.Vc.f(a)
        }, this);
        this.Fe = new Kk({
            Ns: document.body,
            view: this,
            us: this.ma
        });
        this.zf = new T("loaderIcon");
        this.c(this.zf);
        this.ka = new T("viewerContainer mobile");
        this.c(this.ka);
        this.Ob = new Ok({
            ts: this.Fe,
            ke: d,
            bc: a
        });
        this.c(this.Ob);
        this.Ab = new Ek(this.Fe);
        this.c(this.Ab);
        this.Ab.zb().addHandler(function() {
            var a = f.Ab.Da();
            f.Vc.f(a)
        });
        this.yd = new F;
        this.Ec = new F;
        this.Vc = new F;
        this.we = new F
    }
    m(Qk, T);
    e = Qk.prototype;
    e.bb = function() {
        return this.Ab.height()
    };
    e.qa = function(a) {
        this.Ab.qa(a)
    };
    e.u = function(a) {
        this.Ab.u(a);
        this.Ob.u(a);
        this.ma.u(a)
    };
    e.cb = function() {
        return new U(this.width(), this.height())
    };
    e.Ra = function() {
        return this.yd
    };
    e.Qa = function() {
        return this.Ec
    };
    e.zb = function() {
        return this.Vc
    };
    e.Pb = function() {
        return this.we
    };
    e.Gm = function() {};
    e.dd = function() {};
    e.cd = function() {};

    function Dj(a) {
        a.removeChild(a.zf)
    }
    e.Bj = function(a) {
        lg ? (this.Ob.Y("above-auth-popup", a), this.Ob.Pa(!0), Rk(this.Ob, !0)) : (this.Ob.Pa(!a), Rk(this.Ob, !a));
        this.Ab.Pa(!a);
        Rk(this.Ab, !a)
    };
    e.bd = function() {};

    function Sk(a) {
        a.Ab.Pa(!1);
        a.Ob.Pa(!1);
        Rk(a.Ab, !1);
        Rk(a.Ob, !1)
    }

    function Rk(a, b) {
        a.ed(b ? 1 : 0);
        a.Y("hidden", !b)
    }
    e.di = function(a) {
        this.ma.di(a);
        this.Ob.di(a)
    };
    e.fi = function(a) {
        this.ma.fi(a);
        this.Ob.fi(a)
    };
    e.invalidate = function() {
        var a = this,
            b = hh();
        this.Ab.Y("landscape", b);
        this.Ob.Y("landscape", b);
        this.ma.Y("landscape", b);
        window.requestAnimationFrame(function() {
            Jg(a.ma);
            Jg(a.Ab)
        })
    };

    function Tk(a, b, c) {
        var d = this,
            f = new kh;
        this.a = new Qk({
            width: a.clientWidth,
            height: a.clientHeight,
            ke: b.ke(),
            bc: f
        });
        ze(a, this.a.ra);
        Y.call(this, a, b, 1, Fj, f, c);
        this.Jg = new Dh(this.a);
        this.wh = this.lf = this.Dc = 0;
        this.rf = !1;
        this.aj = !0;
        this.Sk = !1;
        this.kj = new G;
        this.Ka = new Lh;
        this.Ka.Ra().addHandler(this.Wc, this);
        this.Ka.Qa().addHandler(this.Uc, this);
        this.Ka.zb().addHandler(this.ae, this);
        this.la = new Kh(this.a.ka);
        this.la.Xl.addHandler(this.Yl, this);
        this.la.sg().addHandler(this.Ih, this);
        this.la.Ke.ul.addHandler(this.Ul,
            this);
        this.la.Ra().addHandler(this.Wc, this);
        this.la.wr.addHandler(function() {
            Wi(Qa(d.j, Ti))
        }, this);
        this.la.Bq.addHandler(function(a) {
            Xi(Qa(d.j, Ti), a, !1)
        }, this);
        this.la.Fn.addHandler(function() {
            Xi(Qa(d.j, Ti), 0, !0)
        }, this);
        this.la.Qa().addHandler(this.Uc, this);
        this.la.kn.addHandler(this.Mq, this);
        this.la.Vm.addHandler(this.Eq, this);
        this.la.Ve().addHandler(function(a, b) {
            var c = d.a.ka.displayObject();
            c.scrollLeft -= a;
            c.scrollTop -= b;
            a = d.kj.x + a;
            b = d.kj.y + b;
            d.kj = new G(a, b);
            d.j.Gd(a, b)
        }, this);
        Uk(this);
        this.oh =
            new hj;
        this.oh.Wa.addHandler(this.gl, this);
        this.a.Ra().addHandler(this.Wc, this);
        this.a.Qa().addHandler(this.Uc, this);
        this.a.zb().addHandler(this.ae, this);
        this.a.Pb().addHandler(this.nd, this);
        this.cj = new N({
            S: "preloader-view"
        });
        this.a.c(this.cj);
        this.Bc(1, Ti);
        this.hh();
        this.a.fi(this.Wb.title());
        H(document.body, "mobile")
    }
    v(Tk, Y);
    e = Tk.prototype;
    e.enable = function() {};
    e.disable = function() {};
    e.resize = function(a, b) {
        var c = this;
        this.Dc && clearTimeout(this.Dc);
        this.a.resize(a, b);
        this.a.invalidate();
        var d = 1 < a / b;
        this.na.Gj ? (this.j.resize(this.Rd()), this.Dc = setTimeout(function() {
            c.j.update();
            c.rf && d != c.Sk && c.j.im({
                Uo: !0
            });
            c.Sk = d
        }, Fj.zm)) : this.Sk = d;
        this.Ia && this.Ia.$(this.ea)
    };
    e.Eq = function() {
        if (this.aj) Sk(this.a);
        else {
            var a = this.a;
            a.Ab.Pa(!0);
            a.Ob.Pa(!0);
            Rk(a.Ab, !0);
            Rk(a.Ob, !0)
        }
        this.aj = !this.aj
    };
    e.Oc = function() {
        return this.j.Oc()
    };
    Tk.prototype.viewPages = Tk.prototype.Oc;

    function Uk(a) {
        a.ba.Gn.addHandler(function() {
            Wi(a.oh.j)
        }, a);
        a.ba.Yg.addHandler(function(b) {
            var c = a.oh;
            b = 0 == b ? 0 : (0 > b ? Math.max(b / 2.5, -50) : Math.min(b / 2.5, 50)) + (0 > b ? Math.min(b + 125, 0) : Math.max(b - 125, 0));
            c.Vk = b;
            Xi(c.j, b, !1)
        }, a);
        a.ba.En.addHandler(function() {
            var b = a.oh;
            Xi(b.j, 0, !0);
            b.j.container().displayObject();
            50 < b.Vk && (b.j.af(!1), b.Wa.f()); - 50 > b.Vk && (b.j.$e(!1), b.Wa.f())
        }, a)
    }
    e = Tk.prototype;
    e.hh = function() {
        if (window.location.hash) {
            var a = this.gh(window.location.hash.substring(1));
            "page" in a && (this.na.Da = parseInt(a.page, 10))
        }
    };
    e.gh = function(a) {
        a = a.split("&");
        for (var b = {}, c = 0; c < a.length; ++c) {
            var d = a[c].split("=");
            b[decodeURIComponent(d[0].toLowerCase())] = 1 < d.length ? decodeURIComponent(d[1]) : null
        }
        return b
    };
    e.Bc = function(a, b) {
        Tk.V.Bc.call(this, a, b);
        this.xa[a].Mf.addHandler(this.Hr, this);
        Qa(this.xa[a], Ti).Em(this)
    };
    e.Wc = function(a) {
        a = void 0 === a ? !0 : a;
        this.gl();
        this.j.af(a)
    };
    e.Uc = function(a) {
        a = void 0 === a ? !0 : a;
        this.gl();
        this.j.$e(a)
    };
    e.gl = function() {
        Sk(this.a);
        this.aj = !1
    };
    e.nd = function() {
        this.Jg.toggle()
    };
    e.Rd = function() {
        return this.a.cb()
    };
    e.ae = function(a) {
        var b = Qa(this.j, Ti);
        b.hb(b.B);
        b.hb(b.w);
        b.hb(b.F);
        b.nc = a;
        Vi(b, a);
        b.O.Xj(0)
    };
    e.rd = function(a) {
        var b = this;
        Tk.V.rd.call(this, a);
        th(a, this.Rc);
        var c = a.o();
        this.a.u(1);
        this.a.qa(c);
        this.Ka.qa(c);
        this.xa[1].ab(a);
        this.Ub(1);
        Ej(this);
        this.R.getOutline().then(function(a) {
            b.a.di(a)
        });
        this.cj && (this.a.removeChild(this.cj), this.cj = null)
    };
    e.Ub = function(a) {
        Tk.V.Ub.call(this, a);
        this.j.resize(this.Rd());
        this.j.enable(this.na.Da);
        a = Qa(this.j, Ti);
        this.oh.j = a;
        this.ba.Hd(Qa(this.j, Ti).Jc())
    };
    e.Se = function(a) {
        Tk.V.Se.call(this, a);
        this.a.u(a);
        this.kc(a)
    };
    e.Hr = function(a) {
        0 < a ? (this.ba.Qb() || this.ba.enable(), a = this.la, a.qd && (ge(a.Ae), a.qd = !1), a = this.la, a.Sd && (ge(a.Cf), a.Sd = !1)) : (this.ba.Qb() && this.ba.disable(), a = this.la, a.qd || (fe(a.Ae), a.qd = !0), a = this.la, a.Sd || (fe(a.Cf), a.Sd = !0))
    };
    e.Yl = function(a, b) {
        this.wh = this.j.Fd();
        this.kj = new G(a, b);
        this.j.Gd(a, b)
    };
    e.Ih = function(a) {
        this.rf = !1;
        a = this.tf(this.wh * a);
        a = cb(a, Fj.Xe, Fj.We);
        this.j.me(a)
    };
    e.Ul = function() {
        this.j.update()
    };
    e.tf = function(a) {
        return (a - 1) / (this.j.$a - 1)
    };
    e.Mq = function(a, b) {
        this.rf = 1 == this.j.Fd();
        this.j.im({
            clientX: a,
            clientY: b,
            Uo: !1
        })
    };

    function Vk(a) {
        W.call(this, [0], [1], a);
        this.A = this.sa = null;
        this.I = 0
    }
    v(Vk, W);
    Vk.prototype.pb = function(a, b, c) {
        this.sa = a;
        this.A = b;
        this.I = c
    };
    Vk.prototype.Ge = function() {
        S(this.sa, "bottom", this.A.bb() + "px");
        this.sa.T("open")
    };
    Vk.prototype.lb = function(a) {
        a = this.I * a[0];
        S(this.sa, "bottom", this.A.bb() - a + "px")
    };
    Vk.prototype.wd = function() {
        this.sa.H("close")
    };

    function Wk(a) {
        W.call(this, [0], [1], a);
        this.A = this.sa = null;
        this.I = 0
    }
    v(Wk, W);
    Wk.prototype.pb = function(a, b, c) {
        this.sa = a;
        this.A = b;
        this.I = c
    };
    Wk.prototype.Ge = function() {
        var a = this.A.bb() - this.I;
        S(this.sa, "bottom", a + "px");
        this.sa.T("close")
    };
    Wk.prototype.lb = function(a) {
        a = this.I * (1 - a[0]);
        S(this.sa, "bottom", this.A.bb() - a + "px")
    };
    Wk.prototype.wd = function() {
        this.sa.H("open")
    };

    function Xk(a, b, c) {
        this.h = b;
        this.Gb = a;
        this.Ba = c
    }

    function Yk(a, b) {
        b = Math.floor(b.height() * a.h.Jp);
        return Math.max(b, a.h.minHeight)
    }
    e = Xk.prototype;
    e.Ek = function(a) {
        a = a - this.h.Yc - 2 * (this.h.lg + this.h.hc);
        a = 1 == this.Ba ? a - this.h.Yc : a - (this.h.Zf + this.h.Yh + this.h.ig);
        return Math.floor(a)
    };
    e.Fk = function(a) {
        a = a + this.h.Yc + 2 * (this.h.lg + this.h.hc);
        a = 1 == this.Ba ? a + this.h.Yc : a + (this.h.Zf + this.h.Yh + this.h.ig);
        return Math.floor(a)
    };
    e.Gk = function(a) {
        a += 2 * this.h.Ue;
        1 < this.Ba && (a += 2 * this.h.$f);
        return a
    };
    e.Dk = function(a) {
        a -= 2 * this.h.Ue;
        1 < this.Ba && (a -= 2 * this.h.$f);
        return a
    };
    e.tf = function(a, b, c) {
        var d = 1,
            f = 1;
        a.width() < b && (d = a.width() / b);
        a.height() < c && (f = a.height() / c);
        return Math.min(d, f)
    };

    function Zk(a, b, c, d) {
        Xk.call(this, a, b, c);
        this.W = d
    }
    v(Zk, Xk);
    e = Zk.prototype;
    e.bm = function(a) {
        var b = Yk(this, a),
            c = this.Ek(b),
            d = this.Ck(c),
            f = Math.min(this.W, this.h.mb),
            g = (d + 2 * (this.h.ai + this.h.hc + this.h.oi)) * f,
            h = this.Gk(g);
        h > a.width() && (a.width() > x.yb ? h = a.width() : h > x.yb && (h = x.yb), g = this.Dk(h), d = g / f - 2 * (this.h.ai + this.h.hc + this.h.oi), c = this.Bk(d), b = this.Fk(c));
        a = this.tf(a, h, b);
        return {
            rg: new U(h, b),
            Uh: g,
            Th: new U(d, c),
            scale: a
        }
    };
    e.Ek = function(a) {
        a = a - this.h.Yc - 2 * (this.h.lg + this.h.hc) - this.h.$o;
        a = 1 == this.Ba ? a - this.h.Yc : a - (this.h.Zf + this.h.Yh + this.h.ig);
        return Math.floor(a)
    };
    e.Fk = function(a) {
        a = a + this.h.Yc + 2 * (this.h.lg + this.h.hc) + this.h.$o;
        a = 1 == this.Ba ? a + this.h.Yc : a + (this.h.Zf + this.h.Yh + this.h.ig);
        return Math.floor(a)
    };
    e.Gk = function(a) {
        a += 2 * (this.h.Ue + this.h.cm);
        1 < this.Ba && (a += 2 * this.h.$f);
        return a
    };
    e.Dk = function(a) {
        a -= 2 * (this.h.Ue + this.h.cm);
        1 < this.Ba && (a -= 2 * this.h.$f);
        return a
    };
    e.Ck = function(a) {
        return Math.floor(a * this.Gb)
    };
    e.Bk = function(a) {
        return a / this.Gb
    };

    function $k() {
        this.W = 0;
        this.R = null;
        this.na = 0;
        this.ce = new F;
        this.Fc = new F;
        this.Wa = new F
    }
    e = $k.prototype;
    e.state = function() {
        return this.na
    };
    e.o = function() {
        return this.W
    };
    e.Cp = function() {
        return this.ce
    };
    e.Oj = function() {
        return this.Wa
    };
    e.document = function() {
        w(this.R);
        return this.R
    };
    e.ab = function(a) {
        this.R = a;
        this.W = a.o()
    };

    function al(a, b) {
        a.na = b;
        a.ce.f(b)
    }
    e.kc = function(a) {
        this.Wa.f(a)
    };

    function bl(a, b) {
        $k.call(this);
        this.A = a;
        this.Ba = 0;
        this.lc = this.wa = this.Td = null;
        this.h = b;
        this.Sc = 0;
        this.ud = [];
        this.Vi = this.fj = null;
        this.$i = x.Im;
        this.Si = this.Qc = this.Re = 0;
        this.eh = null
    }
    v(bl, $k);
    bl.prototype.Wj = function(a) {
        this.lc = a
    };
    bl.prototype.disable = function() {
        this.Ba = this.Sc = 0;
        this.ud = [];
        this.Si = this.Qc = 0;
        this.eh = null
    };

    function cl(a, b, c) {
        if (1 != a.Ba)
            if (a.fj.displayObject().firstChild.style.height = b + "px", a.Vi.displayObject().firstChild.style.height = b + "px", b = dl(a, c), a.$i = b.width, b.o != a.Re) {
                c = b.o - a.Re;
                a.Re = b.o;
                var d = a.Sc - a.Qc;
                if (0 > c && d > b.o / 2 || 0 < c && d < b.o / 2) a.Qc = Math.max(1, a.Qc - c);
                el(a, a.Qc);
                fl(a, a.Sc)
            } else
                for (c = 0; c < a.ud.length; ++c) a.ud[c].displayObject().firstChild.style.width = b.width + "px"
    }

    function gl(a, b, c) {
        var d = new T("thumbnailContainer");
        if (1 < a.Ba) {
            d.H("withPagination");
            var f = new T("thumbnailControlsContainer");
            d.c(f);
            a.fj = hl(a, b);
            f.c(a.fj);
            a.Td = new T("itemsContainer");
            f.c(a.Td);
            a.Vi = il(a, b);
            f.c(a.Vi);
            a.eh = new T("thumbnailPagination");
            d.c(a.eh);
            b = dl(a, c);
            a.Re = b.o;
            a.$i = b.width
        } else a.Td = new T("itemsContainer"), d.c(a.Td);
        return d
    }

    function jl(a, b) {
        a.Sc != b && (a.fo(b), 1 < a.Ba && ((b <= a.Qc || b >= a.Si) && el(a, Math.max(b - Math.floor(a.Re / 2), 1)), fl(a, b), S(a.fj, "visibility", 1 == b ? "hidden" : "visible"), S(a.Vi, "visibility", b == a.Ba ? "hidden" : "visible")), a.Sc = b, a.Yb())
    }

    function kl(a) {
        return a.A.bb()
    }

    function fl(a, b) {
        var c = a.Sc - a.Qc;
        b = Math.max(0, b - a.Qc);
        a.Qc <= a.Sc && a.Sc <= a.Si && 0 <= c && a.ud[c].T("selected");
        a.ud[b].H("selected")
    }

    function el(a, b) {
        ll(a);
        var c = b + a.Re - 1;
        c > a.Ba && (c = a.Ba, b = Math.max(c - (a.Re - 1), 1));
        a.Qc = b;
        for (a.Si = c; b <= c; ++b) {
            var d = a.ln(b);
            d = ml(a, d);
            d.C.addHandler(function(a) {
                jl(this, a)
            }.bind(a, b), a);
            a.ud.push(d);
            a.eh.c(d)
        }
    }

    function dl(a, b) {
        var c = x.ks + 2 * a.h.ii,
            d = Math.floor(b / c);
        d = Math.min(d, a.Ba);
        b -= d * c;
        b > d && (c += Math.floor(b / d));
        c = Math.min(c, x.Im);
        return {
            o: d,
            width: c - 2 * a.h.ii
        }
    }

    function ll(a) {
        for (var b = 0; b < a.ud.length; ++b) a.eh.removeChild(a.ud[b]);
        a.ud = []
    }

    function ml(a, b) {
        var c = new T("selection");
        c.setAttribute("title", b.left + " - " + b.right);
        b = new T("paginationPage");
        a.$i != x.Im && b.Z(a.$i);
        c.c(b);
        return c
    }

    function il(a, b) {
        var c = new T(["next", "paginationPage"], "A"),
            d = new T("backLight");
        S(d, "height", b + "px");
        d.C.addHandler(function() {
            jl(this, this.Sc + 1)
        }, a);
        c.c(d);
        a = new T("arrow");
        d.c(a);
        return c
    }

    function hl(a, b) {
        var c = new T(["prev", "paginationPage"], "A"),
            d = new T("backLight");
        S(d, "height", b + "px");
        d.C.addHandler(function() {
            jl(this, this.Sc - 1)
        }, a);
        c.c(d);
        a = new T("arrow");
        d.c(a);
        return c
    };

    function nl(a) {
        this.Jb = [];
        this.Bh = a
    }
    e = nl.prototype;
    e.Ha = function() {
        for (var a = [], b = this.Bh.ja, c = 0; c < b.length; ++c) a.push(b[c].page());
        return a
    };
    e.render = function(a) {
        var b = this,
            c = this.Mg(a);
        c && !this.Tg(c) && (c.Sh() ? this.Yd(c) : (a = c.pageNumber(), this.Jb[a] || (this.Jb[a] = !0, this.Bh.document().getPage(a, function(a, f) {
            c.ei(a);
            b.Jb[f] = !1;
            b.render(b.Ha())
        }))))
    };
    e.Yd = function(a) {
        switch (a.X) {
            case 3:
                break;
            case 2:
                break;
            case 1:
                break;
            case 0:
                a.Za.addHandler(function() {
                    this.render(this.Ha())
                }, this);
                a.render();
                break;
            default:
                throw Error("renderingState is wrong");
        }
    };
    e.Mg = function(a) {
        for (var b = 0; b < a.length; ++b)
            if (!this.Sg(a[b])) return a[b];
        return null
    };
    e.Sg = function(a) {
        return 3 == a.X
    };
    e.Tg = function(a) {
        return 1 == a.X
    };

    function ol(a, b, c) {
        T.call(this, "thumbnailView");
        this.va = a;
        this.Wn = new F;
        this.Kb = new T("selection");
        this.c(this.Kb);
        this.fa = tj(c, a, b);
        this.fa.C.addHandler(function() {
            this.Wn.f(a)
        }, this);
        this.Kb.c(this.fa.displayObject())
    }
    v(ol, T);
    e = ol.prototype;
    e.page = function() {
        return this.fa
    };
    e.pageNumber = function() {
        return this.va
    };
    e.$ = function(a) {
        this.fa.$(a)
    };
    e.update = function() {
        this.fa.reset()
    };
    e.setActive = function(a) {
        a ? this.Kb.H("selected") : this.Kb.T("selected")
    };
    var pl = {
            vi: [0, .03, .04, .05, .1, .11, .3],
            ti: [.6, .09, .02, .01, .15, .16, 0],
            ui: [0, 0, 0, 255, 255, 255, 255]
        },
        ql = {
            vi: [.78, .88, .9, .94, .95, .98, 1],
            ti: [0, .09, .09, .03, .06, .22, .6],
            ui: [255, 255, 255, 255, 0, 0, 0]
        },
        rl = {
            vi: [.43, .44, .46, .48, .5, .52, .54, .58, .61],
            ti: [0, .05, .2, .2, .5, .4, .3, .1, 0],
            ui: [255, 255, 255, 0, 0, 0, 0, 0, 0]
        },
        sl = {
            vi: [.46, .47, .49, .5, .51, .52, .53, .54, .55],
            ti: [0, .1, .3, .5, .1, .3, .2, .1, 0],
            ui: [0, 0, 0, 0, 0, 255, 255, 255, 255]
        };

    function tl() {
        this.Sl = []
    }

    function ul(a, b, c) {
        a: {
            var d = b.pageNumber();
            for (var f = 0; f < a.Sl.length; ++f)
                if (a.Sl[f] == d) {
                    d = !0;
                    break a
                } d = !1
        }
        if (d) return null;d = b.hf;a = a.Di(b.width(), b.height());vl(a, c);d.c(a);
        return a
    }

    function vl(a, b) {
        var c = a.getContext("2d"),
            d = c.createLinearGradient(0, 0, a.width, 0),
            f = wl(b);
        b = f.vi;
        var g = f.ti;
        f = f.ui;
        for (var h = 0; h < b.length; ++h) d.addColorStop(b[h], "rgba(" + f[h] + ", " + f[h] + ", " + f[h] + ", " + g[h] + ")");
        c.rect(0, 0, a.width, a.height);
        c.fillStyle = d;
        c.fill()
    }
    tl.prototype.Di = function(a, b) {
        var c = document.createElement("canvas");
        c.className = "shadow";
        c.width = a;
        c.height = b;
        c.style.width = a + "px";
        c.style.height = b + "px";
        return c
    };

    function wl(a) {
        switch (a) {
            case 1:
                return pl;
            case 2:
                return ql;
            case 3:
                return rl;
            case 4:
                return sl;
            default:
                throw Error("shadowType is wrong");
        }
    };

    function xl(a, b, c) {
        bl.call(this, a, b);
        this.a = null;
        this.Lb = new tl;
        this.ja = [];
        this.Ya = new nl(this);
        this.vb = null;
        this.ef = this.D = this.Gb = 0;
        this.Vb = !1;
        this.I = 0;
        this.ee = c;
        this.td = new Wk(this.h.animationDuration);
        this.td.ia.addHandler(this.bh, this);
        this.ld = new Vk(this.h.animationDuration);
        this.ld.ia.addHandler(this.Ag, this)
    }
    v(xl, bl);
    e = xl.prototype;
    e.view = function() {
        w(this.a);
        return this.a
    };
    e.u = function(a) {
        this.Vb && this.D != a && (jl(this, Math.ceil(a / this.h.mb)), yl(this, a), this.D = a)
    };
    e.toggle = function(a) {
        1 == this.state() ? this.close(a) : this.open(a)
    };
    e.open = function(a) {
        a ? this.td.play() : (S(this.a, "bottom", kl(this) + "px"), this.a.T("close"), this.bh())
    };
    e.close = function(a) {
        a ? this.ld.play() : (S(this.a, "bottom", kl(this) - this.I + "px"), this.a.T("open"), this.Ag())
    };
    e.pm = function() {
        S(this.a, "display", "none");
        al(this, 2)
    };
    e.show = function() {
        S(this.a, "display", "");
        al(this, 1)
    };
    e.enable = function(a) {
        this.a = new T(["thumbnailWrapper", this.h.className, "close"]);
        this.A.c(this.a);
        var b = ah(this.lc);
        this.Gb = b.width / b.height;
        this.Ba = Math.ceil(this.o() / this.h.mb);
        b = this.Og();
        this.I = b.rg.height();
        this.vb = b.Th;
        var c = this.vb.height() + 2 * this.h.hc;
        this.wa = gl(this, c, b.Uh);
        this.a.c(this.wa);
        this.rh(b);
        this.td.pb(this.a, this.A, this.I);
        this.ld.pb(this.a, this.A, this.I);
        this.Vb = !0;
        this.u(a);
        S(this.a, "bottom", kl(this) - this.I + "px");
        this.Fc.f();
        this.Yb()
    };
    e.disable = function() {
        xl.V.disable.call(this);
        this.ja = [];
        this.D = 0;
        this.Vb = !1;
        this.I = 0;
        S(this.A.ka, "bottom", kl(this) + "px");
        w(this.a);
        this.A.removeChild(this.a)
    };
    e.resize = function() {
        var a = this.Og();
        this.I = a.rg.height();
        this.rh(a);
        w(this.a);
        this.td.pb(this.a, this.A, this.I);
        this.ld.pb(this.a, this.A, this.I);
        0 == this.state() ? S(this.a, "bottom", kl(this) - this.I + "px") : 1 == this.state() && (S(this.A.ka, "bottom", kl(this) + "px"), S(this.a, "bottom", kl(this) + "px"));
        this.vb = a.Th;
        w(this.vb);
        for (var b = 0; b < this.ja.length; ++b) this.ja[b].$(this.vb);
        b = this.vb.height() + 2 * this.h.hc;
        cl(this, b, a.Uh)
    };
    e.update = function() {
        for (var a = 0; a < this.ja.length; ++a) this.ja[a].update();
        this.Yb()
    };
    e.fo = function(a) {
        for (var b = 0; b < this.ja.length; ++b) this.Td.removeChild(this.ja[b]);
        this.ja = [];
        b = (a - 1) * this.h.mb + 1;
        a = Math.min(b + this.h.mb - 1, this.o());
        for (w(this.vb); b <= a; ++b) {
            var c = new ol(b, this.vb, this.ee);
            c.Wn.addHandler(this.Yq, this);
            this.Td.c(c);
            this.ja.push(c)
        }
        yl(this, this.D)
    };
    e.Yb = function() {
        var a = this.Ya.Ha();
        this.Ya.render(a)
    };
    e.Yq = function(a) {
        this.D != a && this.kc(a)
    };
    e.bh = function() {
        al(this, 1)
    };
    e.Ag = function() {
        al(this, 0)
    };
    e.rh = function(a) {
        if (1 > a.scale) {
            this.wa.H("scaled");
            var b = this.h.Ue + this.h.cm,
                c = a.rg.width();
            this.wa.Z(c - 2 * b);
            ug(this.wa.displayObject(), a.scale);
            this.A.cb().width() < c ? S(this.wa, "margin-left", (this.A.cb().width() - c + b) / 2 + "px") : S(this.wa, "margin-left", "")
        } else ug(this.wa.displayObject(), 1), this.wa.T("scaled"), S(this.wa, "margin-left", ""), this.wa.displayObject().style.width = ""
    };

    function yl(a, b) {
        for (var c = 0; c < a.ja.length; ++c) {
            var d = a.ja[c].pageNumber();
            0 != a.D && a.D != b && a.D == d && a.ja[c].setActive(!1);
            d == b && a.ja[c].setActive(!0)
        }
    }
    e.Og = function() {
        return (new Zk(this.Gb, this.h, this.Ba, this.o())).bm(this.A.cb())
    };
    e.ln = function(a) {
        var b = (a - 1) * this.h.mb + 1;
        a *= this.h.mb;
        a > this.o() && (a = this.o());
        return {
            left: b,
            right: a
        }
    };

    function zl(a) {
        W.call(this, [0], [1], a);
        this.A = this.sa = null;
        this.I = 0;
        this.i = this.Aa = null
    }
    v(zl, W);
    zl.prototype.pb = function(a, b, c) {
        this.i = c;
        this.A = b;
        this.sa = a.view();
        this.I = a.height()
    };
    zl.prototype.Ge = function() {
        var a = this.A.bb();
        S(this.sa, "bottom", a - this.I + "px");
        S(this.i.container(), "bottom", a + "px");
        this.sa.T("close")
    };
    zl.prototype.lb = function(a) {
        var b = a[0],
            c = this.A.bb();
        a = this.I * b;
        S(this.sa, "bottom", c - a + "px");
        a = this.I * (1 - b);
        S(this.i.container(), "bottom", Math.ceil(c + a) + "px");
        b = this.A.cb();
        a = b.height() - a;
        this.i.resize(new U(b.width(), a))
    };
    zl.prototype.wd = function() {
        this.sa.H("open");
        this.i.update()
    };

    function Al(a) {
        W.call(this, [0], [1], a);
        this.A = this.sa = null;
        this.I = 0;
        this.i = this.Aa = null
    }
    v(Al, W);
    Al.prototype.pb = function(a, b, c) {
        this.i = c;
        this.A = b;
        this.sa = a.view();
        this.I = a.height()
    };
    Al.prototype.Ge = function() {
        var a = this.A.bb();
        S(this.sa, "bottom", a - this.I + "px");
        S(this.i.container(), "bottom", a + "px");
        this.sa.T("close")
    };
    Al.prototype.lb = function(a) {
        var b = a[0],
            c = this.A.bb();
        a = this.I * (1 - b);
        S(this.sa, "bottom", c - a + "px");
        a = this.I * b;
        S(this.i.container(), "bottom", Math.ceil(c + a) + "px");
        b = this.A.cb();
        a = b.height() - a;
        this.i.resize(new U(b.width(), a))
    };
    Al.prototype.wd = function() {
        this.sa.H("open");
        this.i.update()
    };

    function Bl(a, b, c) {
        Xk.call(this, a, b, c)
    }
    v(Bl, Xk);
    Bl.prototype.bm = function(a) {
        var b = Yk(this, a),
            c = this.Ek(b),
            d = this.Ck(c),
            f = (d + 2 * (this.h.ai + this.h.hc + this.h.oi)) * this.h.mb,
            g = this.Gk(f);
        g > a.width() && (a.width() > x.yb ? g = a.width() : g > x.yb && (g = x.yb), f = this.Dk(g), d = f / this.h.mb - 2 * (this.h.ai + this.h.hc + this.h.oi), c = this.Bk(d), b = this.Fk(c));
        a = this.tf(a, x.yb, x.$h);
        1 != a && (g *= a, b *= a);
        return {
            rg: new U(g, b),
            Uh: f,
            Th: new U(d, c),
            scale: a
        }
    };
    Bl.prototype.Ck = function(a) {
        return Math.floor(a * this.Gb * 2)
    };
    Bl.prototype.Bk = function(a) {
        return a / this.Gb / 2
    };

    function Cl(a, b, c, d) {
        T.call(this, "thumbnailView");
        this.nj = new F;
        var f = c.width() / 2;
        this.Kb = new T("selection");
        this.c(this.Kb);
        this.ib = new T("thumbnailSpread");
        this.ib.Z(f);
        this.ib.pa(c.height());
        this.ib.C.addHandler(function() {
            this.nj.f(a, b)
        }, this);
        this.Kb.c(this.ib);
        this.wo = a;
        c = new U(f, c.height());
        this.fa = tj(d, b, c);
        this.ib.c(this.fa.displayObject())
    }
    v(Cl, T);
    Cl.prototype.page = function() {
        return this.fa
    };
    Cl.prototype.$ = function(a) {
        var b = a.width() / 2;
        this.ib.Z(b);
        this.ib.pa(a.height());
        a = new U(b, a.height());
        this.fa.$(a)
    };
    Cl.prototype.update = function() {
        this.fa.reset()
    };
    Cl.prototype.setActive = function(a) {
        a ? this.Kb.H("selected") : this.Kb.T("selected")
    };

    function Dl(a, b, c, d) {
        T.call(this, "thumbnailView");
        this.wo = a;
        this.nj = new F;
        c = this.Ng(a, 0);
        var f = this.Ng(a, 1);
        this.Kb = new T("selection");
        this.c(this.Kb);
        this.ib = new T("thumbnailSpread");
        this.ib.Z(b.width());
        this.ib.pa(b.height());
        this.ib.C.addHandler(function() {
            this.nj.f(a, f)
        }, this);
        this.Kb.c(this.ib);
        b = new U(b.width() / 2, b.height());
        this.yf = tj(d, c, b);
        this.yf.H("left");
        this.ib.c(this.yf.displayObject());
        c = this.Di(b);
        vl(c, 2);
        this.un = c;
        this.yf.c(c);
        this.Lf = tj(d, f, b);
        this.Lf.H("right");
        this.ib.c(this.Lf.displayObject());
        c = this.Di(b);
        vl(c, 1);
        this.ko = c;
        this.Lf.c(c)
    }
    v(Dl, T);
    e = Dl.prototype;
    e.$ = function(a) {
        this.ib.Z(a.width());
        this.ib.pa(a.height());
        a = new U(a.width() / 2, a.height());
        this.yf.$(a);
        this.Lf.$(a);
        this.un.style.width = a.width() + "px";
        this.un.style.height = a.height() + "px";
        this.ko.style.width = a.width() + "px";
        this.ko.style.height = a.height() + "px"
    };
    e.update = function() {
        this.yf.reset();
        this.Lf.reset()
    };
    e.setActive = function(a) {
        a ? this.Kb.H("selected") : this.Kb.T("selected")
    };
    e.Di = function(a) {
        var b = document.createElement("canvas");
        b.className = "shadow";
        b.width = a.width();
        b.height = a.height();
        return b
    };
    e.Ng = function(a, b) {
        switch (b) {
            case 0:
                a = 2 * (a - 1);
                break;
            case 1:
                a = 2 * (a - 1) + 1;
                break;
            default:
                throw Error("spreadSideId is wrong");
        }
        return a
    };

    function El(a) {
        this.Jb = [];
        this.Bh = a
    }
    e = El.prototype;
    e.Ha = function() {
        for (var a = [], b = this.Bh.Mb, c = 0; c < b.length; ++c) {
            var d = b[c];
            d instanceof Cl ? a.push(d.page()) : d instanceof Dl && (a.push(d.yf), a.push(d.Lf))
        }
        return a
    };
    e.render = function(a) {
        var b = this,
            c = this.Mg(a);
        c && !this.Tg(c) && (c.Sh() ? this.Yd(c) : (a = c.pageNumber(), this.Jb[a] || (this.Jb[a] = !0, this.Bh.document().getPage(a, function(a, f) {
            c.ei(a);
            b.Jb[f] = !1;
            b.render(b.Ha())
        }))))
    };
    e.Yd = function(a) {
        switch (a.X) {
            case 3:
                break;
            case 2:
                break;
            case 1:
                break;
            case 0:
                a.Za.addHandler(function() {
                    this.render(this.Ha())
                }, this);
                a.render();
                break;
            default:
                throw Error("renderingState is wrong");
        }
    };
    e.Mg = function(a) {
        for (var b = 0; b < a.length; ++b)
            if (!this.Sg(a[b])) return a[b];
        return null
    };
    e.Sg = function(a) {
        return 3 == a.X
    };
    e.Tg = function(a) {
        return 1 == a.X
    };

    function Fl(a, b) {
        switch (b) {
            case 0:
                a = 2 * a - 1;
                break;
            case 1:
                a *= 2;
                break;
            default:
                throw Error("sheetSideId is wrong");
        }
        return a
    }

    function Gl(a, b) {
        switch (b) {
            case 0:
                a -= 2;
                break;
            case 1:
                --a;
                break;
            case 2:
                break;
            case 3:
                a += 1;
                break;
            default:
                throw Error("bookSheetId is wrong");
        }
        return a
    }

    function Hl(a, b) {
        var c = Math.floor(b / 2) + 1;
        return 1 == a || a == c && 0 == b % 2
    };

    function Il(a, b, c) {
        bl.call(this, a, b);
        this.a = null;
        this.Lb = new tl;
        this.Mb = [];
        this.be = 0;
        this.Ya = new El(this);
        this.zd = null;
        this.ef = this.sb = this.Gb = 0;
        this.Vb = !1;
        this.I = 0;
        this.i = null;
        this.ee = c;
        this.td = new Al(this.h.animationDuration);
        this.td.ia.addHandler(this.bh, this);
        this.ld = new zl(this.h.animationDuration);
        this.ld.ia.addHandler(this.Ag, this)
    }
    v(Il, bl);
    e = Il.prototype;
    e.view = function() {
        w(this.a);
        return this.a
    };
    e.height = function() {
        return this.I
    };
    e.u = function(a) {
        this.Vb && (a = Math.floor(a / 2 + 1), this.sb != a && (jl(this, Math.ceil(a / this.h.mb)), Jl(this, a), this.sb = a))
    };
    e.ab = function(a) {
        Il.V.ab.call(this, a);
        this.be = Math.floor(this.o() / 2) + 1
    };
    e.Zj = function(a) {
        this.i = a
    };
    e.toggle = function(a) {
        1 == this.state() ? this.close(a) : this.open(a)
    };
    e.open = function(a) {
        if (a) this.td.play();
        else {
            S(this.A.ka, "bottom", Math.ceil(this.I + kl(this)) + "px");
            S(this.a, "bottom", kl(this) + "px");
            this.a.T("close");
            a = this.A.cb();
            var b = a.height() - this.I;
            this.i.resize(new U(a.width(), b));
            this.bh()
        }
    };
    e.close = function(a) {
        a ? this.ld.play() : (S(this.a, "bottom", kl(this) - this.I + "px"), this.a.T("open"), this.Ag())
    };
    e.enable = function(a) {
        this.a = new T(["thumbnailWrapper", this.h.className, "close"]);
        this.A.c(this.a);
        var b = ah(this.lc);
        this.Gb = b.width / b.height;
        this.Ba = Math.ceil(this.be / this.h.mb);
        b = this.Og();
        this.I = b.rg.height();
        this.zd = b.Th;
        var c = this.zd.height() + 2 * this.h.hc;
        this.wa = gl(this, c, b.Uh);
        this.a.c(this.wa);
        this.rh(b.scale);
        w(this.i);
        this.td.pb(this, this.A, this.i);
        this.ld.pb(this, this.A, this.i);
        this.Vb = !0;
        this.u(a);
        S(this.a, "bottom", kl(this) - this.I + "px");
        this.Fc.f();
        this.Yb()
    };
    e.pm = function() {
        S(this.A.ka, "bottom", "");
        var a = this.A.cb();
        this.i.resize(a);
        S(this.a, "display", "none");
        al(this, 2)
    };
    e.show = function() {
        S(this.A.ka, "bottom", Math.ceil(this.I + kl(this)) + "px");
        var a = this.A.cb(),
            b = a.height() - this.I;
        this.i.resize(new U(a.width(), b));
        S(this.a, "display", "");
        al(this, 1)
    };
    e.disable = function() {
        Il.V.disable.call(this);
        this.Mb = [];
        this.sb = 0;
        this.Vb = !1;
        this.I = 0;
        S(this.A.ka, "bottom", kl(this) + "px");
        w(this.a);
        this.A.removeChild(this.a)
    };
    e.resize = function() {
        var a = this.Og();
        this.I = a.rg.height();
        this.rh(a.scale);
        w(this.i);
        this.td.pb(this, this.A, this.i);
        this.ld.pb(this, this.A, this.i);
        0 == this.state() ? S(this.a, "bottom", kl(this) - this.I + "px") : 1 == this.state() && (S(this.A.ka, "bottom", Math.ceil(this.I + kl(this)) + "px"), S(this.a, "bottom", kl(this) + "px"));
        this.zd = a.Th;
        w(this.zd);
        for (var b = 0; b < this.Mb.length; ++b) this.Mb[b].$(this.zd);
        b = this.zd.height() + 2 * this.h.hc;
        cl(this, b, a.Uh)
    };
    e.update = function() {
        for (var a = 0; a < this.Mb.length; ++a) this.Mb[a].update();
        this.Yb()
    };
    e.fo = function(a) {
        for (var b = 0; b < this.Mb.length; ++b) this.Td.removeChild(this.Mb[b]);
        this.Mb = [];
        b = (a - 1) * this.h.mb + 1;
        a = Math.min(b + this.h.mb - 1, this.be);
        w(this.zd);
        for (var c; b <= a; ++b) Hl(b, this.o()) ? (c = 1 == b ? 1 : this.o(), c = new Cl(b, c, this.zd, this.ee)) : c = new Dl(b, this.zd, this.Lb, this.ee), c.nj.addHandler(this.ur, this), this.Td.c(c), this.Mb.push(c);
        Jl(this, this.sb)
    };
    e.Yb = function() {
        var a = this.Ya.Ha();
        this.Ya.render(a)
    };
    e.ur = function(a, b) {
        this.sb != a && this.kc(b)
    };
    e.bh = function() {
        al(this, 1)
    };
    e.Ag = function() {
        al(this, 0)
    };

    function Jl(a, b) {
        for (var c = 0; c < a.Mb.length; ++c) {
            var d = a.Mb[c].wo;
            0 != a.sb && a.sb != b && a.sb == d && a.Mb[c].setActive(!1);
            d == b && a.Mb[c].setActive(!0)
        }
    }
    e.Og = function() {
        return (new Bl(this.Gb, this.h, this.Ba)).bm(this.A.cb())
    };
    e.rh = function(a) {
        this.A.cb().width() < x.yb ? this.wa.Z(x.yb - 2 * this.h.Ue) : this.wa.displayObject().style.width = "";
        1 > a ? (this.wa.H("scaled"), ug(this.wa.displayObject(), a), this.A.cb().width() < x.yb ? S(this.wa, "margin-left", (this.A.cb().width() - x.yb) / 2 + "px") : S(this.wa, "margin-left", "")) : (ug(this.wa.displayObject(), 1), this.wa.T("scaled"), S(this.wa, "margin-left", ""))
    };
    e.ln = function(a) {
        var b = (a - 1) * this.h.mb * 2;
        0 == b && (b = 1);
        a = a * this.h.mb * 2 - 1;
        a > this.o() && (a = this.o());
        return {
            left: b,
            right: a
        }
    };

    function Kl(a, b, c) {
        A && (a.style.visibility = "hidden");
        a.scrollLeft = b;
        a.scrollTop = c;
        A && (a.style.visibility = "visible")
    };
    var Ll = [{
        Kd: "left",
        Jd: "back"
    }, {
        Kd: "right",
        Jd: "front"
    }, {
        Kd: "right",
        Jd: "back"
    }, {
        Kd: "left",
        Jd: "front"
    }, {
        Kd: "next",
        Jd: "front"
    }, {
        Kd: "next",
        Jd: "back"
    }, {
        Kd: "prev",
        Jd: "back"
    }, {
        Kd: "prev",
        Jd: "front"
    }];

    function Ml(a) {
        this.Jb = [];
        this.i = a
    }
    v(Ml, Qi);
    Ml.prototype.Ha = function() {
        for (var a = [], b, c, d = 0; d < Ll.length; ++d) {
            c = Ll[d].Kd;
            b = Ll[d].Jd;
            var f = this.i;
            switch (c) {
                case "prev":
                    c = f.Xa;
                    break;
                case "left":
                    c = f.ca;
                    break;
                case "right":
                    c = f.da;
                    break;
                case "next":
                    c = f.Va;
                    break;
                default:
                    throw Error("sheetName is wrong");
            }(b = c.mm(b)) && 0 != b.pageNumber() && a.push({
                le: b.pageNumber(),
                page: b
            })
        }
        return {
            Pc: a
        }
    };
    Ml.prototype.update = function() {
        for (var a = this.Ha().Pc, b = 0; b < a.length; ++b) a[b].page.reset();
        this.render(a)
    };
    Ml.prototype.R = function() {
        var a = this.i.document();
        w(a);
        return a
    };
    Ml.prototype.Yd = function(a) {
        switch (a.X) {
            case 3:
                break;
            case 2:
                break;
            case 1:
                break;
            case 0:
                a.Za.addHandler(function() {
                    var a = this.Ha();
                    this.render(a.Pc)
                }, this);
                a.render();
                break;
            default:
                throw Error("renderingState is wrong");
        }
    };

    function Nl(a) {
        W.call(this, [0], [1], a);
        this.ac = this.L = this.l = null;
        this.Gi = 0;
        this.a = null
    }
    v(Nl, W);
    Nl.prototype.Ge = function() {
        this.l.style.width = "0px";
        this.l.style.right = "0px";
        this.L.style.right = "0px";
        this.uo();
        this.Gi = parseInt(this.L.style.width, 10)
    };
    Nl.prototype.lb = function(a) {
        var b = this.Gi;
        a = Math.ceil(b * a[0]);
        this.l.style.width = b - a + "px";
        this.L.style.width = a + "px";
        2 != this.ac && 3 != this.ac && this.ro(a);
        var c = null,
            d = !1;
        1 == this.ac ? (c = 2 * a, d = c > b) : 2 == this.ac ? (c = 2 * b - a, d = a < b) : 3 == this.ac && (c = b - a, a > c && (c = a), d = !0);
        d && (w(c), this.a.Z(c))
    };
    Nl.prototype.wd = function() {
        this.l.style.width = this.Gi + "px";
        this.eo();
        this.Xm();
        2 == this.ac && this.a.Z(this.Gi)
    };

    function Ol(a) {
        Nl.call(this, a)
    }
    v(Ol, Nl);
    e = Ol.prototype;
    e.pb = function(a, b, c) {
        this.l = a.$l();
        this.L = a.km();
        this.a = b;
        this.ac = c
    };
    e.uo = function() {
        H(this.l, "back-flipping");
        H(this.L, "back-flipping")
    };
    e.eo = function() {
        J(this.l, "back-flipping");
        J(this.L, "back-flipping")
    };
    e.ro = function(a) {
        this.l.style.left = a + "px";
        this.L.style.left = a + "px"
    };
    e.Xm = function() {
        this.l.style.left = "";
        this.L.style.left = ""
    };
    var Pl = 1 / (1 - .9);

    function Ql(a, b) {
        W.call(this, [0], [1], a);
        this.Lb = b;
        this.a = this.M = this.ac = this.v = null
    }
    v(Ql, W);
    Ql.prototype.pb = function(a, b, c) {
        this.a = b;
        this.v = a;
        this.ac = c
    };
    Ql.prototype.Ge = function() {
        var a = this.v.width,
            b = this.v.height,
            c = document.createElement("canvas");
        c.className = "turn-shadow";
        c.width = a;
        c.height = b;
        c.style.width = a + "px";
        c.style.height = b + "px";
        this.M = c;
        vl(c, this.mn());
        this.a.ob().c(c);
        2 == this.ac ? this.qh(-(a / 2)) : this.qh(0);
        c.style.width = "0px"
    };
    Ql.prototype.lb = function(a) {
        a = a[0];
        var b = this.M,
            c = Math.ceil(this.v.width * a),
            d = Math.min(c, 600);
        .9 <= a && (b.style.opacity = (1 - (a - .9) * Pl * .6).toFixed(2));
        b.style.width = d + "px";
        2 != this.ac && 3 != this.ac ? this.qh(c - d / 2) : this.qh(-(d / 2))
    };
    Ql.prototype.wd = function() {
        w(this.M);
        this.a.ob().removeChild(this.M)
    };

    function Rl(a, b) {
        Ql.call(this, a, b)
    }
    v(Rl, Ql);
    Rl.prototype.qh = function(a) {
        this.M.style.left = a + "px"
    };
    Rl.prototype.mn = function() {
        return 4
    };

    function Sl(a) {
        Nl.call(this, a)
    }
    v(Sl, Nl);
    e = Sl.prototype;
    e.pb = function(a, b, c) {
        this.l = a.km();
        this.L = a.$l();
        this.a = b;
        this.ac = c
    };
    e.uo = function() {
        H(this.l, "front-flipping");
        H(this.L, "front-flipping")
    };
    e.eo = function() {
        J(this.l, "front-flipping");
        J(this.L, "front-flipping")
    };
    e.ro = function(a) {
        this.l.style.right = a + "px";
        this.L.style.right = a + "px"
    };
    e.Xm = function() {
        this.l.style.right = "";
        this.L.style.right = ""
    };

    function Tl(a, b) {
        Ql.call(this, a, b)
    }
    v(Tl, Ql);
    Tl.prototype.qh = function(a) {
        this.M.style.right = a + "px"
    };
    Tl.prototype.mn = function() {
        return 3
    };

    function Ul(a, b) {
        wi.call(this);
        this.Hl = a;
        this.Br = b;
        this.add(a);
        this.add(b)
    }
    v(Ul, wi);

    function Vl(a) {
        var b = x.Ps;
        this.i = a;
        this.Ai = null;
        this.zi = new F;
        a = a.$j();
        this.xk = new Ul(new Sl(b), new Tl(b, a));
        this.ik = new Ul(new Ol(b), new Rl(b, a));
        this.xk.Hl.ia.addHandler(this.Qm, this);
        this.ik.Hl.ia.addHandler(this.Qm, this);
        this.xk.ia.addHandler(this.hk, this);
        this.ik.ia.addHandler(this.hk, this)
    }
    Vl.prototype.play = function(a, b) {
        var c = 0 == a.Bp();
        this.Ai = b;
        b = this.i.sb;
        var d = this.i.Df,
            f = this.i.o();
        d = Hl(d, f);
        b = Hl(b, f) ? d ? 3 : 1 : d ? 2 : null;
        f = this.i.view();
        d = this.i.ad();
        w(d);
        c = c ? this.xk : this.ik;
        c.Hl.pb(a, f, b);
        c.Br.pb(d, f, b);
        c.play()
    };
    Vl.prototype.Qm = function() {
        null !== this.Ai && (this.Ai(), this.Ai = null)
    };
    Vl.prototype.hk = function() {
        this.zi.f()
    };

    function Wl() {
        T.call(this, ["viewer", x.df.className]);
        var a = this;
        this.gj = Xl("prev");
        this.c(this.gj);
        this.th = new T("bookSpread");
        this.c(this.th);
        this.Ga = new T("pageContainer");
        this.th.c(this.Ga);
        this.Wi = Xl("next");
        this.c(this.Wi);
        this.Ec = new F;
        this.so = new F;
        this.Wi.C.addHandler(function() {
            return a.Ec.f()
        });
        this.gj.C.addHandler(function() {
            return a.so.f()
        })
    }
    m(Wl, T);
    e = Wl.prototype;
    e.ob = function() {
        return this.Ga
    };
    e.Z = function(a) {
        this.Ga.Z(a);
        this.th.Z(a)
    };
    e.pa = function(a) {
        this.Ga.pa(a);
        this.th.pa(a)
    };
    e.uc = function(a) {
        var b = a.width() / x.yb;
        a = a.height() / x.$h;
        b = Math.min(b, a);
        a = this.gj.displayObject().firstElementChild;
        var c = this.Wi.displayObject().firstElementChild;
        w(a);
        w(c);
        1 > b ? (If(a, "right center"), ug(a, b), If(c, "left center"), ug(c, b)) : (If(a, ""), ug(a, 1), If(c, ""), ug(c, 1))
    };
    e.Ra = function() {
        return this.so
    };
    e.Qa = function() {
        return this.Ec
    };

    function Xl(a) {
        var b = new N({
            S: "spread"
        });
        b.Y("type", a);
        a = new N({
            J: R(b, "backLight")
        });
        b.c(a);
        var c = new N({
            J: R(b, "arrow")
        });
        a.c(c);
        return b
    };

    function Yl(a, b, c) {
        var d = this,
            f = c.container;
        this.g = f;
        this.mj = b;
        this.oc = c.Fd;
        this.v = c.viewport;
        this.Zb = this.v.scale / this.oc;
        this.Lb = c.$j;
        this.Ud = new F;
        var g = Fl(a, 0);
        this.l = new Mg(g, this.v, this.oc);
        (this.Na = c.pi) && this.l.Za.addHandler(function() {
            var a = d.Zb * oi(d.l.ad());
            d.Na.render(d.l, d.oc, a, d.l.Bg);
            d.Ud.f(d.l)
        });
        f.c(this.l);
        g = Fl(a, 1);
        this.L = new Mg(g, this.v, this.oc);
        this.L.Za.addHandler(function() {
            this.Ud.f(this.L)
        }, this);
        f.c(this.L);
        0 == b ? (this.l.H("front"), Ug(this.l, 0), this.L.H("back"), Ug(this.L, 0)) :
            (this.l.H("back"), Ug(this.l, 1), this.L.H("front"), Ug(this.L, 1));
        this.Cb = ul(this.Lb, this.l, 1);
        this.re = ul(this.Lb, this.L, 2)
    }
    e = Yl.prototype;
    e.jm = function() {
        return this.l
    };
    e.Zl = function() {
        return this.L
    };
    e.km = function() {
        return this.l.displayObject()
    };
    e.$l = function() {
        return this.L.displayObject()
    };
    e.Bp = function() {
        return this.mj
    };
    e.hg = function() {
        return this.Ud
    };
    e.G = function(a) {
        this.l.G(a);
        this.L.G(a);
        this.oc = a;
        this.v = this.v.clone({
            scale: this.Zb * a
        });
        this.Cb && (this.Cb.style.width = this.v.width + "px", this.Cb.style.height = this.v.height + "px");
        this.re && (this.re.style.width = this.v.width + "px", this.re.style.height = this.v.height + "px")
    };
    e.$ = function(a, b) {
        this.Zb = a.scale / b;
        this.v = a;
        this.Cb && (this.Cb.style.width = this.v.width + "px", this.Cb.style.height = this.v.height + "px");
        this.re && (this.re.style.width = this.v.width + "px", this.re.style.height = this.v.height + "px");
        this.l.$(a, b);
        this.L.$(a, b)
    };
    e.destroy = function() {
        this.hb(this.l);
        this.hb(this.L)
    };
    e.ki = function() {
        this.mj = 0 == this.mj ? 1 : 0;
        if (0 == this.mj) {
            var a = this.l;
            a.T("back");
            a.H("front");
            Ug(this.l, 0);
            a = this.L;
            a.T("front");
            a.H("back");
            Ug(this.L, 0)
        } else a = this.l, a.T("front"), a.H("back"), Ug(this.l, 1), a = this.L, a.T("back"), a.H("front"), Ug(this.L, 1)
    };
    e.Nc = function(a, b) {
        this.ym(a);
        this.vj(b)
    };
    e.vj = function(a) {
        this.l.H(a);
        this.L.H(a)
    };
    e.ym = function(a) {
        this.l.T(a);
        this.L.T(a)
    };
    e.mm = function(a) {
        switch (a) {
            case "front":
                a = this.l;
                break;
            case "back":
                a = this.L;
                break;
            default:
                throw Error("pageName is wrong");
        }
        return a
    };
    e.Zh = function(a, b) {
        var c = this,
            d = 0 == a ? this.l : this.L,
            f = d.displayObject(),
            g = f.style.cssText,
            h = f.className;
        this.hb(d);
        b = Fl(b, a);
        0 == a ? (this.l = d = new Mg(b, this.v, this.oc), this.Na && this.l.Za.addHandler(function() {
            var a = c.Zb * oi(c.l.ad());
            c.Na.render(c.l, c.oc, a, c.l.Bg);
            c.Ud.f(c.l)
        }), this.Cb = ul(this.Lb, this.l, 1)) : (this.L = d = new Mg(b, this.v, this.oc), this.re = ul(this.Lb, this.L, 2));
        f = d.displayObject();
        f.style.cssText = g;
        f.className = h;
        this.g.c(d)
    };
    e.hb = function(a) {
        null !== a && (this.g.removeChild(a), a.reset())
    };

    function Zl(a, b) {
        var c = this,
            d = b.container;
        this.g = d;
        this.oc = b.Fd;
        this.v = b.viewport;
        this.Zb = this.v.scale;
        this.Lb = b.$j;
        this.Ud = new F;
        this.Na = b.pi;
        a = Fl(a, 0);
        this.l = new Mg(a, this.v, this.oc);
        this.Na && this.l.Za.addHandler(function() {
            var a = c.Zb * oi(c.l.ad());
            c.Na.render(c.l, c.oc, a, c.l.Bg);
            c.Ud.f(c.l)
        });
        this.l.Za.addHandler(function() {
            this.Ud.f(this.l)
        }, this);
        d.c(this.l);
        this.l.H("front");
        this.Cb = ul(this.Lb, this.l, 1)
    }
    v(Zl, Yl);
    e = Zl.prototype;
    e.hg = function() {
        return this.Ud
    };
    e.G = function(a) {
        this.l.G(a);
        this.oc = a;
        this.v = this.v.clone({
            scale: this.Zb * a
        });
        this.Cb && (this.Cb.style.width = this.v.width + "px", this.Cb.style.height = this.v.height + "px")
    };
    e.$ = function(a, b) {
        this.Zb = a.scale / b;
        this.v = a;
        this.Cb && (this.Cb.style.width = this.v.width + "px", this.Cb.style.height = this.v.height + "px");
        this.l.$(a, b)
    };
    e.destroy = function() {
        this.hb(this.l)
    };
    e.vj = function(a) {
        this.l.H(a)
    };
    e.ym = function(a) {
        this.l.T(a)
    };
    e.mm = function(a) {
        switch (a) {
            case "front":
                a = this.l;
                break;
            case "back":
                a = null;
                break;
            default:
                throw Error("pageName is wrong");
        }
        return a
    };

    function $l() {}
    e = $l.prototype;
    e.hg = function() {
        return new F
    };
    e.destroy = function() {};
    e.Nc = function() {};
    e.vj = function() {};
    e.ym = function() {};
    e.ki = function() {};
    e.G = function() {};
    e.Zh = function() {};
    e.mm = function() {};
    e.km = function() {};
    e.$l = function() {};
    e.jm = function() {};
    e.Zl = function() {};
    e.$ = function() {};
    e.Bp = function() {};

    function am(a) {
        ti.call(this, a);
        this.a = null;
        this.Wa.addHandler(this.Xq, this);
        this.be = this.sb = 0;
        this.Va = this.da = this.ca = this.Xa = null;
        this.rk = !0;
        this.Lb = new tl;
        this.Ya = new Ml(this);
        this.Df = 0;
        this.xc = new ki(0, 0);
        this.ue = new ki(0, 0);
        this.Le = new te(0, 0);
        this.uf = null;
        this.Ro = new F;
        this.Eh = new Vl(this);
        this.Eh.zi.addHandler(this.to, this);
        this.Fc.addHandler(function() {
            var a = this.a.th.displayObject();
            this.ba.Fa = a
        }, this)
    }
    v(am, ti);
    e = am.prototype;
    e.$j = function() {
        return this.Lb
    };
    e.view = function() {
        w(this.a);
        return this.a
    };
    e.Oc = function() {
        var a = [],
            b = this.ca.Zl();
        b && (b = b.pageNumber() - 1, a.push(b));
        if (b = this.da.jm()) b = b.pageNumber() - 1, a.push(b);
        return a
    };
    e.u = function(a) {
        if (si(this, a) && 0 == this.Df)
            if (this.D = a, a = Math.floor(a / 2 + 1), this.sb != a)
                if (this.Df = a, this.rk) this.Xa = bm(this, a, 0), this.ca = bm(this, a, 1), this.ca.hg().addHandler(this.lj, this), this.da = bm(this, a, 2), this.da.hg().addHandler(this.lj, this), this.Va = bm(this, a, 3), this.to(), ri(this), this.rk = !1;
                else {
                    switch (this.Hk(a)) {
                        case 0:
                            var b = this.Cr;
                            break;
                        case 2:
                            b = this.Dr;
                            break;
                        case 1:
                            b = this.qq;
                            break;
                        case 3:
                            b = this.sq;
                            break;
                        default:
                            throw Error("TransitionType is wrong");
                    }
                    b.call(this, a)
                }
        else this.kc()
    };
    e.af = function() {
        1 >= this.D || this.u(this.D - (2 < this.D ? 2 : 1))
    };
    e.$e = function() {
        if (!(this.D >= this.o())) {
            var a = 1 < this.o() - this.D ? 2 : 1;
            this.u(this.D + a)
        }
    };
    e.G = function(a) {
        this.Bb != a && 0 == this.Df && (this.Bb = a, this.N = a * (this.$a - 1) + 1, this.K = this.K.clone({
            scale: this.Zb * this.N
        }), cm(this), dm(this), this.ca.G(this.N), this.da.G(this.N), this.Xa.G(this.N), this.Va.G(this.N), this.Mf.f(this.Bb))
    };
    e.me = function(a) {
        this.G(a);
        var b = this.a.ob().displayObject().getBoundingClientRect();
        a = b.width / this.Le.width;
        b = b.height / this.Le.height;
        a *= this.ue.x();
        b *= this.ue.y();
        var c = 1 < this.W ? x.df.Kp : 0;
        Kl(this.g.displayObject(), a - this.xc.x() + x.df.Hm + c, b - this.xc.y() + x.df.Hm)
    };
    e.Gd = function(a, b) {
        var c = this.a.ob().displayObject().getBoundingClientRect();
        this.xc = new ki(a, b);
        this.ue = new ki(Math.max(a - c.left, 0), Math.max(b - c.top, 0));
        this.Le = new te(c.width, c.height)
    };
    e.resize = function(a) {
        this.Aa = a;
        this.Vb && (this.a.uc(a), this.N = this.Bb * (this.$a - 1) + 1, this.Zb = this.Ua(this.uf), this.K = this.uf.clone({
            scale: this.Zb * this.N
        }), cm(this), dm(this), this.ca.$(this.K, this.N), this.da.$(this.K, this.N), this.Xa.$(this.K, this.N), this.Va.$(this.K, this.N))
    };
    e.update = function() {
        this.Ya.update()
    };
    e.ab = function(a) {
        am.V.ab.call(this, a);
        this.be = Math.floor(this.o() / 2) + 1;
        a = this.Lb;
        var b = [1];
        0 == this.o() % 2 && b.push(this.o());
        a.Sl = b;
        this.uf = ah(this.lc)
    };
    e.enable = function(a) {
        this.a = new Wl;
        w(this.Aa);
        this.a.uc(this.Aa);
        this.a.Ra().addHandler(this.af, this);
        this.a.Qa().addHandler(this.$e, this);
        1 == this.o() && this.a.H("onePage");
        this.container().c(this.a);
        var b = this.Ua(this.uf);
        this.K = this.uf.clone({
            scale: b
        });
        this.Zb = this.K.scale;
        this.u(a);
        cm(this);
        dm(this)
    };
    e.disable = function() {
        am.V.disable.call(this);
        w(this.a);
        this.container().removeChild(this.a);
        this.a = null;
        em(this.Xa);
        em(this.ca);
        em(this.da);
        em(this.Va);
        this.g.displayObject().style.marginTop = "";
        this.sb = 0;
        this.rk = !0
    };
    e.Yb = function() {
        var a = this.Ya.Ha();
        this.Ya.render(a.Pc)
    };
    e.to = function() {
        this.sb = this.Df;
        this.Yb();
        this.kc();
        this.Df = 0
    };
    e.Cr = function(a) {
        var b = this;
        w(this.da);
        this.Eh.play(this.da, function() {
            em(b.Xa);
            b.ca.Nc("left", "prev");
            b.Xa = b.ca;
            b.da.ki();
            b.da.Nc("right", "left");
            b.ca = b.da;
            b.Va.Nc("next", "right");
            b.da = b.Va;
            b.Va = bm(b, a, 3)
        })
    };
    e.Dr = function(a) {
        var b = this;
        w(this.ca);
        this.Eh.play(this.ca, function() {
            em(b.Va);
            b.da.Nc("right", "next");
            b.Va = b.da;
            b.ca.ki();
            b.ca.Nc("left", "right");
            b.da = b.ca;
            b.Xa.Nc("prev", "left");
            b.ca = b.Xa;
            b.Xa = bm(b, a, 0)
        })
    };
    e.qq = function(a) {
        var b = this;
        em(this.Xa);
        em(this.Va);
        var c = Gl(a, 1);
        this.da.Zh(1, c);
        this.Va = bm(this, a, 2);
        w(this.da);
        this.Eh.play(this.da, function() {
            em(b.ca);
            b.da.ki();
            b.da.Nc("right", "left");
            b.ca = b.da;
            b.ca.Zh(0, c);
            b.Va.Nc("next", "right");
            b.da = b.Va;
            b.Va = bm(b, a, 3);
            b.Xa = bm(b, a, 0)
        })
    };
    e.sq = function(a) {
        var b = this;
        em(this.Xa);
        em(this.Va);
        var c = Gl(a, 2);
        this.ca.Zh(0, c);
        this.Xa = bm(this, a, 1);
        w(this.ca);
        this.Eh.play(this.ca, function() {
            em(b.da);
            b.ca.ki();
            b.ca.Nc("left", "right");
            b.da = b.ca;
            b.da.Zh(1, c);
            b.Xa.Nc("prev", "left");
            b.ca = b.Xa;
            b.Xa = bm(b, a, 0);
            b.Va = bm(b, a, 3)
        })
    };

    function em(a) {
        a && a.destroy()
    }
    e.lj = function() {
        var a = this.ca.Zl();
        a && 3 != a.X || (a = this.da.jm(), a && 3 != a.X || (this.Ro.f(), this.ca.hg().removeHandler(this.lj, this), this.da.hg().removeHandler(this.lj, this)))
    };
    e.Hk = function(a) {
        var b = this.sb;
        return a > b ? a == b + 1 ? 0 : 1 : a == b - 1 ? 2 : 3
    };

    function bm(a, b, c) {
        b = Gl(b, c);
        switch (c) {
            case 0:
            case 1:
                var d = 1;
                break;
            case 2:
            case 3:
                d = 0;
                break;
            default:
                throw Error("bookSheetId is wrong");
        }
        var f = {
            container: a.a.ob(),
            Fd: a.N,
            viewport: a.K,
            $j: a.Lb,
            pi: a.Na
        };
        a = 0 < b && b < a.be ? new Yl(b, d, f) : 0 == a.o() % 2 || b != a.be ? new $l : new Zl(b, f);
        switch (c) {
            case 0:
                c = "prev";
                break;
            case 1:
                c = "left";
                break;
            case 2:
                c = "right";
                break;
            case 3:
                c = "next";
                break;
            default:
                throw Error("bookSheetId is wrong");
        }
        a.vj(c);
        return a
    }
    e.Ua = function(a) {
        var b = x.df.Hm,
            c = x.df.Kp,
            d = this.Aa.width() - 2 * b;
        1 < this.o() && (d -= 2 * c);
        2 < this.o() && (d /= 2);
        c = d / a.width;
        a = (this.Aa.height() - 2 * b) / a.height;
        return Math.min(a, c)
    };

    function cm(a) {
        var b = Math.floor(a.K.width),
            c = Math.floor(a.K.height);
        Hl(a.sb, a.o()) || (b *= 2);
        a.a.Z(b);
        a.a.pa(c)
    }

    function dm(a) {
        var b = Math.round(a.K.height);
        b = (a.Aa.height() - b - 18) / 2;
        0 < b ? a.g.displayObject().style.marginTop = b + "px" : a.g.displayObject().style.marginTop = ""
    }
    e.Xq = function(a) {
        this.a.gj.Y("invisible", !(1 < a));
        this.a.Wi.Y("invisible", !(Math.floor(a / 2 + 1) < this.be))
    };
    var fm = Ub();
    fm.Bm = !1;
    Wb(fm.fk, {
        Yc: 3,
        ii: 3,
        ig: 3,
        Zf: 6,
        lg: 7,
        $f: 34
    });
    Wb(fm.ek, {
        ii: 4
    });

    function gm(a) {
        var b = new T("btn", "BUTTON");
        a = new T(["icon", a]);
        b.c(a);
        return b
    };

    function hm() {
        T.call(this, "pageNavigationToolbarContainer");
        this.W = 0;
        this.ml = new F;
        this.lh = gm("previous");
        this.c(this.lh);
        var a = new T("pageNumber");
        this.c(a);
        var b = new T("view");
        a.c(b);
        M && fg ? a = new T("currentPage mobile", "DIV") : (a = new T("currentPage", "INPUT"), a.setAttribute("type", "text"), a.setAttribute("maxlength", "4"), B(a.displayObject(), "keydown", this.Pq, !1, this), B(a.displayObject(), "keyup", this.Nn, !1, this), B(a.displayObject(), "paste", this.Qq, !1, this), B(a.displayObject(), "input", this.Oq, !1, this));
        this.ll = a;
        b.c(this.ll);
        a = document.createTextNode("\u00a0/\u00a0");
        Ae(b.displayObject(), a);
        this.Ce = new T("pagesCount", "SPAN");
        b.c(this.Ce);
        this.Zg = gm("next");
        this.c(this.Zg)
    }
    v(hm, T);
    e = hm.prototype;
    e.qa = function(a) {
        this.W = a;
        this.Ce.U(a.toString())
    };
    e.u = function(a) {
        this.lh.Pa(1 != a);
        this.Zg.Pa(a != this.W);
        M && fg ? this.ll.U(a.toString()) : this.ll.displayObject().value = a.toString()
    };
    e.wc = function(a) {
        var b = this.lh.displayObject().firstElementChild,
            c = this.Zg.displayObject().firstElementChild;
        switch (a) {
            case 1:
                H(b, "up");
                H(c, "down");
                break;
            case 2:
                J(b, "up"), J(c, "down")
        }
    };
    e.Oq = function(a) {
        var b = a.target.value;
        b.match(/[^0-9]/g) && (a.target.value = b.replace(/[^0-9]/g, ""))
    };
    e.Pq = function(a) {
        a.stopPropagation();
        im(a) && a.preventDefault();
        var b = a.which || a.keyCode;
        A && 10 >= parseInt(rc, 10) && 13 == b && (a.preventDefault(), this.Nn(a))
    };
    e.Nn = function(a) {
        13 == a.keyCode && (a = jm(a.target.value), isNaN(a) || this.ml.f(a))
    };
    e.Qq = function(a) {
        var b = jm((a.Oa.clipboardData || window.clipboardData).getData("text"));
        isNaN(b) && a.preventDefault()
    };

    function im(a) {
        switch (a.which || a.keyCode) {
            case 8:
            case 46:
            case 9:
            case 48:
            case 49:
            case 50:
            case 51:
            case 52:
            case 53:
            case 54:
            case 55:
            case 56:
            case 57:
            case 96:
            case 97:
            case 98:
            case 99:
            case 100:
            case 101:
            case 102:
            case 103:
            case 104:
            case 105:
                return a.shiftKey || a.metaKey;
            case 13:
                return !1;
            case 65:
            case 67:
            case 88:
            case 86:
                return !0 !== a.ctrlKey;
            case 37:
            case 39:
                return !1
        }
        return !0
    }

    function jm(a) {
        return /^\d+$/.test(a) ? parseInt(a, 10) : NaN
    };

    function km() {
        T.call(this, "viewerToolbarContainer");
        this.Sf = gm("thumbnail");
        this.c(this.Sf);
        this.Hh = gm("viewMode");
        this.c(this.Hh);
        this.sf = gm("fullscreen");
        this.c(this.sf)
    }
    v(km, T);
    e = km.prototype;
    e.wc = function(a) {
        var b = this.Hh.displayObject().firstElementChild;
        switch (a) {
            case 1:
                J(b, "book");
                H(b, "pages");
                break;
            case 2:
                J(b, "pages"), H(b, "book")
        }
    };
    e.dd = function(a) {
        var b = this.sf.displayObject().firstElementChild;
        a ? H(b, "selected") : J(b, "selected")
    };
    e.fd = function(a) {
        var b = this.Sf.displayObject().firstElementChild;
        switch (a) {
            case 1:
                H(b, "open");
                break;
            case 0:
                J(b, "open")
        }
    };
    e.G = function(a) {
        this.Sf.Pa(0 == a)
    };
    e.vc = function(a) {
        this.Sf.Pa(a)
    };
    e.gd = function(a) {
        this.Hh.Pa(a)
    };
    e.cd = function(a) {
        this.sf.Pa(a)
    };
    e.bd = function() {
        this.removeChild(this.sf)
    };

    function lm() {
        T.call(this, ["toolbar", "mobile", "hidden"]);
        this.Vf = 1;
        this.ea = new U(0, 0);
        var a = new T("toolbarCenter");
        this.Fb = new hm;
        a.c(this.Fb);
        this.oa = new km;
        a.c(this.oa);
        this.c(a)
    }
    v(lm, T);
    e = lm.prototype;
    e.width = function() {
        return this.ea.width()
    };
    e.height = function() {
        return this.ea.height()
    };
    e.qa = function(a) {
        this.Fb.qa(a)
    };
    e.u = function(a) {
        this.Fb.u(a)
    };
    e.wc = function(a) {
        this.oa.wc(a)
    };
    e.dd = function(a) {
        this.oa.dd(a)
    };
    e.fd = function(a) {
        this.oa.fd(a)
    };
    e.G = function(a) {
        this.oa.G(a)
    };
    e.uc = function(a) {
        var b = a.width() / x.yb,
            c = a.height() / x.$h;
        b = Math.min(b, c);
        c = a.width();
        var d = x.bb;
        1 > b ? (If(this.displayObject(), "left bottom"), ug(this.displayObject(), b), d = Math.floor(x.bb * b), this.Z(a.width() * (1 / b))) : (If(this.displayObject(), ""), ug(this.displayObject(), 1), S(this, "width", ""));
        this.Vf = Math.min(1, b);
        this.ea = new U(c, d)
    };
    e.vc = function(a) {
        this.oa.vc(a)
    };
    e.gd = function(a) {
        this.oa.gd(a)
    };
    e.cd = function(a) {
        this.oa.cd(a)
    };
    e.cf = function() {
        return this.oa.Hh.C
    };
    e.Ra = function() {
        return this.Fb.lh.C
    };
    e.Qa = function() {
        return this.Fb.Zg.C
    };
    e.zb = function() {
        return this.Fb.ml
    };
    e.Pb = function() {
        return this.oa.sf.C
    };
    e.bf = function() {
        return this.oa.Sf.C
    };
    e.bd = function() {
        this.oa.bd()
    };

    function mm(a, b) {
        T.call(this, "mainContainer");
        this.ea = new U(0, 0);
        this.zf = new T("loaderIcon");
        this.c(this.zf);
        this.ka = new T("viewerContainer");
        this.c(this.ka);
        this.s = new lm;
        this.c(this.s);
        this.zq = new F;
        this.uc(new U(a, b));
        a = new Gj(this.ka.displayObject());
        B(a, "mousewheel", this.Ol, !1, this)
    }
    v(mm, T);
    e = mm.prototype;
    e.qa = function(a) {
        this.s.qa(a)
    };
    e.u = function(a) {
        this.s.u(a)
    };
    e.cb = function() {
        return new U(this.ea.width(), this.ea.height() - this.s.height())
    };
    e.bb = function() {
        return this.s.height()
    };
    e.wc = function(a) {
        this.s.wc(a)
    };
    e.dd = function(a) {
        this.s.dd(a)
    };
    e.fd = function(a) {
        this.s.fd(a)
    };
    e.G = function(a) {
        this.s.G(a)
    };
    e.uc = function(a) {
        this.ea = a;
        this.resize(a.width(), a.height());
        this.s.uc(a);
        a = Math.round(this.s.height());
        S(this.ka, "bottom", a + "px")
    };
    e.cf = function() {
        return this.s.cf()
    };
    e.Ra = function() {
        return this.s.Ra()
    };
    e.Qa = function() {
        return this.s.Qa()
    };
    e.zb = function() {
        return this.s.zb()
    };
    e.Pb = function() {
        return this.s.Pb()
    };
    e.og = function() {
        return new F
    };
    e.bf = function() {
        return this.s.bf()
    };
    e.Gm = function() {
        this.s.T("hidden")
    };
    e.bd = function() {
        this.s.bd()
    };
    e.Bj = function() {};
    e.vc = function(a) {
        this.s.vc(a)
    };
    e.gd = function(a) {
        this.s.gd(a)
    };
    e.cd = function(a) {
        this.s.cd(a)
    };
    e.Ol = function(a) {
        this.zq.f(a.Oa)
    };

    function nm(a, b, c) {
        var d = new kh;
        this.a = new mm(a.clientWidth, a.clientHeight);
        ze(a, this.a.ra);
        Y.call(this, a, b, 2, fm, d, c);
        this.Jg = new Dh(this.a);
        this.wh = this.lf = this.Dc = 0;
        this.Ka = new Lh;
        this.Ka.Ra().addHandler(this.Wc, this);
        this.Ka.Qa().addHandler(this.Uc, this);
        this.Ka.zb().addHandler(this.ae, this);
        this.Ka.Pb().addHandler(this.nd, this);
        this.la = new Kh(this.a.ka);
        this.la.Xl.addHandler(this.Yl, this);
        this.la.sg().addHandler(this.Ih, this);
        this.la.Ke.ul.addHandler(this.Ul, this);
        this.la.Ra().addHandler(this.Wc,
            this);
        this.la.Qa().addHandler(this.Uc, this);
        this.a.cf().addHandler(this.Ml, this);
        this.a.Ra().addHandler(this.Wc, this);
        this.a.Qa().addHandler(this.Uc, this);
        this.a.zb().addHandler(this.ae, this);
        this.a.Pb().addHandler(this.nd, this);
        this.a.bf().addHandler(this.Nl, this);
        this.a.G(0);
        this.Bc(1, Ti);
        this.Bc(2, am);
        this.Xd(1, xl, fm.ek);
        this.Xd(2, Il, fm.fk);
        this.hh()
    }
    v(nm, Y);
    nm.prototype.view = function() {
        return this.a
    };
    nm.prototype.resize = function(a, b) {
        this.Dc && clearTimeout(this.Dc);
        this.ea = new U(a, b);
        this.a.uc(this.ea);
        this.Ia && this.Ia.$(this.ea);
        this.na.Gj && (this.P.resize(), this.j.resize(this.Rd()), this.Dc = setTimeout(this.Il.bind(this), fm.zm));
        document.body.scrollTop = 0
    };
    nm.prototype.Oc = function() {
        return this.j.Oc()
    };
    nm.prototype.viewPages = nm.prototype.Oc;
    e = nm.prototype;
    e.Il = function() {
        this.j.update();
        this.P.update()
    };
    e.Ub = function(a) {
        nm.V.Ub.call(this, a);
        this.P.enable(this.na.Da);
        this.P.view().H("tablet");
        this.j.resize(this.Rd());
        this.j.enable(this.na.Da);
        this.a.wc(a)
    };
    e.hh = function() {
        if (window.location.hash) {
            var a = this.gh(window.location.hash.substring(1));
            "page" in a && (this.na.Da = parseInt(a.page, 10));
            if ("mode" in a) switch (a.mode) {
                case "book":
                    this.Sb = 2;
                    break;
                case "pages":
                    this.Sb = 1
            }
        }
    };
    e.gh = function(a) {
        a = a.split("&");
        for (var b = {}, c = 0; c < a.length; ++c) {
            var d = a[c].split("=");
            b[decodeURIComponent(d[0].toLowerCase())] = 1 < d.length ? decodeURIComponent(d[1]) : null
        }
        return b
    };
    e.Wc = function() {
        this.j.af()
    };
    e.Uc = function() {
        this.j.$e()
    };
    e.Ml = function() {
        switch (this.Sb) {
            case 2:
                this.Ub(1);
                break;
            case 1:
                this.Ub(2)
        }
    };
    e.Rd = function() {
        var a = this.a.cb(),
            b = a.height();
        this.P instanceof Il && 0 != this.P.state() && (b -= this.P.height());
        return new U(a.width(), b)
    };
    e.ae = function(a) {
        this.j.u(a)
    };
    e.nd = function() {
        this.Jg.toggle()
    };
    e.Bc = function(a, b) {
        nm.V.Bc.call(this, a, b);
        if (b = this.Wb.pi()) this.xa[a].Na = b;
        this.xa[a].Wj(this.Wb.Ye());
        this.xa[a].Mf.addHandler(this.Ql, this);
        this.xa[a].Fc.addHandler(this.Rl, this)
    };
    e.Xd = function(a, b, c) {
        nm.V.Xd.call(this, a, b, c);
        this.jb[a].Wa.addHandler(this.Bl, this);
        this.jb[a].ce.addHandler(this.Cl, this);
        this.jb[a].Fc.addHandler(this.Dl, this)
    };
    e.rd = function(a) {
        nm.V.rd.call(this, a);
        th(a, this.Rc);
        var b = a.o();
        this.a.u(1);
        this.a.qa(b);
        this.xa[2].ab(a);
        this.xa[1].ab(a);
        this.jb[2].ab(a);
        this.jb[1].ab(a);
        a = this.jb[2];
        a instanceof Il && a.Zj(this.xa[2]);
        this.Ub(this.Sb);
        this.Ka.qa(b);
        1 == b && (this.a.vc(!1), this.a.gd(!1));
        Ej(this)
    };
    e.Se = function(a) {
        nm.V.Se.call(this, a);
        this.a.u(a);
        null !== this.P && this.P.u(a);
        this.kc(a)
    };
    e.Ql = function(a) {
        this.a.G(a);
        0 < a ? (this.ba.Qb() || this.ba.enable(), 1 == this.P.state() && this.P.pm(), a = this.la, a.qd && (ge(a.Ae), a.qd = !1), a = this.la, a.Sd && (ge(a.Cf), a.Sd = !1)) : (this.ba.Qb() && this.ba.disable(), 2 == this.P.state() && this.P.show(), 1 == this.R.o() && this.a.vc(!1), a = this.la, a.qd || (fe(a.Ae), a.qd = !0), a = this.la, a.Sd || (fe(a.Cf), a.Sd = !0))
    };
    e.Rl = function() {
        this.j.G(0);
        this.a.G(0);
        this.ba.Qb() && this.ba.disable()
    };
    e.Bl = function(a) {
        this.na.Da = a;
        this.a.u(a);
        this.j.u(a)
    };
    e.Cl = function(a) {
        this.na.ak = a;
        this.a.fd(a)
    };
    e.Dl = function() {
        1 == this.na.ak ? this.P.open() : this.P.close()
    };
    e.Nl = function() {
        this.P.toggle(!0)
    };
    e.Yl = function(a, b) {
        this.wh = this.j.Fd();
        this.j.Gd(a, b)
    };
    e.Ih = function(a) {
        a = this.tf(this.wh * a);
        a = cb(a, fm.Xe, fm.We);
        this.j.me(a)
    };
    e.Ul = function() {
        this.j.update()
    };
    e.tf = function(a) {
        return (a - 1) / (this.j.$a - 1)
    };

    function om() {
        var a = null,
            b = null;
        this.pl = new Promise(function(c, d) {
            a = c;
            b = d
        });
        this.jo = a;
        this.ql = b
    }
    e = om.prototype;
    e.resolveFunc = function() {
        return w(this.jo)
    };
    e.rejectFunc = function() {
        return w(this.ql)
    };
    e.resolve = function(a) {
        w(this.jo)(a)
    };
    e.reject = function(a) {
        w(this.ql)(a)
    };
    e.cancel = function() {
        w(this.ql)("canceled")
    };
    e.then = function(a, b) {
        return this.pl.then(a, b)
    };
    e.catch = function(a) {
        return this.pl.catch(a)
    };
    e.toPromise = function() {
        return this.pl
    };

    function pm() {}
    pm.prototype.cancel = function() {};
    var qm = {
        Vj: "cefclientSendQuery",
        sp: "cefclientCancelQuery",
        mg: "cefclientSendCallbackResult",
        ys: "cefclientDispatch",
        xs: "cefclientDispatchCancel"
    };

    function rm() {
        if (!sm(qm.Vj) || !sm(qm.sp) || !sm(qm.mg)) throw Error("Cef interaction functions not found");
        this.pr = window[qm.Vj];
        this.nr = window[qm.sp];
        this.qr = window[qm.mg];
        this.co = new F;
        this.bo = new F;
        window[qm.ys] = this.cr.bind(this);
        window[qm.xs] = this.ar.bind(this)
    }
    e = rm.prototype;
    e.wm = function() {
        return this.co
    };
    e.Vj = function(a, b, c, d) {
        return this.pr(a, b, c, d)
    };
    e.mg = function(a, b, c, d) {
        this.qr(a, b, c, d)
    };
    e.cr = function(a, b, c) {
        this.co.f(a, b, c)
    };
    e.ar = function(a) {
        this.bo.f(a)
    };

    function sm(a) {
        return window[a] && "function" === typeof window[a]
    };

    function tm() {
        this.Ld = new rm;
        this.Ja = {};
        this.zg = {};
        this.Ld.wm().addHandler(this.br, this);
        this.Ld.bo.addHandler(this.$q, this)
    }
    e = tm.prototype;
    e.wm = function() {
        return this.Ld.wm()
    };
    e.call = function(a, b) {
        for (var c = [], d = 1; d < arguments.length; ++d) c[d - 1] = arguments[d];
        var f = new om;
        c = this.Ld.Vj(a, c, f.resolveFunc(), function(b, c) {
            f.rejectFunc()("cef.Client call '" + a + "' failed: " + c)
        });
        f.catch(this.Zq.bind(this, c));
        return f
    };
    e.addHandler = function(a, b, c) {
        this.Ja[a] = b.bind(c)
    };
    e.removeHandler = function(a) {
        delete this.Ja[a]
    };
    e.Zq = function(a, b) {
        "canceled" == b && this.Ld.nr(a)
    };
    e.br = function(a, b, c) {
        var d = this;
        if (this.Ja[a]) {
            this.zg[b] = new pm;
            var f = this.Ja[a];
            try {
                var g = f.apply(f, [this.zg[b]].concat(c));
                var h = "function" === typeof g ? new Promise(g) : new Promise(function(a) {
                    return a(g)
                })
            } catch (k) {
                h = new Promise(function(a, b) {
                    b(k)
                })
            }
            h.then(function(c) {
                d.Ld.mg(b, a, !0, c);
                delete d.zg[b]
            }, function(c) {
                d.Ld.mg(b, a, !1, um(c));
                delete d.zg[b]
            })
        } else c = "Request " + a + " have no handler", this.Ld.mg(b, a, !1, um(Error(c))), n.console.error(c)
    };
    e.$q = function(a) {
        this.zg[a].cancel()
    };

    function um(a) {
        try {
            return "object" == typeof a && void 0 !== a.message && void 0 !== a.stack ? '"' + a.message + '", stack:\n' + a.stack : "<" + typeof a + "> " + a
        } catch (b) {
            return "error while printing error: " + b
        }
    };
    var vm = function() {
        if (jc) {
            var a = /Windows NT ([0-9.]+)/;
            return (a = a.exec(Kb)) ? a[1] : "0"
        }
        return ic ? (a = /10[_.][0-9_.]+/, (a = a.exec(Kb)) ? a[0].replace(/_/g, ".") : "10") : lc ? (a = /Android\s+([^\);]+)(\)|;)/, (a = a.exec(Kb)) ? a[1] : "") : mc || nc || oc ? (a = /(?:iPhone|CPU)\s+OS\s+(\S+)/, (a = a.exec(Kb)) ? a[1].replace(/_/g, ".") : "") : ""
    }();

    function wm(a) {
        return (a = a.exec(Kb)) ? a[1] : ""
    }
    var xm = function() {
        if (nf) return wm(/Firefox\/([0-9.]+)/);
        if (A || ec || dc) return rc;
        if (rf) return $b() ? wm(/CriOS\/([0-9.]+)/) : wm(/Chrome\/([0-9.]+)/);
        if (sf && !$b()) return wm(/Version\/([0-9.]+)/);
        if ( of || pf) {
            var a = /Version\/(\S+).*Mobile\/(\S+)/.exec(Kb);
            if (a) return a[1] + "." + a[2]
        } else if (qf) return (a = wm(/Android\s+([0-9.]+)/)) ? a : wm(/Version\/([0-9.]+)/);
        return ""
    }();

    function ym(a, b, c, d, f) {
        Zh.call(this, b, c, d, f);
        this.element = a
    }
    v(ym, Zh);
    ym.prototype.bk = ua;
    ym.prototype.Lj = function() {
        this.bk();
        ym.V.Lj.call(this)
    };
    ym.prototype.Xh = function() {
        this.bk();
        ym.V.Xh.call(this)
    };
    ym.prototype.Mj = function() {
        this.bk();
        ym.V.Mj.call(this)
    };

    function zm(a, b, c, d, f) {
        if (2 != b.length || 2 != c.length) throw Error("Start and end points must be 2D");
        ym.apply(this, arguments)
    }
    v(zm, ym);
    zm.prototype.bk = function() {
        if (this.Qs) {
            var a = this.element,
                b = Math.round(this.coords[0]);
            b = Math.max(b, 0);
            if ("rtl" == Re(a)) {
                var c;
                if (c = sf) c = 0 <= Gb(xm, 10);
                var d;
                if (d = pc) d = 0 <= Gb(vm, 10);
                a.scrollLeft = gc || c || d ? -b : fc && vc("8") ? b : a.scrollWidth - b - a.clientWidth
            } else a.scrollLeft = b
        } else this.element.scrollLeft = Math.round(this.coords[0]);
        this.element.scrollTop = Math.round(this.coords[1])
    };

    function Am(a, b) {
        zm.call(this, a, [0, 0], [0, 0], b)
    }
    v(Am, zm);

    function Bm(a, b, c) {
        this.va = a || 0;
        this.yr = b || 0;
        this.tq = c || 0
    }
    Bm.prototype.pageNumber = function() {
        return this.va
    };
    Bm.prototype.top = function() {
        return this.yr
    };
    Bm.prototype.left = function() {
        return this.tq
    };

    function Cm(a) {
        this.Jb = [];
        this.i = a;
        this.Be = []
    }
    v(Cm, Qi);
    Cm.prototype.Ha = function() {
        for (var a = this.i, b = qi(a), c = b.scrollTop, d = c + b.clientHeight, f = b = Dm(this, c), g = [], h = a.o(), k, u, q, y, I = b; I < h; ++I) {
            k = a.getPage(I);
            u = k.displayObject();
            q = u.offsetTop + u.clientTop;
            if (q > d) break;
            y = u.offsetLeft + u.clientLeft;
            f = u.clientHeight;
            u = Math.max(0, c - q) + Math.max(0, q + f - d);
            u = 100 * (f - u) / f | 0;
            f = I;
            g.push({
                le: k.pageNumber(),
                top: q,
                left: y,
                page: k,
                Pj: u
            })
        }
        c = g[0];
        g.sort(function(a, b) {
            var c = a.Pj - b.Pj;
            return .001 < Math.abs(c) ? -c : a.id - b.id
        });
        a.$d.gp ? f + 1 <= h - 1 && g.push({
                le: f + 2,
                page: a.getPage(f + 1),
                Pj: 0
            }) :
            0 < b - 1 && g.push({
                le: b - 1,
                page: a.getPage(b - 1),
                Pj: 0
            });
        return {
            Os: c,
            Pc: g
        }
    };
    Cm.prototype.update = function() {
        for (var a = 0; a < this.Be.length; ++a) this.Be[a].reset();
        a = this.Ha();
        this.render(a.Pc)
    };
    Cm.prototype.R = function() {
        var a = this.i.document();
        w(a);
        return a
    };
    Cm.prototype.Yd = function(a) {
        switch (a.X) {
            case 3:
                break;
            case 2:
                break;
            case 1:
                break;
            case 0:
                Em(this, a);
                a.Za.addHandler(function() {
                    var a = this.Ha();
                    this.render(a.Pc)
                }, this);
                a.render();
                break;
            default:
                throw Error("renderingState is wrong");
        }
    };

    function Em(a, b) {
        var c = a.Be.indexOf(b);
        0 <= c && a.Be.splice(c, 1);
        a.Be.push(b);
        10 < a.Be.length && a.Be.shift().destroy()
    }

    function Dm(a, b) {
        function c(a) {
            a = a.displayObject();
            return a.offsetTop + a.clientTop + a.clientHeight > b
        }
        a = a.i;
        var d = 0,
            f = a.o() - 1,
            g = a.getPage(d);
        w(g);
        if (c(g)) return d;
        for (; d < f;) {
            var h = d + f >> 1;
            g = a.getPage(h);
            w(g);
            c(g) ? f = h : d = h + 1
        }
        return d
    };

    function Fm() {
        T.call(this, ["viewer", x.pe.className]);
        this.i = null
    }
    v(Fm, T);
    Fm.prototype.hi = function(a) {
        this.i = a
    };
    Fm.prototype.ob = function() {
        return this
    };

    function Gm(a) {
        ti.call(this, a);
        this.a = null;
        this.So = 0;
        this.ja = [];
        this.ef = 0;
        this.Ya = new Cm(this);
        this.$d = {
            gp: !0,
            tm: 0,
            position: 0
        };
        this.Fi = !0;
        this.Qk = !1;
        this.nc = 0;
        this.zn = new Bm;
        this.uf = null;
        this.xc = new ki(0, 0);
        this.no = new Am(a.displayObject(), x.Ds);
        B(this.no, "finish", this.oo, !1, this);
        this.Fc.addHandler(function() {
            var a = this.a.displayObject();
            this.ba.Fa = a
        }, this)
    }
    v(Gm, ti);
    e = Gm.prototype;
    e.view = function() {
        w(this.a);
        return this.a
    };
    e.Oc = function() {
        return [this.D - 1]
    };
    e.u = function(a) {
        if (si(this, a) && 0 == this.nc) {
            var b = qi(this),
                c = this.ja[a - 1].displayObject();
            b = b.scrollTop;
            c = c.offsetTop + c.clientTop - x.pe.Ea;
            this.nc = a;
            this.Qk = !0;
            this.Fi ? (qi(this).scrollTop = c, this.$d.position = c / qi(this).scrollHeight, this.Fi = !1, this.oo()) : (a = this.no, a.pg = [0, b], a.bp = [0, c], a.play(!0))
        }
    };
    e.af = function() {
        1 >= this.D || this.u(this.D - 1)
    };
    e.$e = function() {
        this.D >= this.o() || this.u(this.D + 1)
    };
    e.getPage = function(a) {
        if (0 > a || a > this.o()) throw Error("PageNumber is wrong");
        return this.ja[a]
    };
    e.G = function(a) {
        if (this.Bb != a && 0 == this.nc) {
            var b = this.N;
            this.Bb = a;
            this.N = a * (this.$a - 1) + 1;
            for (a = 0; a < this.ja.length; ++a) this.ja[a].G(this.N);
            Hm(this);
            this.Mf.f(this.Bb);
            Im(this, .5, this.N / b - 1)
        }
    };
    e.me = function(a) {
        var b = this.N;
        this.G(a);
        var c = qi(this);
        a = this.a.ob().displayObject().getBoundingClientRect();
        var d = c.getBoundingClientRect();
        c = Math.min(this.xc.x(), a.right);
        c = Math.max(c, a.left);
        c = (c - a.left) / a.width;
        a = this.xc.y() / d.height;
        Im(this, c, a * (this.N / b - 1) * 2)
    };
    e.Gd = function(a, b) {
        this.xc = new ki(a, b)
    };
    e.resize = function(a) {
        this.Aa = a;
        this.Jl();
        if (this.Vb) {
            this.N = this.Bb * (this.$a - 1) + 1;
            for (a = 0; a < this.ja.length; ++a) {
                var b = this.ja[a].ad(),
                    c = this.Ua(b);
                b = b.clone({
                    scale: c * this.N
                });
                this.ja[a].$(b, this.N)
            }
            Hm(this);
            a = this.zn;
            b = a.left();
            c = a.top();
            a = this.ja[a.pageNumber() - 1];
            c = [a.v.convertToViewportPoint(b, c), a.v.convertToViewportPoint(b, c)];
            b = Math.min(c[0][0], c[1][0]);
            c = Math.min(c[0][1], c[1][1]);
            a: if (a = a.displayObject(), b = {
                    left: b,
                    top: c
                }, c = a.offsetParent) {
                var d = a.offsetTop + a.clientTop;
                for (a = a.offsetLeft + a.clientLeft; c.clientHeight ===
                    c.scrollHeight;)
                    if (c.dataset.hr && (d /= c.dataset.hr, a /= c.dataset.It), d += c.offsetTop, a += c.offsetLeft, c = c.offsetParent, !c) {
                        a = 0;
                        break a
                    } b && (void 0 !== b.top && (d += b.top), void 0 !== b.left && (a += b.left, c.scrollLeft = a));
                a = d
            } else console.error("offsetParent is not set -- cannot scroll"), a = 0;
            qi(this).scrollTop = a
        }
    };
    e.enable = function(a) {
        var b = this;
        this.a = new Fm;
        this.a.hi(this);
        this.container().H(x.pe.Ip);
        this.container().c(this.a);
        var c = qi(this);
        B(c, "scroll", this.Zd, !1, this);
        Jm(this);
        Hm(this);
        1 != a ? Jf(function() {
            b.u(a)
        }) : this.Fi = !1;
        this.Yb();
        ri(this)
    };
    e.disable = function() {
        Gm.V.disable.call(this);
        this.container().T(x.pe.Ip);
        w(this.a);
        this.container().removeChild(this.a);
        this.a = null;
        var a = this.container().displayObject();
        qd(a, "scroll", this.Zd, !1, this);
        this.Fi = !0;
        this.ja = []
    };
    e.update = function() {
        this.Ya.update()
    };

    function Jm(a) {
        for (var b = 0, c = 1; c <= a.o(); ++c) {
            var d = $g(a.lc, c),
                f = a.Ua(d);
            f = d.clone({
                scale: f
            });
            f.width > b && (b = f.width, a.So = c - 1);
            f = new Mg(c, f, a.N);
            f.K = d;
            a.Na && f.Za.addHandler(function(a, b) {
                b = this.Ua(b) * oi(b);
                this.Na.render(a, this.N, b)
            }.bind(a, f, d));
            a.ja.push(f);
            d = new T("shadowOffset");
            d.c(f);
            a.a.c(d)
        }
    }
    e.Zd = function() {
        var a = this;
        0 != this.ef || this.Qk || (this.ef = window.requestAnimationFrame(function() {
            var b = qi(a).scrollTop;
            b !== a.$d.tm && (a.$d.gp = b > a.$d.tm);
            a.$d.tm = b;
            var c = a.a.ob().displayObject();
            a.$d.position = b / c.clientHeight;
            a.ef = 0;
            a.Yb()
        }))
    };
    e.Yb = function() {
        var a = this.Ya.Ha(),
            b = a.Pc;
        a = a.Os;
        this.Ya.render(b);
        b = b[0].le;
        b != this.D && (this.D = b, this.kc());
        b = qi(this).scrollLeft - a.left;
        var c = qi(this).scrollTop - a.top;
        b = a.page.v.convertToPdfPoint(b, c);
        this.zn = new Bm(a.le, Math.round(b[1]), Math.round(b[0]))
    };
    e.oo = function() {
        var a = this.nc;
        this.nc = 0;
        this.D = a;
        this.Qk = !1;
        this.Zd();
        this.kc()
    };
    e.Ua = function(a) {
        var b = 2 * x.pe.Ea,
            c = (this.Aa.width() - b) / a.width;
        a = (this.Aa.height() - b) / a.height;
        return Math.min(a, c)
    };

    function Hm(a) {
        var b = Math.round(a.ja[a.So].width() + 2 * x.pe.Ea);
        a.a.Z(b)
    }
    e.Jl = function() {
        var a = ah(this.lc),
            b = this.Ua(a);
        a = a.clone({
            scale: b
        }).width + 2 * x.pe.Ea;
        a = this.Aa.width() / a * 2;
        this.$a = Math.max(a, this.$a)
    };

    function Im(a, b, c) {
        var d = qi(a),
            f = a.a.ob().displayObject(),
            g = f.getBoundingClientRect(),
            h = d.getBoundingClientRect();
        Kl(d, Math.max(g.width - h.width, 0) * b, f.clientHeight * a.$d.position + h.height / 2 * c)
    };

    function Km() {
        this.i = null;
        this.lf = 0
    }

    function Lm(a, b) {
        b = new Gj(b.displayObject());
        B(b, "mousewheel", a.Ol, !1, a)
    }
    Km.prototype.hi = function(a) {
        this.i = a
    };

    function Mm() {
        Km.call(this)
    }
    v(Mm, Km);
    Mm.prototype.Ol = function(a) {
        if (a.ctrlKey || a.metaKey) {
            a.preventDefault();
            var b = a.deltaY,
                c = a.clientX;
            a = a.clientY;
            var d = this.i.scale();
            b = 0 > b ? mi(d) : ni(d);
            d != b && (this.lf && clearTimeout(this.lf), this.i.Gd(c, a), this.i.me(b), this.lf = setTimeout(this.i.update.bind(this.i), x.Wr))
        }
    };

    function Nm(a, b) {
        T.call(this, "slider");
        this.Fh = a;
        this.bn = !1;
        this.oj = [];
        if (a > b) throw Error("An incorrect range");
        this.Af = a;
        this.Ti = b;
        this.Rm = new T("slider__slider-base");
        this.Ik = new T("slider__handler");
        this.Rm.c(this.Ik);
        this.c(this.Rm);
        this.Um = new F;
        this.vh = new F;
        this.ia = new F;
        B(this.Ik.displayObject(), "mousedown", this.Nq, !1, this)
    }
    v(Nm, T);
    Nm.prototype.value = function() {
        return this.Fh
    };

    function Om(a, b) {
        if (!(a.Af <= b && b <= a.Ti)) throw Error("Value is out of range");
        if (a.Fh != b) {
            var c = 0 <= a.oj.indexOf(b);
            if (a.bn && !c) throw Error("Incorrect value");
            a.Fh = b;
            a.Ik.displayObject().style.left = 100 * (Math.abs(a.Af) + b) / (a.Ti - a.Af) + "%"
        }
    }
    Nm.prototype.Nq = function(a) {
        if (!(a.defaultPrevented || 0 < a.button)) {
            this.vh.f(this.value());
            var b = B(document, "mousemove", function(a) {
                    a = a.clientX - this.displayObject().getBoundingClientRect().left;
                    var b = this.width() / (this.Ti - this.Af);
                    a = nj(a / b - Math.abs(this.Af), this.Af, this.Ti);
                    if (this.bn) {
                        b = this.Fh;
                        for (var c = a, d = 0; d <= this.oj.length; ++d) {
                            var k = this.oj[d],
                                u = this.oj[d - 1];
                            if (b < a && a >= k) c = k;
                            else if (b >= a && a <= u) {
                                c = u;
                                break
                            }
                        }
                        a = c
                    }
                    a != this.Fh && (this.Um.f(a), Om(this, a))
                }, !1, this),
                c = B(document, "mouseup", function() {
                    this.ia.f(this.value());
                    rd(b);
                    rd(c)
                }, !1, this);
            a.preventDefault()
        }
    };

    function Pm() {
        T.call(this, "zoomToolbarContainer");
        this.Wl = gm("zoomOut");
        this.c(this.Wl);
        this.Te = new Nm(x.Xe, x.We);
        this.c(this.Te);
        this.Vl = gm("zoomIn");
        this.c(this.Vl)
    }
    v(Pm, T);
    Pm.prototype.G = function(a) {
        this.Vl.Pa(a != x.We);
        this.Wl.Pa(a != x.Xe);
        this.Te.value() != a && Om(this.Te, a)
    };
    Pm.prototype.og = function() {
        return this.Te.ia
    };

    function Qm() {
        T.call(this, ["toolbar", "hidden"]);
        this.Vf = 1;
        this.ea = new U(0, 0);
        var a = new T("toolbarCenter");
        this.Ad = new Pm;
        a.c(this.Ad);
        this.Fb = new hm;
        a.c(this.Fb);
        this.oa = new km;
        a.c(this.oa);
        this.c(a)
    }
    v(Qm, T);
    e = Qm.prototype;
    e.width = function() {
        return this.ea.width()
    };
    e.height = function() {
        return this.ea.height()
    };
    e.qa = function(a) {
        this.Fb.qa(a)
    };
    e.u = function(a) {
        this.Fb.u(a)
    };
    e.wc = function(a) {
        this.Ad.G(0);
        this.oa.wc(a);
        this.Fb.wc(a)
    };
    e.dd = function(a) {
        this.oa.dd(a)
    };
    e.fd = function(a) {
        this.oa.fd(a)
    };
    e.G = function(a) {
        this.Ad.G(a);
        this.oa.G(a)
    };
    e.uc = function(a) {
        var b = a.width() / x.yb,
            c = a.height() / x.$h;
        b = Math.min(b, c);
        c = a.width();
        var d = x.bb;
        1 > b ? (If(this.displayObject(), "left bottom"), ug(this.displayObject(), b), d = Math.floor(x.bb * b), this.Z(a.width() * (1 / b))) : (If(this.displayObject(), ""), ug(this.displayObject(), 1), S(this, "width", ""));
        this.Vf = Math.min(1, b);
        this.ea = new U(c, d)
    };
    e.vc = function(a) {
        this.oa.vc(a)
    };
    e.gd = function(a) {
        this.oa.gd(a)
    };
    e.cd = function(a) {
        this.oa.cd(a)
    };
    e.cf = function() {
        return this.oa.Hh.C
    };
    e.Ra = function() {
        return this.Fb.lh.C
    };
    e.Qa = function() {
        return this.Fb.Zg.C
    };
    e.Km = function() {
        return this.Ad.Vl.C
    };
    e.Lm = function() {
        return this.Ad.Wl.C
    };
    e.Nm = function() {
        return this.Ad.Te.vh
    };
    e.sg = function() {
        return this.Ad.Te.Um
    };
    e.Mm = function() {
        return this.Ad.Te.ia
    };
    e.zb = function() {
        return this.Fb.ml
    };
    e.Pb = function() {
        return this.oa.sf.C
    };
    e.og = function() {
        return this.Ad.og()
    };
    e.bf = function() {
        return this.oa.Sf.C
    };
    e.bd = function() {
        this.oa.bd()
    };

    function Rm(a, b) {
        T.call(this, "mainContainer");
        this.ea = new U(0, 0);
        this.zf = new T("loaderIcon");
        this.c(this.zf);
        this.ka = new T("viewerContainer");
        this.ka.displayObject().tabIndex = -1;
        this.c(this.ka);
        this.s = new Qm;
        this.c(this.s);
        this.uc(new U(a, b))
    }
    v(Rm, T);
    e = Rm.prototype;
    e.qa = function(a) {
        this.s.qa(a)
    };
    e.u = function(a) {
        this.s.u(a)
    };
    e.toolbar = function() {
        return this.s
    };
    e.cb = function() {
        return new U(this.ea.width(), this.ea.height() - this.s.height())
    };
    e.bb = function() {
        return this.s.height()
    };
    e.wc = function(a) {
        this.s.wc(a)
    };
    e.dd = function(a) {
        this.s.dd(a)
    };
    e.fd = function(a) {
        this.s.fd(a)
    };
    e.G = function(a) {
        this.s.G(a)
    };
    e.uc = function(a) {
        this.ea = a;
        this.resize(a.width(), a.height());
        this.s.uc(a);
        a = Math.round(this.s.height());
        S(this.ka, "bottom", a + "px")
    };
    e.cf = function() {
        return this.s.cf()
    };
    e.Ra = function() {
        return this.s.Ra()
    };
    e.Qa = function() {
        return this.s.Qa()
    };
    e.zb = function() {
        return this.s.zb()
    };
    e.Pb = function() {
        return this.s.Pb()
    };
    e.Km = function() {
        return this.s.Km()
    };
    e.Lm = function() {
        return this.s.Lm()
    };
    e.Nm = function() {
        return this.s.Nm()
    };
    e.sg = function() {
        return this.s.sg()
    };
    e.Mm = function() {
        return this.s.Mm()
    };
    e.og = function() {
        return this.s.og()
    };
    e.bf = function() {
        return this.s.bf()
    };
    e.Gm = function() {
        this.s.T("hidden")
    };
    e.bd = function() {
        this.s.bd()
    };
    e.Bj = function() {};
    e.vc = function(a) {
        this.s.vc(a)
    };
    e.gd = function(a) {
        this.s.gd(a)
    };
    e.cd = function(a) {
        this.s.cd(a)
    };

    function Sm(a) {
        a.ka.displayObject().focus()
    };

    function Tm(a, b, c) {
        var d = new kh;
        this.a = new Rm(a.clientWidth, a.clientHeight);
        ze(a, this.a.ra);
        Y.call(this, a, b, 2, x, d, c);
        this.Me = b.$n ? null : new qh;
        this.Jg = new Dh(this.a);
        this.lf = this.Dc = 0;
        this.bl = new Mm;
        Lm(this.bl, this.a.ka);
        Lm(this.bl, this.a.toolbar());
        this.Ka = new Lh;
        this.Ka.Ra().addHandler(this.Wc, this);
        this.Ka.Qa().addHandler(this.Uc, this);
        this.Ka.zb().addHandler(this.ae, this);
        this.Ka.Pb().addHandler(this.nd, this);
        this.a.cf().addHandler(this.Ml, this);
        this.a.Ra().addHandler(this.Wc, this);
        this.a.Qa().addHandler(this.Uc,
            this);
        this.a.zb().addHandler(this.ae, this);
        this.a.Pb().addHandler(this.nd, this);
        this.a.Km().addHandler(this.Jr, this);
        this.a.Lm().addHandler(this.Kr, this);
        this.a.Nm().addHandler(this.Mr, this);
        this.a.sg().addHandler(this.Ih, this);
        this.a.Mm().addHandler(this.Lr, this);
        this.a.og().addHandler(this.rr, this);
        this.a.bf().addHandler(this.Nl, this);
        this.a.G(0);
        this.Bc(1, Gm);
        this.Bc(2, am);
        this.Xd(1, xl, x.ek);
        this.Xd(2, Il, x.fk);
        this.hh()
    }
    v(Tm, Y);
    Tm.prototype.view = function() {
        return this.a
    };
    Tm.prototype.Oc = function() {
        return this.j.Oc()
    };
    Tm.prototype.viewPages = Tm.prototype.Oc;
    e = Tm.prototype;
    e.resize = function(a, b) {
        this.Dc && clearTimeout(this.Dc);
        this.ea = new U(a, b);
        this.a.uc(this.ea);
        this.Ia && this.Ia.$(this.ea);
        this.na.Gj && (this.P.resize(), this.j.resize(this.Rd()), this.Dc = setTimeout(this.Il.bind(this), x.zm))
    };
    e.Il = function() {
        this.j.update();
        this.P.update()
    };
    e.Ub = function(a) {
        Tm.V.Ub.call(this, a);
        this.P.enable(this.na.Da);
        this.j.resize(this.Rd());
        this.j.enable(this.na.Da);
        this.bl.hi(this.j);
        this.a.wc(a);
        Sm(this.a)
    };
    e.hh = function() {
        if (window.location.hash) {
            var a = this.gh(window.location.hash.substring(1));
            "page" in a && (this.na.Da = parseInt(a.page, 10));
            if ("mode" in a) switch (a.mode) {
                case "book":
                    this.Sb = 2;
                    break;
                case "pages":
                    this.Sb = 1
            }
        }
    };
    e.gh = function(a) {
        a = a.split("&");
        for (var b = {}, c = 0; c < a.length; ++c) {
            var d = a[c].split("=");
            b[decodeURIComponent(d[0].toLowerCase())] = 1 < d.length ? decodeURIComponent(d[1]) : null
        }
        return b
    };
    e.Wc = function() {
        this.j.af()
    };
    e.Uc = function() {
        this.j.$e()
    };
    e.Ml = function() {
        switch (this.Sb) {
            case 2:
                this.Ub(1);
                break;
            case 1:
                this.Ub(2)
        }
    };
    e.Rd = function() {
        var a = this.a.cb(),
            b = a.height();
        this.P instanceof Il && 0 != this.P.state() && (b -= this.P.height());
        return new U(a.width(), b)
    };
    e.ae = function(a) {
        this.j.u(a)
    };
    e.nd = function() {
        this.Jg.toggle();
        Sm(this.a)
    };
    e.Bc = function(a, b) {
        Tm.V.Bc.call(this, a, b);
        if (b = this.Wb.pi()) this.xa[a].Na = b;
        this.xa[a].Mf.addHandler(this.Ql, this);
        this.xa[a].Fc.addHandler(this.Rl, this)
    };
    e.Xd = function(a, b, c) {
        Tm.V.Xd.call(this, a, b, c);
        this.jb[a].Wa.addHandler(this.Bl, this);
        this.jb[a].ce.addHandler(this.Cl, this);
        this.jb[a].Fc.addHandler(this.Dl, this)
    };
    e.rd = function(a) {
        Tm.V.rd.call(this, a);
        th(a, this.Rc);
        a.Me = this.Me;
        var b = a.o();
        this.a.u(1);
        this.a.qa(b);
        this.xa[2].ab(a);
        this.xa[1].ab(a);
        this.jb[2].ab(a);
        this.jb[1].ab(a);
        a = this.jb[2];
        a instanceof Il && a.Zj(this.xa[2]);
        w(this.Sb);
        this.Ub(this.Sb);
        this.Ka.qa(b);
        1 == b && (this.a.vc(!1), this.a.gd(!1));
        Ej(this)
    };
    e.Se = function(a) {
        Tm.V.Se.call(this, a);
        this.a.u(a);
        null !== this.P && this.P.u(a);
        Sm(this.a);
        this.kc(a)
    };
    e.Ql = function(a) {
        this.a.G(a);
        0 < a ? (this.ba.Qb() || this.ba.enable(), 1 == this.P.state() && this.P.pm()) : (this.ba.Qb() && this.ba.disable(), 2 == this.P.state() && this.P.show(), 1 == this.R.o() && this.a.vc(!1));
        Sm(this.a)
    };
    e.Rl = function() {
        this.j.G(0);
        this.a.G(0);
        this.ba.Qb() && this.ba.disable();
        this.Kl()
    };
    e.Bl = function(a) {
        this.na.Da = a;
        this.a.u(a);
        this.j.u(a)
    };
    e.Cl = function(a) {
        this.na.ak = a;
        this.a.fd(a)
    };
    e.Dl = function() {
        1 == this.na.ak ? this.P.open() : this.P.close()
    };
    e.Jr = function() {
        var a = this.j.scale();
        if (a != x.We) {
            var b = this.a.ka.displayObject().getBoundingClientRect();
            this.j.Gd(b.width / 2, b.height / 2);
            this.j.me(mi(a));
            this.j.update()
        }
    };
    e.Kr = function() {
        var a = this.j.scale();
        if (a != x.Xe) {
            var b = this.a.ka.displayObject().getBoundingClientRect();
            this.j.Gd(b.width / 2, b.height / 2);
            this.j.me(ni(a));
            this.j.update()
        }
    };
    e.Mr = function() {
        this.Ka.Pk = !0;
        var a = this.a.ka.displayObject().getBoundingClientRect();
        this.j.Gd(a.width / 2, a.height / 2)
    };
    e.Ih = function(a) {
        this.j.me(a)
    };
    e.Lr = function() {
        this.Ka.Pk = !1
    };
    e.rr = function() {
        this.j.update()
    };
    e.Nl = function() {
        this.P.toggle(!0);
        Sm(this.a)
    };

    function Um(a, b, c) {
        Tm.call(this, a, b, c);
        this.Sp = new tm;
        this.xa[2].Ro.addHandler(function() {
            this.Sp.call("Player_initializationFinished")
        }, this)
    }
    v(Um, Tm);
    Um.prototype.rd = function(a) {
        var b = a.o();
        this.na.Da = 2 < b ? 2 : 1;
        Um.V.rd.call(this, a)
    };

    function Vm(a, b) {
        this.bq = a;
        this.Eo = b
    }
    Vm.prototype.create = function(a, b, c) {
        var d = Tm;
        fg ? d = Tk : M ? d = nm : this.bq.cefclientRequired && (d = Um);
        this.Eo && (c = this.Eo.getState());
        var f = Of(!0).resume;
        f = "resume" != (jh[f] || null);
        c = ih() && f ? void 0 : c;
        return new d(a, b, c)
    };

    function Wm(a, b) {
        window.scrollTo(a, b)
    }
    window.yPos = function() {
        return window.pageYOffset
    };
    window.scrollPageTo = Wm;

    function Xm() {
        var a = this;
        this.xo = new F;
        this.qk = this.Gg = 0;
        this.sj = !1;
        this.g = document.createElement("DIV");
        this.g.style.width = eg ? "100%" : "100vw";
        this.g.style.height = Nf ? "50vh" : "100vh";
        this.g.style.position = "absolute";
        this.g.style.zIndex = "-1";
        this.g.style.top = "0";
        M && !fg && (document.body.style.position = "fixed");
        var b = window;
        if (Sf) try {
            b = window.top
        } catch (d) {}
        document.body.insertAdjacentElement("afterbegin", this.g);
        (new ResizeObserver(function() {
            Nf && fg ? setTimeout(function() {
                Ym(a)
            }, 100) : Ym(a)
        })).observe(this.g);
        window.invalidatePlayerSize = ua;
        window.setPlayerSize = ua;
        window.removeResizeListeners = ua;
        document.addEventListener("touchend", function(b) {
            0 == b.touches.length && (a.sj = !1, setTimeout(function() {
                Ym(a, !1, !1)
            }, 100))
        }, !0);
        document.addEventListener("touchstart", function(b) {
            1 == window.event.touches.length && (a.sj = !0);
            1 < b.touches.length && b.preventDefault()
        }, !0);
        var c = b.onresize;
        b.onresize = function() {
            c && c();
            Ym(a)
        };
        b.onorientationchange = function() {
            var b = Je();
            b && M && (Nf ? setTimeout(function() {
                    w(b).blur();
                    dg && Ym(a)
                },
                800) : b.blur())
        };
        Wf && window.frameElement && window.frameElement.setAttribute("scrolling", "no")
    }

    function Ym(a, b, c) {
        function d(a, c) {
            if (b || q.Gg != a || q.qk != c) {
                var d = q.Gg;
                q.Gg = a;
                q.qk = c;
                q.xo.f(q.Gg, q.qk);
                d != q.Gg && Nf && !q.sj && setTimeout(function() {
                    f(0, 0)
                }, 100)
            }
        }
        b = void 0 === b ? !1 : b;
        c = void 0 === c ? !0 : c;
        var f = Wm;
        if (b || !a.sj) {
            var g = Nf ? 2 * a.g.clientHeight : a.g.clientHeight;
            if (Sf || !(Zf && .7 > g / screen.height || of && .7 > window.innerHeight / g)) {
                var h = 1,
                    k = a.g.clientWidth;
                c && Wf && window.frameElement && (k = 0, h = k / window.innerWidth);
                var u = window.innerHeight * h,
                    q = a;
                d(k, u);
                c && Wf && window.frameElement && setTimeout(function() {
                    k = w(window.frameElement).clientWidth;
                    h = k / window.innerWidth;
                    u = window.innerHeight * h;
                    d(k, u)
                }, 0)
            }
        }
    }
    Xm.prototype.Es = ua;
    PDFJS.workerSrc = "data/js/pdf.worker.js";
    Ha("PDFJS.workerSrc", PDFJS.workerSrc);
    PDFJS.disableAutoFetch = !0;
    Ha("PDFJS.disableAutoFetch", PDFJS.disableAutoFetch);
    Ha("PdfViewer.open", function(a, b, c, d, f) {
        c = new dh(c);
        var g = fh();
        if (!M || !c.Tk || g.ispringpreview || hg || 0 < location.hash.length) {
            var h = p(f) ? null : new Jc(c.hn, c.nh),
                k = (new Vm(a, h)).create(b, c, f);
            h && k.ce.addHandler(function() {
                var a = k.Ri;
                a.updated = Math.floor(Date.now() / 1E3);
                try {
                    Fc(h.lk, JSON.stringify(a))
                } catch (I) {
                    Mc(h), Fc(h.lk, JSON.stringify(a))
                }
            });
            (f = g.ispringpreview || a.localPermission) && k.Dm();
            d && d(k);
            "query" == a.type && g.file ? k.Jj(g.file) : "fileName" == a.type && ("file:" != document.location.protocol || f || M ? k.Jj(a.filePath) :
                c.nn ? gh(a.filePath + ".js", function(b) {
                    b = window.atob(b);
                    var c = a.filePath,
                        d = c.lastIndexOf("/") + 1;
                    k.um(b, c.substr(d, c.lastIndexOf(".") - d))
                }) : (b.innerHTML = "", d = new eh(c.ke()), ze(b, d.displayObject())));
            var u = new Xm;
            M && u.Es(!1);
            u.xo.addHandler(function(a, b) {
                k.resize(a, b)
            });
            Ym(u, !0);
            var q = null;
            k.vf.addHandler(function() {
                q && clearTimeout(q);
                q = setTimeout(function() {
                    Ym(u, !0)
                }, 200)
            });
            lg && ISPFlipPlayer.initFlip(jb({
                apiVersion: 1
            }))
        } else location.replace("ismplayer.html" + location.search)
    });
    Ha("PdfViewer.checkMobileIntegration", function(a) {
        a = new dh(a);
        var b = fh();
        M && a.Tk && !b.ispringpreview && (hg || 0 < location.hash.length || location.replace("ismplayer.html" + location.search))
    });

    function sg() {
        return !1
    }

    function zd(a) {
        a && (w(!a.disposed), ya(a.bg) && a.bg(), a.disposed = !0)
    }

    function Zm(a, b) {
        sg() && (b ? n.console.error(a) : n.console.warn(a))
    }

    function Md(a, b) {
        var c = a.stack || a.toString();
        0 > String(c).indexOf(a.message) && Zm(a.message, b);
        Zm(c, b)
    }
    window.onerror = function(a) {
        for (var b = [], c = 0; c < arguments.length; ++c) b[c - 0] = arguments[c];
        c = l(b);
        b = c.next().value;
        c.next();
        c.next();
        c.next();
        (c = c.next().value) ? Md(c, !0): Zm(b, !0);
        return !0
    };
    La = function(a) {
        try {
            throw Error(a.message);
        } catch (b) {
            Md(b, !1)
        }
    };
    n.console || (window._log = "", n.console = {
        log: function(a) {
            window._log += "\n" + a
        },
        warn: function(a) {
            window._log += "\nwarn: " + a
        },
        error: function(a) {
            window._log += "\nerror: " + a
        }
    });
})();

! function(t, e) {
    "object" == typeof exports && "undefined" != typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : t.ResizeObserver = e()
}(this, function() {
    "use strict";

    function t(t) {
        return window.getComputedStyle(t)
    }

    function e(t) {
        return parseFloat(t) || 0
    }

    function n(t) {
        for (var n = arguments.length, r = Array(n > 1 ? n - 1 : 0), i = 1; i < n; i++) r[i - 1] = arguments[i];
        return r.reduce(function(n, r) {
            var i = t["border-" + r + "-width"];
            return n + e(i)
        }, 0)
    }

    function r(t) {
        for (var n = ["top", "right", "bottom", "left"], r = {}, i = n, o = Array.isArray(i), s = 0, i = o ? i : i[Symbol.iterator]();;) {
            var a;
            if (o) {
                if (s >= i.length) break;
                a = i[s++]
            } else {
                if (s = i.next(), s.done) break;
                a = s.value
            }
            var u = a,
                c = t["padding-" + u];
            r[u] = e(c)
        }
        return r
    }

    function i(t, e, n, r) {
        return {
            width: t,
            height: e,
            top: n,
            right: t + r,
            bottom: e + n,
            left: r
        }
    }

    function o(t) {
        var e = t.getBBox();
        return i(e.width, e.height, 0, 0)
    }

    function s() {
        var n = t(document.documentElement),
            r = e(n.width),
            o = e(n.height);
        return i(r, o, 0, 0)
    }

    function a(o) {
        var s = o.clientWidth,
            a = o.clientHeight;
        if (!s && !a) return O;
        var u = t(o),
            c = r(u),
            h = c.left + c.right,
            f = c.top + c.bottom,
            l = e(u.width),
            p = e(u.height);
        "border-box" === u.boxSizing && (Math.round(l + h) !== s && (l -= n(u, "left", "right") + h), Math.round(p + f) !== a && (p -= n(u, "top", "bottom") + f));
        var d = Math.round(l + h) - s,
            _ = Math.round(p + f) - a;
        return 1 !== Math.abs(d) && (l -= d), 1 !== Math.abs(_) && (p -= _), i(l, p, c.top, c.left)
    }

    function u(t) {
        return t instanceof window.SVGElement
    }

    function c(t) {
        return t === document.documentElement
    }

    function h(t) {
        return u(t) ? o(t) : c(t) ? s() : a(t)
    }

    function f(t, e) {
        for (var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {}, r = {
                configurable: n.configurable || !1,
                writable: n.writable || !1,
                enumerable: n.enumerable || !1
            }, i = Object.keys(e), o = Array.isArray(i), s = 0, i = o ? i : i[Symbol.iterator]();;) {
            var a;
            if (o) {
                if (s >= i.length) break;
                a = i[s++]
            } else {
                if (s = i.next(), s.done) break;
                a = s.value
            }
            var u = a;
            r.value = e[u], Object.defineProperty(t, u, r)
        }
        return t
    }
    var l = function(t, e) {
            if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
        },
        p = function() {
            function t(t, e) {
                for (var n = 0; n < e.length; n++) {
                    var r = e[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(t, r.key, r)
                }
            }
            return function(e, n, r) {
                return n && t(e.prototype, n), r && t(e, r), e
            }
        }(),
        d = function(t, e) {
            if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function, not " + typeof e);
            t.prototype = Object.create(e && e.prototype, {
                constructor: {
                    value: t,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), e && (Object.setPrototypeOf ? Object.setPrototypeOf(t, e) : t.__proto__ = e)
        },
        _ = function(t, e) {
            if (!t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return !e || "object" != typeof e && "function" != typeof e ? t : e
        },
        b = "function" == typeof window.WeakMap && "function" == typeof window.Map,
        v = function() {
            function t(t, e) {
                var n = -1;
                return t.some(function(t, r) {
                    var i = t[0] === e;
                    return i && (n = r), i
                }), n
            }
            return b ? window.WeakMap : function() {
                function e() {
                    l(this, e), this.__entries__ = []
                }
                return e.prototype.get = function(e) {
                    var n = t(this.__entries__, e);
                    return this.__entries__[n][1]
                }, e.prototype.set = function(e, n) {
                    var r = t(this.__entries__, e);
                    ~r ? this.__entries__[r][1] = n : this.__entries__.push([e, n])
                }, e.prototype.delete = function(e) {
                    var n = this.__entries__,
                        r = t(n, e);
                    ~r && n.splice(r, 1)
                }, e.prototype.has = function(e) {
                    return !!~t(this.__entries__, e)
                }, e
            }()
        }(),
        y = function() {
            return b ? window.Map : function(t) {
                function e() {
                    return l(this, e), _(this, t.apply(this, arguments))
                }
                return d(e, t), e.prototype.clear = function() {
                    this.__entries__.splice(0, this.__entries__.length)
                }, e.prototype.entries = function() {
                    return this.__entries__.slice()
                }, e.prototype.keys = function() {
                    return this.__entries__.map(function(t) {
                        return t[0]
                    })
                }, e.prototype.values = function() {
                    return this.__entries__.map(function(t) {
                        return t[1]
                    })
                }, e.prototype.forEach = function(t) {
                    for (var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : null, n = this.__entries__, r = Array.isArray(n), i = 0, n = r ? n : n[Symbol.iterator]();;) {
                        var o;
                        if (r) {
                            if (i >= n.length) break;
                            o = n[i++]
                        } else {
                            if (i = n.next(), i.done) break;
                            o = i.value
                        }
                        var s = o;
                        t.call(e, s[1], s[0])
                    }
                }, p(e, [{
                    key: "size",
                    get: function() {
                        return this.__entries__.length
                    }
                }]), e
            }(v)
        }(),
        w = function() {
            return "function" == typeof window.requestAnimationFrame ? window.requestAnimationFrame : function(t) {
                return setTimeout(function() {
                    return t(Date.now())
                }, 1e3 / 60)
            }
        }(),
        g = function(t) {
            function e() {
                t.apply.apply(t, s), s = null, a && (r.apply.apply(r, a), a = null)
            }

            function n() {
                o ? w(e) : e()
            }

            function r() {
                for (var t = arguments.length, e = Array(t), r = 0; r < t; r++) e[r] = arguments[r];
                var o = [this, e];
                s ? a = o : (s = o, setTimeout(n, i))
            }
            var i = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0,
                o = arguments.length > 2 && void 0 !== arguments[2] && arguments[2],
                s = null,
                a = null;
            return r
        },
        m = "function" == typeof window.MutationObserver,
        E = function() {
            function t() {
                var e = arguments.length > 0 && void 0 !== arguments[0] && arguments[0];
                l(this, t), this._isCycleContinuous = !m || e, this._listenersEnabled = !1, this._mutationsObserver = null, this._observers = [], this.refresh = g(this.refresh.bind(this), 30, !0), this._continuousUpdateHandler = g(this.refresh, 70)
            }
            return t.prototype.connect = function(t) {
                this.isConnected(t) || this._observers.push(t), this._listenersEnabled || this._addListeners()
            }, t.prototype.disconnect = function(t) {
                var e = this._observers,
                    n = e.indexOf(t);
                ~n && e.splice(n, 1), !e.length && this._listenersEnabled && this._removeListeners()
            }, t.prototype.isConnected = function(t) {
                return !!~this._observers.indexOf(t)
            }, t.prototype.refresh = function() {
                var t = this._updateObservers();
                t ? this.refresh() : this._isCycleContinuous && this._listenersEnabled && this._continuousUpdateHandler()
            }, t.prototype._updateObservers = function() {
                for (var t = !1, e = this._observers, n = Array.isArray(e), r = 0, e = n ? e : e[Symbol.iterator]();;) {
                    var i;
                    if (n) {
                        if (r >= e.length) break;
                        i = e[r++]
                    } else {
                        if (r = e.next(), r.done) break;
                        i = r.value
                    }
                    var o = i;
                    o.gatherActive(), o.hasActive() && (t = !0, o.broadcastActive())
                }
                return t
            }, t.prototype._addListeners = function() {
                this._listenersEnabled || (window.addEventListener("resize", this.refresh), m && (this._mutationsObserver = new MutationObserver(this.refresh), this._mutationsObserver.observe(document, {
                    attributes: !0,
                    childList: !0,
                    characterData: !0,
                    subtree: !0
                })), this._listenersEnabled = !0, this._isCycleContinuous && this.refresh())
            }, t.prototype._removeListeners = function() {
                this._listenersEnabled && (window.removeEventListener("resize", this.refresh), this._mutationsObserver && this._mutationsObserver.disconnect(), this._mutationsObserver = null, this._listenersEnabled = !1)
            }, p(t, [{
                key: "continuousUpdates",
                get: function() {
                    return this._isCycleContinuous
                },
                set: function(t) {
                    m && (this._isCycleContinuous = t, this._listenersEnabled && t && this.refresh())
                }
            }]), t
        }(),
        O = i(0, 0, 0, 0),
        A = function() {
            function t(e) {
                l(this, t), this.target = e, this._contentRect = O, this.broadcastWidth = 0, this.broadcastHeight = 0
            }
            return t.prototype.broadcastRect = function() {
                var t = this._contentRect;
                return this.broadcastWidth = t.width, this.broadcastHeight = t.height, t
            }, t.prototype.isActive = function() {
                var t = h(this.target);
                return this._contentRect = t, t.width !== this.broadcastWidth || t.height !== this.broadcastHeight
            }, t
        }(),
        ResizeObserverEntry = function ResizeObserverEntry(t, e) {
            l(this, ResizeObserverEntry);
            var n = window.ClientRect || Object,
                r = Object.create(n.prototype);
            f(r, e, {
                configurable: !0
            }), f(this, {
                target: t,
                contentRect: r
            }, {
                configurable: !0
            })
        },
        k = function() {
            function ResizeObserver(t, e, n) {
                if (l(this, ResizeObserver), "function" != typeof t) throw new TypeError("The callback provided as parameter 1 is not a function.");
                this._callback = t, this._targets = new y, this._activeTargets = [], this._controller = e, this._publicObserver = n
            }
            return ResizeObserver.prototype.observe = function(t) {
                if (!arguments.length) throw new TypeError("1 argument required, but only 0 present.");
                if (!(t instanceof Element)) throw new TypeError('parameter 1 is not of type "Element".');
                var e = this._targets;
                e.has(t) || (e.set(t, new A(t)), this._controller.isConnected(this) || this._controller.connect(this), this._controller.refresh())
            }, ResizeObserver.prototype.unobserve = function(t) {
                if (!arguments.length) throw new TypeError("1 argument required, but only 0 present.");
                if (!(t instanceof Element)) throw new TypeError('parameter 1 is not of type "Element".');
                var e = this._targets;
                e.has(t) && (e.delete(t), e.size || this.disconnect())
            }, ResizeObserver.prototype.disconnect = function() {
                this.clearActive(), this._targets.clear(), this._controller.disconnect(this)
            }, ResizeObserver.prototype.gatherActive = function() {
                this.clearActive();
                var t = this._activeTargets;
                this._targets.forEach(function(e) {
                    e.isActive() && t.push(e)
                })
            }, ResizeObserver.prototype.broadcastActive = function() {
                if (this.hasActive()) {
                    var t = this._publicObserver,
                        e = this._activeTargets.map(function(t) {
                            return new ResizeObserverEntry(t.target, t.broadcastRect())
                        });
                    this.clearActive(), this._callback.call(t, e, t)
                }
            }, ResizeObserver.prototype.clearActive = function() {
                this._activeTargets.splice(0)
            }, ResizeObserver.prototype.hasActive = function() {
                return !!this._activeTargets.length
            }, ResizeObserver
        }(),
        T = new E,
        C = new v,
        ResizeObserver = function() {
            function ResizeObserver(t) {
                if (l(this, ResizeObserver), !arguments.length) throw new TypeError("1 argument required, but only 0 present.");
                var e = new k(t, T, this);
                C.set(this, e)
            }
            return p(ResizeObserver, null, [{
                key: "continuousUpdates",
                get: function() {
                    return T.continuousUpdates
                },
                set: function(t) {
                    if ("boolean" != typeof t) throw new TypeError('type of "continuousUpdates" value must be boolean.');
                    T.continuousUpdates = t
                }
            }]), ResizeObserver
        }();
    ["observe", "unobserve", "disconnect"].forEach(function(t) {
        ResizeObserver.prototype[t] = function() {
            var e;
            return (e = C.get(this))[t].apply(e, arguments)
        }
    }), "function" != typeof window.ResizeObserver && Object.defineProperty(window, "ResizeObserver", {
        value: ResizeObserver,
        writable: !0,
        configurable: !0
    });
    var x = window.ResizeObserver;
    return x
});

/*! iScroll v5.2.0-snapshot ~ (c) 2008-2018 Matteo Spinelli ~ http://cubiq.org/license */
! function(t, i, s) {
    function e(s, e) {
        this.wrapper = "string" == typeof s ? i.querySelector(s) : s, this.scroller = this.wrapper.children[0], this.scrollerStyle = this.scroller.style, this.options = {
            resizeScrollbars: !0,
            mouseWheelSpeed: 20,
            snapThreshold: .334,
            disablePointer: !h.hasPointer,
            disableTouch: h.hasPointer || !h.hasTouch,
            disableMouse: h.hasPointer || h.hasTouch,
            startX: 0,
            startY: 0,
            scrollY: !0,
            directionLockThreshold: 5,
            momentum: !0,
            onScrollHandler: Function.prototype,
            bounce: !0,
            bounceTime: 600,
            bounceEasing: "",
            preventDefault: !0,
            preventDefaultException: {
                tagName: /^(A|INPUT|TEXTAREA|BUTTON|SELECT)$/
            },
            HWCompositing: !0,
            useTransition: !0,
            useTransform: !0,
            bindToWrapper: "undefined" == typeof t.onmousedown
        };
        for (var o in e) this.options[o] = e[o];
        this.translateZ = this.options.HWCompositing && h.hasPerspective ? " translateZ(0)" : "", this.options.useTransition = h.hasTransition && this.options.useTransition, this.options.useTransform = h.hasTransform && this.options.useTransform, this.options.eventPassthrough = this.options.eventPassthrough === !0 ? "vertical" : this.options.eventPassthrough, this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault, this.options.scrollY = "vertical" != this.options.eventPassthrough && this.options.scrollY, this.options.scrollX = "horizontal" != this.options.eventPassthrough && this.options.scrollX, this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough, this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold, this.options.bounceEasing = "string" == typeof this.options.bounceEasing ? h.ease[this.options.bounceEasing] || h.ease.circular : this.options.bounceEasing, this.options.resizePolling = void 0 === this.options.resizePolling ? 60 : this.options.resizePolling, this.options.tap === !0 && (this.options.tap = "tap"), this.options.useTransition || this.options.useTransform || /relative|absolute/i.test(this.scrollerStyle.position) || (this.scrollerStyle.position = "relative"), "scale" == this.options.shrinkScrollbars && (this.options.useTransition = !1), this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1, this.x = 0, this.y = 0, this.directionX = 0, this.directionY = 0, this._events = {}, this._init(), this.refresh(), this.scrollTo(this.options.startX, this.options.startY), this.enable()
    }

    function o(t, s, e) {
        var o = i.createElement("div"),
            n = i.createElement("div");
        return e === !0 && (o.style.cssText = "position:absolute;z-index:9999", n.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;position:absolute;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);border-radius:3px"), n.className = "iScrollIndicator", "h" == t ? (e === !0 && (o.style.cssText += ";height:7px;left:2px;right:2px;bottom:0", n.style.height = "100%"), o.className = "iScrollHorizontalScrollbar") : (e === !0 && (o.style.cssText += ";width:7px;bottom:2px;top:2px;right:1px", n.style.width = "100%"), o.className = "iScrollVerticalScrollbar"), o.style.cssText += ";overflow:hidden", s || (o.style.pointerEvents = "none"), o.appendChild(n), o
    }

    function n(s, e) {
        this.wrapper = "string" == typeof e.el ? i.querySelector(e.el) : e.el, this.wrapperStyle = this.wrapper.style, this.indicator = this.wrapper.children[0], this.indicatorStyle = this.indicator.style, this.scroller = s, this.options = {
            listenX: !0,
            listenY: !0,
            interactive: !1,
            resize: !0,
            defaultScrollbars: !1,
            shrink: !1,
            fade: !1,
            speedRatioX: 0,
            speedRatioY: 0
        };
        for (var o in e) this.options[o] = e[o];
        if (this.sizeRatioX = 1, this.sizeRatioY = 1, this.maxPosX = 0, this.maxPosY = 0, this.options.interactive && (this.options.disableTouch || (h.addEvent(this.indicator, "touchstart", this), h.addEvent(t, "touchend", this)), this.options.disablePointer || (h.addEvent(this.indicator, h.prefixPointerEvent("pointerdown"), this), h.addEvent(t, h.prefixPointerEvent("pointerup"), this)), this.options.disableMouse || (h.addEvent(this.indicator, "mousedown", this), h.addEvent(t, "mouseup", this))), this.options.fade) {
            this.wrapperStyle[h.style.transform] = this.scroller.translateZ;
            var n = h.style.transitionDuration;
            if (!n) return;
            this.wrapperStyle[n] = h.isBadAndroid ? "0.0001ms" : "0ms";
            var a = this;
            h.isBadAndroid && r(function() {
                "0.0001ms" === a.wrapperStyle[n] && (a.wrapperStyle[n] = "0s")
            }), this.wrapperStyle.opacity = "0"
        }
    }
    var r = t.requestAnimationFrame || t.webkitRequestAnimationFrame || t.mozRequestAnimationFrame || t.oRequestAnimationFrame || t.msRequestAnimationFrame || function(i) {
            t.setTimeout(i, 1e3 / 60)
        },
        h = function() {
            function e(t) {
                return r !== !1 && ("" === r ? t : r + t.charAt(0).toUpperCase() + t.substr(1))
            }
            var o = {},
                n = i.createElement("div").style,
                r = function() {
                    for (var t, i = ["t", "webkitT", "MozT", "msT", "OT"], s = 0, e = i.length; s < e; s++)
                        if (t = i[s] + "ransform", t in n) return i[s].substr(0, i[s].length - 1);
                    return !1
                }();
            o.getTime = Date.now || function() {
                return (new Date).getTime()
            }, o.extend = function(t, i) {
                for (var s in i) t[s] = i[s]
            }, o.addEvent = function(t, i, s, e) {
                t.addEventListener(i, s, !!e)
            }, o.removeEvent = function(t, i, s, e) {
                t.removeEventListener(i, s, !!e)
            }, o.prefixPointerEvent = function(i) {
                return t.MSPointerEvent ? "MSPointer" + i.charAt(7).toUpperCase() + i.substr(8) : i
            }, o.momentum = function(t, i, e, o, n, r) {
                var h, a, l = t - i,
                    c = s.abs(l) / e;
                return r = void 0 === r ? 6e-4 : r, h = t + c * c / (2 * r) * (l < 0 ? -1 : 1), a = c / r, h < o ? (h = n ? o - n / 2.5 * (c / 8) : o, l = s.abs(h - t), a = l / c) : h > 0 && (h = n ? n / 2.5 * (c / 8) : 0, l = s.abs(t) + h, a = l / c), {
                    destination: s.round(h),
                    duration: a
                }
            };
            var h = e("transform");
            return o.extend(o, {
                hasTransform: h !== !1,
                hasPerspective: e("perspective") in n,
                hasTouch: "ontouchstart" in t,
                hasPointer: !(!t.PointerEvent && !t.MSPointerEvent),
                hasTransition: e("transition") in n
            }), o.isBadAndroid = function() {
                var i = t.navigator.appVersion;
                if (/Android/.test(i) && !/Chrome\/\d/.test(i)) {
                    var s = i.match(/Safari\/(\d+.\d)/);
                    return !(s && "object" == typeof s && s.length >= 2) || parseFloat(s[1]) < 535.19
                }
                return !1
            }(), o.extend(o.style = {}, {
                transform: h,
                transitionTimingFunction: e("transitionTimingFunction"),
                transitionDuration: e("transitionDuration"),
                transitionDelay: e("transitionDelay"),
                transformOrigin: e("transformOrigin"),
                touchAction: e("touchAction")
            }), o.hasClass = function(t, i) {
                var s = new RegExp("(^|\\s)" + i + "(\\s|$)");
                return s.test(t.className)
            }, o.addClass = function(t, i) {
                if (!o.hasClass(t, i)) {
                    var s = t.className.split(" ");
                    s.push(i), t.className = s.join(" ")
                }
            }, o.removeClass = function(t, i) {
                if (o.hasClass(t, i)) {
                    var s = new RegExp("(^|\\s)" + i + "(\\s|$)", "g");
                    t.className = t.className.replace(s, " ")
                }
            }, o.offset = function(t) {
                for (var i = -t.offsetLeft, s = -t.offsetTop; t = t.offsetParent;) i -= t.offsetLeft, s -= t.offsetTop;
                return {
                    left: i,
                    top: s
                }
            }, o.isHyperlink = function(t) {
                if (!t) return !1;
                for (; t;) {
                    if ("A" == t.nodeName.toLocaleUpperCase()) return !0;
                    t = t.parentNode
                }
                return !1
            }, o.preventDefaultException = function(t, i) {
                if (o.isHyperlink(t)) return !0;
                for (var s in i)
                    if (i[s].test(t[s])) return !0;
                return !1
            }, o.extend(o.eventType = {}, {
                touchstart: 1,
                touchmove: 1,
                touchend: 1,
                mousedown: 2,
                mousemove: 2,
                mouseup: 2,
                pointerdown: 3,
                pointermove: 3,
                pointerup: 3,
                MSPointerDown: 3,
                MSPointerMove: 3,
                MSPointerUp: 3
            }), o.extend(o.ease = {}, {
                quadratic: {
                    style: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    fn: function(t) {
                        return t * (2 - t)
                    }
                },
                circular: {
                    style: "cubic-bezier(0.1, 0.57, 0.1, 1)",
                    fn: function(t) {
                        return s.sqrt(1 - --t * t)
                    }
                },
                back: {
                    style: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    fn: function(t) {
                        var i = 4;
                        return (t -= 1) * t * ((i + 1) * t + i) + 1
                    }
                },
                bounce: {
                    style: "",
                    fn: function(t) {
                        return (t /= 1) < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375
                    }
                },
                elastic: {
                    style: "",
                    fn: function(t) {
                        var i = .22,
                            e = .4;
                        return 0 === t ? 0 : 1 == t ? 1 : e * s.pow(2, -10 * t) * s.sin((t - i / 4) * (2 * s.PI) / i) + 1
                    }
                }
            }), o.tap = function(t, s) {
                var e = i.createEvent("Event");
                e.initEvent(s, !0, !0), e.pageX = t.pageX, e.pageY = t.pageY, t.target.dispatchEvent(e)
            }, o.click = function(s) {
                var e, o = s.target;
                /(SELECT|INPUT|TEXTAREA)/i.test(o.tagName) || (e = i.createEvent(t.MouseEvent ? "MouseEvents" : "Event"), e.initEvent("click", !0, !0), e.view = s.view || t, e.detail = 1, e.screenX = o.screenX || 0, e.screenY = o.screenY || 0, e.clientX = o.clientX || 0, e.clientY = o.clientY || 0, e.ctrlKey = !!s.ctrlKey, e.altKey = !!s.altKey, e.shiftKey = !!s.shiftKey, e.metaKey = !!s.metaKey, e.button = 0, e.relatedTarget = null, e._constructed = !0, o.dispatchEvent(e))
            }, o.getTouchAction = function(t, i) {
                var s = "none";
                return "vertical" === t ? s = "pan-y" : "horizontal" === t && (s = "pan-x"), i && "none" != s && (s += " pinch-zoom"), s
            }, o.getRect = function(t) {
                if (t instanceof SVGElement) {
                    var i = t.getBoundingClientRect();
                    return {
                        top: i.top,
                        left: i.left,
                        width: i.width,
                        height: i.height
                    }
                }
                return {
                    top: t.offsetTop,
                    left: t.offsetLeft,
                    width: t.offsetWidth,
                    height: t.offsetHeight
                }
            }, o
        }();
    e.prototype = {
        version: "5.2.0-snapshot",
        _init: function() {
            this._initEvents(), (this.options.scrollbars || this.options.indicators) && this._initIndicators(), this.options.mouseWheel && this._initWheel(), this.options.snap && this._initSnap(), this.options.keyBindings && this._initKeys()
        },
        destroy: function() {
            this._initEvents(!0), clearTimeout(this.resizeTimeout), this.resizeTimeout = null, this._execEvent("destroy")
        },
        setScrollHeight: function(t) {
            this.scrollHeight = t, this.refresh()
        },
        _transitionEnd: function(t) {
            t.target == this.scroller && this.isInTransition && (this._transitionTime(), this.resetPosition(this.options.bounceTime) || (this.isInTransition = !1, this._execEvent("scrollEnd")))
        },
        _start: function(t) {
            if (1 != h.eventType[t.type]) {
                var i;
                if (i = t.which ? t.button : t.button < 2 ? 0 : 4 == t.button ? 1 : 2, 0 !== i) return
            }
            if (this.enabled && (!this.initiated || h.eventType[t.type] === this.initiated)) {
                !this.options.preventDefault || h.isBadAndroid || h.preventDefaultException(t.target, this.options.preventDefaultException) || t.preventDefault();
                var e, o = t.touches ? t.touches[0] : t;
                this.initiated = h.eventType[t.type], this.moved = !1, this.distX = 0, this.distY = 0, this.directionX = 0, this.directionY = 0, this.directionLocked = 0, this.startTime = h.getTime(), this.options.useTransition && this.isInTransition ? (this._transitionTime(), this.isInTransition = !1, e = this.getComputedPosition(), this._translate(s.round(e.x), s.round(e.y)), this._execEvent("scrollEnd")) : !this.options.useTransition && this.isAnimating && (this.isAnimating = !1, this._execEvent("scrollEnd")), this.startX = this.x, this.startY = this.y, this.absStartX = this.x, this.absStartY = this.y, this.pointX = o.pageX, this.pointY = o.pageY, this._execEvent("beforeScrollStart")
            }
        },
        _move: function(t) {
            if (this.enabled && h.eventType[t.type] === this.initiated) {
                this.options.preventDefault && !h.preventDefaultException(t.target, this.options.preventDefaultException) && t.preventDefault();
                var i, e, o, n, r = t.touches ? t.touches[0] : t,
                    a = r.pageX - this.pointX,
                    l = r.pageY - this.pointY,
                    c = h.getTime();
                if (this.pointX = r.pageX, this.pointY = r.pageY, this.distX += a, this.distY += l, o = s.abs(this.distX), n = s.abs(this.distY), !(c - this.endTime > 300 && o < 10 && n < 10)) {
                    if (this.directionLocked || this.options.freeScroll || (o > n + this.options.directionLockThreshold ? this.directionLocked = "h" : n >= o + this.options.directionLockThreshold ? this.directionLocked = "v" : this.directionLocked = "n"), "h" == this.directionLocked) {
                        if ("vertical" == this.options.eventPassthrough) t.preventDefault();
                        else if ("horizontal" == this.options.eventPassthrough) return void(this.initiated = !1);
                        l = 0
                    } else if ("v" == this.directionLocked) {
                        if ("horizontal" == this.options.eventPassthrough) t.preventDefault();
                        else if ("vertical" == this.options.eventPassthrough) return void(this.initiated = !1);
                        a = 0
                    }
                    a = this.hasHorizontalScroll ? a : 0, l = this.hasVerticalScroll ? l : 0, i = this.x + a, e = this.y + l, (i > 0 || i < this.maxScrollX) && (i = this.options.bounce ? this.x + a / 3 : i > 0 ? 0 : this.maxScrollX), (e > 0 || e < this.maxScrollY) && (e = this.options.bounce ? this.y + l / 3 : e > 0 ? 0 : this.maxScrollY), this.directionX = a > 0 ? -1 : a < 0 ? 1 : 0, this.directionY = l > 0 ? -1 : l < 0 ? 1 : 0, this.moved || this._execEvent("scrollStart"), this.moved = !0, this._translate(i, e), c - this.startTime > 300 && (this.startTime = c, this.startX = this.x, this.startY = this.y)
                }
            }
        },
        _end: function(t) {
            if (this.enabled && h.eventType[t.type] === this.initiated) {
                this.options.preventDefault && !h.preventDefaultException(t.target, this.options.preventDefaultException) && t.preventDefault();
                var i, e, o = (t.changedTouches ? t.changedTouches[0] : t, h.getTime() - this.startTime),
                    n = s.round(this.x),
                    r = s.round(this.y),
                    a = s.abs(n - this.startX),
                    l = s.abs(r - this.startY),
                    c = 0,
                    p = "";
                if (this.isInTransition = 0, this.initiated = 0, this.endTime = h.getTime(), !this.resetPosition(this.options.bounceTime)) {
                    if (this.scrollTo(n, r), !this.moved) return this.options.tap && h.tap(t, this.options.tap), this.options.click && h.click(t), void this._execEvent("scrollCancel");
                    if (this._events.flick && o < 200 && a < 100 && l < 100) return void this._execEvent("flick");
                    if (this.options.momentum && o < 300 && (i = this.hasHorizontalScroll ? h.momentum(this.x, this.startX, o, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : {
                            destination: n,
                            duration: 0
                        }, e = this.hasVerticalScroll ? h.momentum(this.y, this.startY, o, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : {
                            destination: r,
                            duration: 0
                        }, n = i.destination, r = e.destination, c = s.max(i.duration, e.duration), this.isInTransition = 1), this.options.snap) {
                        var d = this._nearestSnap(n, r);
                        this.currentPage = d, c = this.options.snapSpeed || s.max(s.max(s.min(s.abs(n - d.x), 1e3), s.min(s.abs(r - d.y), 1e3)), 300), n = d.x, r = d.y, this.directionX = 0, this.directionY = 0, p = this.options.bounceEasing
                    }
                    return n != this.x || r != this.y ? ((n > 0 || n < this.maxScrollX || r > 0 || r < this.maxScrollY) && (p = h.ease.quadratic), void this.scrollTo(n, r, c, p)) : void this._execEvent("scrollEnd")
                }
            }
        },
        _resize: function() {
            var t = this;
            clearTimeout(this.resizeTimeout), this.resizeTimeout = setTimeout(function() {
                t.refresh()
            }, this.options.resizePolling)
        },
        resetPosition: function(t) {
            var i = this.x,
                s = this.y;
            return t = t || 0, !this.hasHorizontalScroll || this.x > 0 ? i = 0 : this.x < this.maxScrollX && (i = this.maxScrollX), !this.hasVerticalScroll || this.y > 0 ? s = 0 : this.y < this.maxScrollY && (s = this.maxScrollY), (i != this.x || s != this.y) && (this.scrollTo(i, s, t, this.options.bounceEasing), !0)
        },
        disable: function() {
            this.enabled = !1
        },
        enable: function() {
            this.enabled = !0
        },
        refresh: function() {
            h.getRect(this.wrapper), this.wrapperWidth = this.wrapper.clientWidth, this.wrapperHeight = this.wrapper.clientHeight;
            var t = h.getRect(this.scroller);
            this.scrollHeight && (t.height = this.scrollHeight), this.scrollerWidth = t.width, this.scrollerHeight = t.height, this.maxScrollX = this.wrapperWidth - this.scrollerWidth, this.maxScrollY = this.wrapperHeight - this.scrollerHeight, this.hasHorizontalScroll = this.options.scrollX && this.maxScrollX < 0, this.hasVerticalScroll = this.options.scrollY && this.maxScrollY < 0, this.hasHorizontalScroll || (this.maxScrollX = 0, this.scrollerWidth = this.wrapperWidth), this.hasVerticalScroll || (this.maxScrollY = 0, this.scrollerHeight = this.wrapperHeight), this.endTime = 0, this.directionX = 0, this.directionY = 0, h.hasPointer && !this.options.disablePointer && (this.wrapper.style[h.style.touchAction] = h.getTouchAction(this.options.eventPassthrough, !0), this.wrapper.style[h.style.touchAction] || (this.wrapper.style[h.style.touchAction] = h.getTouchAction(this.options.eventPassthrough, !1))), this.wrapperOffset = h.offset(this.wrapper), this._execEvent("refresh"), this.resetPosition()
        },
        on: function(t, i) {
            this._events[t] || (this._events[t] = []), this._events[t].push(i)
        },
        off: function(t, i) {
            if (this._events[t]) {
                var s = this._events[t].indexOf(i);
                s > -1 && this._events[t].splice(s, 1)
            }
        },
        _execEvent: function(t) {
            if (this._events[t]) {
                var i = 0,
                    s = this._events[t].length;
                if (s)
                    for (; i < s; i++) this._events[t][i].apply(this, [].slice.call(arguments, 1))
            }
        },
        scrollBy: function(t, i, s, e) {
            t = this.x + t, i = this.y + i, s = s || 0, this.scrollTo(t, i, s, e)
        },
        scrollTo: function(t, i, s, e) {
            e = e || h.ease.circular, this.isInTransition = this.options.useTransition && s > 0;
            var o = this.options.useTransition && e.style;
            !s || o ? (o && (this._transitionTimingFunction(e.style), this._transitionTime(s)), this._translate(t, i)) : this._animate(t, i, s, e.fn)
        },
        scrollToElement: function(t, i, e, o, n) {
            if (t = t.nodeType ? t : this.scroller.querySelector(t)) {
                var r = h.offset(t);
                r.left -= this.wrapperOffset.left, r.top -= this.wrapperOffset.top;
                var a = h.getRect(t),
                    l = h.getRect(this.wrapper);
                e === !0 && (e = s.round(a.width / 2 - l.width / 2)), o === !0 && (o = s.round(a.height / 2 - l.height / 2)), r.left -= e || 0, r.top -= o || 0, r.left = r.left > 0 ? 0 : r.left < this.maxScrollX ? this.maxScrollX : r.left, r.top = r.top > 0 ? 0 : r.top < this.maxScrollY ? this.maxScrollY : r.top, i = void 0 === i || null === i || "auto" === i ? s.max(s.abs(this.x - r.left), s.abs(this.y - r.top)) : i, this.scrollTo(r.left, r.top, i, n)
            }
        },
        _transitionTime: function(t) {
            if (this.options.useTransition) {
                t = t || 0;
                var i = h.style.transitionDuration;
                if (i) {
                    if (this.scrollerStyle[i] = t + "ms", !t && h.isBadAndroid) {
                        this.scrollerStyle[i] = "0.0001ms";
                        var s = this;
                        r(function() {
                            "0.0001ms" === s.scrollerStyle[i] && (s.scrollerStyle[i] = "0s")
                        })
                    }
                    if (this.indicators)
                        for (var e = this.indicators.length; e--;) this.indicators[e].transitionTime(t)
                }
            }
        },
        _transitionTimingFunction: function(t) {
            if (this.scrollerStyle[h.style.transitionTimingFunction] = t, this.indicators)
                for (var i = this.indicators.length; i--;) this.indicators[i].transitionTimingFunction(t)
        },
        _translate: function(t, i) {
            if (this.options.useTransform ? this.scrollerStyle[h.style.transform] = "translate(" + t + "px," + i + "px)" + this.translateZ : (t = s.round(t), i = s.round(i), this.scrollerStyle.left = t + "px", this.scrollerStyle.top = i + "px"), this.x = t, this.y = i, this.indicators)
                for (var e = this.indicators.length; e--;) this.indicators[e].updatePosition();
            this.options.onScrollHandler()
        },
        _initEvents: function(i) {
            var s = i ? h.removeEvent : h.addEvent,
                e = this.options.bindToWrapper ? this.wrapper : t;
            s(t, "orientationchange", this), s(t, "resize", this), this.options.click && s(this.wrapper, "click", this, !0), this.options.disableMouse || (s(this.wrapper, "mousedown", this), s(e, "mousemove", this), s(e, "mousecancel", this), s(e, "mouseup", this)), h.hasPointer && !this.options.disablePointer && (s(this.wrapper, h.prefixPointerEvent("pointerdown"), this), s(e, h.prefixPointerEvent("pointermove"), this), s(e, h.prefixPointerEvent("pointercancel"), this), s(e, h.prefixPointerEvent("pointerup"), this)), h.hasTouch && !this.options.disableTouch && (s(this.wrapper, "touchstart", this), s(e, "touchmove", this), s(e, "touchcancel", this), s(e, "touchend", this)), s(this.scroller, "transitionend", this), s(this.scroller, "webkitTransitionEnd", this), s(this.scroller, "oTransitionEnd", this), s(this.scroller, "MSTransitionEnd", this)
        },
        getComputedPosition: function() {
            var i, s, e = t.getComputedStyle(this.scroller, null);
            return this.options.useTransform ? (e = e[h.style.transform].split(")")[0].split(", "), i = +(e[12] || e[4]), s = +(e[13] || e[5])) : (i = +e.left.replace(/[^-\d.]/g, ""), s = +e.top.replace(/[^-\d.]/g, "")), {
                x: i,
                y: s
            }
        },
        _initIndicators: function() {
            function t(t) {
                if (h.indicators)
                    for (var i = h.indicators.length; i--;) t.call(h.indicators[i])
            }
            var i, s = this.options.interactiveScrollbars,
                e = "string" != typeof this.options.scrollbars,
                r = [],
                h = this;
            this.indicators = [], this.options.scrollbars && (this.options.scrollY && (i = {
                el: o("v", s, this.options.scrollbars),
                interactive: s,
                defaultScrollbars: !0,
                customStyle: e,
                resize: this.options.resizeScrollbars,
                shrink: this.options.shrinkScrollbars,
                fade: this.options.fadeScrollbars,
                listenX: !1
            }, this.wrapper.appendChild(i.el), r.push(i)), this.options.scrollX && (i = {
                el: o("h", s, this.options.scrollbars),
                interactive: s,
                defaultScrollbars: !0,
                customStyle: e,
                resize: this.options.resizeScrollbars,
                shrink: this.options.shrinkScrollbars,
                fade: this.options.fadeScrollbars,
                listenY: !1
            }, this.wrapper.appendChild(i.el), r.push(i))), this.options.indicators && (r = r.concat(this.options.indicators));
            for (var a = r.length; a--;) this.indicators.push(new n(this, r[a]));
            this.options.fadeScrollbars && (this.on("scrollEnd", function() {
                t(function() {
                    this.fade()
                })
            }), this.on("scrollCancel", function() {
                t(function() {
                    this.fade()
                })
            }), this.on("scrollStart", function() {
                t(function() {
                    this.fade(1)
                })
            }), this.on("beforeScrollStart", function() {
                t(function() {
                    this.fade(1, !0)
                })
            })), this.on("refresh", function() {
                t(function() {
                    this.refresh()
                })
            }), this.on("destroy", function() {
                t(function() {
                    this.destroy()
                }), delete this.indicators
            })
        },
        _initWheel: function() {
            h.addEvent(this.wrapper, "wheel", this), h.addEvent(this.wrapper, "mousewheel", this), h.addEvent(this.wrapper, "DOMMouseScroll", this), this.on("destroy", function() {
                clearTimeout(this.wheelTimeout), this.wheelTimeout = null, h.removeEvent(this.wrapper, "wheel", this), h.removeEvent(this.wrapper, "mousewheel", this), h.removeEvent(this.wrapper, "DOMMouseScroll", this)
            })
        },
        _wheel: function(t) {
            if (this.enabled) {
                t.preventDefault();
                var i, e, o, n, r = this;
                if (void 0 === this.wheelTimeout && r._execEvent("scrollStart"), clearTimeout(this.wheelTimeout), this.wheelTimeout = setTimeout(function() {
                        r.options.snap || r._execEvent("scrollEnd"), r.wheelTimeout = void 0
                    }, 400), "deltaX" in t) 1 === t.deltaMode ? (i = -t.deltaX * this.options.mouseWheelSpeed, e = -t.deltaY * this.options.mouseWheelSpeed) : (i = -t.deltaX, e = -t.deltaY);
                else if ("wheelDeltaX" in t) i = t.wheelDeltaX / 120 * this.options.mouseWheelSpeed, e = t.wheelDeltaY / 120 * this.options.mouseWheelSpeed;
                else if ("wheelDelta" in t) i = e = t.wheelDelta / 120 * this.options.mouseWheelSpeed;
                else {
                    if (!("detail" in t)) return;
                    i = e = -t.detail / 3 * this.options.mouseWheelSpeed
                }
                if (i *= this.options.invertWheelDirection, e *= this.options.invertWheelDirection, this.hasVerticalScroll || (i = e, e = 0), this.options.snap) return o = this.currentPage.pageX, n = this.currentPage.pageY, i > 0 ? o-- : i < 0 && o++, e > 0 ? n-- : e < 0 && n++, void this.goToPage(o, n);
                o = this.x + s.round(this.hasHorizontalScroll ? i : 0), n = this.y + s.round(this.hasVerticalScroll ? e : 0), this.directionX = i > 0 ? -1 : i < 0 ? 1 : 0, this.directionY = e > 0 ? -1 : e < 0 ? 1 : 0, o > 0 ? o = 0 : o < this.maxScrollX && (o = this.maxScrollX), n > 0 ? n = 0 : n < this.maxScrollY && (n = this.maxScrollY), this.scrollTo(o, n, 0)
            }
        },
        _initSnap: function() {
            this.currentPage = {}, "string" == typeof this.options.snap && (this.options.snap = this.scroller.querySelectorAll(this.options.snap)), this.on("refresh", function() {
                var t, i, e, o, n, r, a, l = 0,
                    c = 0,
                    p = 0,
                    d = this.options.snapStepX || this.wrapperWidth,
                    u = this.options.snapStepY || this.wrapperHeight;
                if (this.pages = [], this.wrapperWidth && this.wrapperHeight && this.scrollerWidth && this.scrollerHeight) {
                    if (this.options.snap === !0)
                        for (e = s.round(d / 2), o = s.round(u / 2); p > -this.scrollerWidth;) {
                            for (this.pages[l] = [], t = 0, n = 0; n > -this.scrollerHeight;) this.pages[l][t] = {
                                x: s.max(p, this.maxScrollX),
                                y: s.max(n, this.maxScrollY),
                                width: d,
                                height: u,
                                cx: p - e,
                                cy: n - o
                            }, n -= u, t++;
                            p -= d, l++
                        } else
                            for (r = this.options.snap, t = r.length, i = -1; l < t; l++) a = h.getRect(r[l]), (0 === l || a.left <= h.getRect(r[l - 1]).left) && (c = 0, i++), this.pages[c] || (this.pages[c] = []), p = s.max(-a.left, this.maxScrollX), n = s.max(-a.top, this.maxScrollY), e = p - s.round(a.width / 2), o = n - s.round(a.height / 2), this.pages[c][i] = {
                                x: p,
                                y: n,
                                width: a.width,
                                height: a.height,
                                cx: e,
                                cy: o
                            }, p > this.maxScrollX && c++;
                    this.goToPage(this.currentPage.pageX || 0, this.currentPage.pageY || 0, 0), this.options.snapThreshold % 1 === 0 ? (this.snapThresholdX = this.options.snapThreshold, this.snapThresholdY = this.options.snapThreshold) : (this.snapThresholdX = s.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].width * this.options.snapThreshold), this.snapThresholdY = s.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].height * this.options.snapThreshold))
                }
            }), this.on("flick", function() {
                var t = this.options.snapSpeed || s.max(s.max(s.min(s.abs(this.x - this.startX), 1e3), s.min(s.abs(this.y - this.startY), 1e3)), 300);
                this.goToPage(this.currentPage.pageX + this.directionX, this.currentPage.pageY + this.directionY, t)
            })
        },
        _nearestSnap: function(t, i) {
            if (!this.pages.length) return {
                x: 0,
                y: 0,
                pageX: 0,
                pageY: 0
            };
            var e = 0,
                o = this.pages.length,
                n = 0;
            if (s.abs(t - this.absStartX) < this.snapThresholdX && s.abs(i - this.absStartY) < this.snapThresholdY) return this.currentPage;
            for (t > 0 ? t = 0 : t < this.maxScrollX && (t = this.maxScrollX), i > 0 ? i = 0 : i < this.maxScrollY && (i = this.maxScrollY); e < o; e++)
                if (t >= this.pages[e][0].cx) {
                    t = this.pages[e][0].x;
                    break
                } for (o = this.pages[e].length; n < o; n++)
                if (i >= this.pages[0][n].cy) {
                    i = this.pages[0][n].y;
                    break
                } return e == this.currentPage.pageX && (e += this.directionX, e < 0 ? e = 0 : e >= this.pages.length && (e = this.pages.length - 1), t = this.pages[e][0].x), n == this.currentPage.pageY && (n += this.directionY, n < 0 ? n = 0 : n >= this.pages[0].length && (n = this.pages[0].length - 1), i = this.pages[0][n].y), {
                x: t,
                y: i,
                pageX: e,
                pageY: n
            }
        },
        goToPage: function(t, i, e, o) {
            o = o || this.options.bounceEasing, t >= this.pages.length ? t = this.pages.length - 1 : t < 0 && (t = 0), i >= this.pages[t].length ? i = this.pages[t].length - 1 : i < 0 && (i = 0);
            var n = this.pages[t][i].x,
                r = this.pages[t][i].y;
            e = void 0 === e ? this.options.snapSpeed || s.max(s.max(s.min(s.abs(n - this.x), 1e3), s.min(s.abs(r - this.y), 1e3)), 300) : e, this.currentPage = {
                x: n,
                y: r,
                pageX: t,
                pageY: i
            }, this.scrollTo(n, r, e, o)
        },
        next: function(t, i) {
            var s = this.currentPage.pageX,
                e = this.currentPage.pageY;
            s++, s >= this.pages.length && this.hasVerticalScroll && (s = 0, e++), this.goToPage(s, e, t, i)
        },
        prev: function(t, i) {
            var s = this.currentPage.pageX,
                e = this.currentPage.pageY;
            s--, s < 0 && this.hasVerticalScroll && (s = 0, e--), this.goToPage(s, e, t, i)
        },
        _initKeys: function(i) {
            var s, e = {
                pageUp: 33,
                pageDown: 34,
                end: 35,
                home: 36,
                left: 37,
                up: 38,
                right: 39,
                down: 40
            };
            if ("object" == typeof this.options.keyBindings)
                for (s in this.options.keyBindings) "string" == typeof this.options.keyBindings[s] && (this.options.keyBindings[s] = this.options.keyBindings[s].toUpperCase().charCodeAt(0));
            else this.options.keyBindings = {};
            for (s in e) this.options.keyBindings[s] = this.options.keyBindings[s] || e[s];
            h.addEvent(t, "keydown", this), this.on("destroy", function() {
                h.removeEvent(t, "keydown", this)
            })
        },
        _key: function(t) {
            if (this.enabled) {
                var i, e = this.options.snap,
                    o = e ? this.currentPage.pageX : this.x,
                    n = e ? this.currentPage.pageY : this.y,
                    r = h.getTime(),
                    a = this.keyTime || 0,
                    l = .25;
                switch (this.options.useTransition && this.isInTransition && (i = this.getComputedPosition(), this._translate(s.round(i.x), s.round(i.y)), this.isInTransition = !1), this.keyAcceleration = r - a < 200 ? s.min(this.keyAcceleration + l, 50) : 0, t.keyCode) {
                    case this.options.keyBindings.pageUp:
                        this.hasHorizontalScroll && !this.hasVerticalScroll ? o += e ? 1 : this.wrapperWidth : n += e ? 1 : this.wrapperHeight;
                        break;
                    case this.options.keyBindings.pageDown:
                        this.hasHorizontalScroll && !this.hasVerticalScroll ? o -= e ? 1 : this.wrapperWidth : n -= e ? 1 : this.wrapperHeight;
                        break;
                    case this.options.keyBindings.end:
                        o = e ? this.pages.length - 1 : this.maxScrollX, n = e ? this.pages[0].length - 1 : this.maxScrollY;
                        break;
                    case this.options.keyBindings.home:
                        o = 0, n = 0;
                        break;
                    case this.options.keyBindings.left:
                        o += e ? -1 : 5 + this.keyAcceleration >> 0;
                        break;
                    case this.options.keyBindings.up:
                        n += e ? 1 : 5 + this.keyAcceleration >> 0;
                        break;
                    case this.options.keyBindings.right:
                        o -= e ? -1 : 5 + this.keyAcceleration >> 0;
                        break;
                    case this.options.keyBindings.down:
                        n -= e ? 1 : 5 + this.keyAcceleration >> 0;
                        break;
                    default:
                        return
                }
                if (e) return void this.goToPage(o, n);
                o > 0 ? (o = 0, this.keyAcceleration = 0) : o < this.maxScrollX && (o = this.maxScrollX, this.keyAcceleration = 0), n > 0 ? (n = 0, this.keyAcceleration = 0) : n < this.maxScrollY && (n = this.maxScrollY, this.keyAcceleration = 0), this.scrollTo(o, n, 0), this.keyTime = r
            }
        },
        _animate: function(t, i, s, e) {
            function o() {
                var d, u, m, f = h.getTime();
                return f >= p ? (n.isAnimating = !1, n._translate(t, i), void(n.resetPosition(n.options.bounceTime) || n._execEvent("scrollEnd"))) : (f = (f - c) / s, m = e(f), d = (t - a) * m + a, u = (i - l) * m + l, n._translate(d, u), void(n.isAnimating && r(o)))
            }
            var n = this,
                a = this.x,
                l = this.y,
                c = h.getTime(),
                p = c + s;
            this.isAnimating = !0, o()
        },
        handleEvent: function(t) {
            switch (t.type) {
                case "touchstart":
                case "pointerdown":
                case "MSPointerDown":
                case "mousedown":
                    t.defaultPrevented || this._start(t);
                    break;
                case "touchmove":
                case "pointermove":
                case "MSPointerMove":
                case "mousemove":
                    t.defaultPrevented || this._move(t);
                    break;
                case "touchend":
                case "pointerup":
                case "MSPointerUp":
                case "mouseup":
                case "touchcancel":
                case "pointercancel":
                case "MSPointerCancel":
                case "mousecancel":
                    this._end(t);
                    break;
                case "orientationchange":
                case "resize":
                    this._resize();
                    break;
                case "transitionend":
                case "webkitTransitionEnd":
                case "oTransitionEnd":
                case "MSTransitionEnd":
                    this._transitionEnd(t);
                    break;
                case "wheel":
                case "DOMMouseScroll":
                case "mousewheel":
                    this._wheel(t);
                    break;
                case "keydown":
                    this._key(t);
                    break;
                case "click":
                    this.enabled && !t._constructed
            }
        }
    }, n.prototype = {
        handleEvent: function(t) {
            switch (t.type) {
                case "touchstart":
                case "pointerdown":
                case "MSPointerDown":
                case "mousedown":
                    this._start(t);
                    break;
                case "touchmove":
                case "pointermove":
                case "MSPointerMove":
                case "mousemove":
                    this._move(t);
                    break;
                case "touchend":
                case "pointerup":
                case "MSPointerUp":
                case "mouseup":
                case "touchcancel":
                case "pointercancel":
                case "MSPointerCancel":
                case "mousecancel":
                    this._end(t)
            }
        },
        destroy: function() {
            this.options.fadeScrollbars && (clearTimeout(this.fadeTimeout), this.fadeTimeout = null), this.options.interactive && (h.removeEvent(this.indicator, "touchstart", this), h.removeEvent(this.indicator, h.prefixPointerEvent("pointerdown"), this), h.removeEvent(this.indicator, "mousedown", this), h.removeEvent(t, "touchmove", this), h.removeEvent(t, h.prefixPointerEvent("pointermove"), this), h.removeEvent(t, "mousemove", this), h.removeEvent(t, "touchend", this), h.removeEvent(t, h.prefixPointerEvent("pointerup"), this), h.removeEvent(t, "mouseup", this)), this.options.defaultScrollbars && this.wrapper.parentNode && this.wrapper.parentNode.removeChild(this.wrapper)
        },
        _start: function(i) {
            var s = i.touches ? i.touches[0] : i;
            i.preventDefault(), i.stopPropagation(), this.transitionTime(), this.initiated = !0, this.moved = !1, this.lastPointX = s.pageX, this.lastPointY = s.pageY, this.startTime = h.getTime(), this.options.disableTouch || h.addEvent(t, "touchmove", this), this.options.disablePointer || h.addEvent(t, h.prefixPointerEvent("pointermove"), this), this.options.disableMouse || h.addEvent(t, "mousemove", this), this.scroller._execEvent("beforeScrollStart")
        },
        _move: function(t) {
            var i, s, e, o, n = t.touches ? t.touches[0] : t;
            h.getTime();
            this.moved || this.scroller._execEvent("scrollStart"), this.moved = !0, i = n.pageX - this.lastPointX, this.lastPointX = n.pageX, s = n.pageY - this.lastPointY, this.lastPointY = n.pageY, e = this.x + i, o = this.y + s, this._pos(e, o), t.preventDefault(), t.stopPropagation()
        },
        _end: function(i) {
            if (this.initiated) {
                if (this.initiated = !1, i.preventDefault(), i.stopPropagation(), h.removeEvent(t, "touchmove", this), h.removeEvent(t, h.prefixPointerEvent("pointermove"), this), h.removeEvent(t, "mousemove", this), this.scroller.options.snap) {
                    var e = this.scroller._nearestSnap(this.scroller.x, this.scroller.y),
                        o = this.options.snapSpeed || s.max(s.max(s.min(s.abs(this.scroller.x - e.x), 1e3), s.min(s.abs(this.scroller.y - e.y), 1e3)), 300);
                    this.scroller.x == e.x && this.scroller.y == e.y || (this.scroller.directionX = 0, this.scroller.directionY = 0, this.scroller.currentPage = e, this.scroller.scrollTo(e.x, e.y, o, this.scroller.options.bounceEasing))
                }
                this.moved && this.scroller._execEvent("scrollEnd")
            }
        },
        transitionTime: function(t) {
            t = t || 0;
            var i = h.style.transitionDuration;
            if (i && (this.indicatorStyle[i] = t + "ms", !t && h.isBadAndroid)) {
                this.indicatorStyle[i] = "0.0001ms";
                var s = this;
                r(function() {
                    "0.0001ms" === s.indicatorStyle[i] && (s.indicatorStyle[i] = "0s")
                })
            }
        },
        transitionTimingFunction: function(t) {
            this.indicatorStyle[h.style.transitionTimingFunction] = t
        },
        refresh: function() {
            this.transitionTime(), this.options.listenX && !this.options.listenY ? this.indicatorStyle.display = this.scroller.hasHorizontalScroll ? "block" : "none" : this.options.listenY && !this.options.listenX ? this.indicatorStyle.display = this.scroller.hasVerticalScroll ? "block" : "none" : this.indicatorStyle.display = this.scroller.hasHorizontalScroll || this.scroller.hasVerticalScroll ? "block" : "none", this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll ? (h.addClass(this.wrapper, "iScrollBothScrollbars"), h.removeClass(this.wrapper, "iScrollLoneScrollbar"), this.options.defaultScrollbars && this.options.customStyle && (this.options.listenX ? this.wrapper.style.right = "8px" : this.wrapper.style.bottom = "8px")) : (h.removeClass(this.wrapper, "iScrollBothScrollbars"), h.addClass(this.wrapper, "iScrollLoneScrollbar"), this.options.defaultScrollbars && this.options.customStyle && (this.options.listenX ? this.wrapper.style.right = "2px" : this.wrapper.style.bottom = "2px")), h.getRect(this.wrapper), this.options.listenX && (this.wrapperWidth = this.wrapper.clientWidth, this.options.resize ? (this.indicatorWidth = s.max(s.round(this.wrapperWidth * this.wrapperWidth / (this.scroller.scrollerWidth || this.wrapperWidth || 1)), 8), this.indicatorStyle.width = this.indicatorWidth + "px") : this.indicatorWidth = this.indicator.clientWidth, this.maxPosX = this.wrapperWidth - this.indicatorWidth, "clip" == this.options.shrink ? (this.minBoundaryX = -this.indicatorWidth + 8, this.maxBoundaryX = this.wrapperWidth - 8) : (this.minBoundaryX = 0, this.maxBoundaryX = this.maxPosX), this.sizeRatioX = this.options.speedRatioX || this.scroller.maxScrollX && this.maxPosX / this.scroller.maxScrollX), this.options.listenY && (this.wrapperHeight = this.wrapper.clientHeight, this.options.resize ? (this.indicatorHeight = s.max(s.round(this.wrapperHeight * this.wrapperHeight / (this.scroller.scrollerHeight || this.wrapperHeight || 1)), 8), this.indicatorStyle.height = this.indicatorHeight + "px") : this.indicatorHeight = this.indicator.clientHeight, this.maxPosY = this.wrapperHeight - this.indicatorHeight, "clip" == this.options.shrink ? (this.minBoundaryY = -this.indicatorHeight + 8, this.maxBoundaryY = this.wrapperHeight - 8) : (this.minBoundaryY = 0, this.maxBoundaryY = this.maxPosY),
                this.maxPosY = this.wrapperHeight - this.indicatorHeight, this.sizeRatioY = this.options.speedRatioY || this.scroller.maxScrollY && this.maxPosY / this.scroller.maxScrollY), this.updatePosition()
        },
        updatePosition: function() {
            var t = this.options.listenX && s.round(this.sizeRatioX * this.scroller.x) || 0,
                i = this.options.listenY && s.round(this.sizeRatioY * this.scroller.y) || 0;
            this.options.ignoreBoundaries || (t < this.minBoundaryX ? ("scale" == this.options.shrink && (this.width = s.max(this.indicatorWidth + t, 8), this.indicatorStyle.width = this.width + "px"), t = this.minBoundaryX) : t > this.maxBoundaryX ? "scale" == this.options.shrink ? (this.width = s.max(this.indicatorWidth - (t - this.maxPosX), 8), this.indicatorStyle.width = this.width + "px", t = this.maxPosX + this.indicatorWidth - this.width) : t = this.maxBoundaryX : "scale" == this.options.shrink && this.width != this.indicatorWidth && (this.width = this.indicatorWidth, this.indicatorStyle.width = this.width + "px"), i < this.minBoundaryY ? ("scale" == this.options.shrink && (this.height = s.max(this.indicatorHeight + 3 * i, 8), this.indicatorStyle.height = this.height + "px"), i = this.minBoundaryY) : i > this.maxBoundaryY ? "scale" == this.options.shrink ? (this.height = s.max(this.indicatorHeight - 3 * (i - this.maxPosY), 8), this.indicatorStyle.height = this.height + "px", i = this.maxPosY + this.indicatorHeight - this.height) : i = this.maxBoundaryY : "scale" == this.options.shrink && this.height != this.indicatorHeight && (this.height = this.indicatorHeight, this.indicatorStyle.height = this.height + "px")), this.x = t, this.y = i, this.scroller.options.useTransform ? this.indicatorStyle[h.style.transform] = "translate(" + t + "px," + i + "px)" + this.scroller.translateZ : (this.indicatorStyle.left = t + "px", this.indicatorStyle.top = i + "px")
        },
        _pos: function(t, i) {
            t < 0 ? t = 0 : t > this.maxPosX && (t = this.maxPosX), i < 0 ? i = 0 : i > this.maxPosY && (i = this.maxPosY), t = this.options.listenX ? s.round(t / this.sizeRatioX) : this.scroller.x, i = this.options.listenY ? s.round(i / this.sizeRatioY) : this.scroller.y, this.scroller.scrollTo(t, i)
        },
        fade: function(t, i) {
            if (!i || this.visible) {
                clearTimeout(this.fadeTimeout), this.fadeTimeout = null;
                var s = t ? 250 : 500,
                    e = t ? 0 : 300;
                t = t ? "1" : "0", this.wrapperStyle[h.style.transitionDuration] = s + "ms", this.fadeTimeout = setTimeout(function(t) {
                    this.wrapperStyle.opacity = t, this.visible = +t
                }.bind(this, t), e)
            }
        }
    }, e.utils = h, "undefined" != typeof module && module.exports ? module.exports = e : "function" == typeof define && define.amd ? define(function() {
        return e
    }) : t.IScroll = e
}(window, document, Math);