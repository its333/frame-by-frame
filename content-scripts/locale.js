/*--------------------------------------------------------------
# LOCALIZATION
----------------------------------------------------------------
# Property
# Get
# Import
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# PROPERTY
--------------------------------------------------------------*/

extension.locale = {
	message: {}
};


/*--------------------------------------------------------------
# GET
--------------------------------------------------------------*/

extension.locale.get = function (message) {
	var bucket = (this && this.message) ? this.message : {};

	if (bucket && Object.prototype.hasOwnProperty.call(bucket, message)) {
		return bucket[message];
	}

	return message;
};


/*--------------------------------------------------------------
# IMPORT
--------------------------------------------------------------*/

extension.locale.import = function () {
	extension.message.sent({ action: 'get-locale'}, function (response) {
		extension.locale.message = response;
		document.dispatchEvent(new CustomEvent('locale-updated'));
	});
};
