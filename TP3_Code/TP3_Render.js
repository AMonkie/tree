TP3.Render = {
	


	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		// Function to create a branch
		function createBranch(p0, p1, radialDivisions) {
			const direction = new THREE.Vector3().subVectors(p1, p0);
			const length = direction.length();
			direction.normalize();
	
			const geometry = new THREE.CylinderBufferGeometry(0.05, 0.05, length, radialDivisions);
			const material = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
	
			const branch = new THREE.Mesh(geometry, material);
	
			const midpoint = p0.clone().add(p1).multiplyScalar(0.5);
			branch.position.copy(midpoint);
	
			const up = new THREE.Vector3(0, 1, 0); // Default up direction
			const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
			branch.setRotationFromQuaternion(quaternion);
	
			return branch;
		}
	
		function createLeaves(branchPosition, branchLength, isTerminal, leavesDensity, alpha) {
			const leaves = [];
			const numLeaves = Math.floor(Math.random() * leavesDensity);
			const radius = alpha / 2;
		
			for (let i = 0; i < numLeaves; i++) {
				const leafGeometry = new THREE.PlaneBufferGeometry(alpha, alpha); // Square leaves of size alpha x alpha
				const leafMaterial = new THREE.MeshPhongMaterial({
					color: 0x3A5F0B,
					side: THREE.DoubleSide,
					transparent: true,
					opacity: 0.8, // Slight transparency for realism
				});
		
				const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
		
				// Random offset within a spherical radius of alpha/2
				const offset = new THREE.Vector3(
					(Math.random() - 0.5) * radius * 2,
					Math.random() * branchLength + (isTerminal ? alpha : 0), // Extend beyond for terminal branches
					(Math.random() - 0.5) * radius * 2
				);
		
				// Position leaf relative to the branch
				leaf.position.copy(branchPosition).add(offset);
		
				// Random rotation for natural appearance
				leaf.rotation.set(
					Math.random() * Math.PI, // Random X rotation
					Math.random() * Math.PI, // Random Y rotation
					Math.random() * Math.PI  // Random Z rotation
				);
		
				// Ensure leaf points upward or outward
				leaf.lookAt(branchPosition.clone().add(new THREE.Vector3(0, branchLength, 0)));
		
				leaves.push(leaf);
			}
		
			return leaves;
		}
		
	
		const stack = [];
		stack.push(rootNode);
	
		const branches = [];
		const leaves = [];
	
		// Traverse the tree
		while (stack.length > 0) {
			const currentNode = stack.pop();
	
			for (let i = 0; i < currentNode.childNode.length; i++) {
				const child = currentNode.childNode[i];
	
				// Create a branch from currentNode to child
				const branch = createBranch(currentNode.p0, child.p0, radialDivisions);
				branches.push(branch);
	
				// Create leaves if the branch is above the cutoff
				if (child.p1.y > leavesCutoff) {
					const branchLeaves = createLeaves(child.p1, leavesDensity, alpha);
					leaves.push(...branchLeaves);
				}
	
				// Push child to stack to continue traversing
				stack.push(child);
			}
		}
	
		// Apply transformations to individual branches and leaves before merging geometries
		branches.forEach(branch => branch.applyMatrix4(matrix));
		leaves.forEach(leaf => leaf.applyMatrix4(matrix));

		// Collect geometries
		const branchGeometries = branches.map(branch => branch.geometry);
		const leafGeometries = leaves.map(leaf => leaf.geometry);

		// Merge branch geometries
		const mergedBranchGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(branchGeometries);
		const branchesMesh = new THREE.Mesh(mergedBranchGeometry, new THREE.MeshLambertMaterial({ color: 0x8B5A2B }));

		// Merge leaf geometries
		const mergedLeavesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(leafGeometries);
		const leavesMesh = new THREE.Mesh(mergedLeavesGeometry, new THREE.MeshPhongMaterial({ color: 0x3A5F0B, side: THREE.DoubleSide }));

		// Add meshes to the scene
		scene.add(branchesMesh);
		scene.add(leavesMesh);

		// Return the meshes for further use if needed
		return { branches: branchesMesh, leaves: leavesMesh };
	},
	
	
	
	
	
	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		//TODO
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