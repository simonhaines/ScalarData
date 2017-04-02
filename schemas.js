class Schemas {

  constructor(model) {
	if (!(model instanceof Array)) throw new Error('Bad model');

	this.id = model[0];
	this.schemas = model[1].map((s) => new Schema(s));
	
	// Enable events
	Event.enable(this);
  }

  add(schema) {
	this.schemas.push(schema);
	this.dispatch('add', schema);
  }

  remove(schema) {
	var idx = this.schemas.findIndex((s) => s.id === schema.id);
	if (idx === -1)
	  throw new Error(`No such schema: ${schema}`);
	this.schemas.splice(idx, 1);
	this.dispatch('remove', schema);
  }

  create() {
	this.add(Schema.create());
  }

  get(id) {
	var schema = this.schemas.find(s => s.id === id);
	if (!schema)
	  throw new Error(`No such id: ${id}`);
	return schema;
  }
  
  map(callback, thisArg) {
	return this.schemas.map(callback, thisArg);
  }

  toJSON() {
	var json = new Array();
	json.push(this.id);
	json.push(this.schemas.map((s) => s.toJSON()));
	return json;
  }
}
