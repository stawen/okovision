<?php
 $page = basename($_SERVER['SCRIPT_NAME']);
 $pageNotLogged = ['setup.php', 'index.php', 'histo.php'];

 if (!in_array($page, $pageNotLogged) && !session::getInstance()->getVar('logged')) {
     header('Location: /errors/401.php');
     exit();
 }
?>
<!DOCTYPE html> 
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>OkoVision</title>
    <script type="text/javascript">
            var sessionToken = "<?php echo session::getInstance()->getVar('sid'); ?>";		
   </script>
	<!-- Bootstrap core CSS -->
    <link href="css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap theme -->
    <link href="css/bootstrap-theme.min.css" rel="stylesheet">
    <link href="css/jquery-ui.min.css" rel="stylesheet">
    <link href="css/custom.css" rel="stylesheet">
    <link href="css/animate.css" rel="stylesheet">
    <link href="css/jquery-ui-timepicker-addon.css" rel="stylesheet">
    <!-- HTML5 shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>+
    <![endif]-->
	<?php //include_once("analyticstracking.php");?>
	
	</head>

  <body role="document">
  