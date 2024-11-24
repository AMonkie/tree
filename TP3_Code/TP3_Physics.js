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

		// Appliquer la force du vent
		node.vel.add(new THREE.Vector3(u / Math.sqrt(node.mass), 0, v / Math.sqrt(node.mass)).multiplyScalar(dt));

		// Appliquer la gravité (force vers le bas proportionnelle à la masse)
		node.vel.add(new THREE.Vector3(0, -node.mass, 0).multiplyScalar(dt));

		// --- 2. Calcul du mouvement prévu ---
		// Position prévue (p1 + déplacement dû à la vélocité)
		const newP = node.p1.clone().add(node.vel.clone().multiplyScalar(dt));

		// --- 3. Calcul de la restitution ---
		// Direction initiale (entre p0 et p1) et nouvelle direction (entre p0 et newP)
		const initialDirection = new THREE.Vector3().subVectors(node.p1, node.p0).normalize();
		const newDirection = new THREE.Vector3().subVectors(newP, node.p0).normalize();

		//angle and axis
		const angle = Math.acos(initialDirection.dot(newDirection));
		const axis = new THREE.Vector3().crossVectors(initialDirection, newDirection).normalize();

		if(axis.length() > 0){
		rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis, angle);
		node.p1.applyMatrix4(rotationMatrix);
		}	
		node.vel = newDirection.clone().multiplyScalar(node.vel.length());

		// --- 4. Calcul de la force de restitution ---
		const resVel = newDirection.clone().multiplyScalar(-node.a0 * 1000*angle*angle)
		node.vel.add(resVel);
		
		// --- 5. Calcul de la force de damping ---
		node.vel.multiplyScalar(0.7);
		//calcul et propagation de la matrice de transformation
		let transformationMatrix = new THREE.Matrix4();
		transformationMatrix.makeTranslation(node.p1.x-node.p0.x, node.p1.y-node.p0.z, node.p1.z-node.p0.z);

		// --- 7. Propagation aux enfants ---
		// Appliquer la transformation aux enfants (chaque enfant utilise la matrice de transformation du parent)
		for (let i = 0; i < node.childNode.length; i++) {
			const child = node.childNode[i];
			// Propagation inverse : mettre à jour p0 de l'enfant
			child.p0.copy(node.p1);
			// Appliquer les forces récursivement
			TP3.Physics.applyForces(child, dt, time);
		}
	},
}