// set up SVG for D3
//const width = window.innerWidth - 200;
const contWidth = $('#graphArea').width();
const width = contWidth - 15;
const height = window.innerHeight - 150;
const colors = d3.scaleOrdinal(d3.schemeCategory10);

const svg = d3.select('#graphArea')
  .append('svg')
  .on('contextmenu', () => { d3.event.preventDefault(); })
  .attr('width', width)
  .attr('height', height);

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.
const nodes = [
  { id: 1, reflexive: false, weight: 1 },
  { id: 2, reflexive: true, weight: 1 }
];
let lastNodeId = 2;
const links = [
  { id: 1, source: nodes[0], target: nodes[1], left: false, right: true, weight: 1 }
];
let lastLinkId = 1;

// init D3 force layout
const force = d3.forceSimulation()
  .force('link', d3.forceLink().id((d) => d.id).distance(150))
  .force('charge', d3.forceManyBody().strength(-500))
  .force('x', d3.forceX(width / 2))
  .force('y', d3.forceY(height / 2))
  .on('tick', tick);

// init D3 drag support
const drag = d3.drag()
  // Mac Firefox doesn't distinguish between left/right click when Ctrl is held... 
  .filter(() => d3.event.button === 0 || d3.event.button === 2)
  .on('start', (d) => {
    if (!d3.event.active) force.alphaTarget(0.3).restart();

    d.fx = d.x;
    d.fy = d.y;
  })
  .on('drag', (d) => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  })
  .on('end', (d) => {
    if (!d3.event.active) force.alphaTarget(0.3);

    d.fx = null;
    d.fy = null;
  });

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#d65c5c');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#d65c5c');

// line displayed when dragging new nodes
const dragLine = svg.append('svg:path')
  .attr('class', 'link dragline hidden')
  .attr('d', 'M0,0L0,0');

// handles to link and node element groups
let path = svg.append('svg:g').selectAll('path');
let circle = svg.append('svg:g').selectAll('g');
let label = svg.append('svg:g').selectAll('text');

// mouse event vars
let selectedNode = null;
let selectedLink = null;
let mousedownLink = null;
let mousedownNode = null;
let mouseupNode = null;

function resetMouseVars() {
  mousedownNode = null;
  mouseupNode = null;
  mousedownLink = null;
}

// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', (d) => {
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

  circle.attr('transform', (d) => `translate(${d.x},${d.y})`);
}

// update graph (called when needed)
function restart() {
  // path (link) group
  path = path.data(links);

  // update existing links
  path.classed('selected', (d) => d === selectedLink)
    .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
    .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '');

  // remove old links
  path.exit().remove();

  // add new links
  path = path.enter().append('svg:path')
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
      restart();
    })
    .on('mouseover', (d) => {
      d3.select('div.link'+d.id).style('border', '1px solid black');
    })
    .on('mouseout', (d) => {
      d3.select('div.link'+d.id).style('border', '0px');
    })
    .merge(path);
    
  label = label.data(links, function (d) { return d.id; });
  label.exit().remove();
  label.enter().append('svg:text')
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
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, (d) => d.id);

  // update existing nodes (reflexive & selected visual states)
  circle.selectAll('circle')
    .style('fill', (d) => (d === selectedNode) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id))
    .classed('reflexive', (d) => d.reflexive);

  // remove old nodes
  circle.exit().remove();

  // add new nodes
  const g = circle.enter().append('svg:g');

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

      restart();
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
      // NB: links are strictly source < target; arrows separately specified by booleans
      const isRight = mousedownNode.id < mouseupNode.id;
      const source = isRight ? mousedownNode : mouseupNode;
      const target = isRight ? mouseupNode : mousedownNode;

      const link = links.filter((l) => l.source === source && l.target === target)[0];
      if (link) {
        link[isRight ? 'right' : 'left'] = true;
      } else {
        let matrix = getMatrix();
        if (hasRoute(matrix, nodes.indexOf(source), nodes.indexOf(target), false)) {
          //endNode = null;
          alert('Has route!');
        } else {
          links.push({ id: ++lastLinkId, source, target, left: !isRight, right: isRight, weight: 1 });
        }

      }

      // select new link
      selectedLink = link;
      selectedNode = null;
      restart();
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

  circle = g.merge(circle);

  // set the graph in motion
  force.nodes(nodes).force('link').links(links);

  force.alphaTarget(0.3).restart();
  settings();
}

function mousedown() {
  // because :active only works in WebKit?
  svg.classed('active', true);

  if (d3.event.ctrlKey || mousedownNode || mousedownLink) return;

  // insert new node at point
  const point = d3.mouse(this);
  const node = { id: ++lastNodeId, reflexive: false, x: point[0], y: point[1], weight: 1 };
  nodes.push(node);

  restart();
}

function mousemove() {
  if (!mousedownNode) return;

  // update drag line
  dragLine.attr('d', `M${mousedownNode.x},${mousedownNode.y}L${d3.mouse(this)[0]},${d3.mouse(this)[1]}`);
}

function mouseup() {
  if (mousedownNode) {
    // hide drag line
    dragLine
      .classed('hidden', true)
      .style('marker-end', '');
  }

  // because :active only works in WebKit?
  svg.classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  const toSplice = links.filter((l) => l.source === node || l.target === node);
  for (const l of toSplice) {
    links.splice(links.indexOf(l), 1);
  }
}

// only respond once per keydown
let lastKeyDown = -1;

function keydown() {
  //d3.event.preventDefault();

  if (lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if (d3.event.keyCode === 17) {
    circle.call(drag);
    svg.classed('ctrl', true);
    return;
  }

  if (!selectedNode && !selectedLink) return;

  switch (d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
      if (selectedNode) {
        nodes.splice(nodes.indexOf(selectedNode), 1);
        spliceLinksForNode(selectedNode);
      } else if (selectedLink) {
        links.splice(links.indexOf(selectedLink), 1);
      }
      selectedLink = null;
      selectedNode = null;
      restart();
      break;
    case 66: // B
      if (selectedLink) {
        // set link direction to both left and right
        selectedLink.left = true;
        selectedLink.right = true;
      }
      restart();
      break;
    case 76: // L
      if (selectedLink) {
        // set link direction to left only
        selectedLink.left = true;
        selectedLink.right = false;
      }
      restart();
      break;
    case 82: // R
      if (selectedNode) {
        // toggle node reflexivity
        selectedNode.reflexive = !selectedNode.reflexive;
      } else if (selectedLink) {
        // set link direction to right only
        selectedLink.left = false;
        selectedLink.right = true;
      }
      restart();
      break;
  }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if (d3.event.keyCode === 17) {
    circle.on('.drag', null);
    svg.classed('ctrl', false);
  }
}

function settings() {
  let sets = d3.select('#setsArea');
  sets.html('');
  sets.append('button')
    .attr('class', 'btn btn-primary btn-block mb-1')
    .attr('data-toggle', 'collapse')
    .attr('data-target', '#nodes-list')
    .text('Nodes');
  sets.append('div')
    .attr('class', 'card card-body collapse show mb-1')
    .attr('id','nodes-list');
  for (let n in nodes) {
    let setsnodes = sets.select('#nodes-list').append('div').attr('class', 'input-group mb-1');
    setsnodes.append('div')
      .attr('class', 'input-group-prepend')
      .append('span').attr('class', 'input-group-text')
      .style('background-color', colors(nodes[n].id))
      .text('node ' + nodes[n].id);
    setsnodes.append('input')
      .attr('type', 'number')
      .attr('class', 'form-control')
      .attr('min', '0')
      .attr('max', '100')
      .property('value', nodes[n].weight)
      .on('input', function input() {
        nodes[n].weight = this.value;
        svg.selectAll('text.node-weight').text(function (d) { return d.weight; } );
      });
  }
  sets.append('button')
    .attr('class', 'btn btn-primary btn-block mb-1')
    .attr('data-toggle', 'collapse')
    .attr('data-target', '#links-list')
    .text('Links');
  sets.append('div')
    .attr('class', 'card card-body collapse mb-1')
    .attr('id','links-list');
  for (let l in links) {
    let setslinks = sets.select('#links-list').append('div').attr('class', 'input-group mb-1 link' + links[l].id);
    setslinks.append('div')
      .attr('class', 'input-group-prepend')
      .append('span').attr('class', 'input-group-text')
      .style('background-color', '#d65c5c')
      .text('link ' + links[l].source.id +'-'+ links[l].target.id);
    setslinks.append('input')
      .attr('type', 'number')
      .attr('class', 'form-control')
      .attr('min', '0')
      .attr('max', '100')
      .property('value', links[l].weight)
      .on('input', function input() {
        links[l].weight = this.value;
        svg.selectAll('text.link-weight').selectAll('textPath').text((d) =>  d.weight );
      });
  }
}

function save() {
  
  let coln = ['id', 'weight', 'index'];
  let coll = ['id', 'weight', 'index', 'left', 'right', 'source', 'target'];
  // let result = cols.join(',') + '\n';
  let result = '';
  
  for (let n of nodes) {
    let tmp = ['node'];
    for (const c of coln) {
      tmp.push(n[c]);
    }
    result += tmp.join(',') + '\n';
  }
  for (let l of links) {
    let tmp = ['link'];
    for (const c of coll) {
      (c == 'source' || c == 'target') ? tmp.push(l[c].id) : tmp.push(l[c]);
    }
    result += tmp.join(',') + '\n';
  }
  
  let csvContent = 'data:text/csv;charset=utf-8,' 
    + result;
  
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'my_data.csv');
  document.body.appendChild(link); // Required for FF

  link.click();
}

function file() {
  let cols = ['type', 'id', 'weight', 'index', 'left', 'right', 'source', 'target'];
  let file = document.getElementById('graph-file').files[0];
  let reader = new FileReader();
  reader.onload = function() {
    nodes.splice(0, nodes.length);
    links.splice(0, links.length);
    lastNodeId = 0; lastLinkId = 0;
    restart();
    force.alphaTarget(0.3).restart();
    let lines = this.result.split(/\r\n|\n/);
    for (let l of lines) {
      if (l.length < 1) break;
      l = l.split(',');
      let obj = {};
      for (let i = 1; i < l.length; i++) {
        obj[cols[i]] = l[i];
      }
      if (l[0] == 'node') nodes.push(obj);
      if (l[0] == 'link') links.push(obj);
    }
    for (let link of links)
      for (let node of nodes) {
        if (link.source == node.id) link.source = node;
        if (link.target == node.id) link.target = node;
      }
  restart();
  force.alphaTarget(0.3).restart();
  };
  reader.readAsText(file);
}

function newgraph() {
  let c = confirm('Ви дійсно бажаєте створити новий граф?');
  if (!c) return;
  nodes.splice(0, nodes.length);
  links.splice(0, links.length);
  lastNodeId = 0; lastLinkId = 0;
  restart();
  nodes.push(
    { id: 1, reflexive: false, weight: 1 },
    { id: 2, reflexive: true, weight: 1 }
  );
  lastNodeId = 2;
  links.push(
    { id: 1, source: nodes[0], target: nodes[1], left: false, right: true, weight: 1 }
  );
  lastLinkId = 1;
  restart();
  force.alphaTarget(0.3).restart();
}

// app starts here
svg.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);
restart();
