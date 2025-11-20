/*--------------------------------------------------------------
# USER INTERFACE
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# CREATE
--------------------------------------------------------------*/

function updateLocaleTextUi() {
	var get = extension.locale.get;

	extension.ui.time_text.textContent = get("time") || "Time";
	extension.ui.duration_text.textContent = get("duration") || "Duration";
	extension.ui.frame_text.textContent = get("frame") || "Frame";
	extension.ui.framerate_text.textContent = get("framerate") || "FPS";
}

document.addEventListener('ui-create', function (event) {
	var time_container = document.createElement('div'),
		duration_container = document.createElement('div'),
		frame_container = document.createElement('div'),
		framerate_container = document.createElement('div');

	extension.ui.time = document.createElement('div');
	extension.ui.duration = document.createElement('div');
	extension.ui.frame = document.createElement('div');
	extension.ui.framerate = document.createElement('div');
	extension.ui.framerate_detect = document.createElement('button');

	extension.ui.time_text = document.createElement('div');
	extension.ui.time_text.className = extension.prefix + '__label';

	extension.ui.duration_text = document.createElement('div');
	extension.ui.duration_text.className = extension.prefix + '__label';

	extension.ui.frame_text = document.createElement('div');
	extension.ui.frame_text.className = extension.prefix + '__label';

	extension.ui.framerate_text = document.createElement('div');
	extension.ui.framerate_text.className = extension.prefix + '__label';

	// sensible defaults in case locale has not loaded yet
	extension.ui.time_text.textContent = 'Time';
	extension.ui.duration_text.textContent = 'Duration';
	extension.ui.frame_text.textContent = 'Frame';
	extension.ui.framerate_text.textContent = 'FPS';

	time_container.className = extension.prefix + '__container ' + extension.prefix + '__container--time';
	duration_container.className = extension.prefix + '__container ' + extension.prefix + '__container--duration';
	frame_container.className = extension.prefix + '__container ' + extension.prefix + '__container--frame';
	framerate_container.className = extension.prefix + '__container ' + extension.prefix + '__container--framerate';

	extension.ui.time.className = extension.prefix + '__value';
	extension.ui.duration.className = extension.prefix + '__value';
	extension.ui.frame.className = extension.prefix + '__value';
	extension.ui.framerate.className = extension.prefix + '__value';
	extension.ui.framerate_detect.className = extension.prefix + '__detect';
	extension.ui.framerate_detect.type = 'button';
	extension.ui.framerate_detect.textContent = 'Auto';

	time_container.appendChild(extension.ui.time_text);
	time_container.appendChild(extension.ui.time);

	duration_container.appendChild(extension.ui.duration_text);
	duration_container.appendChild(extension.ui.duration);

	frame_container.appendChild(extension.ui.frame_text);
	frame_container.appendChild(extension.ui.frame);

	framerate_container.appendChild(extension.ui.framerate_text);
	framerate_container.appendChild(extension.ui.framerate_detect);
	framerate_container.appendChild(extension.ui.framerate);

	extension.ui.surface.appendChild(time_container);
	extension.ui.surface.appendChild(duration_container);
	extension.ui.surface.appendChild(frame_container);
	extension.ui.surface.appendChild(framerate_container);

	updateLocaleTextUi();
	document.addEventListener('locale-updated', updateLocaleTextUi);

	extension.ui.framerate_detect.addEventListener('click', function (event) {
		event.stopPropagation();

		if (extension.videoManager && typeof extension.videoManager.detectFramerate === 'function') {
			extension.videoManager.detectFramerate();
		}
	});
});


/*--------------------------------------------------------------
# UPDATE
--------------------------------------------------------------*/

document.addEventListener('ui-update', function () {
	var framerate = 60;

	if (extension.storage.items.hasOwnProperty('framerate') === true) {
		framerate = extension.storage.get('framerate');
	}

	extension.ui.time.textContent = extension.videos.active.currentTime.toFixed(2);
	extension.ui.duration.textContent = extension.videos.active.duration.toFixed(2);
	extension.ui.frame.textContent = Math.floor(extension.videos.active.currentTime * framerate);
	extension.ui.framerate.textContent = framerate;
});


/*--------------------------------------------------------------
# STYLES
--------------------------------------------------------------*/

document.addEventListener('ui-styles', function () {
	var storage = extension.storage.items;

	if (storage.background_color) {
		if (storage.hasOwnProperty('opacity')) {
			extension.ui.surface.style.setProperty('background-color', 'rgba(' + storage.background_color.join(',') + ',' + storage.opacity + ')', 'important');
		} else {
			extension.ui.surface.style.setProperty('background-color', 'rgba(' + storage.background_color.join(',') + ',0.8)', 'important');
		}
	}

	if (storage.outline_color) {
		extension.ui.style.setProperty('box-shadow', 'inset 0 0 0 1px rgba(' + storage.outline_color.join(',') + ')', 'important');
	}

	if (storage.text_color) {
		extension.ui.surface.style.setProperty('color', 'rgb(' + storage.text_color.join(',') + ')', 'important');
		extension.ui.surface.style.setProperty('--fbf-color', storage.text_color.join(','), 'important');
	}

	if (storage.blur) {
		extension.ui.surface.style.setProperty('backdrop-filter', 'blur(' + storage.blur + 'px)', 'important');
	}
});
