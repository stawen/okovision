/* global lang, Highcharts */
$(document).ready(function() {

	/**
     * In order to synchronize tooltips and crosshairs, override the 
     * built-in events with handlers defined on the parent element.
     */
     /*
     function getMousePosition(){
     	
	    $('.container-graphe').bind('mousemove touchmove', function (e) {
	    	
	    	var chart, point,i ;
			
	        for (i = 0; i < Highcharts.charts.length; i = i + 1) {
	        	
	            chart = Highcharts.charts[i];
	            e = chart.pointer.normalize(e); // Find coordinates within the chart
	            point = chart.series[0].searchPoint(e, true); // Get the hovered point
	
	            if (point) {
	                point.onMouseOver(); // Show the hover marker
	                chart.tooltip.refresh(point); // Show the tooltip
	                chart.xAxis[0].drawCrosshair(e, point); // Show the crosshair
	            }
	        }
	        
	    });
    }
    */
    
    /**
     * Override the reset function, we don't need to hide the tooltips and crosshairs.
     */
     /*
     Highcharts.Tooltip.prototype.hide = false;
     
     Highcharts.Pointer.prototype.reset = function () {
        return false;
    };
	*/
    /**
     * Synchronize zooming through the setExtremes event handler.
     */
    function syncExtremes(e) {
        var thisChart = this.chart;
	
        Highcharts.each(Highcharts.charts, function (chart) {
            if (chart !== thisChart) {
                if (chart.xAxis[0].setExtremes) { // It is null while updating
                    chart.xAxis[0].setExtremes(e.min, e.max);
                }
            }
        });
    }
	
	/**************************************
	 **** Graphique ***********************
	 *************************************/
	function grapheWithTime(data, where, titre) {

		var chart = new Highcharts.Chart({
			chart: {
				renderTo: where,
				type: 'spline',
				zoomType: 'x',
				panning: true,
				panKey: 'shift'
			},
			title: {
				text: titre
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
				},
				events: {
                	setExtremes: syncExtremes
                }
			},
			yAxis: [{
				title: {
					text: '...',
				},
				min: 0 //,	max : 100
			}],
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
			series: data
		});

	}


	function graphe_error(where, titre) {
		var chart = new Highcharts.Chart({
			chart: {
				renderTo: where,
				type: 'line'
			},
			title: {
				text: titre
			},
			subtitle: {
				text: lang.error.communication
			}
		});

	}

	/**************************************
	 **** Peuplement des graphiques *******
	 * ***********************************/
	function refreshAllGraphe() {
		var jour = $.datepicker.formatDate('yy-mm-dd', $.datepicker.parseDate('dd/mm/yy', $("#date_encours").val()));

		$.api('GET', 'rendu.getIndicByDay', {
			jour: jour
		}).done(function(json) {

			$("#tcmax").text($.DecSepa(json.tcExtMax + " °C"));
			$("#tcmin").text($.DecSepa(json.tcExtMin + " °C"));
			$("#consoPellet").text($.DecSepa(((json.consoPellet === null) ? 0.0 : json.consoPellet) + " Kg"));
		});


		$.each($(".graphique"), function(key, val) {

			$.api('GET', 'rendu.getGrapheData', {
					id: val.id,
					jour: jour
				}).done(function(json) {
					grapheWithTime(json.grapheData, val.id, $("#" + val.id).data("graphename"));
					//getMousePosition();
				})
				.error(function() {
					graphe_error(val.id, $("#" + val.id).data("graphename"));
				});

		});
	}

	/**************************************
	 **** EVENEMENT ***********************
	 * ***********************************/

	$("#date_avant").click(function() {
		if ($.validateDate($('#date_encours').val())) {
			try {
				var newdate = $.datepicker.parseDate('dd/mm/yy', $("#date_encours").val());
				newdate.setDate(newdate.getDate() - 1);

				$("#date_encours").val(
					$.datepicker.formatDate('dd/mm/yy', newdate)
				);
				refreshAllGraphe();

			}
			catch (error) {
				$.errorDate();
				return;
			}
		}
		else {
			$.errorDate();
		}


	});

	$("#date_apres").click(function() {
		if ($.validateDate($('#date_encours').val())) {
			try {
				var newdate = $.datepicker.parseDate('dd/mm/yy', $("#date_encours").val());
				newdate.setDate(newdate.getDate() + 1);

				$("#date_encours").val(
					$.datepicker.formatDate('dd/mm/yy', newdate)
				);
				refreshAllGraphe();

			}
			catch (error) {
				$.errorDate();
				return;
			}
		}
		else {
			$.errorDate();
		}
	});

	$("#date_encours").change(function() {
		if ($.validateDate($('#date_encours').val())) {
			refreshAllGraphe();
		}
		else {
			$.errorDate();
		}

	});

	/**************************************
	 **** Attente preload *****************
	 * ***********************************/

	$(document).ajaxStart(function() {
		$(".se-pre-con").fadeIn();
	});

	$(document).ajaxStop(function() {
		$(".se-pre-con").fadeOut();
	});

	/**************************************
	 **** Creation de la structure de la page 
	 ************************************/

	$.api('GET', 'rendu.getGraphe').done(function(json) {

			$.each(json.data, function(key, val) {
				$('.container-graphe').append('<div class="page-header"> \
			                       			<div class="graphique" id="' + val.id + '" data-graphename="' + val.name + '" style="width:100%; height:400px;"></div> \
			                        	</div>');
			});

			refreshAllGraphe();
			
		})
		.error(function() {
			$.growlErreur(lang.error.getGraphe);
		});


	
});