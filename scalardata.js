
let _id = 0;
class Id {

  static next() {
	return _id++;
  }
  
  static set(value) {
	_id = value;
  }

  static toJson() {
	return _id;
  }
}

sd = {
  schemas: new Array(),
  views: new Array(),

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
	  this.schemas = window.data[1].map((s) => new Schema(s));
	}

	// Reference elements
	this.sidebar = document.getElementById('sidebar');
	this.workspace = document.getElementById('workspace');

	// Render the schema links
	// TODO abstract this into SchemaList and SchemaListView
	var menu = this.sidebar.querySelector('#schemas');
	d3.select(menu)
	  .selectAll('li.menu-item')
	  .data(this.schemas)
	  .enter()
	  .append((d) => {
		var item = document.createElement('li');
		item.className = 'menu-item';
		item.innerHTML = `<a href="#">${d.name}</a>`;
		item.querySelector('a').addEventListener('click', (e) => {
		  e.preventDefault();
		  var view = new SchemaView(d);
		  this.add(view);
		  view.on('change', (item) => {
			e.target.innerText = item.name;
		  });
		});
		return item;
	  });

	// Create a new schema
	var createSchema = document.createElement('li');
	createSchema.className = 'menu-item';
	createSchema.innerHTML = '<a href="#">Create a new schema</a>';
	createSchema.querySelector('a').addEventListener('click', (e) => {
	  e.preventDefault();
	  var schema = Schema.create();
	  this.schemas.push(schema);

	  var view = new SchemaView(schema);
	  this.add(view);
	  view.renderEditor();
	});
	menu.appendChild(createSchema);
  }
}

window.addEventListener('load', (e) => sd.boot());
