/*--------------------------------------------------------------
>>> OPTIONS PAGE
----------------------------------------------------------------
# Global variable
# Initialization
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# GLOBAL VARIABLE
--------------------------------------------------------------*/

var extension = {
	skeleton: {}
};

function renderError(messageKey) {
	extension.skeleton.main.layers.toolbar = {
		component: 'alert',
		variant: 'error',
		text: function () {
			return satus.locale.get(messageKey || 'somethingWentWrongTryReloadingThePage');
		}
	};

	satus.render(extension.skeleton);
}

function prepareUnsupportedToolbar(message) {
	extension.skeleton.main.layers.toolbar = {
		component: 'section',
		variant: 'card',
		text: message,
		action: {
			component: 'button',
			text: 'Open supported tab',
			on: {
				click: function () {
					chrome.tabs.create({ url: 'https://example.com' });
				}
			}
		}
	};
}


/*--------------------------------------------------------------
# INITIALIZATION
--------------------------------------------------------------*/

satus.storage.import(function (items) {
	var language = items.language;

	if (!language || language === 'default') {
		language = window.navigator.language;
	}

	satus.locale.import(language, function () {
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, function (tabs) {
			var tab = tabs[0];

			if (!tab || !tab.id) {
				prepareUnsupportedToolbar('No active tab detected. Open a website to configure Frame by Frame Pro.');
				return;
			}

			chrome.tabs.sendMessage(tab.id, {
				action: 'options-page-connected'
			}, function (response) {
				// Handle missing receivers (e.g., chrome:// pages) gracefully.
				if (chrome.runtime.lastError) {
					var errMsg = chrome.runtime.lastError && chrome.runtime.lastError.message ? chrome.runtime.lastError.message : 'No receiver in tab';
					console.warn('Frame-by-Frame options: unable to reach tab - ' + errMsg);
					prepareUnsupportedToolbar('This tab cannot be controlled. Open a regular webpage to enable shortcuts.');
					return;
				}

				extension.hostname = response;

				if (!response) {
					extension.skeleton.main.layers.toolbar = {
						component: 'alert',
						variant: 'error',
						text: function () {
							return satus.locale.get('somethingWentWrongTryReloadingThePage');
						}
					};
				} else if (
					response.startsWith('about:') ||
					response.startsWith('chrome') ||
					response.startsWith('edge') ||
					response.startsWith('https://addons.mozilla.org') ||
					response.startsWith('https://chrome.google.com/webstore') ||
					response.startsWith('https://microsoftedge.microsoft.com/addons') ||
					response.startsWith('moz') ||
					response.startsWith('view-source:') ||
					response.endsWith('.pdf')
				) {
					prepareUnsupportedToolbar(
						satus.locale.get('thePageHOSTNAMEisProtectedByBrowser').replace('HOSTNAME', response)
					);
				} else {
					extension.skeleton.main.layers.toolbar = {
						component: 'alert',
						variant: 'success',

						switch: {
							component: 'switch',
							text: response,
							storage: 'domains/' + response,
							value: true
						}
					};
				}

				satus.render(extension.skeleton);

				extension.exportSettings();
				extension.importSettings();
			});
		});
	}, '_locales/');
});

chrome.runtime.sendMessage({
	action: 'options-page-connected'
}, function (response) {
	if (chrome.runtime.lastError) {
		var errMsg = chrome.runtime.lastError && chrome.runtime.lastError.message ? chrome.runtime.lastError.message : 'Background not reachable';
		console.warn('Frame-by-Frame options: background not reachable - ' + errMsg);
		renderError();
		return;
	}

	if (response.isPopup === false) {
		document.body.setAttribute('tab', '');
	}
});
