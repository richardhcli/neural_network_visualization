/**
 * ConnectionManager.js
 * Manages connections (lines) between spheres
 */

class ConnectionManager {
    constructor(scene) {
        this.scene = scene;
        this.connections = new Map();
        this.connectionLines = new Map();
        this.materials = new Map();
    }

    /**
     * Create a connection between two spheres
     * @param {string} id - Unique identifier for this connection
     * @param {THREE.Vector3} startPos - Starting position
     * @param {THREE.Vector3} endPos - Ending position
     * @param {object} config - Configuration object
     * @param {string} config.color - Hex color (default: '#00ff00')
     * @param {number} config.lineWidth - Line width (default: 2)
     * @param {string} config.fromSphere - Name of source sphere
     * @param {string} config.toSphere - Name of target sphere
     * @returns {THREE.Line} The created line object
     */
    addConnection(id, startPos, endPos, config = {}) {
        // Prevent duplicate IDs
        if (this.connections.has(id)) {
            console.warn(`Connection "${id}" already exists.`);
            return null;
        }

        const color = config.color || '#00ff00';
        const lineWidth = config.lineWidth || 2;

        // Create geometry
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(
            new Float32Array([
                startPos.x, startPos.y, startPos.z,
                endPos.x, endPos.y, endPos.z
            ]), 3
        ));

        // Create material
        const material = new THREE.LineBasicMaterial({
            color: new THREE.Color(color),
            linewidth: lineWidth,
            transparent: true,
            opacity: 0.8
        });

        // Create line
        const line = new THREE.Line(geometry, material);
        line.name = id;
        line.userData = {
            connectionId: id,
            fromSphere: config.fromSphere,
            toSphere: config.toSphere,
            color: color,
            lineWidth: lineWidth,
            startPos: startPos.clone(),
            endPos: endPos.clone()
        };

        // Add to scene
        this.scene.add(line);
        this.connections.set(id, line.userData);
        this.connectionLines.set(id, line);
        this.materials.set(id, material);

        // console.log(`✓ Connection added: ${id} (${config.fromSphere} -> ${config.toSphere})`);
        return line;
    }

    /**
     * Remove a connection
     * @param {string} id - Connection ID
     */
    removeConnection(id) {
        const line = this.connectionLines.get(id);
        if (!line) {
            console.warn(`Connection "${id}" not found.`);
            return;
        }

        // Remove from scene
        this.scene.remove(line);

        // Clean up geometry and material
        const geometry = line.geometry;
        const material = this.materials.get(id);
        if (geometry) geometry.dispose();
        if (material) material.dispose();

        // Remove from maps
        this.connections.delete(id);
        this.connectionLines.delete(id);
        this.materials.delete(id);

        // console.log(`✓ Connection removed: ${id}`);
    }

    /**
     * Update connection position (useful for dynamic connections)
     * @param {string} id - Connection ID
     * @param {THREE.Vector3} startPos - New start position
     * @param {THREE.Vector3} endPos - New end position
     */
    updateConnectionPositions(id, startPos, endPos) {
        const line = this.connectionLines.get(id);
        if (!line) return;

        const positions = line.geometry.attributes.position.array;
        positions[0] = startPos.x;
        positions[1] = startPos.y;
        positions[2] = startPos.z;
        positions[3] = endPos.x;
        positions[4] = endPos.y;
        positions[5] = endPos.z;

        line.geometry.attributes.position.needsUpdate = true;
        line.userData.startPos = startPos.clone();
        line.userData.endPos = endPos.clone();
    }

    /**
     * Update connection color
     * @param {string} id - Connection ID
     * @param {string} newColor - New hex color
     */
    updateConnectionColor(id, newColor) {
        const material = this.materials.get(id);
        if (!material) return;

        material.color.set(new THREE.Color(newColor));
        this.connections.get(id).color = newColor;
    }

    /**
     * Get connection by ID
     * @param {string} id - Connection ID
     * @returns {Object} Connection data
     */
    getConnection(id) {
        return this.connections.get(id);
    }

    /**
     * Get all connections
     * @returns {Array} Array of all connections
     */
    getAllConnections() {
        return Array.from(this.connections.entries()).map(([id, data]) => ({
            id,
            ...data,
            line: this.connectionLines.get(id)
        }));
    }

    /**
     * Get connections for a specific sphere
     * @param {string} sphereName - Name of the sphere
     * @returns {Array} Connections connected to this sphere
     */
    getConnectionsForSphere(sphereName) {
        return Array.from(this.connections.values()).filter(conn =>
            conn.fromSphere === sphereName || conn.toSphere === sphereName
        );
    }

    /**
     * Remove all connections for a sphere (when sphere is deleted)
     * @param {string} sphereName - Name of the sphere
     */
    removeConnectionsForSphere(sphereName) {
        const connectionsToRemove = Array.from(this.connections.keys()).filter(id => {
            const conn = this.connections.get(id);
            return conn.fromSphere === sphereName || conn.toSphere === sphereName;
        });

        connectionsToRemove.forEach(id => this.removeConnection(id));
    }

    /**
     * Add a pulse effect to a connection
     * @param {string} id - Connection ID
     * @param {number} duration - Duration of pulse in ms
     */
    pulseConnection(id, duration = 500) {
        const material = this.materials.get(id);
        if (!material) return;

        const startOpacity = material.opacity;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed % duration) / duration;
            const opacityPulse = Math.sin(progress * Math.PI * 2);

            material.opacity = startOpacity + opacityPulse * 0.2;

            if (elapsed < duration * 2) {
                requestAnimationFrame(animate);
            } else {
                material.opacity = startOpacity;
            }
        };

        animate();
    }

    /**
     * Clear all connections
     */
    clearAll() {
        const ids = Array.from(this.connections.keys());
        ids.forEach(id => this.removeConnection(id));
        console.log('✓ All connections cleared');
    }

    /**
     * Get connection count
     * @returns {number}
     */
    getCount() {
        return this.connections.size;
    }
}
