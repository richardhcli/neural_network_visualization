// import { MnistData } from './MNIST_dataset.js';


/**
 * Loads and preprocesses MNIST dataset for neural network training
 * Reshapes flat image arrays into column vectors and formats labels
 * @returns {Promise<{trainingData: Array, testData: Array}>} Preprocessed training and test data
 */
async function preprocessMNISTData() {
    
const IMAGE_SIZE = 784;
const NUM_CLASSES = 10;
const NUM_TRAIN_ELEMENTS = 55000;
const NUM_TEST_ELEMENTS = 10000;


    // Load MNIST data from remote sources
    const mnistData = new MnistData();
    await mnistData.load();

    // Convert training data to format expected by Network class
    const trainingData = [];
    for (let i = 0; i < NUM_TRAIN_ELEMENTS; i++) {
        const imageStart = i * IMAGE_SIZE;
        const labelStart = i * NUM_CLASSES;
        
        // Reshape image from flat array into column vector [[val], [val], ...]
        const x = [];
        for (let j = 0; j < IMAGE_SIZE; j++) {
            x.push([mnistData.trainImages[imageStart + j]]);
        }
        
        // Extract one-hot encoded label as column vector
        const y = [];
        for (let j = 0; j < NUM_CLASSES; j++) {
            y.push([mnistData.trainLabels[labelStart + j]]);
        }
        
        trainingData.push([x, y]);
    }

    // Convert test data to format expected by Network class
    const testData = [];
    for (let i = 0; i < NUM_TEST_ELEMENTS; i++) {
        const imageStart = i * IMAGE_SIZE;
        const labelStart = i * NUM_CLASSES;
        
        // Reshape image from flat array into column vector [[val], [val], ...]
        const x = [];
        for (let j = 0; j < IMAGE_SIZE; j++) {
            x.push([mnistData.testImages[imageStart + j]]);
        }
        
        // Extract one-hot encoded label as column vector
        const y = [];
        for (let j = 0; j < NUM_CLASSES; j++) {
            y.push([mnistData.testLabels[labelStart + j]]);
        }
        
        testData.push([x, y]);
    }

    return { trainingData, testData };
}

