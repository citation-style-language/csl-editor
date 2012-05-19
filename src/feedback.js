"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.feedback = {
	init : function (feedbackPanel) {

		feedbackPanel.find('input:submit').on('click', function () {
			var message, email;

			message = feedbackPanel.find('.message').val();
			email = feedbackPanel.find('.email').val();

			var url = "/csl/server/sendFeedback.php?subject=" + encodeURIComponent("CSL editor feedback") +
				"&message=" + encodeURIComponent(message) +
				"&email=" + encodeURIComponent(email);

			$.ajax({
			  url: url
			}).done(function ( data ) {
				$('<div title="Feedback Sent"><\/div>').append(data).dialog();
				if (/Thanks for your feedback!\s*$/.test(data)) {
					feedbackPanel.find('.message').val("");
				}
			}).fail(function () {
				alert("Error, feedback not sent.");
			});
			
		});
	}
};
