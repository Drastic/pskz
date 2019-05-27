function countTime(matrix, weights, currentTime, current){
  let time = currentTime;
  for (let i = 0; i < matrix[current].length; i++) {
    console.log('matrix val is 1? ', matrix[current][i] == 1);
    if (matrix[current][i] == 1) {
      console.log(currentTime, matrix, weights, time + weights[i], i);
      currentTime = Math.max(currentTime, countTime(matrix, weights, time + weights[i], i));
    }
  }
  return currentTime;
}

function getWeights() {
  let arr = [];
  for (let n of nodes) {
    arr[nodes.indexOf(n)] = n.weight;
  }
  return arr;
}

function maxTime(prod) {
  let matrix = getMatrix();
  let weights = getWeights();
  //console.log(matrix.length);
  for (let i = 0; i < weights.length; i++) {
    weights[i] = Math.ceil(weights[i] / prod);
  }
  let maxT = 0;
  for (let i = 0; i < matrix.length; i++) {
    //console.log(maxT, matrix, weights, weights[i], i);
    maxT = Math.max(maxT, countTime(matrix, weights, weights[i], i));
  }
  return maxT;
}

function model() {
  let nodesText = $('#mod1').val();
  let weightFromText = $('#mod2').val();

  queueAlg = 1;
  setAlg = 1;
  let message = '';

  if (nodesText.length === 0) {
    message += ((message.length === 0) ? '' : '\n');
    message += 'Введіть номер алгоритму черги.';
  }
  if (weightFromText.length === 0) {
    message += ((message.length === 0) ? '' : '\n');
    message += 'Введіть номер алгоритму призначення.';
  }

  if (message.length > 0) {
    d3.select('#modelerr').text(message);
    modalerr.hidden = false;
    return;
  }

  let nodeCount = parseInt(nodesText, 10);
  let fromNodeWeight = parseInt(weightFromText, 10);

  if (nodeCount != 1 && nodeCount != 6 && nodeCount != 12) {
    message += ((message.length === 0) ? '' : '\n');
    message += 'Невірний номер алгоритму черги.';
  }
  if (fromNodeWeight != 1 && fromNodeWeight != 5) {
    message += ((message.length === 0) ? '' : '\n');
    message += 'Невірнй номер алгоритму призначення.';
  }

  if (message.length > 0) {
    d3.select('#modelerr').text(message);
    modalerr.hidden = false;
    return;
  }

  queueAlg = nodeCount;
  setAlg = fromNodeWeight;

  let prod = 1;
  let prods = [1, 2, 3, 4];
  for (let k = 0; k < prods.length; k++) {
    //prod = prods[k];
    let timeIn1Processor = 0;
    for (let node of nodes) {
      timeIn1Processor += Math.ceil(node.weight / prod);
    }
    let maxT = maxTime(prod);

    console.log('T = ' + timeIn1Processor);
    let queueAlgs = [6];
    let setAlgs = [5];
    return;
    for (let j = 0; j < setAlgs.length; j++) {
      setAlg = setAlgs[j];
      for (let i = 0; i < queueAlgs.length; i++) {
        queueAlg = queueAlgs[i];
        let processors = modeling(1, prods[k]);
        let index = processors.length - 1;
        let tick = processors[index].id;
        processors.splice(index,1);

        let ky = timeIn1Processor / tick;
        let kef = ky / nodesCS.length;
        let kea = maxT / tick;
        console.log('|  |   T  |  Ky  |  Ke  |  Kea |');
        console.log.format('|%3d%3d|%6d|%6.3f|%6.3f|%6.3f|\n', queueAlg, setAlg, tick, ky, kef, kea);
      }
    }
  }
    
  let processors = modeling(1, 2);
  let index = processors.size() - 1;
  let tick = processors[index].id;
  processors.splice(index,1);

  // CONTINUE
    
}

function modeling(prodLines, numOfLines) {
  let queue = Calculation.queue1List(currentGraphTask); // EXTERNAL
  if (queueAlg == 6) {
    queue = Calculation.queue6List(currentGraphTask); // EXTERNAL
  } else if (queueAlg == 12) {
    queue = Calculation.queue12List(currentGraphTask); // EXTERNAL
  }
  let processors = [];
  let matrix = getMatrix(currentGraphCS, true); // CS
  let linesWeight = getLinesWeights(currentGraphTask, prodLines); // TASK
  for (let node of nodesCS) {
    let mNode = new ModelingNode(node.id);
    processors.push(mNode);
  }
  for (let line of linesCS) {
    for (let node1 of processors) {
      if (line.source.id == node1.id) {
        for (let node2 of processors) {
          if (line.target.id == node2.id) {
            node1.linkedNodes.push(node2); // XZ
            node2.linkedNodes.push(node1); // XZ
          }
        }
      }
    }
  }
  for (let node of queue) {
    //			System.out.println(node.weight + ' ' + (int)Math.ceil(node.weight / (float)prod));
    node.weight = Math.ceil(node.weight / prod);
  }
  let tick = 0;
  while (!queue.isEmpty() || Calculation.hasBusyProccessors(processors)) { // EXTERNAL

    while (Calculation.hasReadyTasks(queue) && // EXTERNAL
        Calculation.hasFreeProccessors(processors)) { // EXTERNAL
      let readyTask = Calculation.getReadyTask(queue); // EXTERNAL
      let processor = Calculation.getProcessor1(processors); // EXTERNAL
      if (setAlg == 5) {
        processor = Calculation.getProcessor5(processors, readyTask, matrix, linesWeight);
      }
      processor.setTask(readyTask); // EXTERNAL
      if (readyTask.parentNodes.size() > 0) {
        let maxStartTime = 0;
        for (let doneTask of readyTask.parentNodes) {
          let route = Calculation.dijkstra(matrix, processors.indexOf(doneTask.processor), processors.indexOf(processor));
          let w = linesWeight[doneTask.id][readyTask.id];

          let time = (setAlg == 5 ? doneTask.endTime : tick);

          if (route.size() == 1) {
            maxStartTime = Math.max(maxStartTime, time);
          }
          for (let i = 0; i < route.size() - 1; i++) {
            let fromProc = processors.get(route.get(i));
            let toProc = processors.get(route.get(i + 1));
            let searching = true;
            while (searching) {
              if (fromProc.isLineBusy(time, w, numOfLines) || toProc.isLineBusy(time, w, numOfLines) ) {

              } else {
                let mLine = new ModelingLine();
                mLine.startNode = doneTask;
                mLine.endNode = readyTask;
                mLine.startProcessor = fromProc;
                mLine.endProcessor = toProc;
                mLine.startTime = time;
                mLine.endTime = time + w;

                fromProc.lines.add(mLine);
                toProc.lines.add(mLine);
                searching = false;
                maxStartTime = Math.max(maxStartTime, time + w);
              }
              time++;
            }
          }
        }
        readyTask.startTime = Math.max(maxStartTime, tick);
      } else {
        readyTask.startTime = tick;
      }
      queue.remove(readyTask);
    }
    tick++;
    for (let processor of processors) {
      let task = processor.getTask();
      if (task != null && processor.hasDataForTask(task, tick) && task.startTime < tick) {
        task.weight--;
        if (task.weight == 0) {
          task.endTime = tick;
          task.finished = true;
          processor.finishedTasks.add(task);
          processor.setTask(null);
        }
      }
    }
  }
  processors.add(new ModelingNode(tick));
  return processors;
}

