class IntegerEditor {
  constructor(model) {
	this.model = model;
	this.label = model.label;
	this.description = "An ordinary number";
  }
  render(el) {
	el
	  .append('div').attr('class', 'description')
	  .text('A double-precision floating point number.');
  }
  commit() {
	this.model.label = this.label;
  }
  rollback() {
	this.label = this.model.label;
  }
}

let viewRegistry = new Map();
class SchemaView {
  constructor(schema) {
	this.schema = schema;

	// Load all editor widgets from the registry
	this.widgets = schema.map((s) => {
	  if (viewRegistry[s[Symbol.toStringTag]] == undefined) {
		throw new Error("Unregistered editor: " + s.toString());
	  } else {
		return new viewRegistry[s[Symbol.toStringTag]](s);
	  }
	});
  }

  render(el) {
	// el contains the container div
	this.el = d3.select(el);
	this.renderViewer();
  }

  renderViewer() {
	// remove any existing elements
	this.el.selectAll('*').remove();

	// add menu
	this.el
	  .selectAll('div.menu')
	  .data([
	    { text: 'Edit', action: this.renderEditor.bind(this) }
	  ])
	  .enter()
	  .append('div')
	  .attr('class', 'menu-tool')
	    .text((d) => d.text)
  	  .on('click', (d) => d.action());
  }

  renderEditor() {
	// remove any existing elements
	this.el.selectAll('*').remove();

	// add menu
	this.el
	  .selectAll('div.menu-tool')
	  .data([
	    { text: 'Save', action: this.commit.bind(this) },
		{ text: 'Cancel', action: this.rollback.bind(this) }
	  ])
	  .enter()
	  .append('div')
	  .attr('class', 'menu-tool')
	    .text((d) => d.text)
  	  .on('click', (d) => d.action());

	// add widgets
	this.el
	  .selectAll('div.widgets')
	  .data(this.widgets)
	  .enter()
	  .append((d, i) => {
		var widget = d3.select(document.createElement('div'))
		    .attr('class', 'widget');

		widget
		  .append('span')
		  .attr('class', 'label')
 		    .append('input')
		    .attr('type', 'text')
		    .attr('placeholder', 'Name')
		  .attr('value', d.label)
		  .on('change', function() {
			d.label = this.value
		  });

		var editor = widget
			.append('div')
		    .attr('class', 'editor');
		d.render(editor);
		
		return widget.node(0);
	  });
  }

  commit() {
	this.widgets.forEach((w) => w.commit());
	this.renderViewer();
  }

  rollback() {
	this.widgets.forEach((w) => w.rollback());
	this.renderViewer();
  }

  static register(domain, editor) {
	if (domain.prototype[Symbol.toStringTag] == undefined) {
	  throw new Error("Registered domains must have a toStringTag");
	}
	viewRegistry[domain.prototype[Symbol.toStringTag]] = editor;
  }
}

SchemaView.register(Integer, IntegerEditor);
