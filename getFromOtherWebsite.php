<?php
$otherURL = $_GET['url'];
$otherPage = http_parse_message(http_get($otherURL, array("redirect" => 3)))->body;
echo $otherPage;
?>
