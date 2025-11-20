/*--------------------------------------------------------------
# VIDEOS
--------------------------------------------------------------*/

extension.videos = {
	active: null,
	items: new Set(),
	scrollParents: new Map(),
	metadata: new WeakMap(),
	initialized: false
};


/*--------------------------------------------------------------
# INTERNAL HELPERS
--------------------------------------------------------------*/

extension.videos.ensureInitialized = function () {
	if (this.initialized) {
		return;
	}

	this.initialized = true;

	this.boundUpdate = this.update.bind(this);
	this.boundTimeUpdate = this.handleTimeUpdate.bind(this);

	document.addEventListener('timeupdate', this.boundTimeUpdate, true);

	this.resizeObserver = new ResizeObserver(function (entries) {
		for (var i = 0, l = entries.length; i < l; i++) {
			var entry = entries[i];

			if (entry && extension.videos.items.has(entry.target)) {
				extension.videos.update();
			}
		}
	});
};

extension.videos.walk = function (node, callback) {
	if (!node) {
		return;
	}

	callback(node);

	var children = node.children;

	if (children) {
		for (var i = 0, l = children.length; i < l; i++) {
			this.walk(children[i], callback);
		}
	}
};

extension.videos.attachScrollListeners = function (video) {
	var parent = video.parentNode;
	var parents = [];

	while (parent && parent !== document.body) {
		parents.push(parent);

		var count = this.scrollParents.get(parent) || 0;

		if (count === 0) {
			parent.addEventListener('scroll', this.boundUpdate, true);
		}

		this.scrollParents.set(parent, count + 1);

		parent = parent.parentNode;
	}

	this.metadata.set(video, {
		scrollParents: parents
	});
};

extension.videos.detachScrollListeners = function (video) {
	var metadata = this.metadata.get(video);
	var parents = (metadata || {}).scrollParents || [];

	for (var i = 0, l = parents.length; i < l; i++) {
		var parent = parents[i];
		var count = this.scrollParents.get(parent) || 0;

		if (count <= 1) {
			parent.removeEventListener('scroll', this.boundUpdate, true);

			this.scrollParents.delete(parent);
		} else {
			this.scrollParents.set(parent, count - 1);
		}
	}

	this.metadata.delete(video);
};

extension.videos.pruneDetached = function () {
	var toRemove = [];

	this.items.forEach(function (video) {
		if (!video.isConnected) {
			toRemove.push(video);
		}
	});

	for (var i = 0, l = toRemove.length; i < l; i++) {
		this.remove(toRemove[i]);
	}
};


/*--------------------------------------------------------------
# ADD / REMOVE
--------------------------------------------------------------*/

extension.videos.add = function (node) {
	if (!node || node.nodeName !== 'VIDEO') {
		return;
	}

	this.ensureInitialized();

	if (this.items.has(node)) {
		return;
	}

	this.items.add(node);

	this.attachScrollListeners(node);
	this.resizeObserver.observe(node);

	this.update();
};

extension.videos.remove = function (node) {
	if (!this.items.has(node)) {
		return;
	}

	this.items.delete(node);

	this.detachScrollListeners(node);

	if (this.resizeObserver) {
		this.resizeObserver.unobserve(node);
	}

	if (this.active === node) {
		this.active = null;

		extension.ui.hide();
	}
};


/*--------------------------------------------------------------
# MUTATION OBSERVER INTEGRATION
--------------------------------------------------------------*/

extension.videos.handleMutations = function (mutationList) {
	for (var i = 0, l = mutationList.length; i < l; i++) {
		var mutation = mutationList[i];

		if (mutation.type === 'childList') {
			for (var j = 0, k = mutation.addedNodes.length; j < k; j++) {
				this.walk(mutation.addedNodes[j], function (node) {
					extension.videos.add(node);
				});
			}

			for (var j = 0, k = mutation.removedNodes.length; j < k; j++) {
				this.walk(mutation.removedNodes[j], function (node) {
					extension.videos.remove(node);
				});
			}
		}
	}

	this.pruneDetached();
};

extension.videos.queryExisting = function () {
	this.ensureInitialized();

	var videos = document.querySelectorAll('video');

	for (var i = 0, l = videos.length; i < l; i++) {
		this.add(videos[i]);
	}

	this.pruneDetached();
};


/*--------------------------------------------------------------
# EVENT HANDLERS
--------------------------------------------------------------*/

extension.videos.handleTimeUpdate = function (event) {
	var target = event.target;

	if (!target || target.nodeName !== 'VIDEO' || this.items.has(target) === false) {
		return;
	}

	extension.ui.update();

	document.dispatchEvent(new CustomEvent('video-timeupdate', {
		detail: {
			currentTime: target.currentTime,
			duration: target.duration
		}
	}));
};


/*--------------------------------------------------------------
# UPDATE
--------------------------------------------------------------*/

extension.videos.update = function () {
	this.pruneDetached();

	var iterator = this.items.values();
	var result = iterator.next();

	while (result.done === false) {
		if (extension.cursor.check(result.value) === true) {
			return true;
		}

		result = iterator.next();
	}

	extension.ui.hide();
};


/*--------------------------------------------------------------
# RESET
--------------------------------------------------------------*/

extension.videos.reset = function () {
	var videos = Array.from(this.items);

	for (var i = 0, l = videos.length; i < l; i++) {
		this.remove(videos[i]);
	}

	if (this.resizeObserver) {
		this.resizeObserver.disconnect();
	}
};
