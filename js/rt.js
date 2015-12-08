/* global lang, Highcharts */ 
$(document).ready(function() {
    
    $.api('GET', 'graphique.getGraphe').done(function(json) {
        
        $.each(json.data, function(key, val) {
            $('#select_graphique').append('<option value="' + val.id + '">' + val.name + '</option>');
        });
        
    });
    
    $.connectBoiler = function() {
        $.api('GET', 'rt.getIndic').done(function(json) {
            
            if(json.response){
            
                $.each(json.data, function(key, val) {
                    $('#'+ key).html(val);
                });
                $('#logginprogress').hide();
                $('#communication').show();
            
                
            }else{
                $('#logginprogress').hide();
                $.growlErreur(lang.error.connectBoiler);
            }
        });
    }
    
    $.hideData =function(){
        $('#logginprogress').show();
        $('#communication').hide();
    }
    
    $.getData = function(){
        
         $.api('GET', 'rt.getData').done(function(json) {
             console.log(json);
             var series = liveChart.series[0],
               shift = series.data.length > 20; // shift if the series is 
                                                 // longer than 20

                // add the point
                liveChart.series[0].addPoint(json, true, shift);
            
                // call it again after one second
                setTimeout($.getData(), 1500);    
         });
    }
    
    var liveChart;
    
    $("#grapheValidate").click(function(){
        console.log('ici');
        
       
        liveChart = new Highcharts.StockChart({
            chart : {
                renderTo: 'rt',
                type: 'spline',
                events : {
                    load : $.getData()
                }
            },
    
            rangeSelector: {
                buttons: [{
                    count: 5,
                    type: 'minute',
                    text: '5M'
                }, {
                    type: 'all',
                    text: 'TOUT'
                }],
                inputEnabled: false,
                selected: 0
            },
            xAxis: {
				type: 'datetime',
				dateTimeLabelFormats: {
					minute: '%H:%M',
					hour: '%H:%M'

				},
				labels: {
					rotation: -45,
				},
				title: {
					text: lang.graphic.hour
				}
			},
            
    
            exporting: {
                enabled: false
            },
    
            series : [{
                name : 'Random data',
                data : []
            }]
        });
        
    });
    
    
    
    
    
    $("#btconfirm").click(function(e){
		var user = $('#okologin').val()
		var pass = $('#okopassword').val()
		
		if(user !== '' && pass !== ''){
		
			$.api('POST', 'rt.setOkoLogin', {user: user, pass: pass}).done(function(json) {
				$("#modal_boiler").modal('hide');
				$.hideData();
				if(!json.response){
					e.preventDefault();
					$.growlErreur(lang.error.save);
				}else{
				    $.growlValidate(lang.valid.save);
				    $.connectBoiler();
				}
				
			});
		}
		
	});
    
    $.connectBoiler();
    
});