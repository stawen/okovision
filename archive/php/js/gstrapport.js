/*****************************************************
 * Projet : Okovision - Supervision chaudiere OeKofen
 * Auteur : Stawen Dronek
 * Utilisation commerciale interdite sans mon accord
 ******************************************************/
/* global lang */
$(document).ready(function() {

    function initModalAddGraphe() {
        $('#modal_graphique').on('show.bs.modal', function() {
            $(this).find('#name').val("");
            $(this).find('#typeModal').val("add");
            $(this).find('#graphiqueTitre').html(lang.text.addGraphe);

            $.api('GET', 'graphique.getLastGraphePosition').done(function(json) {

                var newPosition = (json.data.lastPosition === null) ? 1 : parseInt(json.data.lastPosition) + 1;
                $('#modal_graphique').find('#position').val(newPosition);

            }).error(function() {
                $.growlErreur(lang.error.position);
            });

        });
    }

    function initModalUpdateGraphe(row) {
        $('#modal_graphique').on('show.bs.modal', function() {

            var name = row.find("td:nth-child(2)").text();
            $(this).find('#name').val(name);
            $(this).find('#typeModal').val("edit");
            $(this).find('#grapheId').val(row.attr("id"));
            $(this).find('#graphiqueTitre').html(lang.text.updateGraphe + " " + name);
        });
    }

    function initModalDeleteGraphe(row) {
        $('#confirm-delete').on('show.bs.modal', function() {
            $(this).find('.modal-title').html(lang.text.deleteGraphe + " " + row.find("td:nth-child(2)").text() + "?");
            $(this).find('#deleteid').val(row.attr("id"));
            $(this).find('#typeModal').val('Grph');
        });
    }

    function initModalAddAsso() {
        $('#modal_asso').on('show.bs.modal', function() {

            $(this).find('#typeModal').val("add");
            $('#select_graphe option[value=' + $('#select_graphique').val() + ']').attr("selected", "selected");
            $('#select_capteur').prop("disabled", false);
            $('#select_capteur').find('option').removeAttr("selected");
            //console.log($('#listeAsso tbody > tr').length);
            $('#modal_asso').find('#position').val($('#listeAsso tbody > tr').length + 1)
            $('#coeff').val("1");
        });
    }

    function initModalUpdateAsso(row) {
        $('#modal_asso').on('show.bs.modal', function() {

            $(this).find('#typeModal').val("edit");
            $(this).find('#assoTitre').html(lang.text.updateAsso);
            $('#select_graphe option[value=' + $('#select_graphique').val() + ']').attr("selected", "selected");
            $('#select_capteur option[value=' + row.attr("id") + ']').attr("selected", "selected");

            $('#select_capteur').attr('disabled', 'disabled');
            $('#coeff').val(row.find("td:nth-child(3)").text());

        });
    }

    function initModalDeleteAsso(row) {
        var name = $('#select_graphique option:selected').text() + " - " + row.find("td:nth-child(2)").text();

        $('#confirm-delete').on('show.bs.modal', function() {
            $(this).find('.modal-title').html(lang.text.deleteAsso + " " + name + "?");
            $(this).find('#deleteid').val(row.attr("id")); //id du capteur
            $(this).find('#typeModal').val('Asso');
        });
    }

    function addGraphe() {
        var tab = {
            name: $('#modal_graphique').find('#name').val(),
            position: $('#modal_graphique').find('#position').val()
        };
        $.api('GET', 'graphique.grapheNameExist', {
            name: tab.name
        }).done(function(json) {

            if (!json.exist) {
                //so le groupe n'existe pas, on enregistre
                $.api('POST', 'graphique.addGraphe', tab).done(function(json) {

                    $('#modal_graphique').modal('hide');
                    if (json.response) {
                        $.growlValidate(lang.valid.save);
                        setTimeout(refreshTableGraphe(), 1000);
                    }
                    else {
                        $.growlErreur(lang.error.save);
                    }
                });

            }
            else {
                $.growlWarning(lang.error.grapehAlreadyExist);
            }
        });
    }

    function updateGraphe() {
        var tab = {
            id: $('#modal_graphique').find('#grapheId').val(),
            name: $('#modal_graphique').find('#name').val()
        };
        //test si le groupe adrress n'est pas déja utilisé
        $.api('POST', 'graphique.updateGraphe', tab).done(function(json) {

            $('#modal_graphique').modal('hide');
            if (json.response) {
                $.growlValidate(lang.valid.update);
                setTimeout(refreshTableGraphe(), 1000);
            }
            else {
                $.growlErreur(lang.error.save);
            }
        });

    }

    function deleteGraphe() {
        var tab = {
            id: $('#confirm-delete').find('#deleteid').val()
        };

        $.api('POST', 'graphique.deleteGraphe', tab).done(function(json) {

            $('#confirm-delete').modal('hide');
            if (json.response === true) {
                $.growlValidate(lang.valid.delete);
                setTimeout(refreshTableGraphe(), 1000);
            }
            else {
                $.growlErreur(lang.error.deleteGraphe + " " + tab.name);
            }
        });
    }

    function addAsso() {
        var tab = {
            id_graphe: $('#modal_asso').find('#select_graphe').val(),
            id_capteur: $('#modal_asso').find('#select_capteur').val(),
            position: $('#modal_asso').find('#position').val(),
            coeff: $('#modal_asso').find('#coeff').val()

        };
        //test si le groupe adrress n'est pas déja utilisé
        $.api('GET', 'graphique.grapheAssoCapteurExist', {
            graphe: tab.id_graphe,
            capteur: tab.id_capteur
        }).done(function(json) {

            if (!json.exist) {
                //so l'asso n'existe pas, on enregistre
                $.api('POST', 'graphique.addGrapheAsso', tab).done(function(json) {

                    $('#modal_asso').modal('hide');
                    if (json.response) {
                        $.growlValidate(lang.valid.save);
                        setTimeout(refreshTableAsso(), 1000);
                    }
                    else {
                        $.growlErreur(lang.error.save);
                    }
                });
            }
            else {
                $.growlWarning(lang.error.assoAlreadyExist);
            }
        });
    }

    function updateAsso() {
        var tab = {
            id_graphe: $('#modal_asso').find('#select_graphe').val(),
            id_capteur: $('#modal_asso').find('#select_capteur').val(),
            coeff: $('#modal_asso').find('#coeff').val()
        };
        if (!$.isNumeric(tab.coeff)) {
            $.growlErreur(lang.error.coeffMustBeNumber);
            return;
        }

        $.api('POST', 'graphique.updateGrapheAsso', tab).done(function(json) {

            $('#modal_asso').modal('hide');
            if (json.response) {
                $.growlValidate(lang.valid.update);
                setTimeout(refreshTableAsso(), 1000);
            }
            else {
                $.growlErreur(lang.error.update);
            }

        });
    }

    function deleteAssoGraphe() {
        var tab = {
            id_capteur: $('#confirm-delete').find('#deleteid').val(),
            id_graphe: $('#select_graphique').val()
        };
        $.api('POST', 'graphique.deleteAssoGraphe', tab).done(function(json) {

            $('#confirm-delete').modal('hide');
            if (json.response) {
                $.growlValidate(lang.valid.delete);
                setTimeout(refreshTableAsso(), 1000);
            }
            else {
                $.growlErreur(lang.error.deleteAsso);
            }

        });
    }

    function refreshTableGraphe() {
        $("#listeGraphique> tbody").html("");
        //liste deroulante dans la page
        $('#select_graphique').find('option').remove();
        //listen deroulante fenetre modal add /edit
        $('#select_graphe').find('option').remove();

        $.api('GET', 'graphique.getGraphe').done(function(json) {

                $.each(json.data, function(key, val) {

                    $('#listeGraphique > tbody:last').append('<tr id="' + val.id + '">  <td> \
                                                            <span class="glyphicon glyphicon-resize-vertical" aria-hidden="true"></span> \
    																</td> \
                	                                                <td>' + val.name + '</td>  \
                	                                                <td>       \
                	                                                    <button type="button" class="btn btn-default btn-sm" data-toggle="modal" data-target="#modal_graphique"> \
                                                                            <span class="glyphicon glyphicon-edit" aria-hidden="true"></span> \
                                                                        </button> \
                                                                        <button type="button" class="btn btn-default btn-sm" data-toggle="modal" data-target="#confirm-delete"> \
                                                                            <span class="glyphicon glyphicon-trash" aria-hidden="true"></span> \
                                                                        </button> \
                                                                    </td></tr>');
                    //on rempli les listes box pour le tableau d'asso
                    $('#select_graphique').append('<option value="' + val.id + '">' + val.name + '</option>');
                    $('#select_graphe').append('<option value="' + val.id + '">' + val.name + '</option>');

                });
                refreshTableAsso();
            })
            .error(function() {
                $.growlErreur(lang.error.getGraphe);
            });
    }

    function refreshTableAsso() {
        $("#listeAsso > tbody").html("");

        $.api('GET', 'graphique.getGrapheAsso', {
                graphe: $('#select_graphique').val()
            }).done(function(json) {

                $.each(json.data, function(key, val) {
                    //console.log(val.group_addr);
                    $('#listeAsso > tbody:last').append('<tr id="' + val.id + '">  <td> \
    																	 <span class="glyphicon glyphicon-resize-vertical" aria-hidden="true"></span> \
                                                                    </td> \
                	                                                <td>' + val.name + '</td>  \
                	                                                <td>' + val.coeff + '</td>  \
                	                                                <td>       \
                	                                                    <button type="button" class="btn btn-default btn-sm" data-toggle="modal" data-target="#modal_asso"> \
                                                                            <span class="glyphicon glyphicon-edit" aria-hidden="true"></span> \
                                                                        </button> \
                                                                        <button type="button" class="btn btn-default btn-sm" data-toggle="modal" data-target="#confirm-delete"> \
                                                                            <span class="glyphicon glyphicon-trash" aria-hidden="true"></span> \
                                                                        </button> \
                                                                    </td></tr>');

                });
            })
            .error(function() {
                $.growlErreur(lang.error.getAsso);
            });
    }


    /************************************************
     * ************ Evenements **********************
     * *********************************************/
    //obligé d'utiliser "on()" car les boutons sont ajoutés apres le chargement de la page
    $("body").on("click", ".btn", function() {

        if ($(this).is("#openModalAddGraphique")) {
            initModalAddGraphe();
        }
        if ($(this).is("#openModalAsso")) {
            initModalAddAsso();
        }

        if ($(this).is("#addGraphique")) {
            if ($("#modal_graphique").find('#typeModal').val() == "add") {
                addGraphe();
            }
            if ($("#modal_graphique").find('#typeModal').val() == "edit") {
                updateGraphe();
            }
        }

        if ($(this).is("#addAsso")) {
            if ($("#modal_asso").find('#typeModal').val() == "add") {
                addAsso();
            }
            if ($("#modal_asso").find('#typeModal').val() == "edit") {
                updateAsso();
            }
        }

        if ($(this).children().is(".glyphicon-edit") && $(this).closest('table').is("#listeGraphique")) { //;
            initModalUpdateGraphe($(this).closest("tr"));
        }
        if ($(this).children().is(".glyphicon-trash") && $(this).closest('table').is("#listeGraphique")) {
            initModalDeleteGraphe($(this).closest("tr"));
        }
        if ($(this).children().is(".glyphicon-edit") && $(this).closest('table').is("#listeAsso")) { //;
            initModalUpdateAsso($(this).closest("tr"));
        }
        if ($(this).children().is(".glyphicon-trash") && $(this).closest('table').is("#listeAsso")) {
            initModalDeleteAsso($(this).closest("tr"));
        }
        if ($(this).is('#deleteConfirm')) {
            if ($('#confirm-delete').find('#typeModal').val() == 'Grph') {
                deleteGraphe();
            }
            if ($('#confirm-delete').find('#typeModal').val() == 'Asso') {
                deleteAssoGraphe();
            }

        }




    });

    refreshTableGraphe();


    $('#select_graphique').change(function() {
        refreshTableAsso();
    });

    $.api('GET', 'graphique.getCapteurs').done(function(json) {

        if (json.response) {
            $('#select_capteur').find('option').remove();

            $.each(json.data, function(key, val) {

                $('#select_capteur').append('<option value="' + val.id + '">' + val.name + '</option>');
                $('#select_graphe').attr('disabled', 'disabled');
            });
        }
        else {
            $.growlErreur(lang.error.getSensor);
        }
    });

    var currentPosition;
    $('table tbody').sortable({
        opacity: 0.75,
        helper: fixWidthHelper,
        start: function( event, ui ) {
            //console.log(ui.item.context.rowIndex);
            currentPosition = ui.item.context.rowIndex;
        },
        update: function( event, ui ) {
            
            if ($(this).closest('table').is("#listeGraphique") ){
                
                $.api('POST', 'graphique.updateGraphePosition', {id_graphe: ui.item.context.id, current: currentPosition, position: ui.item.context.rowIndex}).done(function(json) {

                    if (json.response) {
                        $.growlValidate(lang.valid.update);
                    }
                    else {
                        $.growlErreur(lang.error.update);
                    }
                });
                
                //console.log(ui.item.context.rowIndex);
                
            }
            if ($(this).closest('table').is("#listeAsso") ){
                //console.log('listeAsso::'+row);
                $.api('POST', 'graphique.updateGrapheAssoPosition', {id_graphe: $('#select_graphique').val(), id_capteur: ui.item.context.id, current: currentPosition, position: ui.item.context.rowIndex}).done(function(json) {

                    if (json.response) {
                        $.growlValidate(lang.valid.update);
                    }
                    else {
                        $.growlErreur(lang.error.update);
                    }
                });
            }
            
        }
    }).disableSelection();
        
    function fixWidthHelper(e, ui) {
        ui.children().each(function() {
            $(this).width($(this).width());
        });
        return ui;
    }

});