define(function(){

	var app,model,

	/**
	* Controller constructor
	*
	**/
	_start = function()
	{	
		app = window.mUI;
		app.ui.setHeader('categories');
		_model = app.model;
		_getElements();
	},

	/**
	*
	* Gets objects collection from a model to display on a list
	* Loads retrieved items into into the list view & then page content
	* Triggers other necessary methods
	**/
	_getElements = function()
	{
		// get records from db, then process it in the callback
		_model.getCategories(function(res)
		{
            app.ui.makeStandardList({

            	items:res,

            	itemName:'Category',

            	buttonBack: false,

            	// on item click action
            	onItemClick:function(item)
            	{
            		var id = item.data('id');
            		app.router.go('item/'+id);
            	},

            	// on edit submit callback
            	saveEdit:function(id,name)
            	{
            		_model.updateCategory(id,name);
            	},

            	onDelete:function(id)
            	{
            		// modify database
					_model.deleteCategory(id);
            	},

            	// on add item callback
            	saveNew:function(itemName)
            	{
            		_model.addCategory(itemName,function(id)
					{
						// add item on top of the list
						app.ui.appendItem(id,itemName);
					});
            	},

            	onSaveOrder:function(arr)
            	{
            		_model.updateOrder('categories',arr);
            	}
            });
		});
	};

	return{
		start:_start
	}

});