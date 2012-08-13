<?php
$otherURL = filter_var($_GET['url'], FILTER_SANITIZE_URL);

if (substr($otherURL, 0, 7) != "http://") {
	echo 'Invalid URL, must start with "http://"';
	return;
}

$otherPage = fopen($otherURL, "r");
if ($otherPage) {
	while(!feof($otherPage)) {
		echo fgets($otherPage);
	}
} else {
	echo "Error opening URL: $otherURL";
}
?>
