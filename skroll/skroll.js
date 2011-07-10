/**
 * Skroll
 *
 * @version      0.52
 * @author       nori (norimania@gmail.com)
 * @copyright    5509 (http://5509.m1e/)
 * @license      The MIT License
 * @link         https://github.com/5509/skroll
 *
 * 2011-07-10 23:58
 */
/*
 * MEMO:
 * 基本縦のスクロールとして使う
 * 横スクロールはオプションで明示的に狭い幅を与えた場合に有効
 * バグだらけ
 *
 * TODO:
 * IEの対応（主に7以下
 * Androidのtouchmove対応が微妙っぽい
 * overflow: scrollが使えるらしいiOS5の対応をどうするのか
 */
;(function($, window, document, undefined) {

	// CONST
	var MOBILE = "ontouchstart" in window,
		MOUSEWHEEL = "onmousewheel" in window ? "mousewheel" : "DOMMouseScroll",
		MATRIX = "matrix(1,0,0,1,0,0)",
		CUBICBEZIER = "cubic-bezier(0,1,0.73,0.95)",
		CUBICBEZIERBOUNCE = "cubic-bezier(0.11,0.74,0.15,0.80)",
		SCROLLBOUNCECAPACITY = 150,
		SCROLLCANCELDURATION = 80,
		$document = $(document),
		$html = $("html");

	// Bridge
	$.fn.skroll = function(option) {
		new Skroll(this, option);
		return this;
	};

	// Skroll
	var Skroll = function(elm, option) {
		var _borderRadius = undefined,
			_this = this;

		// Option
		this.option = $.extend({
			sync            : false,
			margin          : 0,
			width           : parseInt(elm.css("width"), 10),
			height          : parseInt(elm.css("height"), 10),
			inSpeed         : 50,
			outSpeed        : 200,
			delayTime       : 200,
			scrollBarBorder : 1,
			scrollBarWidth  : 6,
			scrollBarHeight : 6,
			scrollBarSpace  : 0,
			scrollBarColor  : "#000",
			opacity         : .5,
			cursor          : {
				grab     : "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAVBJREFUeNq8lNtqAjEQhjfr1hNCr3vZV+gbCCJY6oXg+z+A0lbrWWPTGf0HZtNpTSh04CcxiV/mlHUhhOK/zZEqUoAqrP0J0uVRTK0nX8AHmhZE/472mha4VPMGqZMZWY/0CY6zoDxvk56cu+4nFPEVZ86kOwGXP+Q0yaJLO4i2BmurIrzo/Flm5PcBjAvMwfWD3JwRvj7/SJqRtqVVoJwHAWA/rv63AuWCOUrSEZ1QKxQTxxqcYWuAvUCZvsfGOuv5XR0YcB4BPQuUJzvSgvuO9Jzp7Rb/9+iCC5QnJ3i5gCa3wNgfkT4QqY9fVECi+cCc9EaaJni8gvYSehG9HknDO9ZTXhY7sYFDwYJKGlboXd4bkrf3NLYi2A753+gCWdAiyq94e8AnThuHuwTUay+LXz6yFbzrYYwv97is1p+3oE6loDTOBfS3R+g1T78EGABoDL2O9rWNwgAAAABJRU5ErkJggg==') 6 6, default",
				grabbing : "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAOFJREFUeNrslDEOwjAMRTGq0ompTEywcBsO0YkDcwCYOtGpLPESXPFThUASV7AgYemrUWO//rhuyTm3+HbQH/qDUCIK9/wGZdZP4VkpqJsS5F5qHcPV0OQR8QDUUAlqRBvRWdNvLbQRXcMkBbQWcQ7q5kwEatai3tctPxqdB/AAp1PE0LGfu2i0ZkcMXYm2orYExn4ruolsDhrGUeF4EHW4JqHj5gWJrDhpD3HpM/VzusfVZIAnmOBwBKs3yQynBj1uElCLfr6cqEoUMJx08UuInNq5fynvtM44HUKnnnUXYADcMYKw5+rWOgAAAABJRU5ErkJggg==') 6 6, default"
			},
			scrollBarHide   : true,
			scrollX         : false
		}, option);

		_borderRadius = (this.option.scrollBarWidth + this.option.scrollBarBorder * 2) / 2 + "px";

		this.$elm = elm;
		this.$outer = $("<div class='scrollOuter'></div>");
		this.$bar = $("<div class='scrollbar'></div>").css({
			position           : "absolute",
			borderRadius       : _borderRadius,
			WebKitBorderRadius : _borderRadius,
			MozBorderRadius    : _borderRadius,
			OBorderRadius      : _borderRadius,
			MsBorderRadius     : _borderRadius,
			cursor             : this.option.cursor.grab,
			backgroundColor    : this.option.scrollBarColor,
			WebkitTransform    : MATRIX,
			boxShadow          : "0 0 2px #fff",
			MozBoxShadow       : "0 0 2px #fff",
			WebkitBoxShadow    : "0 0 2px #fff"
		}).hide();
		this.$images = $("img", elm);
		this.scrollingBase = { x: 0, y: 0 };
		// 値を保持しておくためのやつ
		this.enteringCursor = false;
		this.transitioning = false;
		this.dragging = false;
		this.draggingX = false;
		this.scrolling = false;
		this.dragTop = 0;
		this.dragLeft = 0;
		this.innerWidth = elm.get(0).offsetWidth,
		this.id = ".scrl" + (Math.floor(Math.random() * 1000) * 5); // イベント識別子
		this.mousedown = "mousedown" + this.id;
		this.mousemove = "mousemove" + this.id;
		this.mouseup = "mouseup" + this.id;
		this.outerHeight = undefined;
		this.diff = undefined;
		this.diffX = undefined;
		this.scrollBarWidth = undefined;
		this.scrollBarHeight = undefined;
		this.innerScrollVal = undefined;
		this.innerScrollValX = undefined;
		this.setUp = undefined;
		this.setUpX = undefined;
		this.imgLoaded = 0;
		this.imgLength = 0;
		this.sideScroll = false;

		// コンテンツの高さがアウターよりも大きければという処理を入れたほうがよさそう
		elm.css("height", "auto");
		this.innerHeight = elm.get(0).offsetHeight;
		// 明示的なwidthの指定があり
		// そのwidthがコンテンツ幅を超えている場合は、横スクロールをONにする
		if ( option.width ) {
			this.sideScroll = true;
			this.$barX = this.$bar.clone();
		}
		// Init
		this.setUpSkroll();
		if ( !MOBILE ) {
			this.eventBind();
		// Mobile init
		} else {
			this.evnetBindMobile();
		}
		// 他のコンテンツもロードが終わってから
		// スクロールバーをチラ見せする
		$(window).one("load", function() {
			var _opt = _this.option,
				$bar = _this.$bar,
				$barX = _this.$barX;
			if ( _opt.scrollBarHide ) {
				$bar
					.fadeIn(_opt.inSpeed)
					.delay(_opt.delayTime)
					.fadeOut(_opt.outSpeed*2);
				if ( !$barX ) return false;
				$barX
					.fadeIn(_opt.inSpeed)
					.delay(_opt.delayTime)
					.fadeOut(_opt.outSpeed*2);
			} else {
				$bar.fadeIn(_opt.inSpeed);
				if ( !barX ) return false;
				$barX.fadeIn(_opt.inSpeed);
			}
		});
	};
	Skroll.prototype = {
		getCurrent: function($el) {
			if ( MOBILE ) {
				var _matrix =  $el.css("WebkitTransform")
						.replace(/matrix\(([^\(\)]*)\)/, "$1")
						.split(",");

				return {
					x: parseInt(_matrix[4], 10),
					y: parseInt(_matrix[5], 10)
				}
			} else {
				return {
					x: parseInt($el.css("left"), 10),
					y: parseInt($el.css("top"),  10)
				}
			}
		},
		// for Transition
		setNext: function($el, val, bar, to) { // val: {x: valX, y: valY}
			var _this = this,
				_barDiff = _this.outerHeight - _this.scrollBarHeight,
				_defaultVal = { x: 0, y: 0 };
			if ( val.y === 0 ) {
				val.y = "0";
			}
			if ( val.x === 0 ) {
				val.x = "0";
			}
			if ( !val.x || !val.y ) {
				_defaultVal = this.getCurrent($el);
			}
			val.x = 0;
			// モバイル環境のelmのみ
			// 含む要素が多いためmatrixで移動する
			if ( MOBILE && !bar ) {
				$el.css({
					WebkitTransform : "matrix(1,0,0,1," + (val.x || _defaultVal.x) + "," + (val.y || _defaultVal.y) + ")"
				});
			} else {
				// barのときのみ、barが下へ移動するときはbottomで移動する
				if ( to ) {
					$el.css({
						WebkitTransitionProperty: "height, bottom",
						top: "auto",
						bottom: _barDiff - val.y
					});
				// elmとbar共通、barは上へ移動するときのみ
				} else {
					$el.css({
						top: val.y || _defaultVal.y,
						bottom: "auto"
					});
				}
			}
		},
		setUpScrolling: function(e) {
			var _this = this,
				$outer = this.$outer,
				$bar = this.$bar;

			if ( !_this.setUp ) {
				_this.setUp = true;
			} else {
				return;
			}
			_this.outerHeight = $outer.height();
			_this.diff = _this.innerHeight - _this.outerHeight - _this.option.scrollBarSpace*2;
			_this.innerScrollVal = _this.diff / (_this.outerHeight - _this.scrollBarHeight - _this.option.scrollBarSpace*2);
			_this.dragTop = e ? e.clientY : 0;
			_this.scrolling = _this.dragging ? false : true;
		},
		setUpScrollingX: function(e) {
			var _this = this,
				$outer = this.$outer,
				$barX = this.$barX;

			if ( !_this.setUpX ) {
				_this.setUpX = true;
			} else {
				return;
			}
			_this.outerWidth = $outer.width();
			_this.diffX = _this.innerWidth - _this.outerWidth;
			_this.scrollBarWidth = $barX.width();
			_this.innerScrollValX = _this.diffX / (_this.outerWidth - _this.scrollBarWidth);
			_this.dragLeft = e ? e.clientX : 0;
			_this.scrolling = _this.draggingX ? false : true;
		},
		innerScrolling: function(_to) {
			var _this = this,
				_opt = _this.option,
				_current = this.scrollingBase,
				_next = {},
				_innerNext = {},
				_innerTop = undefined, //_current.y * _this.innerScrollVal,
				_barDiff = _this.outerHeight - _this.scrollBarHeight - _opt.scrollBarSpace,
				_innerScrolling = _current.y >= _barDiff,
				_minInnerTop = _opt.scrollBarSpace * _this.innerScrollVal,
				_maxInnerTop = -_barDiff * _this.innerScrollVal,
				$bar = _this.$bar,
				$elm = _this.$elm;

			_next.y = _current.y <= _opt.scrollBarSpace
					? _opt.scrollBarSpace : _innerScrolling
						? _barDiff : _current.y;

			if ( MOBILE ) {
				_innerNext.y = _current.y * _this.innerScrollVal <= -SCROLLBOUNCECAPACITY
						? SCROLLBOUNCECAPACITY :
							-_current.y * _this.innerScrollVal <= _maxInnerTop - SCROLLBOUNCECAPACITY
								? _maxInnerTop - SCROLLBOUNCECAPACITY
									: -_current.y * _this.innerScrollVal;

				if ( _innerNext.y > 0 ) {
					$bar.css({
						height: _this.scrollBarHeight * (1 - (_innerNext.y / 100)/3)
					});
				} else
				if ( _innerNext.y < _maxInnerTop ) {
					$bar.css({
						height: _this.scrollBarHeight * (1 - (-(_innerNext.y - _maxInnerTop) / 100)/3)
					});
				}
				_this.setNext($bar, {
					y: _next.y <= 0 ? 0 : _next.y
				}, true, _innerNext.y > 0 ? false : _innerNext.y < _maxInnerTop ? true : _to);
				// 0を超えたときは常にtop、_maxInnerTop以下のときは常にbottom

				_this.setNext($elm, {
					y: _innerNext.y
				});
			} else {
				_this.setNext($bar, {
					y: _next.y <= 0 ? 0 : _next.y
				});
				_this.setNext($elm, {
					y: _next.y * _this.innerScrollVal <= 0
						? 0 : -_next.y * _this.innerScrollVal
				});
			}
		},
		innerScrollingX: function(_barLeft) {
			var _this = this,
				_innerLeft = _barLeft * _this.innerScrollValX,
				_innerScrolling = _barLeft >= _this.outerWidth - _this.scrollBarWidth,
				_maxInnerLeft = -(_this.outerWidth - _this.scrollBarWidth) * _this.innerScrollValX,
				$barX = _this.$barX,
				$elm = _this.$elm;

			$barX.css({
				left: _barLeft <= 0
						? 0 : _innerScrolling
							? _this.outerWidth - _this.scrollBarWidth : _barLeft
			});
			if ( !_innerScrolling ) {
				$elm.css({
					left: _innerLeft <= 0 ? 0 : -_innerLeft
				});
			} else {
				$elm.css({
					left: _maxInnerLeft
				});
			}
		},
		setUpSkroll: function() {
			var _this = this,
				_opt = this.option,
				$elm = this.$elm,
				$bar = this.$bar,
				$images = this.$images,
				$outer = this.$outer,
				$barX = this.$barX ? this.$barX : undefined,
				_elmWidth = parseInt($elm.css("width"), 10),
				_barHeight = Math.pow(parseInt(_opt.height, 10), 2) / _this.innerHeight * 3 / 2;

			this.$outer = $elm
				.css({
					margin          : 0,
					width           : _this.sideScroll ?
										_elmWidth
										: _elmWidth - _opt.scrollBarSpace,
					height          : "auto",
					overflow        : "auto",
					position        : MOBILE ? "static" : "relative",
					opacity         : 1,
					WebkitTransform : MATRIX
				})
				.wrap(
					$outer
						.css({
							margin        : _opt.margin,
							paddingRight  : _opt.scrollBarSpace,
							paddingBottom : _this.sideScroll ? _opt.scrollBarSpace : 0,
							width         : parseInt(_opt.width,  10) - _opt.scrollBarSpace,
							height        : parseInt(_opt.height, 10),
							position      : "relative",
							overflow      : "hidden",
							outline       : "none"
						})
				)
				.parent()
				.append(
					$bar
						.css({
							width   : _opt.scrollBarWidth,
							height  : _barHeight,
							top     : _opt.scrollBarSpace,
							right   : 0,
							opacity : _opt.opacity
						})
				)
				.append($barX ?
					$barX
						.css({
							width   : Math.pow(parseInt(_opt.width, 10), 2) / _this.innerWidth,
							height  : _opt.scrollBarHeight,
							opacity : _opt.opacity,
							bottom  : -$barX.get(0).offsetHeight,
							left    : 0
						})
					: undefined
				);

			_this.scrollBarHeight = _barHeight;

			// 画像がある場合は画像の読み込み完了を待つ
			if ( $images.length ) {
				_this.imgLength = $images.length;
				$images.each(function() {
					$(this).m5ImgLoad(function() {
						_this.imgLoaded = _this.imgLoaded + 1;
					})
				});

				(function() {
					if ( _this.imgLoaded === _this.imgLength ) {
						_this.innerHeight = $elm.get(0).offsetHeight;
						return;
					}
					setTimeout(arguments.callee, 30);
				}());
			}
		},
		css: function(elm, styles) {
			for ( var i = 0; i < elm.length; i++ ) {
				elm[i].css(styles);
			}
		},
		eventBind: function() {
			var _this = this,
				_barTop = undefined,
				_barLeft = undefined,
				_opt = this.option,
				$bar = this.$bar,
				$barX = this.$barX ? this.$barX : undefined,
				$outer = this.$outer;

			$outer
				.bind("mouseover", function() {
					_this.enteringCursor = true;
					$bar.stop(true, true).fadeIn(_opt.inSpeed);

					if ( !$barX ) return;
					$barX.stop(true, true).fadeIn(_opt.inSpeed);
				})
				.bind("mouseleave", function() {
					_this.enteringCursor = false;
					if ( _this.dragging || _this.draggingX ) {
						return false;
					}
					_this.setUp = false;
					_this.scrolling = false;
					if ( _opt.scrollBarHide ) {
						$bar.fadeOut(_opt.outSpeed);

						if ( !$barX) return;
						$barX.fadeOut(_opt.outSpeed);
					}
				})
				.bind(MOUSEWHEEL, function(e) {
					// detailはwheelDeltaと正負が逆になり
					// 値もwheelDeltaの1/10
					var _delta = Math.round(e.wheelDelta/10) || -e.detail,
						_current = _this.scrollingBase;

					_current.y = _this.scrollingBase.y - _delta;

					if ( !_opt.scrollX ) {
						if ( !_this.setUp ) _this.setUpScrolling();
						_this.innerScrolling();
					} else {
						_current.x = _current.x - _delta;
						if ( !_this.setUpX ) _this.setUpScrollingX();
						_this.innerScrollingX();
					}
					e.preventDefault();
				});

			$bar.bind(_this.mousedown, function(e) {
				var _current = _this.scrollingBase;

				this.dragTop = e.clientY;
				_this.setUp = false;
				_this.dragging = true;
				_this.scrolling = false;
				_this.setUpScrolling(e);

				_this.css([$html, $bar], {cursor: _opt.cursor.grabbing});

				$document
					.bind(_this.mousemove, function(e) {
						if ( _this.dragging ) {
							_current.y = _current.y + (e.clientY - _this.dragTop);
							_this.dragTop = e.clientY;
							_this.innerScrolling();
						}
						return false;
					})
					.bind(_this.mouseup, function() {
						_this.dragging = false;
						_this.setUp = false;
						$document.unbind(_this.mousemove, _this.mouseup);
						$html.css("cursor", "default");
						$bar.css("cursor", _opt.cursor.grab);
						if ( !_this.enteringCursor ) {
							$bar.fadeOut(_opt.outSpeed);
						}
					});
				return false;
			});

			if ( $barX ) {
				$barX.bind(_this.mousedown + "x", function(e) {
					_barLeft = parseInt($barX.css("left"), 10);
					this.dragLeft = e.clientX;
					_this.setUpX = false;
					_this.draggingX = true;
					_this.scrolling = false;
					_this.setUpScrollingX(e);

					$document
						.bind(_this.mousemove + "x", function(e) {
							if ( _this.draggingX ) {
								_barLeft = _barLeft + (e.clientX - _this.dragLeft);
								_this.dragLeft = e.clientX;
								_this.innerScrollingX(_barLeft);
							}
							return false;
						})
						.bind(_this.mouseup + "x", function() {
							_this.draggingX = false;
							_this.setUpX = false;
							$document.unbind(_this.mousemove + "x", _this.mouseup + "x");
							if ( !_this.enteringCursor ) {
								$barX.fadeOut(_opt.outSpeed);
							}
						});
					return false;
				});
			}
		},
		evnetBindMobile: function() {
			var _this = this,
				_opt = this.option,
				$bar = this.$bar,
				$barX = this.$barX ? this.$barX : undefined,
				$outer = this.$outer,
				$elm = this.$elm,
				outer = $outer.get(0),
				touching = false,
				touchStartPos = undefined,
				touchEndPosPPrev = undefined,
				touchEndPosPrev = undefined,
				touchEndPos = undefined,
				acceleration = undefined,
				touchStartTime = undefined,
				touchMoveEndTime = undefined,
				touchEndTime = undefined,
				touchSpeed = 0,
				transitionSetUp = {
					WebkitTransitionProperty       : "all",
					WebkitTransitionTimingFunction : CUBICBEZIER,
					WebkitTransformStyle           : "preserve-3d", // GPUレンダリングをONにしておく
					WebkitTransitionDuration       : "0s"
				},
				transioningFunc = function(callback) {
					_this.transitioning = true;
					(function() {
						if ( !_this.transitioning ) return;
						callback();
						setTimeout(arguments.callee, 10);
					}());
				},
				bounce = function() {
					var _barDiff = _this.outerHeight - _this.scrollBarHeight - _opt.scrollBarSpace*2,
						_maxInnerTop = -_barDiff * _this.innerScrollVal,
						_current = _this.scrollingBase;

					// 範囲を超えた場合のボイン戻し
					if ( _current.y > _barDiff ) {
						_current.y = _barDiff;
						_this.css([$elm, $bar], {
							WebkitTransitionDuration       : "0.4s",
							WebkitTransitionTimingFunction : CUBICBEZIERBOUNCE
						});
						_this.setNext($elm, {
							y: _maxInnerTop
						});
					} else
					if ( 0 > _current.y ) {
						_current.y = 0;
						_this.css([$elm, $bar], {
							WebkitTransitionDuration       : "0.4s",
							WebkitTransitionTimingFunction : CUBICBEZIERBOUNCE
						});
						$bar.css("height", _this.scrollBarHeight);
						_this.setNext($elm, {
							y: 0
						});
					} else {
						_this.css([$elm, $bar], {
							WebkitTransitionDuration       : "0s",
							WebkitTransitionTimingFunction : CUBICBEZIER
						});
						$bar.stop(true, true).fadeOut(_opt.outSpeed);
					}
					$bar.css("height", _this.scrollBarHeight);
				};

			_this.css([$bar, $elm], transitionSetUp);

			$("a", $outer).each(function() {
				var $this = $(this),
					anchor = $this.get(0);

				anchor.addEventListener("touchend", function(e) {
					//$bar.stop(true, true).hide();
					$this.click();
					e.stopPropagation();
				}, true);
			});
			outer.addEventListener("touchstart", function(e) {
				if ( e.touches[1] ) return;
				var _t = e.touches[0],
					_current = this.scrollingBase,
					_nextInnerX = undefined,
					_nextInnerY = undefined;

				this.scrolling = false;

				// touchstart時のタイムスタンプ
				touchStartTime = +new Date;
				touching = true;
				touchSpeed = 0;

				_this.enteringCursor = true;
				touchStartPos = {
					x: _t.pageX,
					y: _t.pageY
				};
				e.stopPropagation();
				//e.preventDefault();
			}, false);
			outer.addEventListener("touchmove", function(e) {
				if ( e.touches[1] ) return;
				else if ( !touching ) return;
				var _t = e.touches[0],
					_diffY, _diffX,
					_barCurrent = _this.getCurrent($bar),
					_barTop, _barLeft,
					_current = _this.scrollingBase,
					_to = undefined;

				touchEndPosPrev = touchEndPos || touchStartPos;
				//touchEndPosPPrev = touchEndPosPrev;
				touchEndPos = {
					x: _t.pageX,
					y: _t.pageY
				};

				// 一度折り返した場合は、touchStartPosを折り返した地点に置き換える
				if ( touchEndPos.y > touchStartPos.y && touchEndPos.y < touchEndPosPrev.y
				  || touchEndPos.y < touchStartPos.y && touchEndPos.y > touchEndPosPrev.y ) {
					touchStartPos = touchEndPosPrev;
				}
				// 最後にtouchmoveしたタイムスタンプ
				touchMoveEndTime = +new Date;

				_diffY = (touchEndPosPrev.y - touchEndPos.y) * (2 / 5);
				_diffX = (touchEndPosPrev.x - touchEndPos.x) * (2 / 5);
				// 移動距離が気持ち短い方がなめらかにみえる
				_current.y = _current.y + _diffY;
				// 進む方向 down: true, up: false
				_to = _diffY > 0 ? true : false;

				_this.css([$elm, $bar], {
					WebkitTransitionDuration       : "0s",
					WebkitTransitionTimingFunction : CUBICBEZIER
				});
				_this.$bar.css({
					WebkitTransitionProperty: "all",
					height: _this.scrollBarHeight
				});

				// Y scrolling
				if ( !_this.setUp ) {
					$bar.stop(true, true).fadeIn(_opt.inSpeed);
					_this.setUpScrolling();
				}
				_this.innerScrolling(_to);
				// X scrolling
				if ( $barX ) {
					_barLeft = parseInt($barX.css("left"), 10) + _diffX;
					if ( !_this.setUpX ) {
						//$barX.stop(true, true).fadeIn(_opt.inSpeed);
						//$barX.show();
						_this.setUpScrollingX();
					}
					_this.innerScrollingX(_barLeft);
				}
				e.preventDefault();
			}, false);
			outer.addEventListener("touchend", function(e) {
				if ( e.touches[1] && touching ) return;
				var _diffY = (touchEndPos.y - touchStartPos.y), // タッチの移動距離
					_diffX = (touchEndPos.x - touchStartPos.x), // タッチの移動距離
					_stepY = undefined, // 慣性でバーが進む距離
					_stepX = undefined, // 慣性でバーが進む距離
					_nextY = undefined, // 慣性でバーが進んだ後
					_nextX = undefined, // 慣性でバーが進んだ後
					_nextInnerY = undefined, // 慣性でインナーが進んだ後
					_nextInnerX = undefined, // 慣性でインナーが進んだ後
					_barDiff = _this.outerHeight - _this.scrollBarHeight - _opt.scrollBarSpace*2,
					_barDiffX = _this.outerWidth - _this.scrollBarWidth,
					_maxInnerTop = -_barDiff * _this.innerScrollVal,
					_maxInnerLeft = -_barDiffX * _this.innerScrollValX,
					_duration = undefined,
					_to = _diffY < 0 ? true : false,
					_current = _this.scrollingBase;

				// touchendのタイムスタンプ
				touchEndTime = +new Date;

				// ひとつ手前のtouchEndPosとの差があまりない場合のみ
				// モーメンタムスクロール
				if ( _current.y > 0
				  && _current.y < _barDiff
				  && touchEndTime - touchMoveEndTime < SCROLLCANCELDURATION
				  && (Math.abs(touchEndPosPrev.y - touchEndPos.y) > 15
				  || Math.abs(touchEndPosPrev.x - touchEndPos.x) > 15) ) {

					// スクロールする余裕がある場合
					acceleration = touchEndTime - touchStartTime; // 加速度として使う
					// _diffY * a = 進む距離

					// スクロールする量と速度は
					// タッチしていた時間とタッチの距離による
					_stepY = -_diffY / 300 * acceleration; // 慣性でバーが進む距離
					_stepX = -_diffX / 300 * acceleration; // 慣性でバーが進む距離
					// 現在位置の更新
					_current.y = _current.y + _stepY;
					_current.x = _current.x + _stepX;
					// 現在位置からインナーの位置を決定する
					_nextInnerY = -_current.y * _this.innerScrollVal;
					_nextInnerX = -_current.x * _this.innerScrollValX;

					// スクロール速度はタッチしていた時間による
					_duration = 0.5 > acceleration / 400 ? acceleration / 400 : 0.5;
					_this.css([$elm, $bar], {
						WebkitTransitionDuration: _duration + "s"
					});

					_this.setNext($elm, {
						y: _nextInnerY > SCROLLBOUNCECAPACITY ? SCROLLBOUNCECAPACITY :
							_nextInnerY < _maxInnerTop - SCROLLBOUNCECAPACITY ? _maxInnerTop - SCROLLBOUNCECAPACITY : _nextInnerY,
						x: _nextInnerX
					});

					// バーが縮むやつ
					transioningFunc(function() {
						var __current = _this.getCurrent($elm);
						if ( __current.y > 0 ) {
							$bar.css({
								// 全体のパーセンテージから縮める
								height: _this.scrollBarHeight * (1 - (__current.y / 100)/3)
							});
						} else
						if ( __current.y < _maxInnerTop ) {
							$bar.css({
								// 全体のパーセンテージから縮める
								height: _this.scrollBarHeight * (1 - (-(__current.y - _maxInnerTop) / 100)/3)
							});
						}
					});

					// スクロールバーの最終地点
					// 一番上よりさらに上になった場合
					if ( _current.y < 0 ) {
						_this.setNext($bar, { y: 0 }, true, _to);
					} else
					// 一番下よりさらに下になった場合
					if ( _current.y >= _barDiff ) {
						_this.setNext($bar, { y: _barDiff }, true, _to);
						// 第4引数にtrueを指定するとbottomで
					// 上〜下の場合
					} else {
						_this.setNext($bar, { y: _current.y }, true, _to);
					}
				// モーメンタムスクロールなしで指を離したとき
				} else {
					// スクロールバーの最終地点
					// 一番上よりさらに上になった場合
					if ( _current.y < 0 ) {
						bounce();
					} else
					// 一番下よりさらに下になった場合
					if ( _current.y >= _barDiff ) {
						bounce();
					} else {
						$bar.stop(true, true).fadeOut(_opt.outSpeed);
					}
					// 上〜下の場合は特に何もしない
				}

				touching = false;
				touchStartPos = touchEndPos = 0;

				_this.enteringCursor = false;
				_this.setUp = false;
				_this.setUpX = false;
				_this.scrolling = false;
				e.preventDefault();
			}, false);

			$elm.get(0).addEventListener("webkitTransitionEnd", function() {
				_this.transitioning = false;
				bounce();
				$bar.css({
					WebkitTransitionProperty: "all"
				});
			}, false);
		}
	};

	/**
	 * m5ImgLoad
	 *
	 * @version      0.2
	 * @author       nori (norimania@gmail.com)
	 * @copyright    5509 (http://5509.me/)
	 * @license      The MIT License
	 * @link         https://github.com/5509/m5ImgLoad
	 *
	 * 2011-02-08 15:41
	 */
 	$.fn.m5ImgLoad = function(callback, interval) {
		var _img = $(this).get(0),
			newImg = new Image();

		newImg.src = _img.src;

		(function() {
			if ( newImg.complete ) {
				callback.call($(newImg));
				return;
			}
			setTimeout(arguments.callee, interval || 20);
		}());
		 return this;
	}

}(jQuery, this, this.document));