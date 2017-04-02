
let _id = 0;
class Id {

  static next() {
	return _id++;
  }
  
  static set(value) {
	_id = value;
  }

  static toJSON() {
	return _id;
  }
}

sd = {
  add: function(view) {
	var panel = document.createElement('div');
	view.render(panel);
	this.workspace.appendChild(panel);
	view.on('close.sd', () => {
	  this.workspace.removeChild(panel);
	});
  },

  boot: function() {
	// Find data and load it
	if (window.data instanceof Array) {
	  Id.set(window.data[0]);
	  this.schemas = new Schemas(window.data[1]);
	} else {
	  this.schemas = new Schemas([]);
	}

	// Reference elements
	this.workspace = new Workspace(document.getElementById('workspace'));
	this.schemasView = new SchemasView(this.schemas, this.workspace);
	this.schemasView.render(document.getElementById('schemas'));
  },

  export: function() {
	var json = new Array();
	json.push(Id.toJSON());
	json.push(this.schemas.toJSON());

	console.log(JSON.stringify(json));
  }
}

window.addEventListener('load', (e) => sd.boot());
