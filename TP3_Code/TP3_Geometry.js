
class Node {
	constructor(parentNode) {
		this.parentNode = parentNode; //Noeud parent
		this.childNode = []; //Noeud enfants

		this.p0 = null; //Position de depart de la branche
		this.p1 = null; //Position finale de la branche

		this.a0 = null; //Rayon de la branche a p0
		this.a1 = null; //Rayon de la branche a p1

		this.sections = null; //Liste contenant une liste de points representant les segments circulaires du cylindre generalise
	}
}

TP3.Geometry = {

	simplifySkeleton: function (rootNode, rotationThreshold = 0.0001) {
		function simplify(node) {
			if (!node) return;
			
			for (let i = node.childNode.length - 1; i >= 0; i--) {
				let child = node.childNode[i];
	
				// Calculate the vector from parent to child
				const vectorToParent = node.p1 && node.p0 ? node.p0.clone().sub(node.p1) : new THREE.Vector3();
				const vectorToChild = child.p0 && child.p1 ? child.p1.clone().sub(child.p0) : new THREE.Vector3();
	
				// Calculate the angle between vectors
				const [_, angle] = TP3.Geometry.findRotation(vectorToParent, vectorToChild);
	
				if (Math.abs(angle-Math.PI) < rotationThreshold && child.childNode.length === 1) {
					let temp = child;
					let tempAngle = Math.abs(angle-Math.PI);
	
					// Traverse through nodes until we find a split or angle exceeds the threshold
					while (temp.childNode.length === 1 && tempAngle < rotationThreshold) {
						const tempVector = node.p1 && node.p0 ? node.p0.clone().sub(node.p1) : new THREE.Vector3();
						const childVector = child.p1 && child.p0 ? child.p1.clone().sub(child.p0) : new THREE.Vector3();
	
						const [_, nextAngle] = TP3.Geometry.findRotation(tempVector, childVector);
						tempAngle = Math.abs(nextAngle-Math.PI);
						temp = temp.childNode[0];
					}
					
					// Reassign the last node in the simplification chain to the parent node
					temp.parentNode = node;
					node.childNode[i] = temp;
	
					// Update the parent's end position
					node.p1 = temp.p0;
					node.a1 = temp.a0;
					simplify(node.childNode[i]);
					
				} else {
					// Simplify further down this branch if the angle exceeds the threshold
					simplify(node.childNode[i]);
				}
			}
		}
	
		simplify(rootNode);
		return rootNode;
	},

	hermite: function (h0, h1, v0, v1, t) {
		// Calcul du point interpolé p(t)
		const p = (2 * t3 - 3 * t2 + 1) * h0 + (-2 * t3 + 3 * t2) * h1 + (t3 - 2 * t2 + t) * v0 + (t3 - t2) * v1;

		// Calcul de la tangente dp(t)
		const dp = (6 * t2 - 6 * t) * h0 + (-6 * t2 + 6 * t) * h1 + (3 * t2 - 4 * t + 1) * v0 + (3 * t2 - 2 * t) * v1;
	  
		// Normalisation de la tangente
		const magnitude = Math.sqrt(dp.x * dp.x + dp.y * dp.y + dp.z * dp.z);
		dp.x /= magnitude;
		dp.y /= magnitude;
		dp.z /= magnitude;
	  
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
