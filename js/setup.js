$(document).ready(function() {
	
	$("#bt_testConnection").click(function() {
		if ( $('#db_adress').val() !== "" && $('#db_user').val() !== "" && $('#db_password').val() !== "" ){
		
				$(this).text("....");
				var tab = {
					db_adress: $('#db_adress').val(),
					db_user: $('#db_user').val(),
					db_password: $('#db_password').val()
				};
				
				$.ajax({
					url: 'setup.php?type=connect',
					type: 'POST',
					data: $.param(tab),
					async: false,
					success: function(a) {
						console.log(a.response);
						if (a.response) {
							$("#bt_testConnection").text("Succes");
							//console.log("ok");
						} else {
							$("#bt_testConnection").text("Error !");
							//console.log("nok");
						}
		
					}
				});
	
			}		
		
	});
	
	
	
	
});