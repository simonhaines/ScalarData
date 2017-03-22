class ScalarEditor {
  constructor(model) {
	if (model == null) {
	  // We are constructing a new integer attribute
	  this.model = new Scalar('A number', true);
	} else {
	  this.model = model;
	}
	this.name = model.name;
	this.optional = model.optional;
  }
  render(el, schema) {
	this.el = el;
	this.el.innerHTML =
	  `<h3>Any number, e.g. -12.34 or 567</h3>
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
	  <div class="form-group">
	    <div class="col-3"></div>
 	    <div class="col-9">
	      <button class="btn" data-action="remove">Remove this</button>
      </div>
	  </div>
	  </form>`;

	let ctx = this;
	d3.select(el).select("#input-name").on('change', function() {
	  ctx.name = this.value; });
	d3.select(el).select("#input-optional").on('change', function() {
	  ctx.optional = this.checked;
	});
	d3.select(el).select("[data-action=remove]")
	  .on('click', function() {
		d3.event.preventDefault();
		schema.remove(ctx);
	  });
  }
  commit() {
	this.model.name = this.name;
	this.model.optional = this.optional;
  }
  rollback() {
	this.name = this.model.name;
	this.optional = this.model.optional;
  }
}
ScalarEditor.prototype.description = "A number";

let viewRegistry = new Map();
class SchemaView {
  constructor(schema) {
	this.schema = schema;
	this.name = this.schema.name;

	// Load all editor widgets from the registry
	this.widgets = schema.map((s) => {
	  if (!viewRegistry.has(s[Symbol.toStringTag])) {
		throw new Error("Unregistered editor: " + s.toString());
	  } else {
		return new (viewRegistry.get(s[Symbol.toStringTag]))(s);
	  }
	});
  }

  render(el) {
	// TODO move this to a 'workspace' view
	var root = document.createElement('div');
	el.appendChild(root);

	this.el = root;
	this.el.className = 'card shadow-0';
	this.renderViewer();
  }

  renderViewer() {
	this.el.innerHTML =
	  `<div class="card-header">
	    <div class="card-tools float-right">
 	      <a href="#" class="btn btn-link" title="edit">Edit</a>
	      <a href="#" class="btn btn-primary" title="close">Close</a>
	    </div>
	    <div class="card-title">${this.name}</div>
	  </div>
	  <div class="card-body"></div>
	  <div class="card-footer"></div>`;
	
	let ctx = this;
	let el = d3.select(this.el);

	el.select('[title=edit]').on('click', this.renderEditor.bind(this));
	// TODO 'close'

	// TODO create a drag/drop element
	el.select('.card-body').text('DROP ZONE');

	el.select('.card-footer')
	  .selectAll('.chip')
	  .data(this.schema.tags)
	  .enter()
	  .append('label').attr('class', 'chip').text((d) => d);
  }

  renderEditor() {
	this.el.innerHTML =
  	  `<div class="card-header">
	    <div class="card-tools float-right">
 	      <a href="#" class="btn btn-link" title="save">Save</a>
	      <a href="#" class="btn btn-primary" title="close">Close</a>
	    </div>
	    <form class="col-5 form-horizontal">
	    <input class="form-input" type="text" title="name"
   	      placeholder="Name" value="${this.name}"/>
	  </div>
	  <div class="card-body"></div>
	  <div class="card-footer"></div>`;

	  
	let ctx = this;
	let el = d3.select(this.el);

	el.select('[title=save]').on('click', this.commit.bind(this));
	el.select('[title=close]').on('click', this.rollback.bind(this));
	el.select('[title=name]').on('change', function() {
	  ctx.name = this.value;
	});

	// Widgets
	var widgets = el.select('.card-body')
		.append('div').attr('class', 'widgets');
	this.renderWidgets(widgets);
	  

	  // Control for adding a new attribute
	let editors = [];
	  viewRegistry.forEach((v) => editors.push(v));
	  el.select('.card-body').append('form')
		  .attr('class', 'form-horizontal col-5')
		  .html(`<div class="form-group">
		  <div class="col-3">
		  <label class="form-label" for="attribute-add">Add attribute</label>
		  </div>
		  <div class="col-9">
		  <select id="attribute-add" class="form-select">
		  </select>
		  </div>
				</div>`)
		  .select('#attribute-add')
		  .on('change', function() { alert('add!'); })
	      .selectAll('option')
		  .data(editors)
	  .enter()
	  .append('option')
	  .attr('value', (d,i) => i)
		  .text((d) => d.prototype.description);
  }

  renderWidgets(widgets) {
	let ctx = this;
	widgets
	  .selectAll('div.widget')
	  .data(this.widgets)
	  .enter()
	  .append((d, i) => {
		let el = document.createElement('div');
		el.className = 'widget col-5';
		d.render(el, ctx);
		return el;
	  });

	widgets.append('div').attr('class', 'divider');
  }

  commit() {
	this.schema.name = this.name;
	this.widgets.forEach((w) => w.commit());
	this.renderViewer();
  }

  rollback() {
	this.name = this.schema.name;
	this.widgets.forEach((w) => w.rollback());
	this.renderViewer();
  }

  remove(item) {
	alert('Remove: ' + item.name);
  }

  static register(domain, editor) {
	if (domain.prototype[Symbol.toStringTag] == undefined) {
	  throw new Error("Registered domains must have a toStringTag");
	}
	viewRegistry.set(domain.prototype[Symbol.toStringTag], editor);
  }
}

SchemaView.register(Scalar, ScalarEditor);
