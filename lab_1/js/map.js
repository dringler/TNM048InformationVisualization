function map(){
    var self = this;
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 8])
        .on("zoom", move);

    var mapDiv = $("#map");

    var margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = mapDiv.width() - margin.right - margin.left,
        height = mapDiv.height() - margin.top - margin.bottom;

    //initialize color scale
    var color = d3.scale.category20();
    // var color = d3.scale.quantize();
 
    //initialize tooltip
    var div = d3.select("body").append("div")   
        .attr("class", "tooltip")               
        .style("opacity", 0);

    var projection = d3.geo.mercator()
        .center([50, 60 ])
        .scale(250);

    var svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(zoom)
        .attr("transform","translate(100,50)scale(.4,.4)");

    var path = d3.geo.path()
        .projection(projection);

    g = svg.append("g");

    // load data and draw the map
    d3.json("data/world-topo.topojson", function(error, world) {
        console.log(world);
        var countries = topojson.feature(world, world.objects.countries).features;        
        //load summary data
        d3.csv("data/OECD-better-life-index-hi.csv", function(error, data) {
            
        // for (var i = 0; i < data.length; i++) {
        //         var dataCountry = data[i].Country;
        //         var dataUR = parseFloat(data[i].UnemploymentRate);

        //         for (var j = 0; j < countries.length; j++) {
        //             var jsonCountry = countries[j].properties.name;

        //             if (dataCountry == jsonCountry) {
        //                 countries[j].properties.UR = dataUR;
        //                 break;
        //             }
        //         }
        //     }
        // var minValue = d3.min(data, function(d,data) { return d.UnemploymentRate; });
        // var maxValue = d3.max(data, function(d,data) { return d.UnemploymentRate; });

        // color
        //     .domain([minValue, maxValue])
        //     .range(["#041e47", "#063685", "#0449bb", "#055ced", "#5092ff"]);

        // });

        draw(countries, data);
    });
        
    });

    function draw(countries,data)
    {
        var country = g.selectAll(".country").data(countries);

        //initialize a color country object	
        var cc = {};

        data.forEach(function(d){
            cc[d["Country"]] = color(d["Country"]);
        })

        country.enter().insert("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("id", function(d) { return d.id; })
            //.attr("title", function(d) { return d.properties.name; })
            //country color
            .style("fill", function(d) {return cc[d.properties.name];})

            //tooltip
            .on("mousemove", function(d) {
                div.transition()        
                    .duration(200)      
                    .style("opacity", .9);      
                div .html(d.properties.name)  
                    .style("left", (d3.event.pageX) + "px")     
                    .style("top", (d3.event.pageY - 28) + "px");    
            })        
            .on("mouseout", function(d) {
                div.transition()        
                .duration(500)      
                .style("opacity", 0);    
            })
            //selection
            .on("click",  function(d) {
                var countryArray = [];
                countryArray.push(d.properties.name);
                sp1.selectDot(countryArray);
                pc1.selectLine(d.properties.name);
                map.selectCountry(d.properties.name);            
            });

    }
    
    //zoom and panning method
    function move() {

        var t = d3.event.translate;
        var s = d3.event.scale;
        

        zoom.translate(t);
        g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");

    }

        this.selectCountry = function(value){
        svg.selectAll("path").style("opacity", function(d) {
            if (value.indexOf(d.properties.name) == -1) {return 0.2} 
             else {return 1};
        })
    };
    
    //method for selecting features of other components
    function selFeature(value){
        //...
    }
}

