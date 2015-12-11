/* global lang, Highcharts */ 
$(document).ready(function() {
    
    $.api('GET', 'graphique.getGraphe').done(function(json) {
        
        $.each(json.data, function(key, val) {
            $('#select_graphique').append('<option value="' + val.id + '">' + val.name + '</option>');
        });
        
    });
    
    $.IDify = function(text) {
        text = text.replace(/CAPPL:LOCAL\.|[\[\]]|CAPPL:/g, "");
        text = text.replace(/[\.\/]+/g, "_");
        return text;
    }
    
    
    $.connectBoiler = function() {
        
        $.api('GET', 'rt.getIndic').done(function(json) {
            
            if(json.response){
            
                $.each(json.data, function(key, val) {
                    //console.log(lang.sensor[$.IDify(key)]);
                    $('#'+ $.IDify(key)).html(val);
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
    
    
    
    var liveChart;
    
    
    $("#grapheValidate").click(function(){
        //console.log('ici');
        
       
        liveChart = new Highcharts.Chart({
            chart : {
                renderTo: 'rt',
                type: 'spline',
                zoomType: 'x',
				panning: true,
				panKey: 'shift',
                events : {
                    load : $.getData()
                }
            },
            plotOptions: {
				spline: {
					marker: {
						enabled: false
					}
				}
			},
			tooltip: {
				shared: true,
				crosshairs: true,
				followPointer: true
			},
			title: {
				text: ''
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
            yAxis: [{
				title: {
					text: '...',
				},
				min: 0
			}],
            exporting: {
                enabled: false
            },
            series: [new Date().getTime(), 0]
        });
        
        
        
    });
    
    
    
    
    $.getData = function(){
        
        setInterval(function(){
             $.api('GET', 'rt.getData').done(function(json) {
               // add the point
                $.each(json , function(key, val){
                    if (typeof liveChart.series[key] == 'undefined') {
                        liveChart.addSeries(val,false);
                    }
                    if(liveChart.series[key].name != val.name){
                        liveChart.series[key].update({name:val.name}, false);
                    }
                    liveChart.series[key].addPoint(val.data,false);    
                    
                });
                liveChart.redraw();
             });
        },3000);
    }
    
    
    
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