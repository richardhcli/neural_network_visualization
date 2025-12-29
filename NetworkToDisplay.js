/**
 * NetworkToDisplay - Interface between neural network and 3D visualization
 * Creates spheres and manages connections directly in the SceneManager.
 */
class NetworkToDisplay {
    constructor(network, sceneManager, options = {}) {
        this.network = network;
        this.sceneManager = sceneManager;

        const {
            layerSpacing = 10,
            neuronSpacing = 2,
            neuronRadius = 0.5,
            inputColor = '#ff6b6b',
            hiddenColor = '#ffd93d',
            outputColor = '#4ecdc4',
            weightThreshold = 0.1,
            lineWidth = 0.1,
            opacity = 0.1
        } = options;

        this.layerSpacing = layerSpacing;
        this.neuronSpacing = neuronSpacing;
        this.neuronRadius = neuronRadius;
        this.inputColor = inputColor;
        this.hiddenColor = hiddenColor;
        this.outputColor = outputColor;
        this.weightThreshold = weightThreshold;
        this.lineWidth = lineWidth;
        this.opacity = opacity;
    }

    /**
     * Create all neuron spheres and initial connections in the scene.
     */
    initialGeneration() {
        const layers = this.network.neuronCounts;
        const numLayers = layers.length;

        for (let layerIdx = 0; layerIdx < numLayers; layerIdx++) {
            const neuronCount = layers[layerIdx];
            const x = layerIdx * this.layerSpacing - (numLayers - 1) * this.layerSpacing / 2;

            let color = this.hiddenColor;
            if (layerIdx === 0) color = this.inputColor;
            else if (layerIdx === numLayers - 1) color = this.outputColor;

            if (layerIdx === 0) {
                const gridSize = Math.sqrt(neuronCount);
                console.assert(
                    Math.floor(gridSize) * Math.floor(gridSize) === neuronCount,
                    `Input layer neuron count ${neuronCount} is not a perfect square`
                );

                const intGridSize = Math.floor(gridSize);
                const halfSize = (intGridSize - 1) * this.neuronSpacing / 2;
                let sphereCount = 0;

                for (let row = 0; row < intGridSize; row++) {
                    for (let col = 0; col < intGridSize; col++) {
                        const y = row * this.neuronSpacing - halfSize;
                        const z = col * this.neuronSpacing - halfSize;

                        this.sceneManager.sphereManager.addSphere(`L${layerIdx}_N${sphereCount}`, {
                            radius: this.neuronRadius,
                            color: color,
                            position: new THREE.Vector3(x, y, z),
                            opacity: 1
                        });
                        sphereCount++;
                    }
                }

                console.assert(
                    sphereCount === neuronCount,
                    `Generated ${sphereCount} spheres but expected ${neuronCount} neurons in input layer`
                );
            } else {
                const verticalOffset = -(neuronCount - 1) * this.neuronSpacing / 2;

                for (let neuronIdx = 0; neuronIdx < neuronCount; neuronIdx++) {
                    const y = verticalOffset + neuronIdx * this.neuronSpacing;

                    this.sceneManager.sphereManager.addSphere(`L${layerIdx}_N${neuronIdx}`, {
                        radius: this.neuronRadius,
                        color: color,
                        position: new THREE.Vector3(x, y, 0),
                        opacity: 1
                    });
                }
            }
        }

        this.updateConnections();
        console.log('✓ Initial generation complete');
    }

    /**
     * Update/create/delete connections in the scene based on current weights.
     */
    updateConnections() {
        const weightThreshold = this.weightThreshold;

        for (let layerIdx = 0; layerIdx < this.network.weights.length; layerIdx++) {
            const weightMatrix = this.network.weights[layerIdx];
            const fromLayer = layerIdx;
            const toLayer = layerIdx + 1;
            const toNeuronCount = weightMatrix.length;
            const fromNeuronCount = weightMatrix[0].length;

            for (let toIdx = 0; toIdx < toNeuronCount; toIdx++) {
                for (let fromIdx = 0; fromIdx < fromNeuronCount; fromIdx++) {
                    const weight = weightMatrix[toIdx][fromIdx];
                    const weightMagnitude = Math.abs(weight);
                    const connectionId = `W_L${layerIdx}_F${fromIdx}_T${toIdx}`;
                    const fromName = `L${fromLayer}_N${fromIdx}`;
                    const toName = `L${toLayer}_N${toIdx}`;

                    const existing = this.sceneManager.connectionManager.getConnection(connectionId);

                    if (weightMagnitude < weightThreshold) {
                        if (existing) {
                            this.sceneManager.connectionManager.removeConnection(connectionId);
                        }
                        continue;
                    }

                    const connectionColorThis = NetworkToDisplay.weightToColor(weight);

                    if (existing) {
                        this.sceneManager.connectionManager.updateConnectionColor(connectionId, connectionColorThis);
                    } else {
                        const fromSphere = this.sceneManager.sphereManager.getSphere(fromName);
                        const toSphere = this.sceneManager.sphereManager.getSphere(toName);

                        if (fromSphere && toSphere) {
                            this.sceneManager.connectionManager.addConnection(
                                connectionId,
                                fromSphere.position,
                                toSphere.position,
                                {
                                    color: connectionColorThis,
                                    lineWidth: this.lineWidth,
                                    opacity: this.opacity,
                                    fromSphere: fromName,
                                    toSphere: toName,
                                    weight: weight
                                }
                            );
                        }
                    }
                }
            }
        }
    }

    /**
     * Highlight a specific neuron activation
     * @param {number} layerIdx - Layer index
     * @param {number} neuronIdx - Neuron index
     * @param {number} activation - Activation value (0-1)
     */
    highlightNeuron(layerIdx, neuronIdx, activation) {
        const sphereName = `L${layerIdx}_N${neuronIdx}`;
        const sphere = this.sceneManager.sphereManager.getSphere(sphereName);

        if (sphere) {
            const scale = 1 + activation * 0.5;
            sphere.scale.set(scale, scale, scale);
        }
    }

    static weightToColor(weight) {
        const positiveColor = { r: 0, g: 255, b: 0 }; // Green for positive weights
        const neutralColor = { r: 255, g: 255, b: 255 }; // White for neutral weights
        const negativeColor = { r: 255, g: 0, b: 0 }; // Red for negative weights

        const magnitude = Math.min(1, Math.abs(weight) / 3); // Normalize weight magnitude

        // Interpolate between neutral and sign-specific color
        const target = weight >= 0 ? positiveColor : negativeColor;
        const r = Math.round(neutralColor.r * (1 - magnitude) + target.r * magnitude);
        const g = Math.round(neutralColor.g * (1 - magnitude) + target.g * magnitude);
        const b = Math.round(neutralColor.b * (1 - magnitude) + target.b * magnitude);

        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
}

// Expose globally for script-tag usage
window.NetworkToDisplay = NetworkToDisplay;