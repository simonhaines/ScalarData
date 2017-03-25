class Scalar {
  constructor(name, optional) {
    this.name = name;
	this.optional = optional;
  }

  parse(json) {
  }

  toJSON() {
    return [this.name, this.optional];
  }
}

Scalar.prototype[Symbol.toStringTag] = "Schema/Number";

class Location {
  constructor(name, order) {
	this.name = name;
	this.order = order;
  }

  parse(json) {
  }

  toJSON() {
	return [this.name, this.order];
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
	if (!this.events.has(event)) {
	  this.events.set(event, new Array());
	}
	this.events.get(event).push(callback);
  }

  add(item) {
	this.items.push(item);
	if (this.events.has('add')) {
	  let e = { item: item, idx: this.items.length };
	  this.events.get('add').forEach((c) => c(e));
	}
  }

  static register(domain) {
    schemaRegistry.push(domain);
  }
}

Schema.register(Scalar);
Schema.register(Location);
