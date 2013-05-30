/**
 * Main module for html compontents generation / manipulation
 * @module core/ui
 *
 **/
define([
		'tpl!views/list/listView.tpl',
		'tpl!views/list/listElementView.tpl',
		'tpl!views/addListElement.tpl',
		'tpl!views/confirmPopup.tpl',
		'tpl!views/alertPopup.tpl',
		'core/system',
		'core/router',
		'core/tool'
],

function(
	listTpl,
	listElementTpl,
	formTpl,
	confirmTpl,
	alertTpl,
	System,
	Router,
	Tool) {

	var app, list, button, system, router, tool,

		UI = function() {
			var self = this;
			// app = window.mUI;
			// this.list = new List();
			// this.button = new Button();

			router = new Router();

			/* object width settings passed from a controller */
			this._obj = {};

			/* _iScroll array of iScroll instances */
			this._iScroll = [];

			/* _documentDimensions width & height of the document */
			this._documentDimensions;

			/* _pageHeaderHeight Height of the header section */
			this._pageHeaderHeight;

			/* _viewportHeight height of the vieport / outer canvas section */
			this._viewportHeight;

			/* flag for canceling sortable while element dropped on controls (edit/delete) */
			this._allowDrop;

			/**
			 * Assign DOM elements (containers) to variables
			 * The hierarchy of DOM elements is reflected in the below sequence of variables
			 **/

			/* _viewport viewport content (visible canvas), comprising the content & the header */
			// this.viewport = $('#viewport');

			/* _header header section */
			// this.header = $('#header');

			/* _wrapper  wrapping the content & the option sections (without the header) */
			// this.wrapper = $('#wrapper');

			/* _content main page content, without the header */
			// this.content = $('#content');

			/* _option option section view, normally hidden on the right outer side of the viewport */
			// this.options = $('#options');

			// List properties

			// current list element - for editing
			this._currentItem;

			system = new System();

			tool = new Tool();

			/* _buttonBackClone clone from previous view */
			// this.buttonBackClone = null;

			// init layout (if not exists)
			var checkLayout = $('#viewport');
			if (checkLayout.length === 0) {
				this._makeLayout(function() {
					self._setCanvas();
				});
			} else {
				self._setCanvas();
			}

		};

	/**
	 * Creates layout main elements & appens them to #viewport
	 * @method _makeLayout
	 * @param {Function} callback on layout creation
	 * @private
	 */
	UI.prototype._makeLayout = function(fn) {
		// creating
		this.viewport = $('<div id="viewport" />');
		this.header = $('<div id="header" />');
		this.wrapper = $('<div id="wrapper" />');
		this.content = $('<div id="content" />');
		this.options = $('<div id="options" />');
		this.controls = $('<div id="controls"><span class="icon icon-trash fLeft delete control-element"></span><span class="icon icon-pencil fRight edit control-element"></span></div>');

		// appending
		this.wrapper.append(this.content);
		// this.options.append(this.controls);
		this.wrapper.append(this.options);
		this.viewport.append(this.header);
		this.viewport.append(this.wrapper);

		if (!system.test)
			$('body').append(this.viewport);

		if (typeof fn == 'function')
			fn();
	};

	/**
	 * Inits canvas for the application
	 * @method _setViewportHeight
	 * @private
	 */
	UI.prototype._setCanvas = function() {
		var self = this;
		this._documentDimensions = {
			width: $(document).width(),
			height: $(document).height()
		};
		this._pageHeaderHeight = $('#header').height();
		this.wrapper.width(this._documentDimensions.width * 2).height(this._documentDimensions.height);

		// wait a bit for the DOM to load
		setTimeout(function() {
			self._viewportHeight = self._documentDimensions.height;
			self.wrapper.height(self._documentDimensions.height - self._pageHeaderHeight);
			self.viewport.height(self._viewportHeight).width(self._documentDimensions.width);
			self.options.width(self._documentDimensions.width);
			self.content.width(self._documentDimensions.width);
		}, 20);
	};

	/**
	 * Returns viewport width
	 * @method getViewportWidth
	 * @return {Number}
	 **/
	UI.prototype.getViewportWidth = function() {
		return this._documentDimensions.width;
	};

	/**
	 * Unbinds all listeners within a scope of the #content #options #header
	 * @method _unbindAll
	 * @private
	 */
	UI.prototype._unbindAll = function() {
		this.content.off();
		this.options.off();
		this.header.off();
	};

	/**
	 * clears all elements in the header
	 * @method clearHeader
	 **/
	UI.prototype.clearHeader = function() {

		this.header.off();
		this.header.empty();
	};

	/**
	 * Loads page content in to
	 * @method loadPageContent
	 * @param {String} html input string
	 */
	UI.prototype.loadPageContent = function(content) {
		var self = this;
		if (!this._obj.buttonBack)
			$('#back-button').remove();
		// @todo not quite elegant
		if (!content.match(/main-list/)) {
			content = '<div>' + content + '</div>';
		}

		this._unbindAll();
		this.content.empty();
		this.content.html(content);
		setTimeout(function() {
			// wait for the page to load then bind scroll and container animation
			self._scrollPage(1, 'destroy');
			self.wrapper.addClass('animate');
		}, 100);
	};

	/**
	 * Loads html content into options section
	 * options section is intended for content like edit forms or list item details.
	 * Covers the list from the right side - doesn`t remove it.
	 * @method _loadOptionContent
	 * @param {String} html string
	 */
	UI.prototype.loadOptionContent = function(content, fn) {
		this.options.empty();
		this.options.html(content);
		this.wrapper.one('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function() {
			$('input[name=item-name]').focus();
			if (typeof fn == 'function')
				fn();
		});
	};

	UI.prototype.setHeader = function(text) {
		var headerTitle = $('<div class="title"/>').text(text);
		var headerText = this.header.find('.title');
		if (headerText.length > 0)
			headerText.remove();
		this.header.append(headerTitle);
	};

	/**
	 * Init iscroll for current page
	 * @method _scrollPage
	 * @private
	 *
	 * @param {Object} iScroll instance array (_iScroll) index
	 * @param {String} type destroy|undefined
	 * @param {Object} object|undefined target object for iScroll. Default #content.
	 * @param {Function} function on scroll end.s
	 */
	UI.prototype._scrollPage = function(index, type, element, fn) {
		// if testing dispable iscroll initialisation
		if (system.test)
			return;
		var list = (typeof element === 'undefined') ? $('#content')[0] : element;
		if (typeof this._iScroll[index] !== 'undefined') {
			if (type == 'destroy') {
				if (typeof this._iScroll[index] !== 'undefined')
					this._iScroll[index].destroy();

				this._iScroll[index] = undefined;

				// @todo splice ?
				// _iScroll.splice(index,1);
				delete this._iScroll[index];
			} else {
				this._iScroll[index].refresh();
			}
		}

		// @todo check ifs
		if (typeof this._iScroll[index] === 'undefined' || type == 'destroy' || typeof type === 'undefined') {
			if (typeof this._iScroll[index] !== 'undefined') {
				this._iScroll[index].destroy();
				this._iScroll[index] = undefined;
			}
			this._iScroll[index] = new iScroll(list, {
				useTransition: true,
				onScrollEnd: function() {
					if (this.y == this.maxScrollY) {
						if (typeof fn == 'function') {
							fn.call(this);
						}
					}
				}
			});
		}
	};

	/**
	 * Slides back from the option view
	 * Two 'go backs' possible:
	 * 1) From the option view back to the list with a slide
	 * 2) Redirection to another controller/view (if route specified)
	 * @param {String} route controller name
	 * @param {Function} fn callback ?
	 **/
	UI.prototype.goBack = function(route, fn) {
		var self = this;

		if (route == '@slide') {
			if (typeof fn == 'function') {
				// callback on transition end - one time
				this.options.one('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function() {
					fn();
				});
			}
			tool.trimHash();

			this.wrapper.css('-webkit-transform', 'translate3d(' + 0 + 'px,0,0)');

			// empty options view
			this.options.empty();

			// unbind all option view event listeners
			this.options.off();

			if (!this._obj.buttonBack)
				$('#back-button').remove();

		} else if (route !== undefined && route != '@slide') {
			router.go(route);
		} else {
			window.history.back();
		}

		if (typeof fn == 'function')
			fn();
	};

	/**
	 * Shows loading modal
	 * @param {String} text to display
	 **/
	UI.prototype._showLoader = function(text) {
		if ($('#modalbg').length === 0) {
			var t = '<div class="loader-box"><i class="icon icon-spin icon-spinner"></i><div>' + text + '</div></div>';
			$('body').append('<div id="modal-bg">' + t + '</div>');
		}
	};

	// ************* List methods **************

	/**
	 *
	 * Renders standard list view
	 * Binds all neccessary actions
	 * @param {Obj} Object with list & form properties
	 **/
	UI.prototype.makeStandardList = function(obj) {
		var self = this;
		this._obj = obj;
		this.list = this._listView(obj.items);

		this.loadPageContent(this.list);
		this.buttonAdd(
		// add form html content
		formTpl({
			name: '',
			form_title: 'Add ' + obj.itemName,
			del: null
		}),

		// add function callback

		function(itemName) {
			obj.saveNew(itemName);
		},

		// on saved fn callback

		function() {

		});
		this._bindListEvent(obj);
		this._makeListSortable();
	};

	/**
	 * Returns a html list view
	 * Concatenates list elements from partial views into one list
	 * @method _listView
	 * @param {Object}
	 * @return {string} html (ul)
	 */
	UI.prototype._listView = function(inp) {
		var out = "";
		for (var i = 0; i < inp.length; i++) {
			out += listElementTpl({
				obj: inp[i]
			});
		}
		return listTpl({
			content: out
		});
	};

	/**
	 * Prepends item on main list after add new item
	 * @param {Number} newly created item id
	 * @param {String} new item name
	 **/
	UI.prototype.appendItem = function(id, name) {
		var list = this.content.find('.main-list'),
			li = this._listElement(id, name);

		list.prepend(li);
		this.goBack();
	};

	/**
	 *
	 * Shows edit view
	 *
	 **/
	UI.prototype._editListElement = function(el) {
		var self = this,
			name = el.data('name');

		self._currentItem = el;

		// show options view
		self.loadOptionContent(formTpl({
			name: name,
			form_title: 'Edit ' + this._obj.itemName,
			del: null
		}));

		// slide in effect
		self.wrapper.css('-webkit-transform', 'translate3d(-' + self.getViewportWidth() + 'px,0,0)');

		// change hash
		var ch = window.location.hash;
		window.location.hash = ch + '#edit';

		// add button back
		self.back('@slide');

		// add button back
		// uiButton.back();

		// trigger edit / delete listeners
		self._onEditSave(this._obj.saveEdit);
		// self._onItemDelete(this._obj.onDelete);
	};

	/**
	 * Action on edit submit
	 * @param {Function} callback
	 **/
	UI.prototype._onEditSave = function(fn) {
		var self = this;
		// bind action on submit add/edit form
		this.options.on(system.triggerEvent, '#add-submit', function(e) {
			e.preventDefault();
			var itemName = self.options.find('.std-edit-form input[name=item-name]').val(),
				id = self._currentItem.data('id');

			if (itemName === '') {
				self.alert('Field cannot be empty!');
			} else {
				// modify database
				fn(id, itemName);

				// modify item name on the list
				self._currentItem.attr('data-name', itemName).find('.text').text(itemName);
				self.goBack('@slide');
			}
		});
	};

	/**
	 * Action on item delete
	 * @param {Function} callback
	 * @deprecated
	 **/
	UI.prototype._onItemDelete = function(fn) {
		var self = this;
		this.options.on(system.triggerEvent, '.std-button.error', function(e) {
			e.preventDefault();
			self.confirm('Are you sure?', function() {
				var id = self._currentItem.data('id');

				fn(id);

				// modify item name on the list
				self._currentItem.remove();
				self.goBack('@slide');
			});
		});
	};

	/**
	 * binds events to a list item (li)
	 * @method _bindListEvent
	 * @param {Function} callback function
	 */
	UI.prototype._bindListEvent = function(obj) {
		var self = this;

		// add button back
		if (obj.buttonBack)
			this.back(obj.backRoute);

		this.content.on(system.triggerEvent, '.main-list li a', function() {
			var el = $(this),
				li = el.parent();

			// on tap class active
			el.addClass('active');
			setTimeout(function() {
				el.removeClass('active');
			}, 500);

			if (typeof obj.onItemClick == 'function')
				obj.onItemClick(li);
		});

		// on change order
		this.content.on('changeOrder', function(e, arr) {
			if (typeof obj.onSaveOrder == 'function')
				obj.onSaveOrder(arr);
		});
	};

	UI.prototype._makeListSortable = function() {
		var self = this;
		$(".main-list").sortable({
			// disabled:true,
			handle: '.chevron',
			helper: 'clone',
			// containment: 'parent',
			// helper: function(event) {
			// var tr = $(event.target).closest('tr');
			// self.dragSource = parseInt(tr.data('id'),10);
			// self.dragClone = tr.find('.to_drag').text();
			// return $('<div class="drag-cart-item"><table></table></div>')

			// var clone = $(event.target).closest('li').clone();
			// clone.addClass('dragged_element');
			// clone.find('.text').text('');
			// return clone;
			// },
			// revert:'invalid',
			cursor: 'move',
			// scope: 'cart-item',
			// cursorAt: {
			//	left: 5,
			//	bottom: 5
			// },
			zInidex: 7000,
			start: function(e, ui) {
				self._iScroll[1].destroy();
				// enabling droppable option list
				$(ui.helper).css('opacity', '0.7');
				self._enableDroppableOptions();
				self._allowDrop = true;
			},
			update: function() {
				if (self._allowDrop) {
					var sorted = $(".main-list").sortable('toArray', {
						attribute: 'data-id'
					});
					self.content.trigger('changeOrder', [sorted]);
					self._destroyListDroppable();
				} else {
					$('.main-list').sortable('cancel');
				}
			},
			stop: function(e, ui) {
				self._scrollPage(1);
				self._destroyListDroppable();
			}
		});
		// $('.main-list').hammer().on("hold", "li", function(event) {
		// $( ".main-list" ).sortable( "option", "disabled", false );
		// $( ".main-list" ).sortable( "enable" );
		// $(this).addClass('dragged');
		// $('.main-list').sortable('refresh');
		// });
	};

	/**
	 * @method _enableDroppableOptions
	 * reveals controls block in the middle of the viewport
	 * dragging to edit & delete
	 **/
	UI.prototype._enableDroppableOptions = function() {
		var self = this;

		this.content.append(this.controls);

		$(".control-element").droppable({
			// greedy: true,
			hoverClass: 'control-hover',
			drop: function(event, ui) {
				self._allowDrop = false;
				self._destroyListDroppable();
				var target = $(event.target);
				var id = $(ui.helper).data('id');
				var li = self.content.find('.main-list li[data-id=' + id + ']');
				if (target.hasClass('delete')) {
					// remove list item
					self.confirm('Are you sure?', function() {
						self._obj.onDelete(id);
						li.remove();
					});

				}
				if (target.hasClass('edit')) {
					// edit list item
					self._editListElement(li);
				}
			},
			tolerance: 'pointer'
		});
	};

	UI.prototype._destroyListDroppable = function() {
		// var control = $( ".control-element" );
		// control.droppable( "destroy" );
		$('#controls').remove();
		// self._saveOrder(sorted);
	};

	/**
	 * Returns one li item
	 * @method _listElement
	 * @param {Number} li (object) id
	 * @param {String} li item name
	 * @return {String} html (li)
	 **/
	UI.prototype._listElement = function(id, name) {
		return listElementTpl({
			obj: {
				cid: id,
				name: name
			}
		});
	};

	// ************** Button methods ***************

	/**
	 * Appends to the header button back
	 * Sets listener on button back
	 * @method back
	 * @param {Undefined|String} route a controller to go
	 * @param {Function} fn callback
	 * route parameter is passed to this.goBack()
	 **/
	UI.prototype.back = function(route) {
		var self = this;
		var button = $('<button id="back-button" data-route="' + route + '" class="menu-button"><span class="icon-circle-arrow-left"></span></button>');

		// removes previous back button if exists
		var old = this.header.find('#back-button');
		if (old.length > 0) {
			self.header.off(system.triggerEvent, '#back-button');
			old.remove();
		}
		this.header.append(button);

		this.header.on(system.triggerEvent, '#back-button', function() {
			self.goBack(route);

		});
	};

	/**
	 * Appends to the header add new element button
	 * @param {Function} action on click
	 **/
	UI.prototype.buttonAdd = function(formTpl, saveFn, fn) {
		var self = this;
		var button = $('<button id="add-button" class="menu-button-right"><span class="icon-plus-sign"></span></button>');
		if (this.header.find('#add-button').length === 0)
			this.header.append(button);

		$('#header').on(system.triggerEvent, '#add-button', function() {
			// slide back effect
			self.wrapper.css('-webkit-transform', 'translate3d(-' + self.getViewportWidth() + 'px,0,0)');

			// change hash
			var ch = window.location.hash;
			window.location.hash = ch + '#add';

			// add button back
			self.back('@slide');

			// load form html into option view container
			self.loadOptionContent(formTpl);

			// bind action on submit add/edit form
			self.options.on(system.triggerEvent, '#add-submit', function(e) {
				e.preventDefault();
				var itemName = self.options.find('.std-edit-form input[name=item-name]').val();
				if (itemName === '') {
					self.alert('Field cannot be empty!');
				} else {
					saveFn(itemName);
					self.goBack('@slide');
				}
			});
		});
	};

	/**
	 *
	 * Builds & returns a button element
	 * @param {Object} button properties
	 * @return {String} the button`s html
	 **/
	UI.prototype.setButton = function(obj) {
		var id = obj.id !== undefined ? obj.id : '',
			cl = obj.class !== undefined ? obj.class : '',
			text = obj.text !== undefined ? obj.text : '';
		var html = '<button class="button ' + cl + '" id="' + id + '">' + obj.text + '</button>';
		return html;
	};

	// ************ MODALS *************

	UI.prototype.alert = function(text) {
		var t = alertTpl({
			content: text
		});
		if ($('#modalbg').length === 0) {
			$('body').append('<div id="modal-bg">' + t + '</div>');
			//	$('#modal-popup').off(system.triggerEvent,'.close');
			//	$('#modal-popup').on(system.triggerEvent,'.close',function(){
			//	$('#modal-bg').remove();
			// });
			setTimeout(function() {
				$('#modal-bg').fadeOut('fast', function() {
					$(this).remove();
				});
			}, 600);
		}
	};

	UI.prototype.confirm = function(text, fnSuccess, fnFail) {
		var self = this;
		var t = confirmTpl({
			content: text
		});
		if ($('#modalbg').length === 0) {
			$('body').append('<div id="modal-bg">' + t + '</div>');
			// buttons events listeners
			$(document).off(system.triggerEvent, '#modal-popup .cancel');
			$(document).on(system.triggerEvent, '#modal-popup .cancel', function() {
				self.modalPopupRemove();
				if (typeof fnFail == 'function') {
					fnFail();
				}
			});
			$(document).off(system.triggerEvent, '#modal-popup .ok');
			$(document).on(system.triggerEvent, '#modal-popup .ok', function() {
				self.modalPopupRemove();
				if (typeof fnSuccess == 'function') {
					fnSuccess();
				}
			});
		}
	};

	UI.prototype.modalPopupRemove = function() {
		$('#modal-bg').remove();
	};

	return UI;
});