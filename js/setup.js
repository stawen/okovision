$(document).ready(function() {
	
	$("#bt_testConnection").click(function() {
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
					//$.growlValidate("Modification réussi de " + tab.grpaddress);
					//setTimeout(refreshTableEqt(), 1000);
					$("#bt_testConnection").text("OK");
					console.log("ok");
				} else {
					//$.growlErreur("Problême lors de la modification de l'equipement " + tab.grpaddress);
					$("#bt_testConnection").text("Erreur !");
					console.log("nok");
				}

			}
		});

	
		
	});
	
	
	
	
});