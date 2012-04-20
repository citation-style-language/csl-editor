<?php
$otherURL = $_GET['url'];
$otherPage = fopen($otherURL, "r");
while(!feof($otherPage)) {
	echo fgets($otherPage);
}
?>
