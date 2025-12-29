/**
 * main.js
 * Minimalistic Three.js scene with JSON-based initialization
 */


// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    (async () => {
        window.sceneManager = new SceneManager();

        const figureOptions = {
            layerSpacing: 10,
            neuronSpacing: 2,
            neuronRadius: 0.5,
            inputColor: '#ff6b6b',
            hiddenColor: '#ffd93d',
            outputColor: '#4ecdc4',
            weightThreshold: 0.1,
            lineWidth: 0.1,
            opacity: 0.1
        };


        // preprocess MNIST data
        const { trainingData, testData } = await preprocessMNISTData();
        console.log('✓ MNIST data preprocessed');
        
        //model: 

        //create model network:
        const network = new Network([784, 16, 16, 10]); // example architecture


        // Train the network
        //network.SGD(trainingData, 1, 10, 0.5, testData);

        //testing:
        // const network = new Network([784, 1, 1, 1]);

        // Visualizer instance (non-static class)
        const visualizer = new NetworkToDisplay(network, sceneManager, figureOptions);

        // Build spheres and initial connections directly in the scene
        visualizer.initialGeneration();

        const visualizer_function = () => {
            visualizer.updateConnections();
            console.log('✓ Visualization updated');
        };

        // Initialize epoch counter
        let epochCount = 0;

        //attach epoch training to button
        const trainEpochButton = document.getElementById('epochButton');
        if (trainEpochButton) {
            trainEpochButton.addEventListener('click', () => {
                network.SGD_single_epoch(trainingData, 100, 0.5, testData, visualizer_function);
                
                // Increment and update epoch counter display
                epochCount++;
                const epochCounterDiv = document.getElementById('epochCounter');
                if (epochCounterDiv) {
                    epochCounterDiv.textContent = `Epoch: ${epochCount}`;
                }
            });
        }


    })();

    // sceneManager.loadFromJSON({
    //     spheres: [
    //         { name: 'A', radius: 1.5, color: '#ff0000', position: { x: -5, y: 0, z: 0 } },
    //         { name: 'B', radius: 1.5, color: '#00ff00', position: { x: 5, y: 0, z: 0 } }
    //     ],
    //     connections: [
    //         { id: 'AB', from: 'A', to: 'B', color: '#ffffff', lineWidth: 2 }
    //     ]
    // });

    // Example: Uncomment to add initial demo spheres
    // sceneManager.addMultipleSpheres(5);
    // sceneManager.connectSphereChain(['Sphere_0', 'Sphere_1', 'Sphere_2', 'Sphere_3', 'Sphere_4']);
});
