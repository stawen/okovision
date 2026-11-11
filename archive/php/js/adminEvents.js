/*****************************************************
 * Projet : Okovision - Supervision chaudiere OeKofen
 * Auteur : Stawen Dronek
 * Utilisation commerciale interdite sans mon accord
 ******************************************************/
/* global lang, $ */


if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/\{(\d+)\}/g, function (m, n) {
            return args[n];
        });
    };
}

$(document).ready(function () {


    /*
     * Espace event
     */

    $("#event_type").change(function () {

        switch ($(this).val())
        {
            case 'PELLET':
                $("#form-event-quantity").show();
                $("#form-event-remaining").show();
                $("#form-event-price").show();
                break;
            case 'BAG':
                $("#form-event-price").show();
                $("#form-event-quantity").show();
                break;
            case 'MAINT':
                $("#form-event-quantity").hide();
                $("#form-event-remaining").hide();
                $("#form-event-price").show();
                break;
            case 'SWEEP':
                $("#form-event-price").show();
                $("#form-event-quantity").hide();
                $("#form-event-remaining").hide();
                break;
            case 'ASHES':
                $("#form-event-price").hide();
                $("#form-event-quantity").hide();
                $("#form-event-remaining").hide();
                break;
        }
    });

    function refreshEvent() {
        $.api('GET', 'admin.getEvents').done(function (json) {


            if (json.response) {
                $("#events > tbody").html("");

                $.each(json.data, function (key, val) {
                    //console.log(val);
                    var eventType = '';
                    var details = '';
                    switch (val.event_type)
                    {
                        case 'PELLET':
                            eventType = lang.text.eventTypePellets;
                            details = lang.text.eventPelletsdetails.format(val.quantity, val.price, Math.round(1000 * val.price / val.quantity)); // "{0} kg, {1}€ ({2}€/T)"
                            break;
                        case 'ASHES':
                            eventType = lang.text.eventTypeAshes;
                            break;
                        case 'MAINT':
                            eventType = lang.text.eventTypeMaintenance;
                            details = lang.text.eventmaintenanceDetails.format(val.price);
                            break;
                        case 'SWEEP':
                            eventType = lang.text.eventTypeChimneySweeping;
                            details = lang.text.eventmaintenanceDetails.format(val.price);
                            break;
                        case 'BAG':
                            eventType = lang.text.eventTypeBag;
                            details = lang.text.eventBagDetails.format(val.quantity, val.price, Math.round(15 * val.price / val.quantity)); // "{0} kg, {1}€ ({2}€/T)"
                            break;
                    }
                    
                    $('#events > tbody:last').append('<tr id="' + val.id + '"> \
				   			<td>' + eventType + '</td>\
                                                        <td>' + val.event_date + '</td>\
                                                        <td>' + details + '</td>\
                                                        <td> \
                                                            <input type="hidden" class="event_date" value="' + val.event_date + '">\
                                                            <input type="hidden" class="quantity" value="' + val.quantity + '">\
                                                            <input type="hidden" class="remaining" value="' + val.remaining + '">\
                                                            <input type="hidden" class="price" value="' + val.price + '">\
                                                            <input type="hidden" class="event_type" value="' + val.event_type + '">\
                                                            <button type="button" class="btn btn-default btn-sm" data-toggle="modal" data-target="#modal_event"> \
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
                $.growlWarning(lang.error.getEvents);
            }
        });
    }

    function initModalAddEvent() {
        $('#modal_event').on('show.bs.modal', function () {

            $(this).find('#typeModal').val("add");
            $(this).find('.modal-title').html(lang.text.addEvent);
            $(this).find('#event-modal-form')[0].reset();
            $("#form-event-quantity").show();
            $("#form-event-remaining").show();
            $("#form-event-price").show();
        });
    }

    function addEvent() {

        try {
            var date = $.datepicker.parseDate('dd/mm/yy', $('#modal_event').find('#event_date').val());
        }
        catch (error) {
            $.growlWarning(lang.error.date);
            return;
        }

        try { 
            var remaining = $('#modal_event').find('#remaining').val()
            
            var tab = {
                event_date: $.datepicker.formatDate('yy-mm-dd', date),
                quantity: 0 + $('#modal_event').find('#quantity').val(),
                remaining: $.isNumeric(remaining)?remaining:0,
                price: 0 + $('#modal_event').find('#price').val(),
                event_type: $('#modal_event').find('#event_type').val()
            };
        }
        catch (error) {
            $.growlWarning(lang.error.saveEvent);
            return;            
        }
        //console.log(tab.position);

        $.api('POST', 'admin.setEvent', tab, false).done(function (json) {

            $('#modal_event').modal('hide');
            if (json.response) {
                $.growlValidate(lang.valid.save);
                setTimeout(refreshEvent(), 1000);
            }else{
                $.growlErreur(lang.error.saveEvent);
            }
        });


    }

    function updateEvent() {
        if ($.validateDate($('#modal_event').find('#event_date').val())) {
            try {
                var date = $.datepicker.parseDate('dd/mm/yy', $('#modal_event').find('#event_date').val());
            }
            catch (error) {
                //alert(error);
                $.growlWarning(lang.error.date);
                return;
            }
            var remaining = $('#modal_event').find('#remaining').val()
            var tab = {
                event_date: $.datepicker.formatDate('yy-mm-dd', date),
                quantity: 0 + $('#modal_event').find('#quantity').val(),
                remaining: $.isNumeric(remaining)?remaining:0,
                price: 0 + $('#modal_event').find('#price').val(),
                event_type: $('#modal_event').find('#event_type').val(),                
                idEvent: $('#modal_event').find('#eventId').val()
            };

            $.api('POST', 'admin.updateEvent', tab, false).done(function (json) {

                $('#modal_event').modal('hide');

                if (json.response) {
                    $.growlValidate(lang.valid.update);
                    setTimeout(refreshEvent(), 1000);
                }
                else {
                    $.growlErreur(lang.error.update);
                }


            });

        }
        else {
            $.growlWarning(lang.error.date);
        }
    }

    function deleteEvent() {

        var tab = {
            idEvent: $('#confirm-delete').find('#eventId').val()
        };

        $.api('POST', 'admin.deleteEvent', tab, false).done(function (json) {

            $('#confirm-delete').modal('hide');
            if (json.response) {
                $.growlValidate(lang.valid.delete);
                setTimeout(refreshEvent(), 1000);
            }
            else {
                $.growlErreur(lang.error.deleteEvent);
            }
        });
    }

    function initModalEditEvent(row) {
        var event = row.find("td:nth-child(1)").text();
        var id = row.attr("id");

        var event_date = row.find(".event_date").val();
        var quantity = row.find(".quantity").val();
        var remaining = row.find(".remaining").val();
        var price = row.find(".price").val();
        var event_type = row.find(".event_type").val();

        $('#modal_event').on('show.bs.modal', function () {

            $('#typeModal').val("edit");
            $('#EventTitle').html(lang.text.updateEvent + " : " + event);
            
            $('#eventId').val(id);
            $('#event_date').val(event_date);
            $('#price').val(price);
            $('#quantity').val(quantity);
            $('#remaining').val(remaining);
            $('#event_type').val(event_type);   
            
            $('#event_type').change();
        });
    }

    function confirmDeleteEvent(row) {
        var event = row.find("td:nth-child(1)").text();
        var id = row.attr("id");

        $('#confirm-delete').on('show.bs.modal', function () {
            $(this).find('.modal-title').html(lang.text.deleteEvent + " : " + event);
            $(this).find('#eventId').val(id);
        });

    }



    //obligé d'utiliser "on()" car les boutons sont ajoutés apres le chargement de la page
    $("body").on("click", ".btn", function () {

        if ($(this).children().is(".glyphicon-edit")) {
            initModalEditEvent($(this).closest("tr"));

        }
        if ($(this).children().is(".glyphicon-trash")) {
            confirmDeleteEvent($(this).closest("tr"))
        }
        if ($(this).children().is(".glyphicon-plus")) {
            initModalAddEvent();
        }

        if ($(this).is("#confirm")) {
            //console.log($("#modal_action").find('#typeModal').val());
            if ($("#modal_event").find('#typeModal').val() == "add") {
                addEvent();
            }
            if ($("#modal_event").find('#typeModal').val() == "edit") {
                updateEvent();
            }
        }
        if ($(this).is('#deleteConfirm')) {
            deleteEvent();
        }

    });

    $( "#event_date" ).datepicker({ maxDate: 0});
    refreshEvent();


});