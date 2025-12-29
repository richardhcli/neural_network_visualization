/**
 * Helper functions for Neural Network Math
 */
const sigmoid = (z) => {
    // z can be a number or a matrix (array of arrays)
    if (Array.isArray(z)) {
        return z.map(row => row.map(val => 1.0 / (1.0 + Math.exp(-val))));
    }
    return 1.0 / (1.0 + Math.exp(-z));
};

const sigmoidDerivative = (z) => {
    const s = sigmoid(z);
    if (Array.isArray(s)) {
        return s.map(row => row.map(val => val * (1 - val)));
    }
    return s * (1 - s);
};

/**
 * Basic Matrix Operations (Numpy equivalents)
 */
const Matrix = {
    // Dot product of two matrices
    dot: (a, b) => {
        let result = new Array(a.length).fill(0).map(() => new Array(b[0].length).fill(0));
        return result.map((row, i) => {
            return row.map((val, j) => {
                return a[i].reduce((sum, elm, k) => sum + (elm * b[k][j]), 0);
            });
        });
    },
    // Element-wise addition
    add: (a, b) => a.map((row, i) => row.map((val, j) => val + b[i][j])),
    // Element-wise subtraction
    subtract: (a, b) => a.map((row, i) => row.map((val, j) => val - b[i][j])),
    // Element-wise multiplication (Hadamard product)
    multiply: (a, b) => a.map((row, i) => row.map((val, j) => val * b[i][j])),
    // Scalar multiplication
    scale: (a, factor) => a.map(row => row.map(val => val * factor)),
    // Transpose
    transpose: (a) => a[0].map((col, i) => a.map(row => row[i])),
    // Initialize with random Gaussian (standard normal)
    random: (rows, cols) => {
        return new Array(rows).fill(0).map(() => 
            new Array(cols).fill(0).map(() => {
                // Box-Muller transform for Gaussian distribution
                let u = 0, v = 0;
                while(u === 0) u = Math.random();
                while(v === 0) v = Math.random();
                return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
            })
        );
    },
    zeros: (rows, cols) => new Array(rows).fill(0).map(() => new Array(cols).fill(0)),
    argmax: (matrix) => {
        let flat = matrix.map(row => row[0]);
        return flat.indexOf(Math.max(...flat));
    }
};



class Network {
    constructor(neuronCounts) {
        this.numLayers = neuronCounts.length;
        this.neuronCounts = neuronCounts;
        
        // Biases for layers 1 to n (input layer 0 has no bias)
        this.biases = neuronCounts.slice(1).map(count => Matrix.random(count, 1));
        
        // Weights for layer pairs
        this.weights = [];
        for (let i = 0; i < neuronCounts.length - 1; i++) {
            this.weights.push(Matrix.random(neuronCounts[i+1], neuronCounts[i]));
        }
    }

    feedforward(inputVector) {
        let a = inputVector; // inputVector should be a 2D array: [[val], [val]]
        for (let i = 0; i < this.weights.length; i++) {
            const wa_plus_b = Matrix.add(Matrix.dot(this.weights[i], a), this.biases[i]);
            a = sigmoid(wa_plus_b);
        }
        return a;
    }

    // SGD(trainingData, epochs, miniBatchSize, learningRate, testData = null) {
    //     for (let j = 0; j < epochs; j++) {
    //         // Shuffle training data
    //         for (let i = trainingData.length - 1; i > 0; i--) {
    //             const k = Math.floor(Math.random() * (i + 1));
    //             [trainingData[i], trainingData[k]] = [trainingData[k], trainingData[i]];
    //         }

    //         // Create mini batches
    //         for (let k = 0; k < trainingData.length; k += miniBatchSize) {
    //             const miniBatch = trainingData.slice(k, k + miniBatchSize);
    //             this.updateMiniBatch(miniBatch, learningRate);
    //         }

    //         if (testData) {
    //             console.log(`Epoch ${j}: ${this.evaluate(testData)} / ${testData.length}`);
    //         } else {
    //             console.log(`Epoch ${j} complete`);
    //         }
    //     }
    // }
    async SGD_single_epoch(trainingData, miniBatchSize, learningRate, testData, visualizer_function) {
        // Shuffle training data
        for (let i = trainingData.length - 1; i > 0; i--) {
            const k = Math.floor(Math.random() * (i + 1));
            [trainingData[i], trainingData[k]] = [trainingData[k], trainingData[i]];
        }

        const minibatchCounterDiv = document.getElementById('minibatchCounter');
        const totalMiniBatches = Math.ceil(trainingData.length / miniBatchSize);
        let minibatchCounter = 0;

        // Process mini batches asynchronously to allow UI updates
        for (let k = 0; k < trainingData.length; k += miniBatchSize) {
            const miniBatch = trainingData.slice(k, k + miniBatchSize);
            this.updateMiniBatch(miniBatch, learningRate);

            minibatchCounter++;
            
            // Update UI every 10 batches or on last batch
            //if (minibatchCounter % 10 === 0 || k + miniBatchSize >= trainingData.length) {
                //if (minibatchCounterDiv) {
                    minibatchCounterDiv.textContent = `Mini-batch: ${minibatchCounter} / ${totalMiniBatches}`;
                //}
                // Allow UI to update
                await new Promise(resolve => setTimeout(resolve, 0));
            //}
        }

        // Update test data evaluation
        const accuracy = this.evaluate(testData);
        console.log(`Epoch complete: ${accuracy} / ${testData.length}`);
        
        const evalDiv = document.getElementById('accuracyValue');
        if (evalDiv) {
            evalDiv.textContent = `${accuracy} / ${testData.length} = ${(accuracy / testData.length * 100).toFixed(2)}%`;
        }

        // Reset minibatch counter display
        if (minibatchCounterDiv) {
            minibatchCounterDiv.textContent = `Ready`;
        }

        // Visualizer function call
        visualizer_function(this.getParameters());
    }

    updateMiniBatch(miniBatch, learningRate) {
        let accB = this.biases.map(b => Matrix.zeros(b.length, b[0].length));
        let accW = this.weights.map(w => Matrix.zeros(w.length, w[0].length));

        for (const [x, y] of miniBatch) {
            const [deltaGradB, deltaGradW] = this.backpropagation(x, y);
            accB = accB.map((b, i) => Matrix.add(b, deltaGradB[i]));
            accW = accW.map((w, i) => Matrix.add(w, deltaGradW[i]));
        }

        const eta_m = learningRate / miniBatch.length;
        this.weights = this.weights.map((w, i) => Matrix.subtract(w, Matrix.scale(accW[i], eta_m)));
        this.biases = this.biases.map((b, i) => Matrix.subtract(b, Matrix.scale(accB[i], eta_m)));
    }

    backpropagation(x, y) {
        let gradB = this.biases.map(b => Matrix.zeros(b.length, b[0].length));
        let gradW = this.weights.map(w => Matrix.zeros(w.length, w[0].length));

        // Feedforward
        let activation = x;
        let activations = [x];
        let logits = [];

        for (let i = 0; i < this.weights.length; i++) {
            let z = Matrix.add(Matrix.dot(this.weights[i], activation), this.biases[i]);
            logits.push(z);
            activation = sigmoid(z);
            activations.push(activation);
        }

        // Backward pass
        // Output error
        let delta = Matrix.multiply(
            this.costDerivative(activations[activations.length - 1], y),
            sigmoidDerivative(logits[logits.length - 1])
        );
        gradB[gradB.length - 1] = delta;
        gradW[gradW.length - 1] = Matrix.dot(delta, Matrix.transpose(activations[activations.length - 2]));

        // Propagate backwards through layers
        for (let l = 2; l < this.numLayers; l++) {
            const z = logits[logits.length - l];
            const sp = sigmoidDerivative(z);
            delta = Matrix.multiply(
                Matrix.dot(Matrix.transpose(this.weights[this.weights.length - l + 1]), delta),
                sp
            );
            gradB[gradB.length - l] = delta;
            gradW[gradW.length - l] = Matrix.dot(delta, Matrix.transpose(activations[activations.length - l - 1]));
        }

        return [gradB, gradW];
    }

    evaluate(testData) {
        let correctCount = 0;
        for (const [x, y] of testData) {
            const output = this.feedforward(x);
            //console.log(`Output; ${Matrix.argmax(output)}, Expected: ${y}; ${y.indexOf(1)}; ${Matrix.argmax(y)}`);
            //y is column vector one-hot encoded, so we use argmax to get the index. indexOf assume is 1D array, this is 2D array. 
            if (Matrix.argmax(output) == Matrix.argmax(y)) {
                correctCount++;
            }
        }
        return correctCount;
    }

    costDerivative(outputActivations, y) {
        return Matrix.subtract(outputActivations, y);
    }


    getParameters() {
        return {
            biases: this.biases,
            weights: this.weights
        };
    }
}