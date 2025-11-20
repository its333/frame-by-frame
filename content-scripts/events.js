/*--------------------------------------------------------------
# EVENTS
----------------------------------------------------------------
# Property
# Create
# Remove
# Check active element
# Features
# Handler
# Keyboard
# Mouse
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# PROPERTY
--------------------------------------------------------------*/

extension.events = {
	data: {
		alt: false,
		ctrl: false,
		shift: false,
		keys: {}
	},
	keyboard: {},
	mouse: {}
};


/*--------------------------------------------------------------
# CREATE
--------------------------------------------------------------*/

extension.events.create = function (target) {
	for (var type in this[target]) {
		if (type !== 'mouseleave') {
			document.addEventListener(type, this[target][type], true);
		} else {
			window.addEventListener(type, this[target][type], true);
		}
	}
};


/*--------------------------------------------------------------
# REMOVE
--------------------------------------------------------------*/

extension.events.remove = function (target) {
	for (var type in this[target]) {
		document.removeEventListener(type, this[target][type]);
	}
};


/*--------------------------------------------------------------
# CHECK ACTIVE ELEMENT
--------------------------------------------------------------*/

extension.events.checkActiveElement = function (event) {
	if (
		event.target.isContentEditable || [
			'EMBED',
			'INPUT',
			'OBJECT',
			'TEXTAREA',
			'IFRAME'
		].includes((document.activeElement || {}).tagName)
	) {
		return true;
	}
};


/*--------------------------------------------------------------
# FEATURES
--------------------------------------------------------------*/

extension.events.features = {};


/*--------------------------------------------------------------
# HANDLER
--------------------------------------------------------------*/

extension.events.handler = function (event) {
	var prevent = false,
		activeVideo = null,
		uiVisible = extension.ui.classList.contains(extension.prefix + '--visible');

	if (extension.videoManager && typeof extension.videoManager.ensureActiveVideo === 'function') {
		activeVideo = extension.videoManager.ensureActiveVideo();
	}

	if (!activeVideo && extension.videos.active) {
		activeVideo = extension.videos.active;
	}

	// Allow keyboard shortcuts to work even when the overlay is hidden,
	// as long as we have an active video to target.
	if (activeVideo || uiVisible) {
		for (var key in extension.events.features) {
			var shortcut = extension.storage.items[key];

			if (shortcut) {
				var same_keys = true;

				if (
					(extension.events.data.alt === shortcut.alt || shortcut.hasOwnProperty('alt') === false) &&
					(extension.events.data.ctrl === shortcut.ctrl || shortcut.hasOwnProperty('ctrl') === false) &&
					(extension.events.data.shift === shortcut.shift || shortcut.hasOwnProperty('shift') === false) &&
					(extension.events.data.wheel === shortcut.wheel || shortcut.hasOwnProperty('wheel') === false)
				) {
					for (var code in extension.events.data.keys) {
						if (!shortcut.keys[code]) {
							same_keys = false;
						}
					}

					for (var code in shortcut.keys) {
						if (!extension.events.data.keys[code]) {
							same_keys = false;
						}
					}

					if (extension.events.data.wheel === 0) {
						if (same_keys === true) {
							if (activeVideo && extension.ui && typeof extension.ui.show === 'function' && uiVisible === false) {
								try {
									extension.ui.show(activeVideo.getBoundingClientRect());
								} catch (error) { }
							}

							extension.events.features[key](event);

							prevent = true;
						}
					}
				}
			}
		}
	}

	return prevent;
};


/*--------------------------------------------------------------
# KEYBOARD
--------------------------------------------------------------*/

extension.events.keyboard.keydown = function (event) {
	if (extension.events.checkActiveElement(event)) {
		return false;
	}

	// Normalize key codes for punctuation keys to improve cross-browser consistency.
	var keyCode = event.keyCode;
	if (!keyCode && event.key) {
		var map = {
			',': 188,
			'.': 190,
			'[': 219,
			']': 221
		};
		keyCode = map[event.key];
	}

	if (event.code === 'AltLeft' || event.code === 'AltRight') {
		extension.events.data.alt = true;
	} else if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
		extension.events.data.ctrl = true;
	} else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
		extension.events.data.shift = true;
	} else if (keyCode) {
		extension.events.data.keys[keyCode] = true;
	}

	extension.events.data.wheel = 0;

	if (extension.events.handler(event)) {
		event.preventDefault();
		event.stopPropagation();

		return false;
	}
};

extension.events.keyboard.keyup = function (event) {
	if (extension.events.checkActiveElement(event)) {
		return false;
	}

	if (event.code === 'AltLeft' || event.code === 'AltRight') {
		extension.events.data.alt = false;
	} else if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
		extension.events.data.ctrl = false;
	} else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
		extension.events.data.shift = false;
	} else {
		delete extension.events.data.keys[event.keyCode];
	}

	extension.events.data.wheel = 0;
};


/*--------------------------------------------------------------
# MOUSE
--------------------------------------------------------------*/

extension.events.mouse.mouseenter = function (event) {
	extension.cursor.x = event.clientX;
	extension.cursor.y = event.clientY;

	extension.videos.update();
};

extension.events.mouse.mouseleave = function (event) {
	extension.ui.hide();
};

extension.events.mouse.mousemove = function (event) {
	extension.cursor.x = event.clientX;
	extension.cursor.y = event.clientY;

	extension.videos.update();
	extension.ui.update();
	extension.ui.sleep();
};

extension.events.mouse.mousedown = function (event) {
	if (extension.ui.hover(extension.ui.toggle.getBoundingClientRect())) {
		event.preventDefault();
		event.stopPropagation();

		return false;
	}

	if (extension.storage.items.hidden !== true) {
		if (extension.ui.hover(extension.ui.drag.getBoundingClientRect())) {
			event.preventDefault();
			event.stopPropagation();

			extension.action = 2;

			extension.events.clickDrag.x = event.clientX - extension.ui.offsetLeft - extension.ui.surface.offsetLeft - extension.ui.surface.offsetWidth;
			extension.events.clickDrag.y = event.clientY - extension.ui.offsetTop - extension.ui.surface.offsetTop;

			extension.ui.classList.add(extension.prefix + '--busy');

			extension.cursor.style.set('grabbing');

			window.addEventListener('mousemove', extension.ui.actions.dragAndDrop);

			return false;
		}

		if (extension.ui.hover(extension.ui.resize.getBoundingClientRect())) {
			event.preventDefault();
			event.stopPropagation();

			extension.action = 3;

			extension.events.clickResize.x = event.clientX - extension.ui.offsetLeft - extension.ui.surface.offsetLeft - extension.ui.surface.offsetWidth;
			extension.events.clickResize.y = event.clientY - extension.ui.offsetTop - extension.ui.surface.offsetTop - extension.ui.surface.offsetHeight;

			extension.ui.classList.add(extension.prefix + '--busy');

			window.addEventListener('mousemove', extension.ui.actions.resize);

			return false;
		}
	}
};

extension.events.mouse.mouseup = function (event) {
	if (extension.action === 2) {
		chrome.storage.local.set({
			position: {
				x: extension.ui.surface.offsetLeft,
				y: extension.ui.surface.offsetTop
			}
		});
	} else if (extension.action === 3) {
		chrome.storage.local.set({
			size: {
				width: extension.ui.surface.offsetWidth,
				height: extension.ui.surface.offsetHeight
			}
		});
	}

	extension.action = 0;

	extension.ui.classList.remove(extension.prefix + '--busy');

	window.removeEventListener('mousemove', extension.ui.actions.dragAndDrop);
	window.removeEventListener('mousemove', extension.ui.actions.resize);

	extension.cursor.style.reset();

	if (
		extension.ui.hover(extension.ui.toggle.getBoundingClientRect()) ||
		(
			extension.storage.items.hidden !== true &&
			(
				extension.ui.hover(extension.ui.drag.getBoundingClientRect()) ||
				extension.ui.hover(extension.ui.resize.getBoundingClientRect())
			)
		)
	) {
		event.preventDefault();
		event.stopPropagation();

		return false;
	}
};

extension.events.mouse.click = function (event) {
	if (extension.ui.hover(extension.ui.toggle.getBoundingClientRect())) {
		extension.ui.actions.toggle();
	}

	if (
		extension.ui.hover(extension.ui.toggle.getBoundingClientRect()) ||
		(
			extension.storage.items.hidden !== true &&
			(
				extension.ui.hover(extension.ui.drag.getBoundingClientRect()) ||
				extension.ui.hover(extension.ui.resize.getBoundingClientRect())
			)
		)
	) {
		event.preventDefault();
		event.stopPropagation();

		return false;
	}
};

extension.events.mouse.scroll = function (event) {
	extension.videos.update();
};

extension.events.mouse.wheel = function (event) {
	if (event.deltaY > 0) {
		extension.events.data.wheel = 1;
	} else {
		extension.events.data.wheel = -1;
	}

	if (extension.events.handler(event)) {
		event.preventDefault();
	}
};
