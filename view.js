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
  render(el) {
	let ctx = this;
	el.text('Any number, e.g. -12.34 or 567.')
	let container = el.append('div');
	container
	  .append('input')
	  .attr('type', 'checkbox')
	  .attr('checked', this.optional ? 'checked' : null)
	  .on('change', function() {
		ctx.optional = this.checked;
	  });
	container.append('span').text('May be absent (becomes 0)');
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
	// el contains the panel div
	this.el = document.createElement('div');
	this.el.className = 'panel';
	el.appendChild(this.el);

	this.renderViewer();
  }

  renderViewer() {
	let ctx = this;
	let el = d3.select(this.el);
    el.selectAll('*').remove();
	el.append('div')
	  .attr('class', 'toolbar')
	  .selectAll('button')
	  .data([
	    { text: 'Edit', action: this.renderEditor.bind(this) },
	  ])
	  .enter()
	  .append('button').attr('type', 'button').attr('class', 'small')
	  .text((d) => d.text)
  	  .on('click', (d) => d.action());
	el.append('h1').text(this.name);

	// TODO create a drag/drop element
	el.append('div').attr('min-height', '50px').text('drop zone');

	el.append('div').attr('class', 'tags')
	  .selectAll('.tag')
	  .data(this.schema.tags)
	  .enter()
	  .append('span').attr('class', 'tag').text((d) => d);
  }

  renderEditor() {
	let ctx = this;
	let el = d3.select(this.el);
	el.selectAll('*').remove();
	el.append('div')
	  .attr('class', 'toolbar')
	  .selectAll('button')
	  .data([
	    { text: 'Save', action: this.commit.bind(this) },
		{ text: 'Cancel', action: this.rollback.bind(this) }
	  ])
	  .enter()
	  .append('button')
	  .attr('type', 'button').attr('class', 'small')
	  .text((d) => d.text)
	  .on('click', (d) => d.action());

	// Title editor
	el.append('input')
	  .attr('type', 'text')
	  .attr('class', 'name-editor')
	  .attr('value', this.name)
	  .attr('placeholder', 'Schema name')
	  .on('change', function() { ctx.name = this.value; });

	var widgets = el.append('div').attr('class', 'widgets');
	this.renderWidgets(widgets);

	// Control for adding a new attribute
	let editors = [];
	viewRegistry.forEach((v) => editors.push(v));
	let attribute = el.append('div')
		.attr('class', 'attribute');
	attribute
	  .append('span')
	  .attr('class', 'attribute-name')
	  .text('Add a new attribute:');
	let attributeValue = attribute
	  .append('span')
		.attr('class', 'attribute-value attribute-ctrl');
	attributeValue
	  .append('select')
	  .selectAll('option')
	  .data(editors)
	  .enter()
	  .append('option')
	  .attr('value', (d,i) => i)
      .text((d) => d.prototype.description);
	attributeValue
	  .append('button').attr('type', 'button').text('add')
	  .on('click', function(d, i) { alert('add'); });
  }

  renderWidgets(widgets) {
	widgets
	  .selectAll('div.widget')
	  .data(this.widgets)
	  .enter()
	  .append((d, i) => {
		var widget = d3.select(document.createElement('div'))
		    .attr('class', 'attribute');
		let widgetName = widget
		  .append('span')
			.attr('class', 'attribute-name');
		widgetName
 		    .append('input')
		    .attr('type', 'text')
		    .attr('placeholder', 'Name')
		  .attr('value', d.name)
		  .on('change', function() {
			d.name = this.value
		  });
		widgetName
		  .append('button').attr('class', 'small')
		  .text('Remove')
		  .on('click', function(d) {
			alert('remove!');
		  });

		var editor = widget
			.append('span')
		    .attr('class', 'attribute-value');
		d.render(editor);
		
		return widget.node(0);
	  });
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

  static register(domain, editor) {
	if (domain.prototype[Symbol.toStringTag] == undefined) {
	  throw new Error("Registered domains must have a toStringTag");
	}
	viewRegistry.set(domain.prototype[Symbol.toStringTag], editor);
  }
}

SchemaView.register(Scalar, ScalarEditor);
