<?php
if (file_exists('feedbackEmail.txt')) {
	$toEmail = file_get_contents('feedbackEmail.txt');

	//send email
	$subject = $_REQUEST['subject'];
	$message = $_REQUEST['message'];
	$fromEmail = $_REQUEST['email'];

	mail($toEmail, $subject, $message, "From:" . $fromEmail);
	echo "Thanks for your feedback!";
} else {
	echo "No recipient email address. Feedback not sent.";
}
?>

