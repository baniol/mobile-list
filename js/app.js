/**
 * Main / starter module
 * @module app
 **/
define([
		'config',
		'core/router',
		'models/mainModel',
		'core/ui'
],

function(config,
		Router,
		Model,
		UI
) {

	/**
	 * Constructor for the application
	 * refers to the first controller
	 * inits db connection
	 **/
	var App = function() {
		var self = this;

		// shared properties declaratoin
		this.router = new Router();
		this.model = new Model();
		this.ui = new UI();
		this.config = config;

		window.addEventListener('hashchange', function() {
			self.router._hashCheck();
			self.router.go(window.location.hash.replace('#', ''));
		}, false);

		// @todo code duplication
		this.router.go(window.location.hash.replace('#', ''));
		this._bindEvents();
	};

	/**
	 * Binds general application events
	 * exit app
	 **/
	App.prototype._bindEvents = function() {
		var self = this;
		// exit app
		$(document).off('backbutton');
		$(document).on('backbutton', function() {
			self._exitApp();
		});
	};

	/**
	 * Exits app on button back
	 *
	 **/
	App.prototype._exitApp = function() {
		ui.confirm('Are yout sure to exit the application?', function() {
			mosync.app.exit();
		});
	};

	return App;

});