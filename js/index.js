/*****************************************************
 * Projet : Okovision - Supervision chaudiere OeKofen
 * Auteur : Stawen Dronek
 * Utilisation commerciale interdite sans mon accord
 ******************************************************/
/* global lang, Highcharts, $ */
$(document).ready(function() {
	var loader = true;
	/**
	 * Synchronize zooming through the setExtremes event handler.
	 */
	function syncExtremes(e) {
		Highcharts.each(Highcharts.charts, function(c) {
			if (c !== e.currentTarget.chart && c) {
				if (c.xAxis[0].setExtremes) { // It is null while updating
					c.xAxis[0].setExtremes(e.min, e.max);
					//c.showResetZoom();
				}

			}
		});

		if (e.trigger !== 'undefined' && e.trigger == "zoom") {
			//console.log('max: '+e.max+' min: '+e.min);
			refreshIndicateur(e.min, e.max);
		}

	}

	function yAxisMin(c) {
		if (c) {
			if (c.yAxis[0].dataMin < 0) {
				c.yAxis[0].setExtremes(c.yAxis[0].dataMin, c.yAxis[0].dataMax);
			}
			else {
				c.yAxis[0].setExtremes(0, c.yAxis[0].dataMax);
			}
		}
	}

	function isArray(obj) {
		return Object.prototype.toString.call(obj) === '[object Array]';
	}

	function splat(obj) {
		return isArray(obj) ? obj : [obj];
	}
	/**************************************
	 **** Graphique ***********************
	 *************************************/
	var flag = {
		type: 'flags',
		name: 'config',
		color: '#333333',
		shape: 'circlepin',
		y: 0,
		showInLegend: false
	};

	Highcharts.setOptions({
		chart: {
			type: 'spline',
			zoomType: 'x',
			panning: true,
			panKey: 'shift'
		},
		xAxis: {
			type: 'datetime',
			labels: {
				rotation: -45,
			},
			title: {
				text: lang.graphic.hour
			},
			events: {
				setExtremes: syncExtremes
			},
		},
		yAxis: [{
			title: {
				text: '...',
			}
		}],
		plotOptions: {
			spline: {
				marker: {
					enabled: false
				}
			},
			tooltip: {
				formatter: function() {
					//if(this.series.name == 'config'){
					console.log('serie config');
					//	}
				}
			}
		},
		tooltip: {
			shared: true,
			crosshairs: true,
			followPointer: true,
			formatter: function(tooltip) {
				var items = this.points || splat(this);

				// sort the values
				items.sort(function(a, b) {
					return ((a.y < b.y) ? -1 : ((a.y > b.y) ? 1 : 0));
				});
				items.reverse();

				return tooltip.defaultFormatter.call(this, tooltip);
			}
		}


	});


	function grapheWithTime(data, where, titre) {

		var a = {
			chart: {
				renderTo: where,
			},
			title: {
				text: titre
			},
			series: data.concat(flag)
		};

		new Highcharts.Chart(a, yAxisMin);
	}


	function graphe_error(where, titre) {

		new Highcharts.Chart({
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
	 *************************************/
	function refreshIndicateur(timeStart, timeEnd) {

		timeStart = typeof timeStart !== 'undefined' ? timeStart : false;
		timeEnd = typeof timeEnd !== 'undefined' ? timeEnd : false;
		var jour;
		
		try {
			jour = $.datepicker.formatDate('yy-mm-dd', $.datepicker.parseDate('dd/mm/yy', $("#date_encours").val()));
		}
		catch (error) {
			$.errorDate();
			return;
		}
		var request;

		if (!timeStart || !timeEnd) {
			request = {
				jour: jour
			};
		}
		else {
			request = {
				jour: jour,
				timeStart: timeStart,
				timeEnd: timeEnd
			};
		}

		$.api('GET', 'rendu.getIndicByDay', request).done(function(json) {

			$("#tcmax").text($.DecSepa(json.tcExtMax + " °C"));
			$("#tcmin").text($.DecSepa(json.tcExtMin + " °C"));
			$("#consoPellet").text($.DecSepa(((json.consoPellet === null) ? 0.0 : json.consoPellet) + " Kg"));
			$("#consoPelletHotwater").text($.DecSepa(((json.consoPelletHotwater === null) ? 0.0 : json.consoPelletHotwater) + " Kg"));
		});
	}


	/**************************************
	 **** Peuplement des graphiques *******
	 * ***********************************/
	function refreshAllGraphe() {
		//	$(".se-pre-con").fadeIn();

		refreshIndicateur();

		var jour = $.datepicker.formatDate('yy-mm-dd', $.datepicker.parseDate('dd/mm/yy', $("#date_encours").val()));

		//recuperer si un parametre chuaidere doit etre afficher ou pas
		$.api('GET', 'rendu.getAnnotationByDay', {
			jour: jour
		}).done(function(jsonAnnotation) {

			var annotation = new Array();
			var dataFlag = new Array();

			$.each(jsonAnnotation.data, function(i, config) {

				var bar = {
					color: 'red', // Color value
					dashStyle: 'longdash', // Style of the plot line. Default to solid
					width: 2
				};

				bar.value = config.timestamp;
				annotation[i] = bar;

				dataFlag[i] = {
					x: config.timestamp,
					text: config.description,
					title: 'M'
				};

			});

			flag.data = dataFlag;

			//console.log(flag);
			//console.log(annotation);
			Highcharts.setOptions({
				xAxis: {
					plotLines: annotation
				}
			});


			$.each($(".graphique"), function(key, val) {

				$.api('GET', 'rendu.getGrapheData', {
						id: val.id,
						jour: jour
					}).done(function(json) {
						grapheWithTime(json.grapheData, val.id, $("#" + val.id).data("graphename"));

					})
					.error(function() {
						graphe_error(val.id, $("#" + val.id).data("graphename"));
					});

			});


		});





		//$(".se-pre-con").fadeOut();
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
		if (loader) $(".se-pre-con").fadeIn();
	});

	$(document).ajaxStop(function() {
		if (loader) $(".se-pre-con").fadeOut();
	});

	/**************************************
	 **** Creation de la structure de la page 
	 ************************************/
	$.api('GET', 'rendu.getStockStatus').done(function(json) {
		if(json.percent <= 10){
			$('#stock_alert').show();
		}
	});
	
	$.api('GET', 'rendu.getAshtrayStatus').done(function(json) {
		if(json.no_ashtray_info){
			$('#ashtray_noInfo').show();
			return;
		}
		if(json.no_date_emptied_ashtray){
			$('#ashtray_noDate').show();
			return;
		}
		
		if(json.emptying_ashtrey){
			$('#ashtray_alert').show();
		}
	});
	
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


	setTimeout(function() {
		loader = false;
		$.api('GET', 'admin.checkUpdate').done(function(json) {

			if (json.newVersion) {
				$.growlUpdateAvailable();
			}

		});
		loader = true;
	}, 5000);


	$("#date_encours").datepicker({
		maxDate: 0
	});

});