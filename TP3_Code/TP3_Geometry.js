
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
		this.transformationMatrix = null;
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
		function generateSections(node, lengthDivisions, radialDivisions) {
			const sections = [];
			const p0 = node.p0;
			const p1 = node.p1;
			const v0 = node.parentNode ? node.parentNode.p1.clone().sub(node.parentNode.p0) : new THREE.Vector3(0, 1, 0);
			const v1 = p1.clone().sub(p0);
	
			// Initial normal vector pointing 90 degrees to the right
			let normal = new THREE.Vector3(1, 0, 0);
	
			for (let i = 0; i <= lengthDivisions; i++) {
				const t = i / lengthDivisions;
				const { p, dp } = TP3.Geometry.hermite(p0, p1, v0, v1, t);
				const radius = THREE.MathUtils.lerp(node.a0, node.a1, t);
				const section = [];
	
				// Compute the binormal vector
				const tangent = dp.clone();
				const binormal = tangent.clone().cross(normal).normalize();
	
				// Update the normal vector to ensure it points 90 degrees to the right
				normal = binormal.clone().cross(tangent).normalize();
	
				for (let j = 0; j < radialDivisions; j++) {
					const angle = (j / radialDivisions) * Math.PI * 2;
					const x = Math.cos(angle) * radius;
					const z = Math.sin(angle) * radius;
					const vertex = p.clone().add(normal.clone().multiplyScalar(x)).add(binormal.clone().multiplyScalar(z));
					section.push(vertex);
				}
	
				sections.push(section);
			}
	
			node.sections = sections;
		}
	
		const stack = [rootNode];
		while (stack.length > 0) {
			const currentNode = stack.pop();
			generateSections(currentNode, lengthDivisions, radialDivisions);
			for (const child of currentNode.childNode) {
				stack.push(child);
			}
		}
	
		return rootNode;
	},
	
	hermite: function (h0, h1, v0, v1, t) {
		// Convert Hermite to Bézier control points
		const P0 = h0;
		const P1 = h0.clone().add(v0.clone().multiplyScalar(1 / 3));
		const P2 = h1.clone().sub(v1.clone().multiplyScalar(1 / 3));
		const P3 = h1;
	
		// De Casteljau algorithm to compute point on Bézier curve
		const Q0 = P0.clone().lerp(P1, t);
		const Q1 = P1.clone().lerp(P2, t);
		const Q2 = P2.clone().lerp(P3, t);
	
		const R0 = Q0.clone().lerp(Q1, t);
		const R1 = Q1.clone().lerp(Q2, t);
	
		const p = R0.clone().lerp(R1, t);
	
		// Compute tangent using De Casteljau algorithm
		const tangentQ0 = P1.clone().sub(P0).multiplyScalar(3 * (1 - t) * (1 - t));
		const tangentQ1 = P2.clone().sub(P1).multiplyScalar(6 * (1 - t) * t);
		const tangentQ2 = P3.clone().sub(P2).multiplyScalar(3 * t * t);
	
		const dp = tangentQ0.add(tangentQ1).add(tangentQ2).normalize();
	
		return { p, dp };		
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
