## Future Enhancements

- [ ] Real-time training animation via epochs -> change in colors. 
- [ ] Layer-specific zoom focus
- [ ] Neuron activation heatmap
- [ ] Weight magnitude visualization
- [ ] input / output bars


# Custom Neural Network Visualizer

A 3D interactive visualization of a neural network trained on MNIST handwritten digit recognition. This project combines a custom-built neural network implementation with Three.js to create an immersive visualization of network architecture, weights, and connections.

**Purpose:** Visualization of actual model architecture is often lacking in machine learning. This project demonstrates what real-time neural network training looks like in 3D space, with dynamic weight updates and color-coded connections.

Stopped now: Entire simple model of sigmoid neural networks is in js. turns out people don't visualize this because it's a pain in the ass. so much pain. 

## Features

- **Custom Neural Network**: Fully implemented backpropagation neural network from scratch in pure JavaScript (no ML frameworks)
- **MNIST Training**: Load and preprocess MNIST dataset (55,000 training samples, 10,000 test samples)
- **3D Visualization**: Interactive Three.js scene showing network architecture in 3D space
- **Input Layer Grid**: Input layer (784 neurons) displayed as a 28×28 grid (matching MNIST image dimensions)
- **Dynamic Weight Visualization**: Connections colored by weight sign and magnitude
  - **Green**: Positive weights (excitatory connections)
  - **Red**: Negative weights (inhibitory connections)  
  - **White**: Neutral/weak weights
- **Real-time Training Updates**: Weights update color dynamically as network trains
- **Smart Connection Management**: Weak weights below threshold are automatically hidden; strong weights are shown/created dynamically
- **Interactive HUD**: Top bar displays:
  - Epoch counter (starts at 0)
  - Mini-batch progress counter
  - Real-time accuracy percentage
  - Training control buttons
- **Interactive Camera**: OrbitControls for smooth 3D navigation with reset button
- **Async Training**: Non-blocking training with UI updates every 10 mini-batches

## Project Structure

```
├── CustomNeuralNetwork.js      # Neural network implementation with backpropagation
├── MNIST_dataset.js             # MNIST data loading from Google Cloud
├── preprocessing.js             # Data preprocessing and reshaping
├── NetworkToDisplay.js          # Converts network to 3D scene configuration
├── SceneManager.js              # Three.js scene, camera, and lighting setup
├── SphereManager.js             # Creates and manages neuron spheres
├── ConnectionManager.js          # Creates and manages weight connections
├── main.js                      # Entry point and training orchestration
├── index.html                   # HTML page with canvas
└── README.md                    # This file
```

## Architecture

### Neural Network (CustomNeuralNetwork.js)

Custom implementation featuring:
- **Matrix operations**: Dot product, element-wise operations, transpose
- **Activation functions**: Sigmoid activation with derivatives
- **Training**: Stochastic Gradient Descent (SGD) with mini-batches
- **Backpropagation**: Full backpropagation algorithm for weight updates
- **Evaluation**: Accuracy testing on test data

```javascript
// Example usage
const network = new Network([784, 16, 16, 10]); // Input, hidden, hidden, output
network.SGD(trainingData, epochs, batchSize, learningRate, testData);
```

### Data Pipeline (preprocessing.js)

Loads MNIST data and formats it for the network:
1. Fetches image sprites and labels from Google Cloud Storage
2. Reshapes flat 784-element arrays into column vectors `[[val], [val], ...]`
3. Prepares one-hot encoded labels
4. Returns `{trainingData, testData}` ready for training

### Visualization (NetworkToDisplay.js)

Instance-based class that creates and updates the 3D scene directly:
- **Neurons**: Represented as spheres with layer-specific colors
  - Red: Input layer (28×28 grid)
  - Yellow: Hidden layers (vertical line)
  - Cyan: Output layer (vertical line for 10 classes)
- **Connections**: Dynamically managed based on weight magnitude
  - **Color coding by weight sign:**
    - Green: Positive weights (excitatory)
    - Red: Negative weights (inhibitory)
    - White: Neutral weights
  - **Smart visibility:** Connections below `weightThreshold` (default 0.1) are automatically hidden
  - **Dynamic updates:** `updateConnections()` creates new strong connections and removes weak ones in real-time

### 3D Scene Management (SceneManager.js)

Provides Three.js scene setup with:
- Perspective camera with orbit controls
- Ambient and directional lighting with atmospheric point lights
- Fog effect for depth perception
- Real-time rendering loop with connection position updates
- Window resize handling
- Camera reset functionality (removes momentum/velocity)

## Usage

### Basic Setup

1. Open `index.html` in a modern web browser
2. Wait for MNIST dataset to load (automatic)
3. The initial network architecture [784, 16, 16, 10] will be visualized immediately
4. Click **"Next Epoch"** button to train for one epoch
5. Watch as:
   - Mini-batch counter updates in real-time
   - Connections change color based on weight updates
   - Accuracy percentage updates after each epoch
   - Epoch counter increments

### Interactive Controls

**Mouse Controls:**
- **Left-click + drag**: Rotate view
- **Right-click + drag**: Pan camera
- **Mouse scroll**: Zoom in/out

**HUD Controls:**
- **Next Epoch button**: Train network for one epoch (async, non-blocking)
- **Reset Camera button**: Return camera to initial position and stop momentum

### Custom Network Configuration

Edit `main.js` to modify network architecture and training parameters:

```javascript
// Change network architecture
const network = new Network([784, 32, 32, 16, 10]);

// Adjust visualization parameters
const visualizer = new NetworkToDisplay(network, sceneManager, {
    layerSpacing: 10,
    neuronSpacing: 2,
    neuronRadius: 0.5,
    inputColor: '#ff6b6b',
    hiddenColor: '#ffd93d',
    outputColor: '#4ecdc4',
    weightThreshold: 0.1,    // Hide connections below this weight magnitude
    lineWidth: 0.1,
    opacity: 0.1
});

// Modify training parameters in the button click handler
network.SGD_single_epoch(trainingData, miniBatchSize=100, learningRate=0.5, testData, visualizer_function);
```

## Data Format

### Training Data

Each sample is a pair `[x, y]`:
- `x`: Column vector of 784 pixel values (normalized 0-1)
  ```
  [[0.5], [0.3], [0.8], ...]  // 784 elements
  ```
- `y`: One-hot encoded label (10 elements for digits 0-9)
  ```
  [[0], [0], [1], [0], ...] // For digit 2
  ```

### Network Weights

- `weights[i]`: 2D array from layer i to layer i+1
  - Dimensions: `[numNeuronsInLayerI+1, numNeuronsInLayerI]`
  - `weights[i][j][k]`: Weight from neuron k in layer i to neuron j in layer i+1

## Class Reference

### Network

```javascript
// Constructor
new Network(neuronCounts)  // e.g., [784, 16, 16, 10]

// Methods
feedforward(inputVector)                                           // Get network prediction
SGD_single_epoch(trainingData, miniBatchSize, lr, testData, cb)  // Train one epoch (async)
evaluate(testData)                                                 // Count correct predictions
backpropagation(x, y)                                             // Compute gradients
```

### SphereManager

```javascript
addSphere(name, config)           // Add neuron sphere
removeSphere(name)                // Remove sphere
updateSphere(name, config)        // Update sphere properties
getSphere(name)                   // Get sphere mesh
changeColorSmooth(name, color)    // Animate color change
```

### ConnectionManager

```javascript
addConnection(id, fromPos, toPos, config)  // Add weight connection
removeConnection(id)                       // Remove connection
updateConnectionPositions(id, from, to)   // Update endpoints
```

### NetworkToDisplay

```javascript
// Constructor (instance-based, not static)
new NetworkToDisplay(network, sceneManager, options)

// Methods
initialGeneration()              // Create all spheres and initial connections in scene
updateConnections()              // Update/create/delete connections based on current weights
highlightNeuron(layer, neuron, activation)  // Highlight active neuron (instance method)
```

**Static Methods:**
```javascript
NetworkToDisplay.weightToColor(weight)  // Convert weight value to color (red/white/green gradient)
```

## Performance Considerations

- **Input layer grid**: 28×28 = 784 neurons (no sampling)
- **Dynamic connections**: Only connections with weights above threshold are rendered
  - Initial: ~12,960 connections (784→16 + 16→16 + 16→10)
  - Runtime: Varies based on weight magnitudes (weak connections hidden)
- **Async training**: Mini-batches update UI every 10 iterations to prevent blocking
- **Color updates**: Real-time weight-to-color conversion with interpolation
- **Rendering**: Optimized for dynamic object creation/deletion with orbit controls

## Browser Requirements

- WebGL support (modern browsers: Chrome, Firefox, Safari, Edge)
- ES6 JavaScript support
- Minimum 1GB RAM recommended

## Dependencies

- **Three.js r128**: 3D graphics library (loaded from CDN)
- **OrbitControls**: Camera control extension for Three.js (loaded from CDN)
- **TensorFlow.js 1.0.0**: Used only for MNIST data loading from Google Cloud Storage

All dependencies are loaded via CDN - no installation required.

## Future Enhancements

- [ ] Layer-specific zoom focus
- [ ] Neuron activation heatmap (color neurons by activation value during inference)
- [ ] Input/output visualization bars showing sample images and predictions
- [ ] Weight magnitude histogram
- [ ] Training loss curve overlay
- [ ] Export/import trained model weights
- [ ] Multiple activation functions (ReLU, Tanh, etc.)
- [ ] Adjustable learning rate during training



## References

- MNIST Dataset: [Yann LeCun's MNIST Database](http://yann.lecun.com/exdb/mnist/)
- Three.js: [Three.js Documentation](https://threejs.org/docs/)
- Neural Networks: [Neural Networks and Deep Learning](http://neuralnetworksanddeeplearning.com/)

## License

This is an educational project for learning machine learning and 3D visualization.

## Author

Created as part of a custom neural network learning project.
