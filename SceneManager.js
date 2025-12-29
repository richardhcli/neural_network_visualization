
class SceneManager {
    constructor(config = {}) {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(config.backgroundColor || 0x0a0e27);
        this.scene.fog = new THREE.Fog(config.backgroundColor || 0x0a0e27, 100, 1000);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, config.cameraDistance || 15);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('canvas'),
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        // Lighting
        this.setupLighting();

        // Managers
        this.sphereManager = new SphereManager(this.scene);
        this.connectionManager = new ConnectionManager(this.scene);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 500;
        this.controls.maxPolarAngle = Math.PI;

        // Store initial camera state for reset
        this.initialCameraPosition = this.camera.position.clone();
        this.initialControlsTarget = new THREE.Vector3(0, 0, 0);

        // Window resize listener
        window.addEventListener('resize', () => this.onWindowResize());

        // reset camera view button
        const resetCameraButton = document.getElementById('resetCameraButton');
        if (resetCameraButton) {
            resetCameraButton.addEventListener('click', () => {
                this.resetCameraView();
            });
        }

        // Start animation loop
        this.animate();

        console.log('✓ Scene3D initialized');
    }

    /**
     * Setup lighting for the scene
     */
    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Point lights for atmosphere
        const pointLight1 = new THREE.PointLight(0xff0080, 0.3, 100);
        pointLight1.position.set(-10, 10, 10);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x0080ff, 0.3, 100);
        pointLight2.position.set(10, -10, 10);
        this.scene.add(pointLight2);
    }



    /**
     * Initialize scene from JSON configuration
     * @param {Object} jsonConfig - Configuration with spheres and connections arrays
     * 
     * Example:
     * {
     *   spheres: [
     *     { name: 'A', radius: 1, color: '#ff0000', position: { x: 0, y: 0, z: 0 } },
     *     { name: 'B', radius: 1, color: '#00ff00', position: { x: 5, y: 0, z: 0 } }
     *   ],
     *   connections: [
     *     { id: 'AB', from: 'A', to: 'B', color: '#ffff00', lineWidth: 2 }
     *   ]
     * }
     */
    loadFromJSON(jsonConfig) {
        // Clear existing scene
        this.sphereManager.clearAll();
        this.connectionManager.clearAll();

        // Add spheres
        if (jsonConfig.spheres && Array.isArray(jsonConfig.spheres)) {
            jsonConfig.spheres.forEach(sphereConfig => {
                const position = new THREE.Vector3(
                    sphereConfig.position?.x || 0,
                    sphereConfig.position?.y || 0,
                    sphereConfig.position?.z || 0
                );

                this.sphereManager.addSphere(sphereConfig.name, {
                    radius: sphereConfig.radius || 1,
                    color: sphereConfig.color || '#ff0000',
                    position: position,
                    opacity: sphereConfig.opacity || 1
                });
            });
        }

        // Add connections
        if (jsonConfig.connections && Array.isArray(jsonConfig.connections)) {
            jsonConfig.connections.forEach(connConfig => {
                const fromSphere = this.sphereManager.getSphere(connConfig.from);
                const toSphere = this.sphereManager.getSphere(connConfig.to);

                if (fromSphere && toSphere) {
                    this.connectionManager.addConnection(
                        connConfig.id || `conn_${connConfig.from}_${connConfig.to}`,
                        fromSphere.position,
                        toSphere.position,
                        {
                            color: connConfig.color || '#00ff00',
                            lineWidth: connConfig.lineWidth || 2,
                            fromSphere: connConfig.from,
                            toSphere: connConfig.to
                        }
                    );
                } else {
                    console.warn(`Connection ${connConfig.id}: sphere(s) not found`);
                }
            });
        }

        console.log('✓ Scene loaded from JSON');
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    resetCameraView() {
        // Disable damping temporarily to stop momentum
        const wasDamping = this.controls.enableDamping;
        this.controls.enableDamping = false;

        // Reset to initial positions
        this.camera.position.copy(this.initialCameraPosition);
        this.controls.target.copy(this.initialControlsTarget);

        // Reset OrbitControls internal state (removes any stored rotations/pans)
        this.controls.reset();

        // Force immediate update without damping
        this.controls.update();

        // Re-enable damping
        this.controls.enableDamping = wasDamping;

        console.log('✓ Camera view reset');
    }

    /**
     * Main animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        // Update controls
        this.controls.update();

        // Update connection positions dynamically
        this.connectionManager.getAllConnections().forEach(conn => {
            const fromSphere = this.sphereManager.getSphere(conn.fromSphere);
            const toSphere = this.sphereManager.getSphere(conn.toSphere);

            if (fromSphere && toSphere) {
                this.connectionManager.updateConnectionPositions(
                    conn.id,
                    fromSphere.position,
                    toSphere.position
                );
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}