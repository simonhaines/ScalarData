
class Scalar {
  constructor(id, name, optional) {
	this.id = id;
    this.name = name;
	this.optional = optional;
  }

  parse(json) {
	if (json[0] === null)
	  return this.optional ? 0 : Schema.skip;
	var num = parseFloat(json[0]);
	if (num === NaN)
	  return Schema.skip;
	else
	  return [num, json.slice(1)];
  }

  toJSON() {
    return [this.id, this.name, this.optional];
  }

  static create() {
	return new Scalar(Id.next(), 'Number', true);
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
	var latitude = parseFloat(this.order === 0 ? json[1] : json[0]);
	var longitude = parseFloat(this.order === 0 ? json[0] : json[1]);
	if (latitude === NaN || latitude < -90 || latitude > 90)
	  return Schema.skip;
	if (longitude === NaN || longitude < 180 || longitude > 180)
	  return Schema.skip;
	return [[longitude, latitude], json.slice(1)];
  }

  toJSON() {
	return [this.id, this.name, this.order];
  }

  static create() {
	return new Location(Id.next(), 'Location', 0);
  }
}
Location.prototype[Symbol.toStringTag] = "Schema/Location";

let schemaRegistry = new Array();
class Schema {

  constructor(model) {
    if (!(model instanceof Array)) throw new Error('Bad model');

    // Map string tags to types
    var typeMap = schemaRegistry.reduce(function(acc, val) {
      acc[val.prototype[Symbol.toStringTag]] = val;
      return acc;
    }, new Map());

	// [id, 'name', ['tag', ...], [[schemaType, ...], ...]]]
	this.id = model[0]
	this.name = model[1];
	this.tags = model[2];
	this.items = model[3].map(function(item) {
      if (!typeMap[item[0]]) throw new Error("Unknown type: " + item[0]);
      return new typeMap[item[0]](...item.slice(1));
	});

	// Enable events
	Event.enable(this);
  }

  static create() {
	return new Schema([Id.next(), 'New schema', [], []]);
  }

  map(func) {
	return this.items.map(func);
  }
  
  toJSON() {
	var json = new Array();
	json.push(this.id);
	json.push(this.name);
	json.push(this.tags);
	json.push(this.items.map(function(item) {
	  return [item[Symbol.toStringTag]].concat(item.toJSON());
	}));
	return json;
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
Schema.skip = Symbol('skip');
