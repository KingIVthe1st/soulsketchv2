(function () {
	function hidePreloader() {
		try {
			var preloader = document.querySelector('.preloader');
			if (preloader) {
				preloader.style.opacity = '0';
				preloader.style.pointerEvents = 'none';
				// Remove from layout after fade
				setTimeout(function () {
					if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
				}, 300);
			}
		} catch (e) {
			// No-op
		}
	}

	if (window.jQuery) {
		jQuery(function () {
			// DOM ready
			hidePreloader();
		});
		jQuery(window).on('load', hidePreloader);
	} else {
		document.addEventListener('DOMContentLoaded', hidePreloader);
		window.addEventListener('load', hidePreloader);
	}
})();


