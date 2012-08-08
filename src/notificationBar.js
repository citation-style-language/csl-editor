"use strict";

define(function () {
	var element, messageElement;

	return {
		init : function (_element) {
			element = _element;
			messageElement = element.find('span.message');
			
			element.find('button.dismiss').on('click', function () {
				element.slideUp();
			});
		},
		showMessage : function (message) {
			var percentage;

			element.css({'display' : 'none'});
			messageElement.html(message);

			percentage = Math.round(50 * 
				(element.parent().width() - element.width()) / element.parent().width());

			element.css({
				'left' : percentage + '%'});
			element.slideDown();
		}
	}
});
