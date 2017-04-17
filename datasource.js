
class DataSource {

  constructor(model) {
	if (!(model instanceof Array)) throw new Error("Bad model");

	// [id, 'name', ['tag', ...], Types, [[row...]]]

	this.id = model[0];
	this.name = model[1];
	this.tags = model[2];
	this.types = Types.fromJSON(model[3]);
	this.data = model[4];

	Event.enable(this);
  }
  
}
