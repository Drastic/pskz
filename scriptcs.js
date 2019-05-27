// set up SVG for D3
//const width = window.innerWidth - 200;
const svgCS = d3.select('#graphCSArea')
  .append('svg')
  .on('contextmenu', () => { d3.event.preventDefault(); })
  .attr('width', width)
  .attr('height', height);

// set up initial nodesCS and linksCS
//  - nodesCS are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - linksCS are always source < target; edge directions are set by 'left' and 'right'.
const nodesCS = [
  { id: 1, reflexive: false, weight: 1 },
  { id: 2, reflexive: true, weight: 1 }
];
let lastNodeIdCS = 2;
const linksCS = [
  { id: 1, source: nodesCS[0], target: nodesCS[1], left: false, right: true, weight: 1 }
];
let lastLinkIdCS = 1;

// init D3 force layout
const forceCS = d3.forceSimulation()
  .force('link', d3.forceLink().id((d) => d.id).distance(150))
  .force('charge', d3.forceManyBody().strength(-500))
  .force('x', d3.forceX(width / 2))
  .force('y', d3.forceY(height / 2))
  .on('tick', tickCS);

// update force layout (called automatically each iteration)
function tickCS() {
  // draw directed edges with proper padding from node centers
  pathCS.attr('d', (d) => {
    const deltaX = d.target.x - d.source.x;
    const deltaY = d.target.y - d.source.y;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const normX = deltaX / dist;
    const normY = deltaY / dist;
    const sourcePadding = d.left ? 17 : 12;
    const targetPadding = d.right ? 17 : 12;
    const sourceX = d.source.x + (sourcePadding * normX);
    const sourceY = d.source.y + (sourcePadding * normY);
    const targetX = d.target.x - (targetPadding * normX);
    const targetY = d.target.y - (targetPadding * normY);

    return `M${sourceX},${sourceY}L${targetX},${targetY}`;
  });

  circleCS.attr('transform', (d) => `translate(${d.x},${d.y})`);
}

// handles to link and node element groups
let pathCS = svgCS.append('svg:g').selectAll('path');
let circleCS = svgCS.append('svg:g').selectAll('g');
let labelCS = svgCS.append('svg:g').selectAll('text');

function restartCS() {
  // pathCS (link) group
  pathCS = pathCS.data(linksCS);

  // update existing linksCS
  pathCS.classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '');

  // remove old linksCS
  pathCS.exit().remove();

  // add new linksCS
  pathCS = pathCS.enter().append('svg:path')
    .attr('class', 'link')
    .attr('id', (d) => 'link'+d.id)
    .classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '')
    .on('mousedown', (d) => {
      if (d3.event.ctrlKey) return;

      // select link
      mousedownLink = d;
      selectedLink = (mousedownLink === selectedLink) ? null : mousedownLink;
      selectedNode = null;
      restartCS();
    })
    .on('mouseover', (d) => {
      d3.select('div.link'+d.id).style('border', '1px solid black');
    })
    .on('mouseout', (d) => {
      d3.select('div.link'+d.id).style('border', '0px');
    })
    .merge(pathCS);
    
  labelCS = labelCS.data(linksCS, function (d) { return d.id; });
  labelCS.exit().remove();
  labelCS.enter().append('svg:text')
    .attr('class', 'link-weight')
    .attr('dy', 15)
    .attr('x', 4)
    .append('textPath')
    .attr('xlink:href',(d) => '#link'+d.id)
    .attr('text-anchor', 'middle')
    .attr('startOffset', '50%')
    .text((d) => d.weight);
    //.merge(path);


  // circle (node) group
  // NB: the function arg is crucial here! nodesCS are known by id, not by index!
  circleCS = circleCS.data(nodesCS, (d) => d.id);

  // update existing nodesCS (reflexive & selected visual states)
  circleCS.selectAll('circle')
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .classed('reflexive', (d) => d.reflexive);

  // remove old nodesCS
  circleCS.exit().remove();

  // add new nodesCS
  const g = circleCS.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', 16)
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .style('stroke', (d) => d3.rgb(colors(d.id)).darker().toString())
    .classed('reflexive', (d) => d.reflexive)
    .on('mouseover', function (d) {
      if (!mousedownNode || d === mousedownNode) return;
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.5)');
    })
    .on('mouseout', function (d) {
      if (!mousedownNode || d === mousedownNode) return;
      // unenlarge target node
      d3.select(this).attr('transform', '');
    })
    .on('mousedown', (d) => {
      if (d3.event.ctrlKey) return;

      // select node
      mousedownNode = d;
      selectedNode = (mousedownNode === selectedNode) ? null : mousedownNode;
      selectedLink = null;

      // reposition drag line
      dragLine
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', `M${mousedownNode.x},${mousedownNode.y}L${mousedownNode.x},${mousedownNode.y}`);

      restartCS();
    })
    .on('mouseup', function (d) {
      if (!mousedownNode) return;

      // needed by FF
      dragLine
        .classed('hidden', true)
        .style('marker-end', '');

      // check for drag-to-self
      mouseupNode = d;
      if (mouseupNode === mousedownNode) {
        resetMouseVars();
        return;
      }

      // unenlarge target node
      d3.select(this).attr('transform', '');

      // add link to graph (update if exists)
      // NB: linksCS are strictly source < target; arrows separately specified by booleans
      const isRight = mousedownNode.id < mouseupNode.id;
      const source = isRight ? mousedownNode : mouseupNode;
      const target = isRight ? mouseupNode : mousedownNode;

      const link = linksCS.filter((l) => l.source === source && l.target === target)[0];
      if (link) {
        link[isRight ? 'right' : 'left'] = true;
      } else {
        let matrix = getMatrix();
        if (hasRoute(matrix, nodesCS.indexOf(source), nodesCS.indexOf(target), false)) {
          //endNode = null;
          alert('Has route!');
        } else {
          linksCS.push({ id: ++lastLinkId, source, target, left: !isRight, right: isRight, weight: 1 });
        }

      }

      // select new link
      selectedLink = link;
      selectedNode = null;
      restartCS();
    });

  // show node IDs
  g.append('svg:text')
    .attr('x', 0)
    .attr('y', 5)
    .attr('class', 'id')
    .text((d) => d.id);
  g.append('svg:text')
    .attr('x', 24)
    .attr('y', 4)
    .attr('class', 'node-weight')
    .text((d) => d.weight);

  circleCS = g.merge(circleCS);

  // set the graph in motion
  forceCS.nodes(nodesCS).force('link').links(linksCS);

  forceCS.alphaTarget(0.3).restart();
  //settingsCS();
}

restartCS();
