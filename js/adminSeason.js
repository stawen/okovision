/*****************************************************
 * Projet : Okovision - Supervision chaudiere OeKofen
 * Auteur : Stawen Dronek
 * Utilisation commerciale interdite sans mon accord
 ******************************************************/
/* global lang,$ */

$(document).ready(function() {


	/*
	 * Espace saison
	 */

	function refreshSaison() {
		$.api('GET', 'admin.getSaisons').done(function(json) {


			if (json.response) {
				$("#saisons > tbody").html("");

				$.each(json.data, function(key, val) {
					//console.log(val);
					//$('#select_graphe').append('<option value="' + val.id + '">' + val.name + '</option>');
					$('#saisons > tbody:last').append('<tr id=' + val.id + '> \
				   											<td>' + val.saison + '</td>\
				                                        	<td>' + val.date_debut + '</td>\
				                                        	<td>' + val.date_fin + '</td>\
				                                        	<td> \
				                                        		<button type="button" class="btn btn-default btn-sm" data-toggle="modal" data-target="#modal_saison"> \
                                                                	<span class="glyphicon glyphicon-edit" aria-hidden="true"></span> \
                                                                </button> \
                                                                <button type="button" class="btn btn-default btn-sm" data-toggle="modal" data-target="#confirm-delete"> \
                                                                	<span class="glyphicon glyphicon-trash" aria-hidden="true"></span> \
                                                                </button> \
				                                        	</td>\
				                                        </tr>');
				});


			}
			else {
				$.growlWarning(lang.error.getSeasons);
			}
		});
	}

	function initModalAddSaison() {
		$('#modal_saison').on('show.bs.modal', function() {

			$(this).find('#typeModal').val("add");
			$(this).find('.modal-title').html(lang.text.addSeason);
			$(this).find('#startDateSaison').val("");
		});
	}

	function addSaison() {

		if ($.validateDate($('#modal_saison').find('#startDateSaison').val())) {
			var date;
			try {
				date = $.datepicker.parseDate('dd/mm/yy', $('#modal_saison').find('#startDateSaison').val());
			}
			catch (error) {
				$.growlWarning(lang.error.date);
				return;
			}

			var tab = {
				startDate: $.datepicker.formatDate('yy-mm-dd', date) //;
			};
			//console.log(tab.position);
			//test si la saison existe deja n'est pas déja utilisé
			$.api('GET', 'admin.existSaison', {
				date: tab.startDate
			}).done(function(json) {

				//console.log(json);
				if (!json.response) {
					//saison n'existe pas, on enregistre
					
					$.api('POST', 'admin.setSaison', tab, false).done(function(json) {

						$('#modal_saison').modal('hide');
						if (json.response) {
							$.growlValidate(lang.valid.save);
							setTimeout(refreshSaison(), 1000);
						}
						else {
							$.growlErreur(lang.error.saveSeason);
						}
					});


				}
				else {
					$.growlWarning(lang.error.seasonAlreadyExist);
				}
			});
		}
		else {
			$.growlWarning(lang.error.date);
		}

	}

	function updateSaison() {
		if ($.validateDate($('#modal_saison').find('#startDateSaison').val())) {
			var date;
			try {
				date = $.datepicker.parseDate('dd/mm/yy', $('#modal_saison').find('#startDateSaison').val());
			}
			catch (error) {
				//alert(error);
				$.growlWarning(lang.error.date);
				return;
			}
			var tab = {
				startDate: $.datepicker.formatDate('yy-mm-dd', date),
				idSaison: $('#modal_saison').find('#saisonId').val()
			};
			//test si la saison existe deja n'est pas déja utilisé
			$.api('GET', 'admin.existSaison', {
				date: tab.startDate
			}).done(function(json) {

				//console.log(json);
				if (!json.response) {
					//saison n'existe pas, on enregistre
				
					$.api('POST', 'admin.updateSaison', tab, false).done(function(json) {

						$('#modal_saison').modal('hide');

						if (json.response) {
							$.growlValidate(lang.valid.update);
							setTimeout(refreshSaison(), 1000);
						}
						else {
							$.growlErreur(lang.error.update);
						}


					});


				}
				else {
					$.growlWarning(lang.error.seasonAlreadyExist);
				}
			});
		}
		else {
			$.growlWarning(lang.error.date);
		}
	}

	function deleteSaison() {

		var tab = {
			idSaison: $('#confirm-delete').find('#saisonId').val()
		};
		
		$.api('POST', 'admin.deleteSaison', tab, false).done(function(json) {

			$('#confirm-delete').modal('hide');
			if (json.response) {
				$.growlValidate(lang.valid.delete);
				setTimeout(refreshSaison(), 1000);
			}
			else {
				$.growlErreur(lang.error.deleteSeason);
			}
		});
	}

	function initModalEditSaison(row) {
		var startDate = row.find("td:nth-child(2)").text();
		var saison = row.find("td:nth-child(1)").text();
		var id = row.attr("id");

		$('#modal_saison').on('show.bs.modal', function() {

			$(this).find('#typeModal').val("edit");
			$(this).find('#startDateSaison').val(startDate);
			$(this).find('.modal-title').html(lang.text.updateSeason + " : " + saison);
			$(this).find('#saisonId').val(id);
		});
		//$.datepicker.formatDate('yy-mm-dd',$.datepicker.parseDate('dd/mm/yy', $( "#date_encours" ).val()));

	}

	function confirmDeleteSaison(row) {
		var saison = row.find("td:nth-child(1)").text();
		var id = row.attr("id");

		$('#confirm-delete').on('show.bs.modal', function() {
			$(this).find('.modal-title').html(lang.text.deleteSeason + " : " + saison);
			$(this).find('#saisonId').val(id);
		});

	}



	//obligé d'utiliser "on()" car les boutons sont ajoutés apres le chargement de la page
	$("body").on("click", ".btn", function() {

		if ($(this).children().is(".glyphicon-edit")) {
			initModalEditSaison($(this).closest("tr"));

		}
		if ($(this).children().is(".glyphicon-trash")) {
			confirmDeleteSaison($(this).closest("tr"));
		}
		if ($(this).children().is(".glyphicon-plus")) {
			initModalAddSaison();
		}

		if ($(this).is("#confirm")) {
			//console.log($("#modal_action").find('#typeModal').val());
			if ($("#modal_saison").find('#typeModal').val() === "add") {
				addSaison();
			}
			if ($("#modal_saison").find('#typeModal').val() === "edit") {
				updateSaison();
			}
		}
		if ($(this).is('#deleteConfirm')) {
			deleteSaison();
		}

	});

	refreshSaison();


});