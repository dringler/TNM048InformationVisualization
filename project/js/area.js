//Focus+Context via Brushing
//http://bl.ocks.org/mbostock/1667367
var data;
var svg;
var prevClusterResult;
var brush;
var focus;
var xAxis;
var area;
var areaYparameter = 'AVERAGE_SPEED';

function area(data) {
    data = data;
    // console.log("data");
    // console.log(data);
    var areaDiv = $("#area");

    // var margin = {top: 100, right: 40, bottom: 100, left: 40},
    var margin = {top: 20, right: 20, bottom: 100, left: 20};

    margin2 = {top: areaDiv.height() - 70, right: 40, bottom: 30, left: 20},
    width = areaDiv.width() - margin.left - margin.right,
            height = areaDiv.height() - margin.top - margin.bottom,
            height2 = areaDiv.height() - margin2.top - margin2.bottom;

    //Sets the data format
    var format = d3.time.format("%Y-%m-%d %H:%M:%S");

    //initialize color scale
    var color = d3.scale.category10();

    //Sets the scales 
    var x = d3.time.scale().range([0, width]),
            x2 = d3.time.scale().range([0, width]),
            y = d3.scale.linear().range([height, 0]),
            y2 = d3.scale.linear().range([height2, 0]);
    
    //Sets the axis 
    xAxis = d3.svg.axis().scale(x).orient("bottom"),
            xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
            yAxis = d3.svg.axis().scale(y).orient("left");
    
    //Assigns the brush to the small chart's x axis
    brush = d3.svg.brush()
            .x(x2)
            .on("brush", brush);
     
    //Assings the svg canvas to the area div
    svg = d3.select("#area").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
    
    //Defines clip region
    svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);


    

    //create scales for both charts
    create_scales();
    //draw data, axis & brush
    draw(data);

    function draw(data, clusterResult) {

        //color function for the clustering result
        var cValue = function(d) {
            if (clusterResult == null) {
                return 0;
            } else {
                // for (var j = 0; j < d.length; j++) {
                    for (var i = 0; i < clusterResult.points.length; i++) {
                        if (d.id == clusterResult.points[i][0]) { //check id
                            return clusterResult.assignments[i];
                        }
                    }
                // }
            }
        };

        //Creates the big chart
        area = d3.svg.area()
            .interpolate("step")
            .x(function (d) {
                return x(new Date(d.TIMESTAMP));
            })
            .y0(height)
            .y1(function (d) {
                return y(d[areaYparameter]);
            });
    
        //Creates the small chart        
        var area2 = d3.svg.area()
            .interpolate("step")
            .x(function (d) {
                return x2(new Date(d.TIMESTAMP));
            })
            .y0(height2)
            .y1(function (d) {
                return y2(d[areaYparameter]);
            });

        //Defines the focus area
        focus = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
        //Defines the context area
        var context = svg.append("g")
            .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");


        //Appends the big chart to the focus area
        focus.append("path")
            .datum(data)
            .attr("clip-path", "url(#clip)")
            .attr("d", area)
            .style("fill", "steelblue")
            // .style("fill", function(d) {return color(cValue(d));})
            ;
    
        //Appends the x axis 
        focus.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
    
        //Appends the y axis 
        focus.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        //Appends the small chart to the focus area        
        context.append("path")
            .datum(data)
            .attr("d", area2)
            .style("fill", "steelblue");
    
        //Appends the x axis 
        context.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height2 + ")")
            .call(xAxis2);

        //Appends the brush 
        context.append("g")
            .attr("class", "brush")
            .call(brush)
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", height2 + 7);

        // svg.selectAll("g")
        //     .data(data)
        //     .enter()
        //     .append("path")
        //     .attr("class", "area")
        //     .attr("d", area)
        //     .attr("fill", function(d) {return color(cValue(d));});

    }

    
    
    function create_scales(){
        //Initializes the axis domains for the big chart
        x.domain(d3.extent(data.map(function(d){return new Date(d.TIMESTAMP)})));
        y.domain(d3.extent(data.map(function(d){return +d[areaYparameter]})));
        //Initializes the axis domains for the small chart
        x2.domain(x.domain());
        y2.domain(y.domain());
    }
    //Method for brushing
    function brush() {
        x.domain(brush.empty() ? x2.domain() : brush.extent());
        focus.select("path").attr("d", area);
        focus.select(".x.axis").call(xAxis);

        //filter dots based on selected time range
        map1.filterTime(brush.extent());
        // map1.cluster();
    }
    this.updateData = function(newData, clusterResult, yParam) {
        data = newData;
        prevClusterResult = clusterResult;
        areaYparameter = yParam;
        //delete old chart
        svg.selectAll("path").remove();
        svg.selectAll("g").remove();
        svg.selectAll(".brush").remove()
        create_scales();
        draw(data, clusterResult);

    }
    this.resetTimeSelection = function(){
        // brush.clear();
        // svg.selectAll("rect.extent").remove();
        // svg.selectAll('.x brush').call(brush);
        // d3.selectAll(".brush").call(brush.clear());

        this.updateData(data,prevClusterResult,areaYparameter);
        
    }
}
