
class Node {
	constructor(parentNode) {
		this.parentNode = parentNode; //Noeud parent
		this.childNode = []; //Noeud enfants

		this.p0 = null; //Position de depart de la branche
		this.p1 = null; //Position finale de la branche

		this.a0 = null; //Rayon de la branche a p0
		this.a1 = null; //Rayon de la branche a p1

		this.sections = null; //Liste contenant une liste de points representant les segments circulaires du cylindre generalise
		this.vel = null; //Vitesse du noeud	
		this.mass = null; //Masse du noeud
		this.Strengh = null; //Force du noeud
		this.appleIndices = null; //Indice de la pomme
		this.transformationMatrix = null; //Matrice de transformation
	}
}

TP3.Geometry = {

	simplifySkeleton: function (rootNode, rotationThreshold = 0.0001) {
		const initChild = [...rootNode.childNode];
		for (let i = 0; i < initChild.length; i++) {
			const child = initChild[i];

			// Compute vectors
			const vectorToChild = rootNode.p1.clone().sub(rootNode.p0).normalize();
			const vectorToGrandchild = child.p1.clone().sub(child.p0).normalize();

			// Check for collinearity 
			if (Math.abs(vectorToChild.dot(vectorToGrandchild) - 1) <= rotationThreshold) {
				const index = rootNode.childNode.indexOf(child);
				rootNode.childNode.splice(index, 1);
				rootNode.childNode.push(...child.childNode);
				// Merge  
				rootNode.p1 = child.p1;
				rootNode.a1 = child.a1;
				//clear reference
				child.parentNode = null;
				child.childNode = [];

				this.simplifySkeleton(rootNode, rotationThreshold);
			} else {
				this.simplifySkeleton(child, rotationThreshold);
			}
		}
	},
	generateSegmentsHermite: function (rootNode, lengthDivisions = 4, radialDivisions = 8) {
		const interpolate = (a, b, t) => a + (b - a) * t;

		// Helper: Generate a circle of points
		const generateCircle = (center, radius, tangent, radialDivisions) => {
			const circlePoints = [];
			const angleStep = (2 * Math.PI) / radialDivisions;

			// Create orthogonal vectors to `tangent`
			const up = Math.abs(tangent.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
			const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
			const normal = new THREE.Vector3().crossVectors(tangent, right).normalize();

			// Generate circle points
			for (let i = 0; i < radialDivisions; i++) {
				const angle = i * angleStep;
				const x = radius * Math.cos(angle);
				const y = radius * Math.sin(angle);

				const point = new THREE.Vector3()
					.addScaledVector(right, x)
					.addScaledVector(normal, y)
					.add(center); // Center the circle
				circlePoints.push(point);
			}

			return circlePoints;
		};

		// Iterative DFS for traversing the node tree
		function traverseNode(rootNode) {
			const stack = [rootNode];

			while (stack.length > 0) {
				const node = stack.pop();


				const h0 = node.p0;
				const h1 = node.p1;
				const v0 = node.parentNode
					? node.parentNode.p1.clone().sub(node.parentNode.p0.clone()) // Use parent's tangent
					: node.p1.clone().sub(node.p0.clone()); // Default tangent for root
				const v1 = node.p1.clone().sub(node.p0.clone()); // Tangent at child

				node.sections = []; // Initialize node's sections array

				for (let i = 0; i <= lengthDivisions; i++) {
					const t = i / lengthDivisions;

					// Compute Hermite point and tangent
					const [p, dp] = TP3.Render.hermite(h0, h1, v0, v1, t);
					const tangent = dp.clone();

					// Interpolate radius
					const radius = interpolate(node.a0, node.a1, t);

					// Generate a circle
					const circle = generateCircle(p, radius, tangent, radialDivisions);
					node.sections.push(circle);
				}


				// Traverse child nodes
				if (node.childNode.length > 0) {
					for (let i = node.children.length - 1; i >= 0; i--) {
						stack.push(node.childNode[i]);
					}
				}
			}
		}

		traverseNode(rootNode);
		return rootNode;
	},
	hermite: function (h0, h1, v0, v1, t) {
		// Calcul de t^2 et t^3
		const t2 = t * t;
		const t3 = t2 * t;

		// Calcul du point interpolé p(t)
		const p = {
			x: (2 * t3 - 3 * t2 + 1) * h0.x + (-2 * t3 + 3 * t2) * h1.x + (t3 - 2 * t2 + t) * v0.x + (t3 - t2) * v1.x,
			y: (2 * t3 - 3 * t2 + 1) * h0.y + (-2 * t3 + 3 * t2) * h1.y + (t3 - 2 * t2 + t) * v0.y + (t3 - t2) * v1.y,
			z: (2 * t3 - 3 * t2 + 1) * h0.z + (-2 * t3 + 3 * t2) * h1.z + (t3 - 2 * t2 + t) * v0.z + (t3 - t2) * v1.z
		};

		// Calcul de la tangente dp(t)
		const dp = {
			x: (6 * t2 - 6 * t) * h0.x + (-6 * t2 + 6 * t) * h1.x + (3 * t2 - 4 * t + 1) * v0.x + (3 * t2 - 2 * t) * v1.x,
			y: (6 * t2 - 6 * t) * h0.y + (-6 * t2 + 6 * t) * h1.y + (3 * t2 - 4 * t + 1) * v0.y + (3 * t2 - 2 * t) * v1.y,
			z: (6 * t2 - 6 * t) * h0.z + (-6 * t2 + 6 * t) * h1.z + (3 * t2 - 4 * t + 1) * v0.z + (3 * t2 - 2 * t) * v1.z
		};

		// Normalisation de la tangente
		dp.normalize();

		return [p, dp];
	},



	// Trouver l'axe et l'angle de rotation entre deux vecteurs
	findRotation: function (a, b) {
		const axis = new THREE.Vector3().crossVectors(a, b).normalize();
		var c = a.dot(b) / (a.length() * b.length());

		if (c < -1) {
			c = -1;
		} else if (c > 1) {
			c = 1;
		}

		const angle = Math.acos(c);

		return [axis, angle];
	},

	// Projeter un vecter a sur b
	project: function (a, b) {
		return b.clone().multiplyScalar(a.dot(b) / (b.lengthSq()));
	},

	// Trouver le vecteur moyen d'une liste de vecteurs
	meanPoint: function (points) {
		var mp = new THREE.Vector3();

		for (var i = 0; i < points.length; i++) {
			mp.add(points[i]);
		}

		return mp.divideScalar(points.length);
	},
};
