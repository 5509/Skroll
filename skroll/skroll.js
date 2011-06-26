/**
 * Skroll
 *
 * @version      0.2
 * @author       nori (norimania@gmail.com)
 * @copyright    5509 (http://5509.me/)
 * @license      The MIT License
 * @link         https://github.com/5509/skroll
 *
 * 2011-06-27 01:37
 */
/*
 * MEMO
 * 基本縦のスクロールとして使う
 * 横スクロールはオプションで明示的に狭い幅を与えた場合に有効
 */
;(function($, window, document, undefined) {

	// Bridge
	$.fn.skroll = function(option) {
		option = $.extend({
			sync: false
		}, option);

		// Syncオプションが有効なときはスクロールを同期する
		if ( option.sync ) {
			new Skroll(this, option);
		// 無効時はそれぞれスクロールを有効にする
		} else {
			$(this).each(function() {
				new Skroll($(this), option);
			});
		}
		return this;
	}

	// Global
	var mobile = "ontouchstart" in window,
		mousewheel = "onmousewheel" in window ? "mousewheel" : "DOMMouseScroll",
		$document = $(document);

	// Skroll
	var Skroll = function(elm, option) {
		// Option
		this.option = $.extend({
			margin          : 0,
			width           : parseInt(elm.css("width"), 10),
			height          : parseInt(elm.css("height"), 10),
			inSpeed         : 150,
			outSpeed        : 300,
			delayTime       : 200,
			scrollBarWidth  : 10,
			scrollBarHeight : 10,
			scrollBarSpace  : 0,
			scrollBarColor  : "#000",
			opacity         : .5,
			scrollBarHide   : true,
			scrollX         : false
		}, option);

		this.$elm = elm;
		this.$outer = $("<div class='scrollOuter'></div>");
		this.$bar = $("<div class='scrollbar'></div>").css({
			position: "absolute",
			borderRadius: this.option.scrollBarWidth/2 + "px",
			WebKitBorderRadius: this.option.scrollBarWidth/2 + "px",
			MozBorderRadius: this.option.scrollBarWidth/2 + "px",
			MsBorderRadius: this.option.scrollBarWidth/2 + "px",
			cursor: "move",
			backgroundColor: this.option.scrollBarColor
		}).hide();
		this.$images = $("img", elm);
		this.enteringCursor = false;
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
		this.init();
	};
	Skroll.prototype = {
		settingUpScroll: function(e) {
			var _this = this,
				$outer = this.$outer,
				$bar = this.$bar;

			if ( !_this.setUp ) {
				_this.setUp = true;
			} else {
				return;
			}
			_this.outerHeight = $outer.height();
			_this.diff = _this.innerHeight - _this.outerHeight;
			_this.scrollBarHeight = $bar.height();
			_this.innerScrollVal = _this.diff / (_this.outerHeight - _this.scrollBarHeight);
			_this.dragTop = e ? e.clientY : 0;
			_this.scrolling = _this.dragging ? false : true;
		},
		settingUpScrollX: function(e) {
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
		innerScrolling: function(_barTop) {
			var _this = this,
				_innerTop = _barTop * _this.innerScrollVal,
				// ↑インナーのトップ位置
				_innerScrolling = _barTop >= _this.outerHeight - _this.scrollBarHeight,
				// ↑ドラッグがスクロール許容量を超えてしまったときにtrue
				_maxInnerTop = -(_this.outerHeight - _this.scrollBarHeight) * _this.innerScrollVal,
				// ↑インナーの最大トップ位置
				$bar = _this.$bar,
				$elm = _this.$elm;

			$bar.css({
				top: _barTop <= 0
						? 0 : _innerScrolling
							? _this.outerHeight - _this.scrollBarHeight : _barTop
			});
			if ( !_innerScrolling ) {
				$elm.css({
					top: _innerTop <= 0 ? 0 : -_innerTop
				});
			// スクロールバーが一番下まで移動したらコンテンツも一番下に
			} else {
				$elm.css({
					top: _maxInnerTop
				});
			}
		},
		innerScrollingX: function(_barLeft) {
			var _this = this,
				_innerLeft = _barLeft * _this.innerScrollValX,
				// ↑インナーのレフト位置
				_innerScrolling = _barLeft >= _this.outerWidth - _this.scrollBarWidth,
				// ↑ドラッグがスクロール許容量を超えてしまったときにtrue
				_maxInnerLeft = -(_this.outerWidth - _this.scrollBarWidth) * _this.innerScrollValX,
				// ↑インナーの最大レフト位置
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
			// スクロールバーが一番下まで移動したらコンテンツも一番下に
			} else {
				$elm.css({
					left: _maxInnerLeft
				});
			}
		},
		init: function() {
			var _this = this,
				_barTop = undefined,
				_barLeft = undefined,
				_opt = this.option,
				$elm = this.$elm,
				$bar = this.$bar,
				$images = this.$images,
				$outer = this.$outer,
				$barX = this.$barX ? this.$barX : undefined;

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
				.bind(mousewheel, function(e) {
//					console.log(e);
					// detailはwheelDeltaと正負が逆になり
					// 値もwheelDeltaの1/10
					var _delta = Math.round(e.wheelDelta/10) || -e.detail,
						_barTop = parseInt($bar.css("top"), 10) - _delta,
						_barLeft;

					console.log("delta: " + _delta);
					console.log(e);
					//console.log("Y: " + e.clientY);
					//console.log("X: " + e.clientX);

					if ( !_opt.scrollX ) {
						if ( !_this.setUp ) _this.settingUpScroll();
						_this.innerScrolling(_barTop);
					} else {
						_barLeft = parseInt($barX.css("left"), 10) - _delta;
						if ( !_this.setUpX ) _this.settingUpScrollX();
						_this.innerScrollingX(_barLeft);
					}
					e.preventDefault();
					// MacのTrackpadとマウスのホイール横スクロールは
					// イベントでは取れないかも
				});

			$elm
				.css({
					margin   : 0,
					width    : _this.sideScroll ?
								parseInt($elm.css("width"), 10)
								: parseInt($elm.css("width"), 10) - _opt.scrollBarSpace,
					height   : "auto",
					overflow : "auto",
					position : "relative"
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
							overflow      : "hidden"
						})
				)
				.parent()
				.append(
					$bar
						.css({
							width   : _opt.scrollBarWidth,
							height  : Math.pow(parseInt(_opt.height, 10), 2) / _this.innerHeight,
							top     : 0,
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

			$bar.bind(_this.mousedown, function(e) {
				_barTop = parseInt($bar.css("top"), 10);
				this.dragTop = e.clientY;
				_this.setUp = false;
				_this.dragging = true;
				_this.scrolling = false;
				_this.settingUpScroll(e);

				$document
					.bind(_this.mousemove, function(e) {
						if ( _this.dragging ) {
							_barTop = _barTop + (e.clientY - _this.dragTop);
							_this.dragTop = e.clientY;
							_this.innerScrolling(_barTop);
						}
						return false;
					})
					.bind(_this.mouseup, function() {
						_this.dragging = false;
						_this.setUp = false;
						$document.unbind(_this.mousemove, _this.mouseup);
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
					_this.settingUpScrollX(e);

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

			// 他のコンテンツもロードが終わってから
			// スクロールバーをチラ見せする
			$(window).load(function() {
				if ( mobile ) {
					$bar.fadeIn(_opt.inSpeed);
				} else {
					if ( _opt.scrollBarHide ) {
						$bar
							.fadeIn(_opt.inSpeed)
							.delay(_opt.delayTime)
							.fadeOut(_opt.outSpeed);

						if ( !$barX ) return false;
						$barX
							.fadeIn(_opt.inSpeed)
							.delay(_opt.delayTime)
							.fadeOut(_opt.outSpeed);
					} else {
						$bar.fadeIn(_opt.inSpeed);
						if ( !barX ) return false;
						$barX.fadeIn(_opt.inSpeed);
					}
				}
			});
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