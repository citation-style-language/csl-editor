<?php
$otherURL = $_GET['url'];
$otherPage = fopen($otherURL, "r");
if ($otherPage) {
	while(!feof($otherPage)) {
		echo fgets($otherPage);
	}
} else {
	echo "Error opening URL: $otherURL";
}
?>
