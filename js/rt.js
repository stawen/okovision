/* global lang, Highcharts */ 
$(document).ready(function() {
    
    $.api('GET', 'graphique.getGraphe').done(function(json) {
        
        $.each(json.data, function(key, val) {
            $('#select_graphique').append('<option value="' + val.id + '">' + val.name + '</option>');
        });
        
    });
    
    $.api('GET', 'rt.getIndic').done(function(json) {
        
        if(json.response){
        
            $.each(json.data, function(key, val) {
                $('#'+ key).html(val);
            });
            $('#logginprogress').hide();
            $('#communication').show();
        
            
        }else{
            $('#logginprogress').hide();
            $.growlErreur('Connection impossible !');
        }
    });
    
    
    
    $('#rt').highcharts('StockChart', {
        chart : {
            type: 'spline',
            events : {
                load : function () {

                    // set up the updating of the chart each second
                    var series = this.series[0];
                    setInterval(function () {
                        var x = (new Date()).getTime(), // current time
                            y = Math.round(Math.random() * 100);
                        series.addPoint([x, y], true, true);
                    }, 1000);
                }
            }
        },

        rangeSelector: {
            buttons: [{
                count: 1,
                type: 'minute',
                text: '1'
            }, {
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

        

        exporting: {
            enabled: false
        },

        series : [{
            name : 'Random data',
            data : (function () {
                // generate an array of random data
                var data = [], time = (new Date()).getTime(), i;

                for (i = -500; i <= 0; i += 1) {
                    data.push([
                        time + i * 1000,
                        Math.round(Math.random() * 100)
                    ]);
                }
                return data;
            }())
        }]
    });
    
    
    
});