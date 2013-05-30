define(function() {

	var System = function() {
		this.triggerEvent = 'fastClick';
		this.ios = !! navigator.userAgent.match(/(iPad|iPhone|iPod)/i);
		this.test = !! window.location.href.match(/\/test\//);
	};

	return System;
});