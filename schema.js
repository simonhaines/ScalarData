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

  static register(domain) {
    schemaRegistry.push(domain);
  }
}

Schema.register(Scalar);
