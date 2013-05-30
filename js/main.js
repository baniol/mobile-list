// MoSync onready
document.addEventListener("deviceready", appStart, true);

var appStart;

requirejs.config({
	baseUrl: 'js',
	paths: {
		tpl: 'lib/tpl'
	},

	shim: {
		'lib/iscroll-lite': {
			exports: 'iScroll'
		},
		'lib/lopers': {
			exports: 'Lopers'
		},
		'app': {
			deps: ['lib/iscroll-lite', 'lib/lopers']
		}
	}
});

require(['app'],

appStart = function(App) {
	window.mUI = new App();
});