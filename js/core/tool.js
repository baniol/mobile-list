define(function() {

	var Tool = function() {
		// console.log(window.mUI);
	};

	/**
	 * Removes #add & #edit from the hash string
	 * @method trimHash
	 **/
	Tool.prototype.trimHash = function() {
		var href = window.location.hash;
		setTimeout(function() {
			window.location.hash = href.replace(/#add/g, '').replace(/#edit/g, '');
		}, 200);
	};

	return Tool;

});