
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
		const magnitude = Math.sqrt(dp.x * dp.x + dp.y * dp.y + dp.z * dp.z);
		dp.x /= magnitude;
		dp.y /= magnitude;
		dp.z /= magnitude;

		return [p, dp];
	}



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
