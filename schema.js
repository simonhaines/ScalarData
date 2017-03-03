class Integer {
  constructor(label) {
    this.label = label;
  }

  parse(json) {
  }

  toJSON() {
    return [this.label];
  }
}

Integer.prototype[Symbol.toStringTag] = "Schema/Integer";

let registry = [];
class Schema extends Array {
  get [Symbol.species]() {
    return this;  // Allows Array.map() to return a Schema object
  }

  toJSON() {
    return this.reduce(function(acc, val) {
      acc.push([val[Symbol.toStringTag]].concat(val.toJSON()));
      return acc;
    }, new Array());
  }

  static fromJSON(json) {
    if (!(json instanceof Array)) throw new Error("Bad JSON");

    // Map string tags to types
    var typeMap = registry.reduce(function(acc, val) {
      acc[val.prototype[Symbol.toStringTag]] = val;
      return acc;
    }, new Map());
    var result = new Schema();
    json.forEach(function(item) {
      if (!typeMap[item[0]]) throw new Error("Unknown type: " + item[0]);
      result.push(new typeMap[item[0]](...item.slice(1)));
    });
    return result;
  }

  static register(domain) {
    registry.push(domain);
  }
}

Schema.register(Integer);
