/*--------------------------------------------------------------
# STORAGE
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# IMPORT
--------------------------------------------------------------*/

document.addEventListener('storage-import', function () {
	var items = extension.storage.items;
	var defaults = {
		increase_framerate: {
			keys: {
				221: {
					key: ']'
				}
			}
		},
		decrease_framerate: {
			keys: {
				219: {
					key: '['
				}
			}
		},
		next_shortcut: {
			keys: {
				190: {
					key: '.'
				}
			}
		},
		prev_shortcut: {
			keys: {
				188: {
					key: ','
				}
			}
		},
		hide_shortcut: {
			keys: {
				72: {
					key: 'h'
				}
			}
		}
	};

	var legacyKeys = {
		increase_framerate: 38,
		decrease_framerate: 40,
		next_shortcut: 39,
		prev_shortcut: 37
	};

	var updates = {};

	var isLegacyShortcut = function (shortcut, expectedCode) {
		if (!shortcut || !shortcut.keys) {
			return false;
		}

		var codes = Object.keys(shortcut.keys);

		return codes.length === 1 &&
			Number(codes[0]) === expectedCode &&
			shortcut.alt !== true &&
			shortcut.ctrl !== true &&
			shortcut.shift !== true;
	};

	var ensureShortcut = function (name) {
		var current = items[name];
		var shouldReplace = false;

		if (items.hasOwnProperty(name) === false) {
			shouldReplace = true;
		} else if (isLegacyShortcut(current, legacyKeys[name])) {
			shouldReplace = true;
		} else {
			var keys = (current && current.keys) ? Object.keys(current.keys) : [];
			// Force to new defaults if keys do not match the desired single-key mapping.
			if (keys.length !== 1 || Number(keys[0]) !== Object.keys(defaults[name].keys).map(Number)[0]) {
				shouldReplace = true;
			}
		}

		if (shouldReplace) {
			items[name] = defaults[name];
			updates[name] = defaults[name];
		}
	};

	ensureShortcut('increase_framerate');
	ensureShortcut('decrease_framerate');
	ensureShortcut('next_shortcut');
	ensureShortcut('prev_shortcut');

	if (items.hasOwnProperty('hide_shortcut') === false) {
		items.hide_shortcut = defaults.hide_shortcut;
		updates.hide_shortcut = defaults.hide_shortcut;
	}

	if (Object.keys(updates).length > 0) {
		chrome.storage.local.set(updates);
	}

	if (items.hasOwnProperty('framerate')) {
		extension.framerate = items.framerate;
	}
});


/*--------------------------------------------------------------
# CHANGE
--------------------------------------------------------------*/

document.addEventListener('storage-change', function (event) {
	if (event.detail.key === 'framerate') {
		extension.framerate = event.detail.value;
	}
});
