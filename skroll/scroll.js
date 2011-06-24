;(function($) {

	$.fn.scroll = function(option) {
		var $this = this, // スクロールする要素
			$body = $("body"),
			$outer = $("<div class='scrollOuter'></div>"),
			$bar = $("<div class='scrollbar'></div>").hide(),
			innerHeight = $this.get(0).offsetHeight,
			enteringCursor = false,
			dragging = false,
			scrolling = false,
			dragTop = null,
			dragTo = 0,
			mobile = "ontouchstart" in window,
			id = ".scrl" + randomNumber(), // イベントをunbindするためのID
			mousedown = mobile ? "touchstart" + id : "mousedown" + id,
			mousemove = mobile ? "touchmove" + id : "mousemove" + id,
			mouseup = mobile ? "touchend" + id : "mouseup" + id,
			mousewheel = "onmousewheel" in window ? "mousewheel" : "DOMMouseScroll",
			outerHeight, diff, scrollBarHeight, innerScrollVal, setUp,
			$images = $("img", this),
			imgLoaded = 0,
			imgLength = 0;

		console.log(mobile);
		console.log(mousedown + " " + mousemove + " " + mouseup)

		option = $.extend({
			margin: "2em auto 0", // なんかテキトーに
			width: 250,
			height: 300
		}, option);

		$outer
			.hover(function() {
				enteringCursor = true;
				$bar.fadeIn(150);
			}, function() {
				enteringCursor = false;
				if ( dragging ) {
					return false;
				}
				setUp = false;
				scrolling = false;
				$bar.fadeOut(300);
			})
			.bind(mousewheel, function(e) {
//				console.log("wheelDelta: " + e.wheelDelta);
//				console.log("detail: " + e.detail);
				// detailはwheelDeltaと正負が逆になり
				// 値もwheelDeltaの1/10
				var _delta = e.wheelDelta/10 || -e.detail,
					_barTop = parseInt($bar.css("top")) - _delta;

				console.log(_delta);

				if ( !setUp ) settingUpScroll();
				//console.log(_barTop);
				innerScrolling(_barTop);
				e.preventDefault();
			});

		$this
			.wrap(
				$outer
					.css({
						margin   : option.margin,
						width    : option.width,
						height   : option.height,
						position : "relative",
						overflow : "hidden"
					})
			)
			.parent()
			.append(
				$bar
					.css({
						height: (option.height / innerHeight * option.height)
					})
			);

//		if ( $images.length ) {
//			imgLength = $images.length;
//			$images.each(function() {
//				$(this).m5ImgLoad(function() {
//					imgLoaded = imgLoaded + 1;
//				})
//			});
//
//			(function() {
//				if ( imgLoaded === imgLength ) {
//					innerHeight = $this.get(0).offsetHeight;
//					return;
//				}
//				setTimeout(arguments.callee, 30);
//			}());
//		}

		function settingUpScroll(e) {
			if ( !setUp ) {
				setUp = true;
			} else {
				return;
			}
			outerHeight = $outer.height();
			diff = innerHeight - outerHeight;
			scrollBarHeight = $bar.height();
			innerScrollVal = diff / (outerHeight - scrollBarHeight); // 補正量はコンテンツの量によって増減したほうがよさそう
			dragTop = e ? e.clientY - dragTo : dragTo;
			scrolling = true;
			$bar.css("cursor", "move");
//			console.log(outerHeight - scrollBarHeight + " : " + diff)
//			console.log(innerHeight)
		}
		function innerScrolling(_barTop) {
			var _innerTop = _barTop * innerScrollVal, // インナーのトップ位置
				_innerScrolling = _barTop >= outerHeight - scrollBarHeight, // ドラッグがスクロール許容量を超えてしまったときにtrue
				_maxInnerTop = -(outerHeight - scrollBarHeight) * innerScrollVal; // インナーの最大トップ位置

			if ( !dragging && !scrolling ) {
				dragTo = parseInt($bar.css("top"));
				return;
			}
//			console.log(diff);
//			console.log(outerHeight);
//			console.log(scrollBarHeight)
//			console.log((outerHeight - scrollBarHeight) * (innerHeight - outerHeight) / outerHeight * (1 - outerHeight / innerHeight))

			//if ( _barTop >= 0 && !_innerScrolling ) console.log("scrollbarHeight: " + scrollBarHeight + ", barTop: " + _barTop)
			$bar.css({
				top: _barTop <= 0
						? 0 : _innerScrolling
							? outerHeight - scrollBarHeight : _barTop
			});
			if ( !_innerScrolling ) {
				$this.css({
					top: _innerTop <= 0 ? 0 : -_innerTop
				});
			// スクロールバーが一番下まで移動したらコンテンツも一番下に
			} else {
				$this.css({
					top: _maxInnerTop
				});
			}
		}

		$bar.bind(mousedown, function(e) {
			console.log("mousedown")
			var _barTop;
			dragging = true;
			scrolling = true;
			settingUpScroll(e);
			$(document)
				.bind(mousemove, function(e) {
					_barTop = e.clientY - dragTop;
					// ドラッグによるスクロールバーのトップ位置を把握するための値
					innerScrolling(_barTop);
					return false;
				})
				.bind(mouseup, function() {
					dragging = false;
					scrolling = false;
					setUp = false;
					$bar.css("cursor", "pointer");
					$(document).unbind(mousemove, mouseup);
					if ( !enteringCursor ) {
						$bar.fadeOut(300);
					}
				});
			return false;
		})

		if ( mobile ) {
			$bar.fadeIn(150);
		} else {
			$bar.fadeIn(150).delay(200).fadeOut(300);
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
	 * 2010-02-08 15:41
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
		})();
	}

}(jQuery));