/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/
$(document).ready(function() {

	
	//http://chaudiere/?action=get&attr=1
	/*
	$.get("http://chaudiere/?action=get&attr=1", function(json) {
				console.log('success');	
				console.log(json);
			},'jsonp')
			.error(function(json) { 
				console.log('error');	
				console.log(json);
				//graphe_error(div_ecs,titre_ecs);
				
			});
	*/
	function buildJSONString(variables, values) {
		var setStr = typeof values != "undefined";
		var str = setStr ? "{" : "[";
		if ($.isArray(variables)) {
		  var count = 0;
		  $.each(variables, function(i, variable) {
			if (count++ > 0) {
			  str += ",";
			}
			str += '"' + variable + '"';
			if (setStr) {
			  str += ':"' + values[i] + '"';
			}
		  });
		}
		else {
		  str += '"' + variables + '"';
		  if (setStr) {
			str += ':"' + values + '"';
		  }
		}
		str += setStr ? "}" : "]";

		return str;
	  }
	
	var requestedVars = '["CAPPL:LOCAL.anlage_betriebsart","CAPPL:LOCAL.hk[0].betriebsart[1]"]';
	
	 $.ajax({
      
      type: "POST",
      data: requestedVars,
      url: "http://chaudiere/?action=get&attr=1",
	  crossDomain: true,
      cache: false,
      dataType: "text",
      success: function(data, status, xhr) {
        console.log('success');
		console.log(data);
		console.log(status);
		console.log(xhr);
        
      },
      error: function(data, status, error) {
        console.log('error');
		console.log(data);
		console.log(status);
		console.log(error);
      }
    });		
});	

//http://chaudiere/login.cgi?username=oekofen&password=oekofen&language=fr&submit=Acc%C3%A8s
