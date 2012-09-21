"use strict";

// A slide-down notification bar with a "Dismiss" button

define(function () {
	var element, messageElement;

	// Initialise the notification bar
	//
	// - _element - the jQuery element to initialise within
	//              Note: this should contain
	//              - <span class=message/> to put messages in
	//              - <button class=dismiss>Your Dismiss Text</button>
	var init = function (_element) {
		element = _element;
		messageElement = element.find('span.message');
		
		element.find('button.dismiss').on('click', function () {
			element.slideUp();
		});
	};

	// Display a plain text or html message within 'span.message'
	//
	// - message - the message to display
	// - useHtml - set this to true if your message is HTML
	var showMessage = function (message, useHtml /* optional */) {
		var percentage;

		element.css({'display' : 'none'});

		if (useHtml) {
			messageElement.html(message);
		} else {
			messageElement.text(message);
		}

		percentage = Math.round(50 * 
			(element.parent().width() - element.width()) / element.parent().width());

		element.css({
			'left' : percentage + '%'
		});
		element.slideDown();
	};

	return {
		init : init,
		showMessage : showMessage
	};
});
