function generate() {
  let weightFromText = $('#gen1').val();
  let weightToText = $('#gen2').val();
  let nodesText = $('#gen3').val();
  let correlationText = $('#gen4').val();
  let lineWeightFromText = $('#gen5').val();
  let lineWeightToText = $('#gen6').val();

  let message = '';

  if (nodesText.length === 0) {
    message += ((message.length === 0) ? '' : '\n');
    message += 'Введіть Кількість задач.';
  }
  if (weightFromText.length === 0 || weightToText.length === 0) {
    message += ((message.length === 0) ? '' : '\n');
    message += 'Введіть Діапазон задач.';
  }
  if (correlationText.length === 0) {
    message += ((message.length === 0) ? '' : '\n');
    message += 'Введіть Зв\'язність графу.';
  }
  if (lineWeightFromText.length === 0 || lineWeightToText.length === 0) {
    message += ((message.length === 0) ? '' : '\n');
    message += 'Введіть Діапазон даних.';
  }

  if (message.length > 0) {
    d3.select('#modalerr').text(message);
    modalerr.hidden = false;
    return;
  }

  let nodeCount = parseInt(nodesText, 10);
  let fromNodeWeight = parseInt(weightFromText, 10);
  let toNodeWeight = parseInt(weightToText, 10);
  let correlation = parseInt(correlationText, 10);
  let fromLineWeight = parseInt(lineWeightFromText, 10);
  let toLineWeight = parseInt(lineWeightToText, 10);

  if (nodeCount == 0) {
    message += ((message.length === 0) ? '' : '\n');
    message += 'Невірна кількість задач.';
  }
  if (nodeCount == 1 && correlation != 100) {
    message += ((message.length === 0) ? '' : '\n');
    message += 'Невірна кількість задач або зв\'язність графу задач.';
  }
  if (fromNodeWeight > toNodeWeight || fromNodeWeight == 0) {
    message += ((message.length === 0) ? '' : '\n');
    message += 'Невірний діапазон обчислювальної складності задач.';
  }
  if (correlation > 100 || correlation == 0) {
    message += ((message.length === 0) ? '' : '\n');
    message += 'Невірна зв\'язність графу задач.';
  }
  if (fromLineWeight > toLineWeight || fromLineWeight == 0) {
    message += ((message.length === 0) ? '' : '\n');
    message += 'Невірний діапазон даних для пересилки.';
  }
  if (message.length > 0) {
    d3.select('#modalerr').text(message);
    modalerr.hidden = false;
    return;
  }

  $('#graphgenModal').modal('hide');

  // Graph reset and generate

  nodes.splice(0, nodes.length);
  links.splice(0, links.length);
  lastNodeId = 0; lastLinkId = 0;

  let sumOfNodeWeight = 0;

  for (let i = 0; i < nodeCount; i++) {
    let node = { id: ++lastNodeId, reflexive: false, weight: 1 };
    node.weight = Math.trunc(Math.random() * ((toNodeWeight - fromNodeWeight) + 1)) + fromNodeWeight;
    nodes.push(node);
    sumOfNodeWeight += node.weight;
  }
  let sumOfLineWeight = Math.trunc(sumOfNodeWeight * (100 - correlation) / correlation);

  while (sumOfLineWeight > 0) {
    let nextLineWeight = 0;

    if (sumOfLineWeight < fromLineWeight) {
      nextLineWeight = sumOfLineWeight;
    } else if (sumOfLineWeight < toLineWeight) {
      nextLineWeight = Math.trunc(Math.random() * ((sumOfLineWeight - fromLineWeight) + 1)) + fromLineWeight;
    } else  {
      nextLineWeight = Math.trunc(Math.random() * ((toLineWeight - fromLineWeight) + 1)) + fromLineWeight;
    }

    sumOfLineWeight -= nextLineWeight;

    let shouldAddToList = true;
    let line = { id: ++lastLinkId, left: false, right: true, weight: 1 };
    line.weight = nextLineWeight;

    let startNode = nodes[(Math.trunc(Math.random() * nodes.length))];
    let endNode = null; let countr = 0;
    while (endNode == null && shouldAddToList && countr < 20) {
      endNode = nodes[(Math.trunc(Math.random() * nodes.length))];

      for (let l in links) {
        if ((l.startNode == startNode && l.endNode == endNode) ||
            (l.startNode == endNode && l.endNode == startNode)) {
          l.weight += line.weight;
          shouldAddToList = false;
        }
      }
      if (shouldAddToList) {
        let matrix = getMatrix();
        if (hasRoute(matrix, nodes.indexOf(startNode), nodes.indexOf(endNode), true)) {
          endNode = null;
        } else {
          line.source = startNode;
          line.target = endNode;
          links.push(line);
          console.log(startNode.id +'_'+ endNode.id +'_'+ line.id);
        }
      }
      countr++;
    }
  }

  restart();
  force.alphaTarget(0.3).restart();
}

function getMatrix() {
  let matrix = [];
  for (let i = 0; i < nodes.length; i++) {
    matrix[i] = [];
  }
  for (let l in links) {
    console.log( l + ' duh ' +'_'+ links.length +'_'+ nodes.indexOf(l.target) +'_'+ nodes.indexOf(l.source) );
    //matrix[nodes.indexOf(l.source)][nodes.indexOf(l.target)] = 1;
    //matrix[nodes.indexOf(l.target)][nodes.indexOf(l.source)] = 1;
  }
  return matrix;
}

function hasRoute(matrix, from, to, isCycle) {
  let result = true;
  if (from != to && from >= 0 && from < matrix.length && to >= 0 && to < matrix.length) {
    if (matrix[from][to] == 1) {
      result = true;
    } else {
      if (isCycle) {
        matrix[from][to] = 1;
      }

      //				for (int i = 0; i < matrix.length; i++) {
      //				    for (int j = 0; j < matrix[i].length; j++) {
      //				        System.out.print(matrix[i][j] + " ");
      //				    }
      //				    System.out.println();
      //				}
      //				System.out.println();

      result = hasCycle(matrix, 0, (isCycle ? to : from), to);
      if (isCycle) {
        matrix[from][to] = 0;
      }
    }
  }
  return result;
}

function hasCycle(matrix, depth, current, to) {
  let result = false;
  if (to == current && depth != 0) {
    result = true;
  } else if (depth < matrix.length) {
    for (let m = 0; m < matrix.length; m++) { //matrix.length
      if (matrix[current][m] == 1) {
        matrix[current][m] = 0;
        result = hasCycle(matrix, depth + 1, m, to);
        matrix[current][m] = 1;
        if (result) {
          break;
        }
      }
    }
  }
  return result;
}