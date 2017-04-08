
class DataSource {

  constructor(model) {
	if (!(model instanceof Array)) throw new Error("Bad model");

	// [id, 'name', ['tag', ...], schema, [[row...]]]

	this.id = model[0];
	this.name = model[1];
	this.tags = model[2];
	this.schema = model[3].map(function(item) {
      if (!typeMap[item[0]]) throw new Error("Unknown type: " + item[0]);
      return new typeMap[item[0]](...item.slice(1));
	});
	this.data = model[4];

	Event.enable(this);
  }
  
}
