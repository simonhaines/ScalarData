class Workspace {
  constructor(el) {
	this.el = el;
	this.panels = new Map();
  }

  add(item) {
	var panel = document.createElement('div');
	item.render(panel);
	this.el.appendChild(panel);
	this.panels.set(item.id, panel);
  }

  remove(item) {
	if (this.panels.has(item.id)) {
	  this.el.removeChild(this.panels.get(item.id));
	  this.panels.delete(item.id);
	}
  }
}
