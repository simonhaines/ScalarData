var Event = {
  enable: function(item) {
	item.events = new Map();
	item.on = this.on;
	item.dispatch = this.dispatch;
  },
  on: function(event, callback) {
	this.events.set(event, callback);
  },
  dispatch: function(event, ...args) {
	for (var entry of this.events.entries()) {
	  if (entry[0].split('.')[0] === event) {
		entry[1](...args);
	  }
	}
  }
}
