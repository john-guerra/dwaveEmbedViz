"use strict"

var width =500,
    height = 500;
var nodes, edges;


var chart = d3.select("#chart")
        .attr("width", width)
        .attr("height", height)
    .append("g")
        // .call(d3.behavior.zoom().scaleExtent([1, 8]).on("zoom", zoom))
    .append("g");

chart.append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height);

var colorScale = d3.scale.category20();
var nodeSize = d3.scale.linear();
var linkSize = d3.scale.linear();
var linkColor = d3.scale.linear();
var x = d3.scale.linear();
var y = d3.scale.linear();
var pathgen = d3.svg.line().interpolate("basis");

var force = d3.layout.force();

function zoom() {
  chart.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}


function embed(logical, embedding) {
    force.stop();
    var newNodes = [], newEdges = [];

    logical.nodes(forEach(function (n) {
        n.embed.forEach(function (ne) {
            newNodes.push({
                id : ne,
                originalId : n.id,
                x : nx,
                y : ny,
                size : 1,
            });
        });
    }));
}


function getPathForLink(d) {
    var dx, dy, dr,
            linedata,
            cycle_curvep = 25; // cyclic ~ self-referential links: determines the 'radius' of the bezier path constructed for the link

    dx = d.target.x - d.source.x;
    dy = d.target.y - d.source.y;
    dr = Math.sqrt(dx * dx + dy * dy);

    if (dr===0) {
        //self link
        linedata = [
            [d.source.x, d.source.y],
            [d.source.x + cycle_curvep / 2 , d.source.y - cycle_curvep],
            [d.source.x - cycle_curvep / 2 , d.source.y - cycle_curvep],
            [d.source.x, d.source.y],
        ];
        return pathgen(linedata);
    } else {
        return "M" + d.source.x + "," + d.source.y +
            "A" + dr + "," + dr + " 0 0,1 " +
            d.target.x + "," + d.target.y;
    }
}

function draw(logical, embedding, type) {
    var nodes = logical.nodes,
        edges = logical.edges;
    var drawEdges = d3.select("#drawEdges").property("checked");
    var embed = d3.select("#embed").property("checked");
    var fixed = d3.select("#chulo").property("checked");

    var color;



    type = type || "logical";
    width = window.innerWidth;
    height = window.innerHeight - 100;

    d3.select("#chart")
        .attr("width", width)
        .attr("height", height);

    chart.select(".overlay")
        .attr("width", width)
        .attr("height", height);

   nodeSize.domain( [0, d3.max(nodes, function (d) { return d.size; }) ] );
    linkColor.domain( d3.extent(edges, function (d) { return d.weight; }) )
            .range( ["black", "red"] );
    x.domain( d3.extent(nodes, function (d) { return d.ox; })  )
        .range([0, width]);
    y.domain( d3.extent(nodes, function (d) { return d.oy; })  )
        .range([0, height]);


    var filterExtras = function (d) {
        return !d.extra || embed; //If not extra don't show, unless embed is enabled
    };

    //Data binding
    force.nodes(nodes.filter(filterExtras))
                .links(drawEdges ? edges.filter(filterExtras): [])
                .size([width, height])
                .on("tick", onTick);

    if (embed) {
        nodeSize.range([5, 5]);
        linkSize = function () { return 1; };
        color = function (d) { return colorScale(d.working); }
    } else {
        nodeSize.range([5, 20]);
        linkSize = function () { return 3; };
        color = function (d) { return colorScale(d.oid); }
    }
    if (embed && fixed ) {
        //Parameters for embed graph
        force.charge(-1)
            .linkStrength(0.001)
            .gravity(0.1);

    } else {
        //Parameters for logical graph
        force.charge(-500)
            .linkStrength(0.1)
            .gravity(0.1);


    }


    d3.select("#chulo")
        .on("click", function (d) {
            force.stop();
            draw(logical, embedding, type);
        });
    d3.select("#drawEdges")
        .on("click", function (d) {
            force.stop();
            draw(logical, embedding, type);
        });
    d3.select("#embed")
        .on("click", function (d) {
            force.stop();
            draw(logical, embedding, type);
        });


    console.log(force.links());

    //Update links
    var selLinks = chart.selectAll(".link")
        .data(force.links(), function (d) { return d.source.id + "~" + d.target.id; });

    selLinks.enter()
        .append("path")
        .attr("class", "link")
        .style("stroke-width", function (e) {
            return linkSize(e.weight) + "pt";
        })
        .style("stroke", function (e) {
            return linkColor(e.weight);
        });

    selLinks.exit().remove();

    var sel = chart.selectAll(".node")
            .data(force.nodes(), function (d) { return d.id; });

    //New nodes
    var selEnter = sel.enter()
        .append("g")
        .attr("class", "node");

    selEnter.append("circle")
        .call(force.drag)
        .on("mousedown", function() { d3.event.stopPropagation(); })
        .on("mouseover", function(d) { console.log(d); })
        .append("title")

    sel.select("circle")
        .transition().duration(1000)
        .style("fill", function (d) {
            return color(d);
        })
        .attr("r", function (d) {
                return nodeSize(d.size);
        })
        .select("title")
            .text(function (d) {
                return "Node: " + d.name + " \nsize: " + d.size;
            });


    selEnter.append("text");

    sel.select("text")
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
        var k = e.alpha * 0.5;


        if (fixed) {

            nodes.forEach(function (n) {
                n.x += (x(n.ox) - n.x)*k;
                n.y += (y(n.oy) - n.y)*k;
            });
        }

        //Update Edges
        selLinks.attr("d", getPathForLink);

        //Update Edges
        // selLinks.attr("x1", function(d) { return d.source.x; })
        //     .attr("y1", function(d) { return d.source.y; })
        //     .attr("x2", function(d) { return d.target.x; })
        //     .attr("y2", function(d) { return d.target.y; });


        //Update Nodes
        sel.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    }


    force.start();

}



//Extracts the nodes of the logical graph from the correlations dictionary
function getNetworkFromLogicalCorrelations(logical, embed, coords) {
    var nodes = [], edges = [],
        dNodes = d3.map(),
        edge,
        s, t;

    function getOrCreateNode(id) {
        if (!dNodes.has(id)) {

            var ns = embed[id].map(function (d, i) {
                return {
                    id:id+"_"+d,
                    name:id+"_"+d,
                    oid : id,
                    extra: i!==0, //All but the first are extra nodes
                    size: embed[id].length,
                    embed: embed[id],
                    ox: coords[d][0],
                    oy: coords[d][1]
                }
            });
            dNodes.set(id, ns);
        }
        return dNodes.get(id);
    }


    //Compute the edges
    for (var edge in logical) {
        var split = edge.split(",");
        var ss = [], tt = []; //The multiple targets and sources after the embedding
        ss = getOrCreateNode(split[0]);
        tt = getOrCreateNode(split[1]);

        //Edges between nodes
        ss.forEach(function (s) {
            tt.forEach(function  (t) {
                edges.push({
                    source:s,
                    target:t,
                    extra: s.extra || t.extra, //Is an extra edge if any of the nodes are extra
                    weight:logical[edge]
                });

            });
        });

        //Edges between extras
        ss.forEach(function (s) {
            ss.forEach(function  (t) {
                if (s===t) { return; }
                edges.push({
                    source:s,
                    target:t,
                    extra: true, //Is an extra edge if any of the nodes are extra
                    weight:logical[edge]
                });
            });
        });
        tt.forEach(function (s) {
            tt.forEach(function  (t) {
                if (s===t) { return; }
                edges.push({
                    source:s,
                    target:t,
                    extra: true, //Is an extra edge if any of the nodes are extra
                    weight:logical[edge]
                });
            });
        });
    }

    //Aggregate all the nodes in a single list
    nodes = [];
    dNodes.values().forEach(function (ns) {
        ns.forEach(function (d) {
            nodes.push(d);
        });
    });

    return {dNodes:dNodes, edges:edges, nodes:nodes};
}




queue()
    .defer(d3.json, "embed.json")
    .await(function (err, embed) {
        var nodes = [], edges = [];
        var n;

        //All nodes
        for (n in embed.chimera_all_d3nodecoords) {
            var coords = embed.chimera_all_d3nodecoords[n];
            nodes.push({ox: coords[0], oy: coords[1], size:1, working:true});
        }

        embed.broken_qubits_0based.forEach(function (n) {
            nodes[n].working=false;
        });

        //Full edges
        embed.all_hardware_edges.forEach(function (e) {
            edges.push({
                source:e[0],
                target:e[1],
                weight:1
            })
        });



        var logical = getNetworkFromLogicalCorrelations(embed.J_chainNNB_logical, embed.embMin, embed.chimera_all_d3nodecoords);
        var embedding = {
            nodes: nodes,
            edges:edges
        };


        // draw(nodes, edges, "embed");
        draw(logical, embedding, "logical");


        window.onresize = function () { draw(logical, embedding, "logical"); };
    })
