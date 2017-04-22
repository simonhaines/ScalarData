class ScalarEditor {
  constructor(model, schema) {
	this.model = model;
	this.schema = schema;
	this.name = model.name;
	this.optional = model.optional;
  }
  render(el) {
	this.el = el;
	this.el.innerHTML =
	  `<h3>Any number, e.g. -12.34 or 567</h3>
         <button class="btn btn-link" data-action="remove">Remove this</button>
         <form class="form-horizontal">
	      <div class="form-group">
	        <div class="col-3">
	          <label class="form-label" for="input-name">Name</label>
	        </div>
	        <div class="col-9">
	          <input id="input-name" class="form-input" type="text"
	            placeholder="Name" value="${this.name}"/>
	        </div>
	      </div>
 	      <div class="form-group">
	        <div class="col-3"></div>
	        <div class="col-9">
	          <label class="form-checkbox">
	            <input id="input-optional" type="checkbox"
 	              ${this.optional ? "checked" : null}/>
	            <i class="form-icon"></i>May be absent (becomes 0)
	          </label>
	        </div>
	      </div>
	    </form>`;

	this.el.querySelector('#input-name')
	  .addEventListener('change', (e) => this.name = e.target.value);
	this.el.querySelector('#input-optional')
	  .addEventListener('change', (e) => this.optional = e.target.checked);
	this.el.querySelector('[data-action=remove]')
	  .addEventListener('click', (e) => this.schema.remove(this));
  }
  commit() {
	this.model.name = this.name;
	this.model.optional = this.optional;
  }
  rollback() {
	this.name = this.model.name;
	this.optional = this.model.optional;
  }
  renderValue(el, data) {
	el.style.width = 80;
	el.innerText = data.toString();
  }
  static get description() {
	return "A number";
  }
}

class LocationEditor {
  constructor(model, schema) {
	this.model = model;
	this.schema = schema;
	this.name = model.name;
	this.order = model.order;
  }
  render(el) {
	this.el = el;
	this.el.innerHTML =
	  `<h3>A geographic location (WGS84)</h3>
         <button class="btn btn-link" data-action="remove">Remove this</button>
         <form class="form-horizontal">
	      <div class="form-group">
	        <div class="col-3">
	          <label class="form-label" for="input-name">Name</label>
	        </div>
	        <div class="col-9">
	          <input id="input-name" class="form-input" type="text"
	            placeholder="Name" value="${this.name}"/>
	        </div>
	      </div>
 	      <div class="form-group">
	        <div class="col-3">
              <label class="form-label" for="input-order">Order</label>
            </div>
	        <div class="col-9">
              <select id="input-order" class="form-select">
                <option value="0">Longitude,Latitude</option>
                <option value="1">Latitude,Longitude</option>
              </select>
	        </div>
	      </div>
	    </form>`;

	this.el.querySelector('#input-name')
	  .addEventListener('change', (e) => this.name = e.target.value);
	let orderSelection = this.el.querySelector('#input-order');
	orderSelection.addEventListener('change',
	  (e) => this.order = parseInt(e.target.value));
	orderSelection.children[this.order].selected = true;
	this.el.querySelector('[data-action=remove]')
	  .addEventListener('click', (e) => this.schema.remove(this));
  }
  commit() {
	this.model.name = this.name;
	this.model.order = this.order;
  }
  rollback() {
	this.name = this.model.name;
	this.order = this.model.order;
  }
  renderValue(el, value) {
	el.style.width = 80;
	el.innerText = `(${value[0]},${value[1]})`;
  }
  static get description() {
	return "A geographic location";
  }
}

let viewRegistry = new Map();
class SchemaView {
  constructor(schema, workspace) {
	this.schema = schema;
	this.workspace = workspace;
	this.id = this.schema.id;
	this.name = this.schema.name;
	this.tags = this.tagsToString(this.schema.tags);
	this.key = 1;

	// This class is event-enabled
	Event.enable(this);

	// Add all existing attributes
	this.widgets = new Array();
	this.schema.forEach((s,i) => {
	  this.onAdd(i, s);
	});

	// Listen out for schema changes
	this.schema.on('add.view', this.onAdd.bind(this));
	this.schema.on('remove.view', this.onRemove.bind(this));
  }

  render(el) {
	this.el = el;
	this.el.className = 'card shadow-0';
	this.renderViewer();
  }

  renderViewer() {
	this.el.innerHTML =
	  `<div class="card-header">
        <div class="btn-group btn-group-block float-right">
 	      <button class="btn" title="edit">Edit</button>
	      <button class="btn" title="close">Close</buton>
	    </div>
	    <div class="card-title">${this.name}</div>
	  </div>
	  <div class="card-body">
        <div id="dropzone" class="col-12 dropzone">
          <div>Drop a file here</div>
        </div>
      </div>
	  <div class="card-footer"></div>`;
	  
	// Menu
	this.el.querySelector('[title=edit]')
	  .addEventListener('click', (e) => this.renderEditor());
	this.el.querySelector('[title=close]')
	  .addEventListener('click', (e) => this.close());

	// Drop zone
	let dz = this.el.querySelector('#dropzone');
	dz.addEventListener('dragover', (e) => {
	  e.stopPropagation();
	  e.preventDefault();
	  e.dataTransfer.dropEffect = 'copy';
	});
	dz.addEventListener('drop', (e) => {
	  e.stopPropagation();
	  e.preventDefault();
	  let files = e.dataTransfer.files;
	  this.schema.parseCSV(files[0])
		.then((data) => {
		  var model = new Array();
		  model.push(Id.next());
		  model.push(files[0].name);
		  model.push(this.stringToTags(this.tags));
		  model.push(Types.toJSON(this.schema.types));
		  model.push(data);
		  var datasource = new DataSource(model);
		  let view = new DataSourceView(datasource);
		  this.workspace.add(view);
		}, (error) => {
		  throw new Error(error);
		});
	});

	d3.select(this.el)
	  .select('.card-footer')
	  .selectAll('.chip')
	  .data(this.schema.tags)
	  .enter()
	  .append('label').attr('class', 'chip').text((d) => d);
  }

  renderEditor() {
	this.el.innerHTML =
  	  `<div class="card-header">
	    <div class="btn-group btn-group-block float-right">
 	      <button class="btn" title="save">Save</button>
	      <button class="btn" title="close">Close</buton>
	    </div>
	    <div class="input-group col-5">
		  <span class="input-group-addon">Title</span>
	      <input class="form-input" type="text" title="name"
   	        placeholder="Name" value="${this.name}"/>
		</div>
	  </div>
	  <div class="card-body">
        <div id="widgets" class="w500"></div>
        <div class="divider"></div>
        <form class="form-horizontal col-12 w500">
          <div class="form-group"> 
            <label class="form-label col-3">New attribute</label>
            <select id="attribute-type" class="form-select col-6"></select>
            <button id="attribute-add" class="btn btn-link">Add</button>
          </div>
        </form>
        <div class="divider"></div>
      </div>
      <div class="card-footer">
	    <div class="input-group col-5">
	      <span class="input-group-addon">Tags</span>
		    <input class="form-input" type="text" title="tags"
              placeholder="Tags" value="${this.tags}"/>
	    </div>
	    <i>Separate tags with spaces</i>
	  </div>`;

	this.el.querySelector('[title=save]')
	  .addEventListener('click', (e) => this.commit());
	this.el.querySelector('[title=close]')
	  .addEventListener('click', (e) => this.rollback());
	this.el.querySelector('[title=name]')
	  .addEventListener('change', (e) => this.name = e.target.value);
	this.el.querySelector('[title=tags]')
	  .addEventListener('change', (e) => this.tags = e.target.value);
	this.el.querySelector('#attribute-add')
	  .addEventListener('click', (e) => {
		e.preventDefault();
		this.add(this.el.querySelector('#attribute-type').value);
	  });

	// Attribute types
	let editors = [];
	viewRegistry.forEach((v,k) => editors.push([k,v]));
	d3.select(this.el)
	  .select('#attribute-type')
	  .selectAll('option')
	  .data(editors)
	  .enter()
	  .append('option')
	  .attr('value', (d) => d[0])
	  .text((d) => d[1].description);

	this.renderWidgets();
  }

  renderWidgets() {
	let widgets = d3.select(this.el.querySelector('#widgets'))
	  .selectAll('.widget')
	  .data(this.widgets, (d) => d.key);
	widgets.enter()
	  .append((d, i) => {
		let el = document.createElement('div');
		el.className = 'widget col-12';
		d.render(el);
		return el;
	  });
	widgets.exit()
	  .remove();
  }

  onAdd(item, idx) {
	if (!viewRegistry.has(item[Symbol.toStringTag]))
	  throw new Error(`Unregistered editor: ${item[Symbol.toStringTag]}`);
	var cons = viewRegistry.get(item[Symbol.toStringTag]);
	var widget = new cons(item, this);
	widget.key = this.key++;
	this.widgets.splice(idx, 0, widget);
	this.renderWidgets();
  }

  onRemove(item, idx) {
	if (this.widgets[idx].model !== item) throw new Error('Mismatch!');
	this.widgets.splice(idx, 1);
	this.renderWidgets();
  }

  add(type) {
	this.schema.add(type);
  }

  remove(view) {
	this.schema.remove(view.model);
  }

  commit() {
	this.schema.name = this.name;
	this.schema.tags = this.stringToTags(this.tags);
	this.widgets.forEach((w) => w.commit());
	this.renderViewer();
	this.dispatch('change', this);
  }

  rollback() {
	this.name = this.schema.name;
	this.widgets.forEach((w) => w.rollback());
	this.renderViewer();
  }

  close() {
	this.dispatch('close', this);
  }
  
  stringToTags(str) {
	let r = new RegExp(/\[([^\]]+)\]|([\w]+)/g);
	let t = [];
	do {
	  var match = r.exec(str);
	  if (match) t.push(match[1] || match[0]);
	} while (match);
	return t;
  }

  tagsToString(tags) {
	return tags.map((t) => t.includes(' ') ? '[' + t + ']' : t)
	  .join(' ');
  }

  static register(domain, editor) {
	if (domain.prototype[Symbol.toStringTag] == undefined) {
	  throw new Error("Registered domains must have a toStringTag");
	}
	viewRegistry.set(domain.prototype[Symbol.toStringTag], editor);
  }
}

SchemaView.register(Scalar, ScalarEditor);
SchemaView.register(Location, LocationEditor);
