define(function(){

	var app,model,

	_start = function()
	{	
		app = window.mUI;
		_model = app.model;
		_currentCatId = app.router.getArgs()[0];
		_getElements();
		// uiButton.back('category');

		// category name in the header
		app.ui.setHeader(_model.getCatName(_currentCatId));
	},

	_getElements = function()
	{
		_model.getItems(_currentCatId,function(res)
		{
            app.ui.makeStandardList({

            	items:res,

            	itemName:'Item',

                  buttonBack: true,

            	// on item click action
            	onItemClick:function(item)
            	{
            		var id = item.data('id');
            		// router.go('item',id);
            	},

            	// on edit submit callback
            	saveEdit:function(id,name)
            	{
            		_model.updateItem(id,name);
            	},

            	onDelete:function(id)
            	{
            		// modify database
					_model.deleteItem(id);
            	},

            	// on add item callback
            	saveNew:function(itemName)
            	{
            		_model.addItem(itemName,_currentCatId,function(id)
					{
						// add item on top of the list
						app.ui.appendItem(id,itemName);
					});
            	},

            	onSaveOrder:function(arr)
            	{
            		_model.updateOrder('items',arr);
            	},

            	backRoute: 'category'
            });
		});
	};

	return{
		start:_start
	}

});