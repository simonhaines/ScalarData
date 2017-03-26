var idCounter = 0;
function newId() {
  return `s${idCounter++}`;
}

class Scalar {
  constructor(id, name, optional) {
	this.id = id;
    this.name = name;
	this.optional = optional;
  }

  parse(json) {
  }

  toJSON() {
    return [this.id, this.name, this.optional];
  }

  static create() {
	return new Scalar(newId(), 'Number', true);
  }
}

Scalar.prototype[Symbol.toStringTag] = "Schema/Number";

class Location {
  constructor(id, name, order) {
	this.id = id;
	this.name = name;
	this.order = order;
  }

  parse(json) {
  }

  toJSON() {
	return [this.id, this.name, this.order];
  }

  static create() {
	return new Location(newId(), 'Location', 0);
  }
}
Location.prototype[Symbol.toStringTag] = "Schema/Location";

let schemaRegistry = new Array();
class Schema {

  constructor(model) {
    if (!(model instanceof Array)) throw new Error("Bad model");

    // Map string tags to types
    var typeMap = schemaRegistry.reduce(function(acc, val) {
      acc[val.prototype[Symbol.toStringTag]] = val;
      return acc;
    }, new Map());

	// ['schema name', ['tag', ...], [[schemaType, ...], ...]]]
	this.name = model[0];
	this.tags = model[1];
	this.items = model[2].map(function(item) {
      if (!typeMap[item[0]]) throw new Error("Unknown type: " + item[0]);
      return new typeMap[item[0]](...item.slice(1));
	});

	// Event dispatch
	this.events = new Map();
  }

  map(func) {
	return this.items.map(func);
  }
  
  toJSON() {
	var json = new Array();
	json.push(this.name);
	json.push(this.tags);
	json.push(this.items.map(function(item) {
	  return [item[Symbol.toStringTag]].concat(item.toJSON());
	}));
	return json;
  }

  on(event, callback) {
	this.events.set(event, callback);
  }

  dispatch(event, ...args) {
	for (var entry of this.events.entries()) {
	  if (entry[0].split('.')[0] === event) {
		entry[1](...args);
	  }
	}
  }

  add(type) {
	var cons = schemaRegistry.find(
	  (s) => s.prototype[Symbol.toStringTag] === type);
	if (cons === undefined) throw new Error(`Bad type: ${type}`);
	var item = cons.create();
	this.items.push(item);
	this.dispatch('add', item, this.items.length - 1);
  }

  remove(item) {
	var idx = this.items.indexOf(item);
	if (idx === -1) throw new Error('Schema does not contain item');
	this.items.splice(idx, 1);
	this.dispatch('remove', item, idx);
  }

  static register(domain) {
    schemaRegistry.push(domain);
  }
}

Schema.register(Scalar);
Schema.register(Location);
