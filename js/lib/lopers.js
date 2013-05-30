//     Lopers.js 0.0.2
//     (c) 2012-2013 Marcin Baniowski, baniowski.pl
//     Lopers may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://...
var Lopers = function(dbName,options){

	var self = this;

	this.options = {
		timestamp:true
	};
	if(options !== undefined && typeof options == 'object'){
		if(options.timestamp !== undefined){
			this.options.timestamp = options.timestamp;
		}
	}

	this.version = '0.0.1';

	if(dbName === undefined || dbName === ''){
		throw new Error('db name not defined or empty string');
	}

	// common namespace
	this._dbName = dbName;

	// reserved table names
	this._reserved = ['cid','time'];

	// array with objects with each table structure (fields)
	this._schemas = [];

	// object containing data tables
	this._db;

	if(localStorage.getItem(this._dbName+'_lopers_cid_count') === null){
		this._lastCid = 0;
		localStorage.setItem(this._dbName+'_lopers_cid_count',this._lastCid);
	}else{
		this._lastCid = localStorage.getItem(this._dbName+'_lopers_cid_count');
	}

	var i = localStorage.getItem(self._dbName);
	if(i === null){
		this._db = localStorage.setItem(self._dbName,JSON.stringify([]));
		this._db = [];
	}else{
		try{
			this._db = JSON.parse(i);
		}
		catch(e){
			throw new Error('String from localStorage is not in valid JSON format');
		}
	}

	// initialize table - name and data structure
	this.setTable = function(tableName,fields){
		var $this = this;
		if(typeof tableName !== 'string'){
			throw new Error('Table name must be a string!');
		}
		if(fields instanceof Array == false){
			throw new Error('Fields argument must be an array!');
		}
		if(fields.length == 0){
			throw new Error('Fields argument must not be an empty array!');
		}

		for(var i=0;i<fields.length;i++){
			if(this._reserved.indexOf(fields[i]) != -1){
				throw new Error('Field name '+ fields[i] + ' is reserved!')
			}
		}
		
		// table structure
		fields.push('cid');
		if(this.options.timestamp === true)
			fields.push('time');
		var tableStr = {table:tableName,fields:fields};
		this._schemas.push(tableStr);

		// check if tableName exists - prevents table doubling
		this._checkTableName(tableName,function(){
			// add client ID
			$this._db.push({table:tableName,records:[]});
			$this._persistTable();
		});
	};

	this.select = function(table,cond,sortArgs){
		var coll = this._pickRecords(table,cond,true);
		if(sortArgs !== undefined)
		{
			this.sort(coll,sortArgs);
		}
		return coll;
	};

	this.sort = function(coll,args)
	{
		coll.sort(function(a, b) {
			return args.order == 'asc' ? a[args.field] - b[args.field] : b[args.field] - a[args.field];
		});
	};

	// Creates new record 
	this.insert = function(table,arr,fn){
		// check arguments
		if(table === undefined){
			throw new Error('Undefined table name');
		}
		if(arr instanceof Array == false){
			throw new Error('Inserted values object argument must be of Array type');
		}

		// init empty object to insert
		var el = {};

		// get table structure - fields names
		var fields = this._getTableSchema(table);

		var fieldsMinus = this.options.timestamp ? 2 : 1;

		if(arr.length !== fields.length - fieldsMinus)
			throw new Error('The number of values you trying to insert does not correspod the schema from setTable!');

		for(var i in fields){
			el[fields[i]] = arr[i];
		}

		el['cid'] = this._getFirstCid();
		if(this.options.timestamp){
			var t = new Date();
			el['time'] = t.getTime();
		}

		// insert new record
		for(var i in this._db){
			if(this._db[i].table == table){
				this._db[i].records.push(el);
			}
		}
		// save to localStorage
		this._persistTable(fn);
	};

	// updates a record
	this.update = function(table,fields,cond){
		var found = this._pickRecords(table,cond,true);
		for(var i=0;i<found.length;i++){
			var el = found[i];
			for(var key in fields){
				el[key] = fields[key];
			}
		}
		this._persistTable();
	};

	// delete a record
	this.delete = function(table,cond){
		var found = this._pickRecords(table,cond);
		for(var i=0;i<found.length;i++){
			var el = found[i];
			var index = this._getIndexByCid(table,el.cid);
			var td = this._getTableData(table);
			td.splice(index,1);
		}
		this._persistTable();
	};

	this.getCount = function(table,cond){
		var out = this._pickRecords(table,cond,true);
		return out.length;
	};

	this.destroyDB = function(){
		localStorage.removeItem(this._dbName);
		localStorage.removeItem(this._dbName+'_lopers_cid_count');
		delete this;
	};

	this.serialize = function(string){
		var raw = localStorage.getItem(this._dbName);
		var dbConf = {dbName:this._dbName,counter:this._lastCid};
		var data = JSON.parse(raw);
		data.push(dbConf);
		if(string === undefined){
			return JSON.stringify(data);
		}else{
			return data;
		};
	};

	this.lastInserted = function()
	{
		return this._lastCid;
	};

	// Pseudo private methods

	// checks for table name availability - if already exists returns false: @todo - decribe more
	this._checkTableName = function(tableName,fn){
		for(var i in this._db){
			if(this._db[i].table == tableName){
				return false;
				// throw new Error('Table name must be unique!');
			}
		}
		if(typeof fn === 'function'){
			fn();
		}
	};

	// Gets table fields (structure)
	this._getTableSchema = function(table){
		var out;
		for(var i in this._schemas){
			if(this._schemas[i].table == table){
				out = this._schemas[i].fields;
			}
		}
		if(out === undefined){
			throw new Error('Table '+ table +' not found!');
		}
		return out;
	};

	// Returns table data
	this._getTableData = function(table){
		var out;
		for(var i in this._db){
			if(this._db[i].table == table){
				out = this._db[i].records;
			}
		}
		if(out === undefined){
			throw new Error('Table '+ table +' not found!');
		}
		return out;
	};

	this._getFirstCid = function(){
		var newCid = parseInt(this._lastCid);
		newCid++;
		this._lastCid = newCid;
		localStorage.removeItem(this._dbName+'_lopers_cid_count');
		localStorage.setItem(this._dbName+'_lopers_cid_count',newCid);
		return newCid;
	};

	this._pickRecordByIndex = function(table,index){
		var records = this._getTableData(table);
		return records[index];
	};
	
	// returns indexes of picked record by condition
	this._pickRecords = function(table,cond,whole){
		var data = this._getTableData(table);
		if(cond === undefined)
			return data;
		var picked = [];

		var keys = [];
		var values = [];
		for(var condKey in cond){
			keys.push(condKey);
			values.push(cond[condKey]);
		}

		for(var i=0;i<data.length;i++){
			var el = data[i];
			var check = 1;
			for(var j=0;j<keys.length;j++){
				if(el[keys[j]] != values[j]){
					check = 0;
				}
			}
			if(check == 1){
				picked.push(el);
			}
		}

		return picked;
	};

	this._persistTable = function(fn){
		localStorage.removeItem(self._dbName);
		localStorage.setItem(self._dbName,JSON.stringify(self._db));
		if(typeof fn === 'function')
			fn();
	};
	
	/**
	 * Returns collection key by client id
	 */
	this._getIndexByCid = function(table,cid){
		var out = null,
			td = this._getTableData(table);

		for(var i in td){
			if(td[i]['cid'] == cid)
				out = i;
		}
		if(out !== null){
			return out;
		}else{
			throw new Error('object doesn`t exist');
		}
	};

	/**
	 * Adds field to table schema
	 * @param {String} table table name
	 * @param {String} field name of the new field
	 * @param {Mixed} value default field value
	 */
	this.newField = function(table,field,value){
		var td = this._getTableData(table),
			out = [];
		for(var i in td){
			var obj = td[i];
			if(obj[field] === undefined)
			{
				obj[field] = value;
			}
			out.push(obj);
		}
		this._persistTable();
	};

	// @todo - remove, only for app example ?
	this.resetCounter = function(){
		localStorage.removeItem(this._dbName+'_lopers_cid_count');
		this._lastCid = 0;
	};
	
}