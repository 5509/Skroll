/**
 * Skroll
 *
 * @version      0.56
 * @author       nori (norimania@gmail.com)
 * @copyright    5509 (http://5509.me/)
 * @license      The MIT License
 * @link         https://github.com/5509/skroll
 *
 * 2011-07-12 12:27
 */
;(function($, window, document, undefined) {

	// CONST
	var MOBILE = "ontouchstart" in window,
		MOUSEWHEEL = "onmousewheel" in document ? "mousewheel" : "DOMMouseScroll",
		MATRIX = "matrix(1,0,0,1,0,0)",
		$document = $(document),
		$html = $("html");

	// Bridge
	$.fn.Skroll = function(option) {
		new Skroll(this, option);
		return this;
	};

	// Skroll
	var Skroll = function(elm, option) {
		var _borderRadius = undefined;
		// Option
		this.option = $.extend({
			margin            : 0,
			width             : parseInt(elm.css("width"), 10),
			height            : parseInt(elm.css("height"), 10),
			inSpeed           : 50,
			outSpeed          : 200,
			delayTime         : 200,
			scrollBarBorder   : 1,
			scrollBarWidth    : 6,
			scrollBarHeight   : 6,
			scrollBarSpace    : 3,
			scrollBarColor    : "#000",
			opacity           : .5,
			cursor            : {
				grab     : "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAACVBMVEX///8AAAD///9+749PAAAAA3RSTlP//wDXyg1BAAAASUlEQVR42qXNQQqAQAxD0cT7H3qQj/MVKi4MXb3SJscUtX0o0qTtTZHknBetHyCWHTTo1UVUDnfUqLtNUuVJRVRWYRGVv3XKf13yEgJFXOqs0wAAAABJRU5ErkJggg==') 6 6, default",
				grabbing : "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAMAAACeyVWkAAAACVBMVEX///8AAAD///9+749PAAAAA3RSTlP//wDXyg1BAAAAOklEQVR42sXQMQ4AIAxCUb73P7SDDNI03YyE6S2k1eryReE0FMkl1EFYg2+lU6RZc61qMHkbo7795AZ/8gKwxSMcDgAAAABJRU5ErkJggg==') 6 6, default"
			},
			scrollCancel      : 80,
			cubicBezier       : "cubic-bezier(0,1,0.73,0.95)",
			cubicBezierBounce : "cubic-bezier(0.11,0.74,0.15,0.80)",
			scrollBarHide     : true
		}, option);

		// 古いブラウザはcusorのdataURLは無視する
		if ( !$.support.opacity ) {
			this.option.cursor = {
				grab: "move",
				grabbing: "move"
			}
		}

		_borderRadius = (this.option.scrollBarWidth + this.option.scrollBarBorder * 2) / 2 + "px";

		this.$elm = elm;
		this.$outer = $("<div class='scrollOuter'></div>");
		this.$bar = $("<div class='scrollbar'></div>").css({
			position           : "absolute",
			borderRadius       : _borderRadius,
			WebkitBorderRadius : _borderRadius,
			MozBorderRadius    : _borderRadius,
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
		this.innerWidth = elm.get(0).offsetWidth,
		this.id = ".skrl" + (Math.floor(Math.random() * 1000) * 5);
		// イベント識別子
		this.mousedown = "mousedown" + this.id;
		this.mousemove = "mousemove" + this.id;
		this.mouseup = "mouseup" + this.id;
		this.outerHeight = undefined;
		this.diff = undefined;
		this.scrollBarWidth = undefined;
		this.scrollBarHeight = undefined;
		this.innerScrollVal = undefined;
		this.setUp = undefined;
		this.imgLoaded = 0;
		this.imgLength = 0;
		this.sideScroll = false;

		// コンテンツの高さがアウターよりも大きければという処理を入れたほうがよさそう
		elm.css("height", "auto");
		this.innerHeight = elm.get(0).offsetHeight;
		// Init
		this.setUpSkroll();
		if ( !MOBILE ) {
			this.eventBind();
		// Mobile init
		} else {
			this.evnetBindMobile();
		}

		if ( this.option.scrollBarHide ) {
			this.$bar
				.fadeIn(this.option.inSpeed)
				.delay(this.option.delayTime)
				.fadeOut(this.option.outSpeed*2);
		} else {
			this.$bar.fadeIn(this.option.inSpeed);
		}
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
		innerScrolling: function(_to) {
			var _this = this,
				_opt = _this.option,
				_current = this.scrollingBase,
				_next = {},
				_innerNext = {},
				_barDiff = _this.outerHeight - _this.scrollBarHeight - _opt.scrollBarSpace,
				_innerScrolling = _current.y >= _barDiff,
				_maxInnerTop = -_barDiff * _this.innerScrollVal,
				_scrollBounceCapacity = _this.outerHeight*9/10,
				_scrollBarHeight = undefined,
				$bar = _this.$bar,
				$elm = _this.$elm;

			_next.y = _current.y <= _opt.scrollBarSpace
				? _opt.scrollBarSpace : _innerScrolling
					? _barDiff : _current.y;

			if ( MOBILE ) {
				_innerNext.y = _current.y * _this.innerScrollVal <= -_scrollBounceCapacity
					? _scrollBounceCapacity :
						-_current.y * _this.innerScrollVal <= _maxInnerTop - _scrollBounceCapacity
							? _maxInnerTop - _scrollBounceCapacity
								: -_current.y * _this.innerScrollVal;

				if ( _innerNext.y > 0 ) {
					_scrollBarHeight = _this.scrollBarHeight * (1 - (_innerNext.y / 100)/2);
					$bar.css({
						height: _scrollBarHeight < 10 ?
							10 : _scrollBarHeight
					});
				} else
				if ( _innerNext.y < _maxInnerTop ) {
					_scrollBarHeight = _this.scrollBarHeight * (1 - (-(_innerNext.y - _maxInnerTop) / 100)/2);
					$bar.css({
						height: _scrollBarHeight < 10 ?
							10 : _scrollBarHeight
					});
				}

				_this.setNext($bar, {
					y: _next.y <= 0 ? 0 : _next.y
				}, true, _innerNext.y > 0 ? false : _innerNext.y < _maxInnerTop ? true : _to);
				// 0を超えたときは常にtop、_maxInnerTop以下のときは常にbottom
			} else {
				if ( _current.y > _barDiff ) {
					_current.y = _barDiff;
				} else
				if ( 0 > _current.y ) {
					_current.y = 0
				}
				_innerNext.y = _current.y * _this.innerScrollVal <= 0
					? 0 :
						-_current.y * _this.innerScrollVal <= _maxInnerTop
							? _maxInnerTop
								: -_current.y * _this.innerScrollVal;
				_this.setNext($bar, {
					y: _next.y
				});
			}
			_this.setNext($elm, {
				y: _innerNext.y
			});
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
							right   : _opt.scrollBarSpace,
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
		transioningFunc: function(callback) {
			var _this = this;
			this.transitioning = true;
			(function() {
				if ( !_this.transitioning ) return;
				callback();
				setTimeout(arguments.callee, 10);
			}());
		},
		bounceEffect: function($bar, $elm) {
			var _this = this,
				_opt = this.option,
				_barDiff = _this.outerHeight - _this.scrollBarHeight - _opt.scrollBarSpace*2,
				_maxInnerTop = -_barDiff * _this.innerScrollVal,
				_current = _this.scrollingBase;

			// 範囲を超えた場合のボイン戻し
			if ( _current.y > _barDiff ) {
				_current.y = _barDiff;
				_this.css([$elm, $bar], {
					WebkitTransitionDuration: "0.4s",
					WebkitTransitionTimingFunction: _opt.cubicBezierBounce
				});
				_this.setNext($elm, {
					y: _maxInnerTop
				});
			} else
			if ( 0 > _current.y ) {
				_current.y = 0;
				_this.css([$elm, $bar], {
					WebkitTransitionDuration: "0.4s",
					WebkitTransitionTimingFunction: _opt.cubicBezierBounce
				});
				$bar.css("height", _this.scrollBarHeight);
				_this.setNext($elm, {
					y: 0
				});
			} else {
				_this.css([$elm, $bar], {
					WebkitTransitionDuration: "0s",
					WebkitTransitionTimingFunction: _opt.cubicBezier
				});
				$bar
					.stop(true, true)
					.delay(_opt.delayTime)
					.fadeOut(_opt.outSpeed);
			}
			$bar.css("height", _this.scrollBarHeight);
		},
		eventBind: function() {
			var _this = this,
				_opt = this.option,
				$bar = this.$bar,
				$outer = this.$outer;

			$outer
				.bind("mouseover", function() {
					_this.enteringCursor = true;
					$bar.stop(true, true).fadeIn(_opt.inSpeed);
				})
				.bind("mouseleave", function() {
					_this.enteringCursor = false;
					if ( _this.dragging || _this.draggingX ) {
						return false;
					}
					_this.setUp = false;
					_this.scrolling = false;
					if ( !_opt.scrollBarHide ) return;
					$bar.fadeOut(_opt.outSpeed);
				})
				.bind(MOUSEWHEEL, function(e) {
					e = e || window.event;
					// detailはwheelDeltaと正負が逆になり
					// 値もwheelDeltaの1/10
					var _delta = Math.round(e.wheelDelta/10) || -e.detail,
						_current = _this.scrollingBase;

					_current.y = _this.scrollingBase.y - _delta;
					if ( !_this.setUp ) _this.setUpScrolling();
					_this.innerScrolling();
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
		},
		evnetBindMobile: function() {
			var _this = this,
				_opt = this.option,
				$bar = this.$bar,
				$outer = this.$outer,
				$elm = this.$elm,
				outer = $outer.get(0),
				touching = false,
				touchStartPos = undefined,
				touchEndPosPrev = undefined,
				touchEndPos = undefined,
				acceleration = undefined,
				touchStartTime = undefined,
				touchMoveEndTime = undefined,
				touchEndTime = undefined,
				touchSpeed = 0;

			_this.css([$bar, $elm], {
				WebkitTransitionProperty       : "all",
				WebkitTransitionTimingFunction : _opt.cubicBezier,
				// GPUレンダリングをONにしておく
				WebkitTransformStyle           : "preserve-3d",
				WebkitTransitionDuration       : "0s"
			});

			$("a", $outer).each(function() {
				var $this = $(this),
					anchor = $this.get(0);

				anchor.addEventListener("touchend", function(e) {
					$this.click();
					e.stopPropagation();
				}, true);
			});
			outer.addEventListener("touchstart", function(e) {
				if ( e.touches[1] ) return;
				var _t = e.touches[0];

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
			}, true);
			outer.addEventListener("touchmove", function(e) {
				if ( e.touches[1] ) return;
				else if ( !touching ) return;
				var _t = e.touches[0],
					_diffY = undefined,
					_current = _this.scrollingBase,
					_to = undefined;

				touchEndPosPrev = touchEndPos || touchStartPos;
				touchEndPos = {
					y: _t.pageY
				};

				// 一度折り返した場合は、touchStartPosを折り返した地点に置き換える
				if ( touchEndPos.y > touchStartPos.y && touchEndPos.y < touchEndPosPrev.y
				  || touchEndPos.y < touchStartPos.y && touchEndPos.y > touchEndPosPrev.y ) {
					touchStartPos = touchEndPosPrev;
				}
				// 最後にtouchmoveしたタイムスタンプ
				touchMoveEndTime = +new Date;

				_diffY = (touchEndPosPrev.y - touchEndPos.y) * (1 / 5);
				// 移動距離が気持ち短い方がなめらかにみえる
				_current.y = _current.y + _diffY;
				// 進む方向 down: true, up: false
				_to = _diffY > 0;

				_this.css([$elm, $bar], {
					WebkitTransitionDuration       : "0s",
					WebkitTransitionTimingFunction : _opt.cubicBezier
				});
				_this.$bar.css({
					WebkitTransitionProperty: "all",
					height: _this.scrollBarHeight
				});

				// vertical scrolling
				if ( !_this.setUp ) {
					$bar.stop(true, true).fadeIn(_opt.inSpeed);
					_this.setUpScrolling();
				}
				_this.innerScrolling(_to);
				e.preventDefault();
			}, true);
			outer.addEventListener("touchend", function(e) {
				if ( e.touches[1] && touching ) return;
				if ( !touchEndPos ) return;
				var _diffY = (touchEndPos.y - touchStartPos.y), // タッチの移動距離
					_stepY = undefined, // 慣性でバーが進む距離
					_nextInnerY = undefined, // 慣性でインナーが進んだ後
					_barDiff = _this.outerHeight - _this.scrollBarHeight - _opt.scrollBarSpace,
					_maxInnerTop = -_barDiff * _this.innerScrollVal,
					_scrollBounceCapacity = _this.outerHeight/5,
					_duration = undefined,
					// 進む方向 down: false, up: true
					// moveのときとは逆
					_to = _diffY < 0,
					_current = _this.scrollingBase;

				// touchendのタイムスタンプ
				touchEndTime = +new Date;

				// モーメンタムスクロール
				if ( _current.y > 0 // 指を離したときに最低値を下回っていなければ
				  && _current.y < _barDiff // 指を離したときに最大値を上回っていなければ
				  // 最後のtouchmoveとひとつ前のtouchmoveのタイムスタンプの差を確認する
				  && touchEndTime - touchMoveEndTime < _opt.scrollCancel
				  // ひとつ手前のtouchEndPosとの差があまりない場合のみ
				  && (Math.abs(touchEndPosPrev.y - touchEndPos.y) > 15
				  || Math.abs(touchEndPosPrev.x - touchEndPos.x) > 15) ) {

					// スクロールする余裕がある場合
					acceleration = touchEndTime - touchStartTime; // 加速度として使う

					// スクロールする量と速度は
					// タッチしていた時間とタッチの距離による
					_stepY = -_diffY / 300 * acceleration; // 慣性でバーが進む距離
					// 現在位置の更新
					_current.y = _current.y + _stepY;
					// 現在位置からインナーの位置を決定する
					_nextInnerY = -_current.y * _this.innerScrollVal;

					// スクロール速度はタッチしていた時間による
					_duration = 0.5 > acceleration / 400 ? acceleration / 400 : 0.5;
					_this.css([$elm, $bar], {
						WebkitTransitionDuration: _duration + "s"
					});

					_this.setNext($elm, {
						y: _nextInnerY > _scrollBounceCapacity ? _scrollBounceCapacity :
							_nextInnerY < _maxInnerTop - _scrollBounceCapacity ? _maxInnerTop - _scrollBounceCapacity : _nextInnerY
					});

					// バーが縮むやつ
					// ここはbounceのtransitionが呼ばれているときだけ
					_this.transioningFunc(function() {
						var __current = _this.getCurrent($elm),
							__scrollBarHeight = undefined;
						if ( __current.y > 0 ) {
							__scrollBarHeight = _this.scrollBarHeight * (1 - (__current.y / 100)/2);
						} else
						if ( __current.y < _maxInnerTop ) {
							__scrollBarHeight = _this.scrollBarHeight * (1 - (-(__current.y - _maxInnerTop) / 100)/2);
						}
						$bar.css({
							height: __scrollBarHeight < 10 ?
								10 : __scrollBarHeight
						});
					});

					// スクロールバーの最終地点
					_this.setNext($bar, {
						// 一番上よりさらに上になった場合
						y: _current.y < _opt.scrollBarSpace ? _opt.scrollBarSpace :
							// 一番下よりさらに下になった場合
							_current.y >= _barDiff ? _barDiff :
								// 上〜下の場合
								_current.y
					}, true, _to);
					
				// モーメンタムスクロールなしで指を離したとき
				} else {
					// スクロールバーの最終地点
					// 一番上（下）よりさらに上（上）になった場合
					if ( _current.y < 0
					  || _current.y >= _barDiff ) {
						_this.bounceEffect($bar, $elm);
					} else {
						$bar
							.stop(true, true)
							.delay(_opt.delayTime)
							.fadeOut(_opt.outSpeed);
					}
					// 上〜下の場合は何もしない
				}

				touching = false;
				touchStartPos = touchEndPos = 0;

				_this.enteringCursor = false;
				_this.setUp = false;
				_this.scrolling = false;
				e.preventDefault();
			}, true);

			$elm.get(0).addEventListener("webkitTransitionEnd", function() {
				_this.transitioning = false;
				_this.bounceEffect($bar, $elm);
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
	};

}(jQuery, this, this.document));