var prevClusterRes;
function pc(data){

    var self = this; // for internal d3 functions
    self.data = data;

    var pcDiv = $("#pc");

    var margin = [30, 10, 10, 10],
        width = pcDiv.width() - margin[1] - margin[3],
        height = pcDiv.height() - margin[0] - margin[2];

    
    //initialize color scale
    // var color = d3.scale.category10();
    
    //initialize tooltip
    var div = d3.select("body").append("div")   
        .attr("class", "tooltip")               
        .style("opacity", 0);
    
    var x = d3.scale.ordinal().rangePoints([0, width], 1),
        y = {};

    var line = d3.svg.line(),
        axis = d3.svg.axis().orient("left"),
        background,
        foreground;

    var svg = d3.select("#pc").append("svg:svg")
        .attr("width", width + margin[1] + margin[3])
        .attr("height", height + margin[0] + margin[2])
        .append("svg:g")
        .attr("transform", "translate(" + margin[3] + "," + margin[0] + ")");

    //Load data
    // d3.csv("data/OECD-better-life-index-hi.csv", function(data) {

    //     self.data = data;

       
        //create scales
        create_scales();

        draw(null);
    // });
    function create_scales(){
         // Extract the list of dimensions and create a scale for each.
        x.domain(dimensions = d3.keys(self.data[0]).filter(function(d) {
            //exclude unnecessary dimensions
            return d != "TIMESTAMP" && 
                d != "DS_REFERENCE" && 
                d != "LEGEND_GROUP" &&
                d != "LEGEND_SIGN" &&
                d != "LEGEND_SUBSIGN" &&
                d != "PROTOCOL_VERSION" &&
                d != "TRAFFIC_DIRECTION" && 
                d != "id" &&
                d != "X_COORD" && 
                d != "Y_COORD" && 

            (y[d] = d3.scale.linear()
                .domain(d3.extent(self.data, function(p) {return +p[d];}))
                .range([height, 0]));
        })
        // .sort()
        );
    }

    function draw(clusterResult){

        // var cc = {};
        //     self.data.forEach(function(d){
        //         cc[d["id"]] = color(d["id"]);
        // })
        var color = d3.scale.category10();
        var cValue = function(d) {
            if (clusterResult == null) {
                return 0;
            } else {
                for (var i = 0; i < clusterResult.points.length; i++) {
                    if (d.id == clusterResult.points[i][0]) { //check id
                        return clusterResult.assignments[i];
                    }
                }
            }
        };

        // Add grey background lines for context.
        background = svg.append("svg:g")
            .attr("class", "background")
            .selectAll("path")
            //add the data and append the path 
            .data(self.data)
            .enter().append("path")
            .attr("d", path)
            .on("mousemove", function(d){})
            .on("mouseout", function(){});

        // Add foreground lines for focus.
        foreground = svg.append("svg:g")
            .attr("class", "foreground")
            .selectAll("path")
            //add the data and append the path 
            .data(self.data)
            .enter().append("path")
            .attr("d", path)
            // .style("stroke", function(d) {return cc[d.id];})
            .style("stroke", function(d) {return color(cValue(d));})
            .on("mousemove", function(d){
                div.transition()        
                    .duration(1)      
                    .style("opacity", .9);      
                div.html("id:" + d.id + "<br> average speed: " + d.AVERAGE_SPEED + "<br> detector number: " + d.DETECTOR_NUMBER + "<br> flow in: " + d.FLOW_IN + "<br>status: " + d.STATUS )
                    .style("left", (d3.event.pageX + 5) + "px")     
                    .style("top", (d3.event.pageY - 28) + "px");    
            })
            .on("mouseout", function(){
                div.transition()        
                    .duration(500)      
                    .style("opacity", 0);   
            })
            .on("click", function(d){
                var idArray = [];
                idArray.push(d.id);
                // sp1.selectDot(countryArray);
                pc1.selectLine(d.id);  
                // map.selectCountry(countryArray);
            });

        // Add a group element for each dimension.
        var g = svg.selectAll(".dimension")
            .data(dimensions)
            .enter().append("svg:g")
            .attr("class", "dimension")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; });
            
        // Add an axis and title.
        g.append("svg:g")
            .attr("class", "axis")
            //add scale
            .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
            .append("svg:text")
            .attr("text-anchor", "middle")
            .attr("y", -9)
            .text(String);

        // Add and store a brush for each axis.
        g.append("svg:g")
            .attr("class", "brush")
            .each(function(d) { d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brush", brush)); })
            .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
    }

    // Returns the path for a given data point.
    function path(d) {
        return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
    }

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        var selectedLines = [];
        var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
            extents = actives.map(function(p) { return y[p].brush.extent(); });
        foreground.style("display", function(d) {
            return actives.every(function(p, i) {
                if(extents[i][0] <= d[p] && d[p] <= extents[i][1]) {selectedLines.push(d["id"])}
                return extents[i][0] <= d[p] && d[p] <= extents[i][1];
            }) ? null : "none";
        });
        // sp1.selectDot(selectedLines);
        // map.selectCountry(selectedLines);
        map1.filterAttributes(actives, extents);


    }

    this.updateData = function(newData, clusterRes) {
        prevClusterRes = clusterRes;
        svg.selectAll("path").remove();
        svg.selectAll("g").remove();
        self.data = newData;

        create_scales();
        draw(clusterRes);

    };

    //method for selecting the pololyne from other components   
    this.selectLine = function(value){
        svg.selectAll("path").style("opacity", function(d) {
            if (d.id != value) {return 0.2} 
             else {return 1};
        })
    };

    this.resetSelections = function(){
        // svg.selectAll("path").style("opacity", 1);
        // d3.selectAll(".brush").call(d3.svg.brush().clear());
        // foreground.style("display", "")
        this.updateData(data, prevClusterRes);
    }
    
    //method for selecting features of other components
    function setFeature(value){
        //...
    };

}
