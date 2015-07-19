$(document).ready(function() {

	$.growlValidate = function(text) {
		$.notify({
			icon: 'glyphicon glyphicon-save',
			message: text
		}, {
			z_index: 9999,
			type: 'success'
		});
	}

	$.growlErreur = function(text) {
		$.notify({
			icon: 'glyphicon glyphicon-exclamation-sign',
			message: text
		}, {
			z_index: 9999,
			type: 'danger'
		});
	}

	$.growlWarning = function(text) {
		$.notify({
			icon: 'glyphicon glyphicon-exclamation-sign',
			message: text
		}, {
			z_index: 9999,
			type: 'warning'
		});
	}
	
	
	function activeTab(){
	    var url = document.location.toString();
        if (url.match('#')) {
            $('.nav-tabs a[href=#'+url.split('#')[1]+']').tab('show') ;
        } 
    }
    
    // Change hash for page-reload
    
    $('.nav-tabs a').on('shown.bs.tab', function (e) {
        window.location.hash = e.target.hash;
    });
    
    
    $(window).on('hashchange', function() {
        activeTab();
    });
    
    activeTab();
	
});