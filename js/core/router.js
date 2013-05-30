define(['config', 'core/tool'], function(config, Tool) {

	// "use strict";

	var tool,

		Router = function() {
			tool = new Tool();
			tool.trimHash();
		};

	Router.prototype._hashCheck = function() {
		var rawHash = window.location.hash.replace('#', '');
		this._splitHash(rawHash);
	};

	Router.prototype.go = function(route) {
		var hash = window.location.hash;
		route = (route === '') ? config.defaultRoute : route;
		window.location.hash = '#' + route;
		this._hashCheck();
		// in case off #add or #edit are present in the hash - block loadController
		if (!hash.match(/#add/) && !hash.match(/#edit/))
			this._loadController(this.hash);
	};

	Router.prototype._splitHash = function(hash) {
		var p = hash.split('/');
		this.hash = p[0];
		p.splice(0, 1);
		this.args = p;
	};

	Router.prototype.getArgs = function() {
		this._hashCheck();
		return this.args;
	};

	/**
	 * Loads controller
	 */
	Router.prototype._loadController = function(controller) {
		require(['controllers/' + controller + 'Controller'], function(cont) {
			cont.start();
		});
	};

	return Router;

});