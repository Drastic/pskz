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

  // Generate graph

  nodes.splice(0, nodes.length);
  links.splice(0, links.length);
  restart();
}