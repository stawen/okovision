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
    };
    
    function isArray(obj) {
	    return Object.prototype.toString.call(obj) === '[object Array]';
	}
    function splat(obj) {
	    return isArray(obj) ? obj : [obj];
	}
    
    $.connectBoiler = function() {
        
        $.api('GET', 'rt.getIndic').done(function(json) {
            
            if(json.response){
            
                $.each(json.data, function(key, val) {
                    $('#'+ $.IDify(key)).html(val);
                });
                $('#logginprogress').hide();
                $('#communication').show();
            
                
            }else{
                $('#logginprogress').hide();
                $.growlErreur(lang.error.connectBoiler);
            }
            
           $.getListConfigboiler();
        });
    };
    
    $.hideData =function(){
        $('#logginprogress').show();
        $('#communication').hide();
    };
    
    
    
    var liveChart, refreshData;
    
    $.drawChart = function(idGraphe){
        //console.log(liveChart);
        if(typeof liveChart !== 'undefined') {
            liveChart.destroy();
            clearInterval(refreshData);
        }
        
        liveChart = new Highcharts.Chart({
            chart : {
                renderTo: 'rt',
                type: 'spline',
                zoomType: 'x',
				panning: true,
				panKey: 'shift'
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
			tooltip: {
				shared: true,
				crosshairs: true,
				followPointer: true,
				formatter: function (tooltip) {
				                var items = this.points || splat(this);
				                // sort the values
				                items.sort(function(a, b){
				                    return ((a.y < b.y) ? -1 : ((a.y > b.y) ? 1 : 0));
				                });
				                items.reverse();
				
				                return tooltip.defaultFormatter.call(this, tooltip);
            					}
            },
            exporting: {
                enabled: false
            }
        
        });
        
    };
    
    $("#grapheValidate").click(function(){
        //console.log('ici');
        var idGraphe = $('#select_graphique').val();
        
        $.drawChart(idGraphe);
        liveChart.showLoading('Loading data from boiler...');
        
        $.getUpdateData(idGraphe);
        
    });
    
    
    
    
    $.getUpdateData = function(idGraphe){
        
        var firstData=0;
        refreshData = setInterval(function(){
            
             $.api('GET', 'rt.getData', {id: idGraphe}).done(function(json) {
               
               // add the point
                $.each(json , function(key, val){
                    
                    if (typeof liveChart.series[key] == 'undefined') {
                        liveChart.addSeries(val,false);
                    }else{
                        liveChart.series[key].addPoint(val.data,false);    
                    }
                    
                    
                });
                
                liveChart.redraw();
                
                if(firstData < 2){
                    
                    $.each(liveChart.series, function(key){
                        liveChart.series[key].removePoint(0);  
                    });
                    firstData = firstData + 1;
                    
                }else if(firstData == 2){
                    liveChart.hideLoading();
                }
                
             });
        },3000);
    };
    
    
    
    $("#btconfirm").click(function(e){
		var user = $('#okologin').val();
		var pass = $('#okopassword').val();
		
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
    
    
    $("a[class~='change']").click(function(){
        
        var id = $(this).closest('.row').find('.huge').attr("id");
        var name = $(this).closest('.panel').find('.labelbox').text();
        var value = $(this).closest('.row').find('.huge').text().split(" ")[0];
        
        $.api('POST', 'rt.getSensorInfo', {sensor: lang.sensor[id] }).done(function(json) {
            
            var max = json.upperLimit / json.divisor;
            var min = json.lowerLimit / json.divisor;
            
            $("#sensorId").val(id);
            $("#sensorUnitText").val(json.unitText);
            $("#sensorTitle").html(name);
            $("#sensorMax").html('Max : ' + max);
            $("#sensorMin").html('Min : ' + min);
            
            $("#sensorValue").attr({
                                "max" : max,
                                "min" : min
                                });
            
            $("#sensorValue").val(value); 
            
            $("#modal_change").modal('show');
        });
        
    
    });
    
    $("#btConfirmSensor").click(function(){
        var id = $("#sensorId").val();
        var newValue = $("#sensorValue").val() + ' ' + $("#sensorUnitText").val();
        
        $.changeSensorValue(id, newValue);
        
        $("#modal_change").modal('hide');
    });
    
    $.viewMessageMustsave = function(b){
      if(b){
          $("#mustSaving").show('pulsate');
          $("a[href~='#config']").toggleClass("bg-warning");
      }else{
          $("#mustSaving").hide();
          $("a[href~='#config']").removeClass("bg-warning");
          $(".panel").switchClass('panel-warning', 'panel-primary',0);
      }
    };
    
    $.changeSensorValue = function(id,value){
        var oldValue = $("#"+id).closest(".row").find('.huge').text();
        
        if(value !== oldValue){
            $("#"+id).closest(".row").find('.huge').text(value);
            $("#"+id).closest(".panel").switchClass('panel-primary', 'panel-warning',0);
            $.viewMessageMustsave(true);
        }
    };
    
    $.getConfigBoiler = function(){
        var json = {};
        
        $.each( $(".2save"), function(key){
            json[$( this ).attr('id')] = $( this ).text();
            
        });
        //console.log(json);
        return json;
    };
    
    $.setConfigBoiler = function(json){
        console.log(json);
        
        $.each( json, function(id, value){
            $.changeSensorValue(id, value);
        });
        
        
    };
    
    $.getListConfigboiler = function(){
        
        $.api('GET', 'rt.getListConfigBoiler').done(function(json) {
            if (json.response) {
				$("#listConfig > tbody").html("");

				$.each(json.data, function(key, val) {
					//console.log(val);
					$('#listConfig > tbody:last').append('<tr id="' + val.timestamp + '"> \
				                                        	<td>' + val.date + '</td>\
				                                        	<td>' + val.description + '</td>\
				                                        	<td>\
				                                        	    <button type="button" class="btn btn-default btn-sm"> \
                                                                    <span class="glyphicon glyphicon-floppy-open" aria-hidden="true"></span> \
                                                                </button> \
                                                                <button type="button" id="delete" class="btn btn-default btn-sm"> \
                                                                    <span class="glyphicon glyphicon-trash" aria-hidden="true"></span> \
                                                                </button> \
				                                        	</td> \
				                                        </tr>');
				});

			}
			else {
				$.growlWarning("Impossible de récuperer la liste des configurations");
			}
        });
    };
    
    
    $("#configDescriptionSave").click(function(){
        var a = $.getConfigBoiler();
        var desc = $("#configDescription").val();
        var date = '';
        
        if(desc ==''){
            $.growlWarning('La description ne doit pas etre vide');
        }else{
            //test si la date est visible ou non
            if($("#configTime").is(":visible") ){
                date = $("#configTimeSelect").val();
            }
            $.api('POST', 'rt.saveBoilerConfig', {config: a, description: desc, date: date} ).done(function(json) {
                if(json.response){
                    $.growlValidate('Configuration sauvegardée et appliquée sur la chaudière');
                    $("#configDescription").val("");
                    $.getListConfigboiler();
                    
                    $.viewMessageMustsave(false);
                    
                }else{
                    $.growlErreur('Impossible de sauvegarder la configuration');
                }
            });
        }
        
    });
    
    $("body").on("click", ".btn", function() {
        console.log($(this));
        if ($(this).is('#delete')) {
           $("#deleteid").val( $(this).closest("tr").attr('id') );
           $("#modal_delete").modal('show');
        }
        
        if($(this).is('#deleteConfirm')){
            
             $.api('POST', 'rt.deleteConfigBoiler', {timestamp: $("#deleteid").val()} ).done(function(json) {
                 if(json.response){
                     $("#modal_delete").modal('hide');
                     $.growlValidate('Suppression effectuée');
                     $.getListConfigboiler();
                 }else{
                     $.growlErreur('Suppression impossible');
                 }
             });
        }
        //relord config
        if($(this).children().is('.glyphicon-floppy-open')){
           
            $.api('POST', 'rt.getConfigBoiler', {timestamp: $(this).closest("tr").attr('id') } ).done(function(json) {
                
                if(json.response){
                    $.setConfigBoiler(json.data);
                    $.viewMessageMustsave(true);
                }else{
                    $.growlErreur('rt.getConfigBoiler.error');
                }
             });
        }
        
    });
    
    $('#configTimeSelect').datetimepicker({
        timeFormat: "HH:mm:ss"
    });
    
    
    $("#btConfigTime").click(function(){
       // console.log('ici');
       $("#configTime").toggle();
       $('#configTimeSelect').datetimepicker('setDate', (new Date()) );
    });
    
    
    
    
    
});