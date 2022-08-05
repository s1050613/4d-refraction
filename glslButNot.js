/*

GLSL swizzling but in JS? ...
Supported: x, y, z, xy, xz, yz, xyz

*/

Object.defineProperty(Array.prototype, "x", {
	get: function() {
		return this[0];
	},
	set: function(n) {
		this[0] = n;
	}
});
Object.defineProperty(Array.prototype, "y", {
	get: function() {
		return this[1];
	},
	set: function(n) {
		this[1] = n;
	}
});
Object.defineProperty(Array.prototype, "z", {
	get: function() {
		return this[2];
	},
	set: function(n) {
		this[2] = n;
	}
});
Object.defineProperty(Array.prototype, "xy", {
	get: function() {
		return [this[0], this[1]];
	},
	set: function(n) {
		[this[0], this[1]] = n;
	}
});
Object.defineProperty(Array.prototype, "xz", {
	get: function() {
		return [this[0], this[2]];
	},
	set: function(n) {
		[this[0], this[2]] = n;
	}
});
Object.defineProperty(Array.prototype, "yz", {
	get: function() {
		return [this[1], this[2]];
	},
	set: function(n) {
		[this[1], this[2]] = n;
	}
});
Object.defineProperty(Array.prototype, "xyz", {
	get: function() {
		return [this[0], this[1], this[2]];
	},
	set: function(n) {
		[this[0], this[1], this[2]] = n;
	}
});