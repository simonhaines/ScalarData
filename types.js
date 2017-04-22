
var typeRegistry = new Map();
class Types {
  static register(name, type) {
	type.prototype[Symbol.toStringTag] = name;
	typeRegistry.set(name, type);
  }

  static create(name) {
	if (!typeRegistry.has(name))
	  throw new Error(`Bad type: ${name}`);
	return typeRegistry.get(name).create();
  }
  
  static fromJSON(json) {
	if (!(json instanceof Array))
	  throw new Error("Bad types");
	return json.map((item) => {
	  if (!typeRegistry.has(item[0]))
		throw new Error(`Unknown type: ${item[0]}`);
	  var cons = typeRegistry.get(item[0]);
	  return new cons(...item.slice(1));
	});
  }

  static toJSON(types) {
	return types.map((t) => {
	  for (var e of typeRegistry.entries()) {
		if (t instanceof e[1]) return [e[0]].concat(t.toJSON());
	  }
	  throw new Error(`Bad type: ${t.toString()}`);
	});
  }
};
