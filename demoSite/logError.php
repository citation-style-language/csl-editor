<?php
// write to error.log file
$success = error_log("\nDate: " . date('d.m.Y h:i:s') . "\n" . $_REQUEST['message'] . "\n", 3, "error.log");
if ($success == TRUE) {
        echo "success";
} else {
        echo "fail";
}
?>

