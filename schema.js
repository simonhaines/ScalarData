// require types.js

class Scalar {
  constructor(name, optional) {
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
    return [this.name, this.optional];
  }

  static create() {
	return new Scalar('Number', true);
  }
}
Types.register('Schema/Number', Scalar);

class Location {
  constructor(name, order) {
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
	return [this.name, this.order];
  }

  static create() {
	return new Location('Location', 0);
  }
}
Types.register('Schema/Location', Location);

class Schema {

  constructor(model) {
    if (!(model instanceof Array)) throw new Error('Bad model');

	// [id, 'name', ['tag', ...], Types]
	this.id = model[0]
	this.name = model[1];
	this.tags = model[2];
	this.items = Types.fromJSON(model[3]);

	
	// Enable events
	Event.enable(this);
  }

  static create() {
	return new Schema([Id.next(), 'New schema', [], []]);
  }

  map(func) {
	return this.items.map(func);
  }

  forEach(func) {
	return this.items.forEach(func);
  }

  parseCSV(file) {
	// TODO file iterator
	var result = new Array();
	var field = new String();
	var state = 0;
	// 0 = default, 1 = quoting, 2 = quoting quote
	for (var ch of new FileIterator(file)) {
	  switch (state) {
	  case 0:
		if (ch === '"') {
		  state = 1;
		  continue;
		}
		break;
	  case 1:
		if (ch === '"') {
		  state = 2;
		} else {
		  field = field.concat(ch);
		}
		continue;
	  case 2:
		if (ch === '"') {
		  field = field.concat('"');
		  state = 1;
		  continue;
		} else {
		  state = 0;
		}
		break;
	  }

	  if (ch === '\n') {
		result.push(field);
		field = new String();
		yield(result);
		result = new Array();
	  } else if (ch === ',') {
		result.push(field);
		field = new String();
	  } else if (ch !== '\r') {
		field = field.concat(ch);
	  }
	}
  }
  
  toJSON() {
	var json = new Array();
	json.push(this.id);
	json.push(this.name);
	json.push(this.tags);
	json.push(Types.toJSON(this.items));
	return json;
  }

  add(type) {
	var item = Types.create(type);
	this.items.push(item);
	this.dispatch('add', item, this.items.length - 1);
  }

  remove(item) {
	var idx = this.items.indexOf(item);
	if (idx === -1) throw new Error('Schema does not contain item');
	this.items.splice(idx, 1);
	this.dispatch('remove', item, idx);
  }
}
Schema.skip = Symbol('skip');
