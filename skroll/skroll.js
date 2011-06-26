/**
 * Skroll
 *
 * @version      0.1
 * @author       nori (norimania@gmail.com)
 * @copyright    5509 (http://5509.me/)
 * @license      The MIT License
 * @link         https://github.com/5509/skroll
 *
 * 2011-06-26 20:40
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
		this.$elm = elm;
		this.$outer = $("<div class='scrollOuter'></div>");
		this.$bar = $("<div class='scrollbar'></div>").hide();
		this.$images = $("img", elm);
		this.innerHeight = elm.get(0).offsetHeight;
		this.enteringCursor = false;
		this.dragging = false;
		this.scrolling = false;
		this.dragTop = 0;
		this.dragTo = 0;
		this.id = ".scrl" + randomNumber(); // イベント識別子
		this.mousedown = "mousedown" + this.id;
		this.mousemove = "mousemove" + this.id;
		this.mouseup = "mouseup" + this.id;
		this.outerHeight = undefined;
		this.diff = undefined;
		this.scrollBarHeight = undefined;
		this.innerScrollVal = undefined;
		this.setUp = undefined;
		this.imgLoaded = 0;
		this.imgLength = 0;
		// Option
		this.option = $.extend({
			margin         : 0,
			width          : parseInt(elm.css("width"), 10),
			height         : parseInt(elm.css("height"), 10),
			opacity        : .5,
			inSpeed        : 150,
			outSpeed       : 300,
			delayTime      : 200,
			scrollBarSpace : 0,
			scrollBarHide  : true
		}, option);

		// コンテンツの高さがアウターよりも大きければという処理を入れたほうがよさそう
		elm.css("height", "auto");
		this.innerHeight = parseInt(elm.css("height"), 10);

		// Init
		this.init();
	}
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
			_this.dragTop = e ? e.clientY - _this.dragTo : _this.dragTo;
			_this.scrolling = _this.dragging ? false : true;
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
		init: function() {
			var _this = this,
				_barTop = undefined,
				_opt = this.option,
				$elm = this.$elm,
				$bar = this.$bar,
				$images = this.$images,
				$outer = this.$outer;

			$outer
				.bind("mouseover", function() {
					_this.enteringCursor = true;
					$bar.stop(true, true).fadeIn(_opt.inSpeed);
				})
				.bind("mouseleave", function() {
					_this.enteringCursor = false;
					if ( _this.dragging ) {
						return false;
					}
					_this.setUp = false;
					_this.scrolling = false;
					if ( _opt.scrollBarHide ) {
						$bar.fadeOut(_opt.outSpeed);
					}
				})
				.bind(mousewheel, function(e) {
					// detailはwheelDeltaと正負が逆になり
					// 値もwheelDeltaの1/10
					var _delta = Math.round(e.wheelDelta/10) || -e.detail,
						_barTop = parseInt($bar.css("top"), 10) - _delta;
					if ( !_this.setUp ) _this.settingUpScroll();
					_this.innerScrolling(_barTop);
					e.preventDefault();
				});

			$elm
				.css({
					margin   : 0,
					width    : parseInt($elm.css("width"), 10) - _opt.scrollBarSpace,
					height   : "auto",
					overflow : "auto",
					position : "relative"
				})
				.wrap(
					$outer
						.css({
							margin       : _opt.margin,
							paddingRight : _opt.scrollBarSpace,
							width        : parseInt(_opt.width,  10) - _opt.scrollBarSpace,
							height       : parseInt(_opt.height, 10),
							position     : "relative",
							overflow     : "hidden"
						})
				)
				.parent()
				.append(
					$bar
						.css({
							height  : Math.pow(parseInt(_opt.height, 10), 2) / _this.innerHeight,
							opacity : _opt.opacity
						})
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
					} else {
						$bar.fadeIn(_opt.inSpeed);
					}
				}
			});
		}
	}

	// イベントにIDをふるためのもの
	function randomNumber() {
		return Math.floor(Math.random() * 1000) * 5;
	}

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