/*
User Story: I can see a Force-directed Graph that shows which campers are
posting links on Camper News to which domains.

User Story: I can see each camper's icon on their node.

User Story: I can see the relationship between the campers and the domains
they're posting.

User Story: I can tell approximately many times campers have linked to a
specific domain from it's node size.

User Story: I can tell approximately how many times a specific camper has
posted a link from their node's size.

Hint: Here's the Camper News Hot Stories API endpoint:
http://www.freecodecamp.com/news/hot.
*/

// Easy way to define margins
var margin = {
    top: 10,
    right: 70,
    bottom: 40,
    left: 40
  },
  width = 890 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom,
  $svg,
  $tooltip,
  $chart,
  tmpl;

$svg = d3.select('#chart').append('svg');
$toolTip = d3.select('.tooltip');
tmpl = $.templates('#tmpl');

$svg.attr({
  width: width + margin.left + margin.right,
  height: height + margin.top + margin.bottom
});
$chart = $svg.append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// TODO
// - Switch to FCC API endpoint
d3.json('./sample.json', function(err, data) {

  // Group all links by domain
  var pickKeys = R.map(R.pick(['link', 'author']));
  pickKeys();
  var groupByDomain = R.groupBy(function(data) {
    var re = /https?:\/\/([^\/]+)/;
    var result = data.link.match(re);
    return result[1];
  });
  var domainGroups = groupByDomain(pickKeys(data));

  // Build unique list of all authors
  var authors = R.map(R.pick(['author']), data);
  var y = R.map(function(v) {
    return {
      nodeName: v.author.username,
      nodeType: 'camper',
      nodeImage: v.author.picture
    }
  }, R.uniq(authors));

  // Build list of all domains with author associations intact
  var x = R.values(R.mapObjIndexed(function(v, key, data) {
    var children = R.uniq(R.map(R.path(['author', 'username']), v));
    return {
      nodeName: key,
      nodeType: 'domain',
      weight: v.length,
      children:children
    };
  }, domainGroups));

  var nodes = R.concat(x, y);

  // Connect nodes by linking each domain node to all children
  var edges = R.addIndex(R.map)(function(v, idx, ary) {
    if(v.children) {
      return R.addIndex(R.map)(function(a, aidx) {
        return {
          source:idx,
          target:R.findIndex(R.pathEq(['nodeName'], a), ary)
        }
      }, v.children);
    }
    else {
      return null;
    }
  }, nodes);

  // Filter out any nulls and flatten edge list
  edges = R.flatten(R.filter(v => (!!v), edges));

  var force = d3.layout.force()
    .nodes(nodes)
    .links(edges)
    .size([width, height])
    .linkDistance(40)
    .charge(-50)
    .start();

  // Interactive Data Visualization for the Web
  // by Scott Murray
  // Published by O'Reilly Media, Inc., 2013
  var edges = $svg.selectAll("line")
    .data(edges)
    .enter()
    .append("line")
    .style("stroke", "#ccc")
    .style("stroke-width", 1);

  // Interactive Data Visualization for the Web
  // by Scott Murray
  // Published by O'Reilly Media, Inc., 2013
  var nodes = $svg.selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", 10)
    .style("fill", function(d, i) {
      if(d.nodeType == 'domain') {
        return 'red';
      }
      else {
        return 'green';
      }
    })
    .call(force.drag);

    // Interactive Data Visualization for the Web
    // by Scott Murray
    // Published by O'Reilly Media, Inc., 2013
    force.on("tick", function() {

    edges.attr("x1", function(d) { return d.source.x; })
         .attr("y1", function(d) { return d.source.y; })
         .attr("x2", function(d) { return d.target.x; })
         .attr("y2", function(d) { return d.target.y; });

    nodes.attr("cx", function(d) { return d.x; })
         .attr("cy", function(d) { return d.y; });

   });

  // Derived from:
  // http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html
  nodes.on({
    'mouseover': function(v) {
      $toolTip.html(tmpl.render(v));
      $toolTip.transition().duration(200).style('opacity', .9);
      $toolTip.style({
        'left': (d3.event.pageX) + "px",
        'top': (d3.event.pageY - 28) + "px"
      });
    },
    'mouseout': (v) => {
      $toolTip.transition().style('opacity', 0);
    }
  });
});
