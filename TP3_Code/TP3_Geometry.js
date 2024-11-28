
class Node {
	constructor(parentNode) {
		this.parentNode = parentNode; //Noeud parent
		this.childNode = []; //Noeud enfants

		this.p0 = null; //Position de depart de la branche
		this.p1 = null; //Position finale de la branche

		this.a0 = null; //Rayon de la branche a p0
		this.a1 = null; //Rayon de la branche a p1

		this.sections = []; //Liste contenant une liste de points representant les segments circulaires du cylindre generalise
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
		if (rootNode.parentNode == null) {
			for (let i = 0; i < rootNode.childNode.length; i++) {
				this.generateSegmentsHermite(rootNode.childNode[i]);
			}
		} else {
			for (let i = 0; i < rootNode.childNode.length; i++) {
				this.generateSegmentsHermite(rootNode.childNode[i]);
			}
	
			let p = rootNode.parentNode;
			let h0 = rootNode.p0.clone();
			let h1 = p.p0.clone();
	
			// potentiel problème
			let v0 = rootNode.p1.clone().sub(rootNode.p0).normalize();
			let v1 = p.p0.clone().sub(p.p1).normalize();
	
			
			for (let t = 0; t <= 1; t += 1 / lengthDivisions) {
				let { p: pt, dp } = this.hermite(h0, h1, v0, v1, t);
	
				dp.normalize();
				let r = new THREE.Vector3(0, 0, 1);
				if (Math.abs(dp.dot(r)) > 0.99) {
					r.set(1, 0, 0); // Avoid collinearity
				}
	
				let n1 = new THREE.Vector3().crossVectors(r, dp).normalize();
				let n2 = new THREE.Vector3().crossVectors(dp, n1).normalize();
	
				let pointList = [];
				for (let i = 0; i < radialDivisions; i++) {
					let theta = (2 * Math.PI * i) / radialDivisions;
					let length = ((radialDivisions - i) / radialDivisions) * rootNode.a1 +
						(i / radialDivisions) * p.a0;
	
					let offset = n1.clone().multiplyScalar(Math.cos(theta) * length)
						.add(n2.clone().multiplyScalar(Math.sin(theta) * length));
					pointList.push(pt.clone().add(offset));
				}
	
				if (!rootNode.sections) rootNode.sections = [];
				rootNode.sections.push(pointList);
			}
			
		}
	},
	
	hermite: function (h0, h1, v0, v1, t) {
		const t2 = t * t;
		const t3 = t2 * t;
	
		// Calculate the interpolated point p(t)
		const p = new THREE.Vector3(
			(2 * t3 - 3 * t2 + 1) * h0.x + (-2 * t3 + 3 * t2) * h1.x + (t3 - 2 * t2 + t) * v0.x + (t3 - t2) * v1.x,
			(2 * t3 - 3 * t2 + 1) * h0.y + (-2 * t3 + 3 * t2) * h1.y + (t3 - 2 * t2 + t) * v0.y + (t3 - t2) * v1.y,
			(2 * t3 - 3 * t2 + 1) * h0.z + (-2 * t3 + 3 * t2) * h1.z + (t3 - 2 * t2 + t) * v0.z + (t3 - t2) * v1.z
		);
	
		// Calculate the tangent dp(t)
		const dp = new THREE.Vector3(
			(6 * t2 - 6 * t) * h0.x + (-6 * t2 + 6 * t) * h1.x + (3 * t2 - 4 * t + 1) * v0.x + (3 * t2 - 2 * t) * v1.x,
			(6 * t2 - 6 * t) * h0.y + (-6 * t2 + 6 * t) * h1.y + (3 * t2 - 4 * t + 1) * v0.y + (3 * t2 - 2 * t) * v1.y,
			(6 * t2 - 6 * t) * h0.z + (-6 * t2 + 6 * t) * h1.z + (3 * t2 - 4 * t + 1) * v0.z + (3 * t2 - 2 * t) * v1.z
		);
	
		// Normalize the tangent
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
