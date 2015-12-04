
function draw(nodes, edges) {
    var color = d3.scale.category20();
    var nodeSize = d3.scale.linear()
                .domain( [0, d3.max(nodes, function (d) { return d.size; }) ] )
                .range([5, 20]);
    var linkColor = d3.scale.linear()
                .domain( d3.extent(edges, function (d) { return d.weight; }) )
                .range( ["black", "red"] )




    //Data binding
    var chart = d3.select("#chart");

    var force = d3.layout.force()
                .nodes(nodes)
                .links(edges)
                .linkStrength(0.1)
                .size([900, 600])
                .charge(-700)
                .on("tick", onTick);

    d3.select("#chulo")
        .on("click", function (d) {
            force.stop();
            force.start();
        });

    //Update links
    var selLinks = chart.selectAll("line")
        .data(force.links());

    selLinks.enter()
        .append("line")
        .style("stroke", function (e) {
            return linkColor(e.weight);
        });

    selLinks.exit().remove();

    var sel = chart.selectAll(".node")
            .data(nodes);

    //New nodes
    var selEnter = sel.enter()
        .append("g")
        .attr("class", "node");

    selEnter.append("circle")
        .style("fill", function (d) {
            return color(d.name);
        })
        .attr("r", function (d) {
                return nodeSize(d.size);
        })
        .call(force.drag)
        .append("title")
        .text(function (d) {
            return "Node: " + d.name + " \nsize: " + d.size;
        });

    selEnter.append("text")
        .text(function (d) {
            return d.name;
        })
        .attr("dy", 2)
        .attr("dx", function (d) {
            return nodeSize(d.size);
        });

    //Nodes to delete
    sel.exit()
        .remove();

    function onTick(e) {
        var k = e.alpha * 0.2;

        var fix = d3.select("#chulo").property("checked");
        if (fix) {

            nodes.forEach(function (n) {
                n.x += (n.mx - n.x)*k;
                n.y += (n.my - n.y)*k;
            });
        }


        //Update Nodes
        selLinks.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        //Update Nodes
        sel.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    }


    force.start();

}

queue()
    .defer(d3.json, "nodes2.json")
    .defer(d3.json, "edges.json")
    .await(function (err, nodes, edges) {
        draw(nodes, edges);
    })
