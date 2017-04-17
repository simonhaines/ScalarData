
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
	  if (!typeRegistry[item[0]])
		throw new Error(`Unknown type: ${item[0]}`);
	  return new typeRegistry[item[0]](...item.slice(1));
	});
  }

  static toJSON(types) {
	return types.map((t) => {
	  for (var e in typeRegistry.entries()) {
		if (t instanceof e.value) return [e.key].concat(t.toJSON());
	  }
	  throw new Error(`Bad type: ${t.toString()}`);
	});
  }
};
