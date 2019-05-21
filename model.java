public void handle(ActionEvent t) {

  queueAlg = 1;
  setAlg = 1;

  Label queueLabel = new Label("Алгоритм черги:");
  queueLabel.setMinWidth(200);
  queueLabel.setMaxWidth(200);
  queueLabel.setFont(new Font("Arial", 16));

  TextField queueTextField = new TextField();
  queueTextField.setMinWidth(50);
  queueTextField.setMaxWidth(50);
  queueTextField.textProperty().addListener(new ChangeListener<String>() {
    @Override
    public void changed(ObservableValue<? extends String> observable,
        String oldValue, String newValue) {
      if (newValue != null) {
        queueTextField.setText(newValue.replaceAll("[^\\d.]", ""));
      }
    }
  });

  HBox hBoxQueue = new HBox();
  hBoxQueue.getChildren().addAll(queueLabel, queueTextField);

  Label setLabel = new Label("Алгоритм призначення:");
  setLabel.setMinWidth(200);
  setLabel.setMaxWidth(200);
  setLabel.setFont(new Font("Arial", 16));

  TextField setTextField = new TextField();
  setTextField.setMinWidth(50);
  setTextField.setMaxWidth(50);
  setTextField.textProperty().addListener(new ChangeListener<String>() {
    @Override
    public void changed(ObservableValue<? extends String> observable,
        String oldValue, String newValue) {
      if (newValue != null) {
        setTextField.setText(newValue.replaceAll("[^\\d.]", ""));
      }
    }
  });

  HBox hBoxSet = new HBox();
  hBoxSet.getChildren().addAll(setLabel, setTextField);

  Button button = new Button("Зберегти");
  button.setMinWidth(380);
  button.setMaxWidth(380);
  button.setOnAction(new EventHandler<ActionEvent>() {
    @Override public void handle(ActionEvent e) {

      String nodesText = queueTextField.getText();
      String weightFromText = setTextField.getText();

      String message = "";

      if (nodesText.isEmpty()) {
        message += (message.isEmpty() ? "" : "\n");
        message += "Введіть номер алгоритму черги.";
      }
      if (weightFromText.isEmpty()) {
        message += (message.isEmpty() ? "" : "\n");
        message += "Введіть номер алгоритму призначення.";
      }

      if (!message.isEmpty()) {
        showGenerateGraphTaskAlert(message);
      } else {
        int nodeCount = Integer.parseInt(nodesText);
        int fromNodeWeight = Integer.parseInt(weightFromText);

        if (nodeCount != 1 && nodeCount != 6 && nodeCount != 12) {
          message += (message.isEmpty() ? "" : "\n");
          message += "Невірний номер алгоритму черги.";
        }
        if (fromNodeWeight != 1 && fromNodeWeight != 5) {
          message += (message.isEmpty() ? "" : "\n");
          message += "Невірнй номер алгоритму призначення.";
        }
        if (!message.isEmpty()) {
          showGenerateGraphTaskAlert(message);
        } else {
          queueAlg = nodeCount;
          setAlg = fromNodeWeight;
        }
      }
    }
  });
  VBox rootBox = new VBox();
  rootBox.getChildren().addAll(hBoxQueue, hBoxSet, button);

  ScrollPane scrollPaneSelect = new ScrollPane();
  scrollPaneSelect.setContent(rootBox);
  scrollPaneSelect.setHbarPolicy(ScrollBarPolicy.AS_NEEDED);
  scrollPaneSelect.setVbarPolicy(ScrollBarPolicy.NEVER);

  Scene sceneSelect = new Scene(scrollPaneSelect);
  sceneSelect.setFill(Color.OLDLACE);

  Stage newStageSelect = new Stage();
  newStageSelect.initOwner(stage);
  newStageSelect.initModality(Modality.APPLICATION_MODAL);
  newStageSelect.setWidth(400);
  newStageSelect.setHeight(200);
  newStageSelect.setTitle("Моделювання");
  newStageSelect.setScene(sceneSelect);
  newStageSelect.showAndWait();

  System.out.println(currentGraphTask.fileName);
  prod = 1;
  int[] prods = {1, 2, 3, 4};
  for (int k = 0; k < prods.length; k++) {
    //prod = prods[k];
    int timeIn1Processor = 0;
    for (Node node : currentGraphTask.nodesList) {
      timeIn1Processor += (int)Math.ceil(node.weight / (float)prod);
    }
    int maxTime = Calculation.maxTime(currentGraphTask, prod);

    System.out.println("T = " + timeIn1Processor);
    int[] queueAlgs = {6};
    int[] setAlgs = {5};
    for (int j = 0; j < setAlgs.length; j++) {
      setAlg = setAlgs[j];
      for (int i = 0; i < queueAlgs.length; i++) {
        queueAlg = queueAlgs[i];
        List<ModelingNode> processors = modeling(1, prods[k]);
        int index = processors.size() - 1;
        int tick = processors.get(index).id;
        processors.remove(index);

        float ky = (float)timeIn1Processor / (float)tick;
        float kef = ky / (float)currentGraphCS.nodesList.size();
        float kea = (float)maxTime / (float)tick;
        System.out.println("|  |   T  |  Ky  |  Ke  |  Kea |");
        System.out.format("|%3d%3d|%6d|%6.3f|%6.3f|%6.3f|\n", queueAlg, setAlg, tick, ky, kef, kea);
      }
    }
  }

  List<ModelingNode> processors = modeling(1, 2);
  int index = processors.size() - 1;
  int tick = processors.get(index).id;
  processors.remove(index);

  int deltaX = 20;
  int width = tick * deltaX + 100;
  int height = processors.size() * 120 + 20;
  Canvas canvas = new Canvas(width, height);
  final GraphicsContext graphicsContext = canvas.getGraphicsContext2D();
  graphicsContext.setFill(Color.DEEPSKYBLUE);
  graphicsContext.setStroke(Color.DARKBLUE);
  graphicsContext.setLineWidth(1);
  graphicsContext.setFont(Font.font("Verdana", FontWeight.LIGHT, 10));
  graphicsContext.clearRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);

  for (ModelingNode proc : processors) {

    int startY = (processors.indexOf(proc) + 1) * 120;
    graphicsContext.beginPath();
    graphicsContext.moveTo(50, startY);
    graphicsContext.lineTo(width - 50, startY);
    graphicsContext.stroke();

    graphicsContext.strokeText("" + (processors.indexOf(proc) + 1), 30, startY);

    for (int i = 0; i <= tick; i++) {
      graphicsContext.beginPath();
      graphicsContext.moveTo(50 + i * deltaX, startY - 5);
      graphicsContext.lineTo(50 + i * deltaX, startY + 5);
      graphicsContext.stroke();
      if (i % 2 == 0) {
        graphicsContext.strokeText("" + i, 50 + i * 20, startY + 10);
      }
    }
    graphicsContext.setStroke(Color.DEEPSKYBLUE);
    for (QueueNode task : proc.finishedTasks) {
      graphicsContext.strokeRoundRect(50 + task.startTime * deltaX, startY - 20, (task.endTime - task.startTime) * deltaX, 20, 20, 20);
      graphicsContext.strokeText("" + (task.id + 1), 50 + (task.endTime + task.startTime) * deltaX / 2, startY - 5);
    }
    graphicsContext.setStroke(Color.DARKBLUE);
    int lineDeltaY = 40;
    int deltaY = 20;
    for (ModelingLine line : proc.lines) {
      if (line.startProcessor == proc) {
        graphicsContext.setStroke(Color.GREEN);
      } else {
        graphicsContext.setStroke(Color.RED);
      }

      graphicsContext.beginPath();
      graphicsContext.moveTo(50 + line.startTime * deltaX, startY - lineDeltaY);
      graphicsContext.lineTo(50 + line.endTime * deltaX, startY - lineDeltaY);
      graphicsContext.stroke();

      graphicsContext.beginPath();
      graphicsContext.moveTo(50 + line.startTime * deltaX, startY - lineDeltaY - 3);
      graphicsContext.lineTo(50 + line.startTime * deltaX, startY - lineDeltaY + 3);
      graphicsContext.stroke();

      graphicsContext.beginPath();
      graphicsContext.moveTo(50 + line.endTime * deltaX, startY - lineDeltaY - 3);
      graphicsContext.lineTo(50 + line.endTime * deltaX, startY - lineDeltaY + 3);
      graphicsContext.stroke();

      graphicsContext.strokeText("" + (line.startNode.id + 1) + "-" + (line.endNode.id + 1) + "(" + (processors.indexOf(line.endProcessor) + 1) + ")", 50 + (line.endTime + line.startTime) * deltaX / 2, startY - lineDeltaY - 5);
      graphicsContext.setStroke(Color.DARKBLUE);
      lineDeltaY += deltaY;
      if (lineDeltaY == 80) {
        deltaY = -20;
      } else if (lineDeltaY == 40) {
        deltaY = 20;
      }
    }
  }

  ScrollPane scrollPane = new ScrollPane();
  scrollPane.setContent(canvas);
  scrollPane.setHbarPolicy(ScrollBarPolicy.AS_NEEDED);
  scrollPane.setVbarPolicy(ScrollBarPolicy.AS_NEEDED);

  Scene scene = new Scene(scrollPane);
  scene.setFill(Color.OLDLACE);

  Stage newStage = new Stage();
  newStage.initOwner(stage);
  newStage.initModality(Modality.NONE);
  newStage.setWidth(700);
  newStage.setHeight(500);
  newStage.setTitle("Моделювання");
  newStage.setScene(scene);
  newStage.show();
}
