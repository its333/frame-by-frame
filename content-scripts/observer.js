/*--------------------------------------------------------------
# MUTATION OBSERVER
--------------------------------------------------------------*/

extension.observer = {
	instance: null,
	callback: null
};

extension.observer.create = function () {
	if (!this.callback) {
		this.callback = extension.videos.handleMutations.bind(extension.videos);
	}

	if (!this.instance) {
		this.instance = new MutationObserver(this.callback);
	}

	this.instance.observe(document, {
		childList: true,
		subtree: true
	});

	extension.videos.queryExisting();
};

extension.observer.query = function () {
	extension.videos.queryExisting();
};

extension.observer.remove = function () {
	if (this.instance) {
		this.instance.disconnect();
	}

	extension.videos.reset();
};
