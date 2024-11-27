const appleMass = 0.075;

TP3.Physics = {
	initTree: function (rootNode) {

		this.computeTreeMass(rootNode);

		var stack = [];
		stack.push(rootNode);

		while (stack.length > 0) {
			var currentNode = stack.pop();
			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			currentNode.vel = new THREE.Vector3();
			currentNode.strength = currentNode.a0;
		}
	},

	computeTreeMass: function (node) {
		var mass = 0;

		for (var i = 0; i < node.childNode.length; i++) {
			mass += this.computeTreeMass(node.childNode[i]);
		}
		mass += node.a1;
		if (node.appleIndices !== null) {
			mass += appleMass;
		}
		node.mass = mass;

		return mass;
	},

	applyForces: function (node, dt, time) {

	// --- 1. Calcul des forces externes (vent et gravité) ---
    // Vent : dépend du temps (sinus/cosinus)
    let u = Math.sin(1 * time) * 4 + Math.sin(2.5 * time) * 2 + Math.sin(5 * time) * 0.4;
    let v = Math.cos(1 * time + 56485) * 4 + Math.cos(2.5 * time + 56485) * 2 + Math.cos(5 * time + 56485) * 0.4;
    node.vel.add(new THREE.Vector3(u / Math.sqrt(node.mass), 0, v / Math.sqrt(node.mass)).multiplyScalar(dt));
    node.vel.add(new THREE.Vector3(0, -node.mass, 0).multiplyScalar(dt));

    // --- 2. Calcul du mouvement prévu ---
    // Position prévue (p1 + déplacement dû à la vélocité)
    const newP = node.p1.clone().add(node.vel.clone().multiplyScalar(dt));

    // --- 3. Calcul de la restitution ---
    // Direction initiale (entre p0 et p1) et nouvelle direction (entre p0 et newP)
    const initialDirection = new THREE.Vector3().subVectors(node.p1, node.p0).normalize();
    const newDirection = new THREE.Vector3().subVectors(newP, node.p0).normalize();
	const angle = Math.acos(initialDirection.dot(newDirection));
	const axis = new THREE.Vector3().crossVectors(initialDirection, newDirection).normalize();

	let adjustedP = node.p1.clone();
    if (angle > 0) {
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
        adjustedP.applyMatrix4(rotationMatrix);
    }
	const rotationVect = new THREE.Vector3().subVectors(node.p1, adjustedP);
	node.vel.add(rotationVect);
	node.p1.copy(adjustedP);

	// --- 4. Calcul de la force de restitution ---
	const resVel = rotationVect.normalize().clone().multiplyScalar(-node.a0 * 1000*angle*angle)
	node.vel.add(resVel);
	node.vel.multiplyScalar(0.7);

	// --- 5. Update transformation matrix ---
    const transformationMatrix = new THREE.Matrix4().makeTranslation(
        node.p1.x - node.p0.x,
        node.p1.y - node.p0.y,
        node.p1.z - node.p0.z
    );
    node.transformationMatrix = transformationMatrix;

    // --- 6. Propagate to children ---
    for (let i = 0; i < node.childNode.length; i++) {
        const child = node.childNode[i];
        child.p0.copy(node.p1);
        TP3.Physics.applyForces(child, dt, time);
    }

    // --- 7. Propagate to parent (if needed) ---
    if (node.parentNode) {
        node.parentNode.vel.add(node.vel.clone().multiplyScalar(0.1)); // Example: small influence on parent
        TP3.Physics.applyForces(node.parentNode, dt, time);
    }

    // --- 8. Propagate to siblings (if needed) ---
    if (node.siblingNodes) {
        for (let sibling of node.siblingNodes) {
            sibling.p0.copy(node.p0); // Example: share the same origin
            TP3.Physics.applyForces(sibling, dt, time);
        }
    }
},
}