<?php
ob_start();
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="css/style.css" type="text/css">
    <link rel="icon" href="images/icon_web.png" type="image/png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <title>Tiệm bách hóa Hai Tụi Mình</title>
</head>
<body>
    <?php
            include("pages/header.php");
    ?>
    <div class="wrapper">
        <?php   
            include("admincp/config/config.php");
            include("pages/menu.php");
            include("pages/main.php");
            include("pages/footer.php");
        ?>
    </div>
    <script src="js/sidebar_toggle.js"></script>
</body>
</html>
<?php ob_end_flush(); ?>