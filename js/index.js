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

var width = 890;
var height = 600;
var imageAttributes = {
  x: 0,
  y: 0,
  width: 52,
  height: 52
}
var $svg, $tooltip, $chart, tmpl;

$svg = d3.select('#chart').append('svg');
$toolTip = d3.select('.tooltip');
tmpl = $.templates('#tmpl');

$svg.attr({
  width,
  height
});
$chart = $svg.append('g');

d3.json('https://www.freecodecamp.com/news/hot', function(err, data) {

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
      nodeElType:'circle',
      nodeImage: v.author.picture
    }
  }, R.uniq(authors));

  // Build list of all domains with author associations intact
  var x = R.values(R.mapObjIndexed(function(v, key, data) {
    var children = R.uniq(R.map(R.path(['author', 'username']), v));
    return {
      nodeName: key,
      nodeType: 'domain',
      nodeElType: 'circle',
      nodeWeight: v.length,
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

  // Define background images
  // Derived from:
  // http://stackoverflow.com/questions/11496734/add-a-background-image-png-to-a-svg-circle-shape
  var $def = $svg.append('defs').attr('id', 'defs');
  $def.selectAll('pattern').data(nodes)
  .enter()
  .append('pattern')
  .attr(imageAttributes)
  .attr('id', function(v) {
    return v.nodeName;
  })
  .append('svg:image')
  .attr(imageAttributes)
  .attr('xlink:href', function(v) {
    return v.nodeImage;
  });

  var force = d3.layout.force()
    .nodes(nodes)
    .links(edges)
    .size([width, height])
    .linkDistance(100)
    .charge(-100)
    .gravity(.1)
    .start();

  // Interactive Data Visualization for the Web
  // by Scott Murray
  // Published by O'Reilly Media, Inc., 2013
  var edges = $chart.selectAll('line')
    .data(edges)
    .enter()
    .append('line')
    .style('stroke', '#ccc')
    .style('stroke-width', 1);

  // Interactive Data Visualization for the Web
  // by Scott Murray
  // Published by O'Reilly Media, Inc., 2013
  var nodes = $chart.selectAll('circle')
    .data(nodes)
    .enter()
    .append(function(v) {
      return document.createElementNS('http://www.w3.org/2000/svg', v.nodeElType);
    })
    .attr('r', function(v) {
      return v.nodeWeight ? v.nodeWeight*4 : 25;
    })
    .style('fill', function(v, i) {
      if(v.nodeType == 'domain') {
        return 'darkgreen';
      }
      else {
        return 'url(#' + v.nodeName + ')';
      }
    })
    .call(force.drag);

  // Interactive Data Visualization for the Web
  // by Scott Murray
  // Published by O'Reilly Media, Inc., 2013
  force.on('tick', function() {
    edges.attr('x1', function(v) { return v.source.x; })
    .attr('y1', function(v) { return v.source.y; })
    .attr('x2', function(v) { return v.target.x; })
    .attr('y2', function(v) { return v.target.y; });

    // http://stackoverflow.com/questions/17853985/how-do-i-change-circular-to-rectangular-node-in-d3-force-layout
     nodes.attr('cx', function(v) { return v.nodeElType == 'circle' ? v.x : null; })
     .attr('cy', function(v) { return v.nodeElType == 'circle' ? v.y : null; })
     .attr('x', function(v) { return v.nodeElType == 'rect' ? v.x : null; })
     .attr('y', function(v) { return v.nodeElType == 'rect' ? v.y : null; })
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
