define(function() {

	var Model = function() {
		this.db = new Lopers('mui_todos');
		this.db.setTable('categories', ['name', 'order']);
		this.db.setTable('items', ['category', 'name', 'done']);
		// console.log(this.db.serialize(true));
	};

	Model.prototype.getCategories = function(fn) {
		var cats = this.db.select('categories', {}, {
			field: 'order',
			order: 'asc'
		});
		fn(cats);
	};

	Model.prototype.addCategory = function(name, fn) {
		// @todo - refresh order ints instead of 0 !!!
		this.db.insert('categories', [name, 0]);
		fn(this.db.lastInserted());
	},

	Model.prototype.updateCategory = function(id, name) {
		this.db.update('categories', {
			name: name
		}, {
			cid: id
		});
	};

	Model.prototype.deleteCategory = function(id) {
		this.db.delete('categories', {
			cid: id
		});
		this.db.delete('items', {
			category: id
		});
	};

	Model.prototype.getItems = function(catId, fn) {
		var items = this.db.select('items', {
			category: catId
		}, {
			field: 'order',
			order: 'asc'
		});
		fn(items);
	};

	Model.prototype.addItem = function(name, catId, fn) {
		this.db.insert('items', [catId, name, 0]);
		fn(this.db.lastInserted());
	};

	Model.prototype.deleteItem = function(id) {
		this.db.delete('items', {
			cid: id
		});
	};

	Model.prototype.updateItem = function(id, name) {
		this.db.update('items', {
			name: name
		}, {
			cid: id
		});
	};

	Model.prototype.getCatName = function(id) {
		var c = this.db.select('categories', {
			cid: id
		});
		return c[0].name;
	};

	Model.prototype.updateOrder = function(table, arr) {
		for (var i = 0; i < arr.length; i++) {
			this.db.update(table, {
				order: i
			}, {
				cid: arr[i]
			});
		};
	};

	Model.prototype.getAllItems = function(fn) {
		var items = this.db.select('items');
		fn(items);
	};

	return Model;

});