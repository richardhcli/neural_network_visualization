/**
 * SphereManager.js
 * Manages the creation, deletion, and customization of spheres in the Three.js scene
 */

class SphereManager {
    constructor(scene) {
        this.scene = scene;
        this.spheres = new Map();
        this.sphereMeshes = new Map();
        this.geometries = new Map();
        this.materials = new Map();
    }

    /**
     * Create and add a new sphere to the scene
     * @param {string} name - Unique identifier for the sphere
     * @param {object} config - Configuration object
     * @param {number} config.radius - Sphere radius (default: 1)
     * @param {string} config.color - Hex color (default: '#ff0000')
     * @param {THREE.Vector3} config.position - Position vector (default: 0,0,0)
     * @param {number} config.opacity - Opacity 0-1 (default: 1)
     * @returns {THREE.Mesh} The created sphere mesh
     */
    addSphere(name, config = {}) {
        // Prevent duplicate names
        if (this.spheres.has(name)) {
            console.warn(`Sphere with name "${name}" already exists. Skipping.`);
            return null;
        }

        // Set defaults
        const radius = config.radius || 1;
        const color = config.color || '#ff0000';
        const position = config.position || new THREE.Vector3(0, 0, 0);
        const opacity = config.opacity !== undefined ? config.opacity : 1;

        // Create geometry and material
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            opacity: opacity,
            transparent: opacity < 1,
            emissive: new THREE.Color(color),
            emissiveIntensity: 0.3,
            metalness: 0.3,
            roughness: 0.4
        });

        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.name = name;
        mesh.userData = {
            sphereName: name,
            radius: radius,
            originalColor: color,
            connections: []
        };

        // Store references
        this.scene.add(mesh);
        this.spheres.set(name, mesh.userData);
        this.sphereMeshes.set(name, mesh);
        this.geometries.set(name, geometry);
        this.materials.set(name, material);

        console.log(`✓ Sphere added: ${name}`, config);
        return mesh;
    }

    /**
     * Remove a sphere from the scene
     * @param {string} name - Name of the sphere to remove
     */
    removeSphere(name) {
        const mesh = this.sphereMeshes.get(name);
        if (!mesh) {
            console.warn(`Sphere "${name}" not found.`);
            return;
        }

        // Remove from scene
        this.scene.remove(mesh);

        // Clean up geometry and material
        const geometry = this.geometries.get(name);
        const material = this.materials.get(name);
        if (geometry) geometry.dispose();
        if (material) material.dispose();

        // Remove from maps
        this.spheres.delete(name);
        this.sphereMeshes.delete(name);
        this.geometries.delete(name);
        this.materials.delete(name);

        console.log(`✓ Sphere removed: ${name}`);
    }

    /**
     * Update sphere properties
     * @param {string} name - Name of the sphere
     * @param {object} config - Properties to update
     */
    updateSphere(name, config = {}) {
        const mesh = this.sphereMeshes.get(name);
        if (!mesh) {
            console.warn(`Sphere "${name}" not found.`);
            return;
        }

        // Update position
        if (config.position) {
            mesh.position.copy(config.position);
        }

        // Update color
        if (config.color) {
            const colorObj = new THREE.Color(config.color);
            mesh.material.color.copy(colorObj);
            mesh.material.emissive.copy(colorObj);
            mesh.userData.originalColor = config.color;
        }

        // Update opacity
        if (config.opacity !== undefined) {
            mesh.material.opacity = config.opacity;
            mesh.material.transparent = config.opacity < 1;
        }

        // Update scale (for size changes without recreating geometry)
        if (config.scale !== undefined) {
            mesh.scale.set(config.scale, config.scale, config.scale);
        }

        console.log(`✓ Sphere updated: ${name}`);
    }

    /**
     * Get sphere mesh by name
     * @param {string} name - Name of the sphere
     * @returns {THREE.Mesh} The sphere mesh
     */
    getSphere(name) {
        return this.sphereMeshes.get(name);
    }

    /**
     * Get all spheres
     * @returns {Array} Array of sphere data
     */
    getAllSpheres() {
        return Array.from(this.spheres.entries()).map(([name, data]) => ({
            name,
            ...data,
            mesh: this.sphereMeshes.get(name)
        }));
    }

    /**
     * Change sphere color with animation
     * @param {string} name - Name of the sphere
     * @param {string} newColor - New hex color
     * @param {number} duration - Animation duration in ms
     */
    changeColorSmooth(name, newColor, duration = 500) {
        const mesh = this.sphereMeshes.get(name);
        if (!mesh) return;

        const startColor = mesh.material.color.getHex();
        const endColor = new THREE.Color(newColor).getHex();
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const currentColor = new THREE.Color().lerpHexColors(startColor, endColor, progress);
            mesh.material.color.copy(currentColor);
            mesh.material.emissive.copy(currentColor);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                mesh.userData.originalColor = newColor;
            }
        };

        animate();
    }

    /**
     * Add a glow effect to a sphere
     * @param {string} name - Name of the sphere
     * @param {boolean} enable - Whether to enable glow
     */
    setGlow(name, enable = true) {
        const mesh = this.sphereMeshes.get(name);
        if (!mesh) return;

        if (enable) {
            mesh.material.emissiveIntensity = 0.8;
        } else {
            mesh.material.emissiveIntensity = 0.3;
        }
    }

    /**
     * Clear all spheres
     */
    clearAll() {
        const names = Array.from(this.spheres.keys());
        names.forEach(name => this.removeSphere(name));
        console.log('✓ All spheres cleared');
    }

    /**
     * Get sphere count
     * @returns {number}
     */
    getCount() {
        return this.spheres.size;
    }
}
