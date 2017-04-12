class DataSourceView {
  constructor(datasource) {
	this.datasource = datasource;
	this.id = datasource.id;
	this.name = datasource.name;

	// Load all schema widgets from the view registry
	this.widgets = datasource.schema.map((s) => {
	  if (!viewRegistry.has(s[Symbol.toStringTag])) {
		throw new Error("Unregistered editor: " + s.toString());
	  } else {
		return new (viewRegistry.get(s[Symbol.toStringTag]))(s, this);
	  }
	});

	this.width = 500;
	this.height = 300;
	this.rowHeight = 20;
	this.rowCount = this.height / this.rowHeight;
  }

  render(el) {
	this.el = el;
	this.el.className = 'card shadow-0';
	this.el.innerHTML =
	  `<div class="card-header">
        <div class="btn-group btn-group-block float-right">
          <button class="btn" title="query">Query</button>
          <button class="btn" title="close">Close</button>
        </div>
        <div class="card-title">${this.name}</div>
      </div>
      <div class="card-body">
        <div class="portal-hdr"></div>
        <div class="portal">
        </div>
        <input class="slider" type="range"/>
      </div>
      <div class="card-footer"></div>`;

	// Menu
	this.el.querySelector('[title=query]')
	  .addEventListener('click', (e) => this.query());
	this.el.querySelector('[title=close]')
	  .addEventListener('click', (e) => this.close());

	// Heading
	var header = this.querySelector('.portal-hdr');
	this.widgets.forEach((w) => {
	  var sp = document.createElement('span');
	  sp.style.width = 80;
	  sp.style.fontWeight = 'bold';
	  sp.innerText = w.name;
	  header.appendChild(sp);
	});
	
	// Data panel
	this.panel = this.el.querySelector('.portal-data');
	this.panel.style.width = this.width;
	this.panel.style.height = this.height;

	// Slider
	var max = (this.numRows > this.data.length)
		? this.data.length - this.numRows : 0;
	this.slider = this.el.querySelector('.slider');
	this.slider.style.width = this.width;
	this.slider.addEventListener('change',
	  (e) => this.renderRows(this.slider.value));
	this.slider.min = 0;
	this.slider.max = max;
	this.slider.value = 0;
	if (max === 0) {
	  this.slider.disabled = true;
	}
	this.renderRows(0);
	
	// Tags
	d3.select(this.el)
	  .select('.card-footer')
	  .selectAll('.chip')
	  .data(this.datasource.tags)
	  .enter()
	  .append('label').attr('class', 'chip').text((d) => d);
  }

  renderRows(idx) {
	var count = (idx + rowCount > this.data.length)
		? this.data.length - idx : rowCount;
	var range = Array.from(new Array(count), (x, i) => i + idx);
	var panel = d3.select(this.panel);
	  .selectAll('.portal-row')
	  .data(range);
	panel
	  .enter()
	  .append((d, i) => {
		var row = document.createElement('div');
		row.className = 'portal-row';
		for (var di = 0; di < rowCount; ++di) {
		  this.data[idx + di].forEach((dv) => {
			var s = document.createElement('span');
			this.widgets[di].renderValue(s, dv);
			row.appendChild(s);
		  });
		}
		return row;
	  });
	panel
	  .exit()
	  .remove();
  }
  
  close() {
	this.dispatch('close', this);
  }

  query() {
	this.dispatch('query', this);
  }
}
