TP3.Render = {
	


	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		// Function to create a branch
		function createBranch(node,p0, p1, radialDivisions) {
			const direction = new THREE.Vector3().subVectors(p1, p0);
			const length = direction.length();
			direction.normalize();
	
			const geometry = new THREE.CylinderGeometry(node.a1, node.a0, length, radialDivisions);
			const material = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
	
			const branch = new THREE.Mesh(geometry, material);
	
			const midpoint = p0.clone().add(p1).multiplyScalar(0.5);
			branch.position.copy(midpoint);
	
			const up = new THREE.Vector3(0, 1, 0); // Default up direction
			const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
			branch.setRotationFromQuaternion(quaternion);
			
			return branch;
		}
	
		function createLeaves(branchPosition, branchLength, branchWidth, isTerminal, leavesDensity, alpha, leavesCutoff) {
			const leaves = [];
		
			if (branchWidth >= alpha * leavesCutoff) return leaves;
		
			const radius = alpha / 2; 
			const numLeaves = Math.floor(Math.random() * leavesDensity); 
		
			for (let i = 0; i < numLeaves; i++) {
				const leafGeometry = new THREE.PlaneGeometry(alpha, alpha); 
				const leafMaterial = new THREE.MeshPhongMaterial({
					color: 0x3A5F0B,
					side: THREE.DoubleSide,
				});
		
				const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
		
				const offset = new THREE.Vector3(
					(Math.random() - 0.5) * radius * 2,
					-Math.random() * branchLength + (isTerminal ? alpha : 0), // made it negative fixed my problems im happy 
					(Math.random() - 0.5) * radius * 2
				);
				
				leaf.position.copy(branchPosition).add(offset);
				//random rotation
				leaf.rotation.set(
					Math.random() * Math.PI,
					Math.random() * Math.PI,
					Math.random() * Math.PI
				);
		
				leaves.push(leaf);
			}
		
			return leaves;
		}
		
		function createApples(branchPosition, applesProbability, alpha,branchWidth) {
			const apples = [];
		
			// Random chance to place an apple or below cutoff like leaves 
			if (Math.random() > applesProbability || branchWidth >= alpha * leavesCutoff) return apples;
		
			const appleGeometry = new THREE.BoxGeometry(alpha, alpha, alpha); // Cube for the apple
			const appleMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
			const apple = new THREE.Mesh(appleGeometry, appleMaterial);
		
			apple.position.copy(branchPosition);
		
			apples.push(apple);
		
			return apples;
		}
		
	
		const stack = [];
	stack.push(rootNode);

	const branches = [];
	const leaves = [];

	while (stack.length > 0) {
		const currentNode = stack.pop();
	
		for (let i = 0; i < currentNode.childNode.length; i++) {
			const child = currentNode.childNode[i];
			const branchLength = child.p0.clone().sub(currentNode.p0).length();
			const branchWidth = currentNode.a0;
	
			//init stuff i need that i would want to only pass the node or something as argument not super important 
			const branch = createBranch(currentNode, currentNode.p0, child.p0, radialDivisions);
			scene.add(branch);
			branches.push(branch);
	
			const isTerminal = child.childNode.length === 0;
	
			// could be improved redudent inputs
			const branchLeaves = createLeaves(
				currentNode.p0, // Branch position
				branchLength,   // Branch length
				branchWidth,    // Branch width
				isTerminal,     // Is terminal
				leavesDensity,  // Leaves density
				alpha,          // Alpha (leaf size)
				leavesCutoff    // Leaves cutoff (no longer restricting)
			);
	
			// Create apples
			const branchApples = createApples(
				currentNode.p0,    // Branch position
				applesProbability, // Apple probability
				alpha,             // Apple size
				branchWidth
			);
			//add everything in the scene that i would want a single mesh to take care of the stuff at least
			for (const leaf of branchLeaves) {
				scene.add(leaf);
			}
			for (const apple of branchApples) {
				scene.add(apple);
				currentNode.appleIndices +=1;
			}
			leaves.push(...branchLeaves);
	
			stack.push(child);
		}
	}
	},
	
    drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
        const vertices = [];
		const indices = [];
		let indexOffset = 0;

		const leafVertices = [];
    	const leafIndices = [];
    	let leafIndexOffset = 0;

		function addBranchVertices(p0, p1, radius0, radius1, radialDivisions) {
			const direction = new THREE.Vector3().subVectors(p1, p0);
			const length = direction.length();
			direction.normalize();

			const quaternion = new THREE.Quaternion();
			quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

			for (let i = 0; i <= 1; i++) {
				const radius = i === 0 ? radius0 : radius1;
				const position = i === 0 ? p0 : p1;

				for (let j = 0; j < radialDivisions; j++) {
					const angle = (j / radialDivisions) * Math.PI * 2;
					const x = Math.cos(angle) * radius;
					const z = Math.sin(angle) * radius;
					const vertex = new THREE.Vector3(x, 0, z).applyQuaternion(quaternion).add(position);
					vertices.push(vertex.x, vertex.y, vertex.z);
				}
			}

			for (let j = 0; j < radialDivisions; j++) {
				const nextJ = (j + 1) % radialDivisions;
				indices.push(indexOffset + j, indexOffset + radialDivisions + j, indexOffset + nextJ);
				indices.push(indexOffset + nextJ, indexOffset + radialDivisions + j, indexOffset + radialDivisions + nextJ);
			}

			indexOffset += radialDivisions * 2;
		}

		function addLeafVertices(position, size) {
			const height = Math.sqrt(3) / 2 * size;
			const vertices = [
				new THREE.Vector3(0, 0, 0),
				new THREE.Vector3(size / 2, height, 0),
				new THREE.Vector3(-size / 2, height, 0)
			];
	
			// Apply random rotation
			const rotation = new THREE.Euler(
				Math.random() * Math.PI * 2,
				Math.random() * Math.PI * 2,
				Math.random() * Math.PI * 2
			);
			const quaternion = new THREE.Quaternion().setFromEuler(rotation);
			vertices.forEach(vertex => vertex.applyQuaternion(quaternion).add(position));
	
			leafVertices.push(
				vertices[0].x, vertices[0].y, vertices[0].z,
				vertices[1].x, vertices[1].y, vertices[1].z,
				vertices[2].x, vertices[2].y, vertices[2].z
			);
			leafIndices.push(leafIndexOffset, leafIndexOffset + 1, leafIndexOffset + 2);
			leafIndexOffset += 3;
		}

		function createApples(branchPosition, applesProbability, alpha,branchWidth) {
			const apples = [];
		
			// Random chance to place an apple or below cutoff like leaves 
			if (Math.random() > applesProbability || branchWidth >= alpha * leavesCutoff) return apples;
		
			const appleGeometry = new THREE.SphereGeometry(alpha/2, 16, 16); // Cube for the apple
			const appleMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
			const apple = new THREE.Mesh(appleGeometry, appleMaterial);
		
			apple.position.copy(branchPosition);
		
			apples.push(apple);
		
			return apples;
		}


		const stack = [];
		stack.push(rootNode);

		while (stack.length > 0) {
			const currentNode = stack.pop();

			for (let i = 0; i < currentNode.childNode.length; i++) {
				const child = currentNode.childNode[i];
				const branchLength = child.p0.clone().sub(currentNode.p0).length();
				const branchWidth = currentNode.a0;

				addBranchVertices(currentNode.p0, child.p0, currentNode.a0, child.a0, 8);

				// Add leaves if the branch width is below the cutoff
				if (currentNode.a0 < alpha * leavesCutoff) {
					for (let j = 0; j < leavesDensity; j++) {
						const offset = new THREE.Vector3(
							(Math.random() - 0.5) * alpha,
							Math.random() * (child.p0.y - currentNode.p0.y),
							(Math.random() - 0.5) * alpha
						);
						const leafPosition = currentNode.p0.clone().add(offset);

						addLeafVertices(leafPosition, alpha);
					}
				}

				const branchApples = createApples(
					currentNode.p0,    // Branch position
					applesProbability, // Apple probability
					alpha,             // Apple size
					branchWidth
				);
				for (const apple of branchApples) {
					scene.add(apple);
					currentNode.appleIndices +=1;
				}

				stack.push(child);
			}
		}

		// Create branch mesh
		const f32vertices = new Float32Array(vertices);
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(f32vertices, 3));
		geometry.setIndex(indices);
		geometry.computeVertexNormals();

		const material = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
		const branchMesh = new THREE.Mesh(geometry, material);
		branchMesh.applyMatrix4(matrix);
		scene.add(branchMesh);

		// Create leaf mesh
		const leafF32vertices = new Float32Array(leafVertices);
		const leafGeometry = new THREE.BufferGeometry();
		leafGeometry.setAttribute("position", new THREE.BufferAttribute(leafF32vertices, 3));
		leafGeometry.setIndex(leafIndices);
		leafGeometry.computeVertexNormals();

		const leafMaterial = new THREE.MeshPhongMaterial({ color: 0x3A5F0B, side: THREE.DoubleSide });
		const leafMesh = new THREE.Mesh(leafGeometry, leafMaterial);
		leafMesh.applyMatrix4(matrix);
		scene.add(leafMesh);

		

		return { branchMesh, leafMesh };
    },


	updateTreeHermite: function (trunkGeometryBuffer, leavesGeometryBuffer, applesGeometryBuffer, rootNode) {
		//TODO
	},

	drawTreeSkeleton: function (rootNode, scene, color = 0xffffff, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.LineBasicMaterial({ color: color });
		var line = new THREE.LineSegments(geometry, material);
		line.applyMatrix4(matrix);
		scene.add(line);

		return line.geometry;
	},

	updateTreeSkeleton: function (geometryBuffer, rootNode) {

		var stack = [];
		stack.push(rootNode);

		var idx = 0;
		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}
			geometryBuffer[idx * 6] = currentNode.p0.x;
			geometryBuffer[idx * 6 + 1] = currentNode.p0.y;
			geometryBuffer[idx * 6 + 2] = currentNode.p0.z;
			geometryBuffer[idx * 6 + 3] = currentNode.p1.x;
			geometryBuffer[idx * 6 + 4] = currentNode.p1.y;
			geometryBuffer[idx * 6 + 5] = currentNode.p1.z;

			idx++;
		}
	},


	drawTreeNodes: function (rootNode, scene, color = 0x00ff00, size = 0.05, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.PointsMaterial({ color: color, size: size });
		var points = new THREE.Points(geometry, material);
		points.applyMatrix4(matrix);
		scene.add(points);

	},


	drawTreeSegments: function (rootNode, scene, lineColor = 0xff0000, segmentColor = 0xffffff, orientationColor = 0x00ff00, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];
		var pointsS = [];
		var pointsT = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			const segments = currentNode.sections;
			for (var i = 0; i < segments.length - 1; i++) {
				points.push(TP3.Geometry.meanPoint(segments[i]));
				points.push(TP3.Geometry.meanPoint(segments[i + 1]));
			}
			for (var i = 0; i < segments.length; i++) {
				pointsT.push(TP3.Geometry.meanPoint(segments[i]));
				pointsT.push(segments[i][0]);
			}

			for (var i = 0; i < segments.length; i++) {

				for (var j = 0; j < segments[i].length - 1; j++) {
					pointsS.push(segments[i][j]);
					pointsS.push(segments[i][j + 1]);
				}
				pointsS.push(segments[i][0]);
				pointsS.push(segments[i][segments[i].length - 1]);
			}
		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var geometryS = new THREE.BufferGeometry().setFromPoints(pointsS);
		var geometryT = new THREE.BufferGeometry().setFromPoints(pointsT);

		var material = new THREE.LineBasicMaterial({ color: lineColor });
		var materialS = new THREE.LineBasicMaterial({ color: segmentColor });
		var materialT = new THREE.LineBasicMaterial({ color: orientationColor });

		var line = new THREE.LineSegments(geometry, material);
		var lineS = new THREE.LineSegments(geometryS, materialS);
		var lineT = new THREE.LineSegments(geometryT, materialT);

		line.applyMatrix4(matrix);
		lineS.applyMatrix4(matrix);
		lineT.applyMatrix4(matrix);

		scene.add(line);
		scene.add(lineS);
		scene.add(lineT);

	}
}