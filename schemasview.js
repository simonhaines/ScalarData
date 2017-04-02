class SchemasView {
  constructor(schemas, workspace) {
	this.schemas = schemas;
	this.schemas.on('add.view', (s) => this.onAdd(s));
	this.schemas.on('remove.view', (s) => this.onRemove(s));
	this.workspace = workspace;
	this.views = new Map();
	Event.enable(this);
  }

  render(el) {
	this.el = el;
	this.el.innerHTML = `
      <ul class="menu">
        <li class="divider" data-content="SCHEMAS"></li>
      </ul>
      <button class="btn btn-link"
        title="create">Create a new schema</button>`;

	// Create a new schema
	el.querySelector('[title=create]')
	  .addEventListener('click', (e) => this.schemas.create());

	// Render existing schemas
	this.renderSchemas();
  }

  renderSchemas() {
	var data = this.schemas.map((s) => [s.id, s.name]);
	d3.select(this.el)
	  .select('ul.menu')
	  .selectAll('li.menu-item')
	  .data(data, (d) => d[0])
	  .enter()
	  .append((d) => {
		var item = document.createElement('li');
		item.className = 'menu-item';
		item.innerHTML = `<a href="#" data-id="${d[0]}">${d[1]}</a>`;
		item.firstChild.addEventListener('click', (e) => {
		  e.preventDefault();
		  this.show(d[0]);
		});
		return item;
	  });
  }

  show(id) {
	if (!this.views.has(id)) {
	  var schema = this.schemas.get(id);
	  var view = new SchemaView(schema);
	  view.on('change', (v) => {
		this.el.querySelector(`[data-id="${id}"]`).innerText = v.name;
	  });
	  view.on('close', (v) => this.onClose(v));
	  this.views.set(id, view);
	  this.workspace.add(view);
	  return view;
	} else {
	  return this.views.get(schema.id);
	}
  }
  
  onAdd(schema) {
	this.renderSchemas();
	var view = this.show(schema.id);
	view.renderEditor();
  }

  onRemove(schema) {
	this.renderSchemas();
	if (this.views.has(schema.id)) {
	  this.workspace.remove(this.views.get(schema.id));
	  this.views.delete(schema.id);
	}
  }

  onClose(view) {
	if (this.views.has(view.id)) {
	  this.workspace.remove(this.views.get(view.id));
	  this.views.delete(view.id);
	}
  }
}
