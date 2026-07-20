// FILE: calculations/volumeCalculator.js
// This module imports CPEX from your extension integration

import CPEX from "../extension_integration/CPEX.js";
import Terminal from "../extension_integration/terminal.js";


class VolumeCalculator {
    /**
     * Calculate BOTH the actual molecular (van der Waals) volume and the
     * solvent-accessible volume (molecule + probe, e.g. water) using a
     * single shared Monte Carlo point cloud so the two numbers are
     * directly comparable and only one sampling pass is needed.
     *
     * @param {number} probeRadius - Probe radius in meters (default: 1.4e-10 for water)
     * @param {number} numPoints - Number of Monte Carlo points (default: 100000)
     * @param {number} padding - Padding around molecule in meters (default: 2e-10)
     * @returns {Object} Volume results, including both molecularVolume and solventAccessibleVolume
     */

    static runExtension() {
      const obj = VolumeCalculator.calculateMolecularVolume()
      Terminal.println()
      Terminal.println()

      Terminal.println("SASA (Water) Extension.  Author: Some shitty AI")
      Terminal.print("Solvent Accessible Volume (Angstrong cube): ");
      Terminal.printColor('blue', obj.solventAccessibleVolumeA3)
      Terminal.println()
    }

    static calculateMolecularVolume(probeRadius = 1.4e-10, numPoints = 100000, padding = 2e-10) {
        // Get atoms from CPEX
        const atoms = CPEX.getAtoms();
        if (!atoms || atoms.length === 0) {
            throw new Error("No atoms loaded in the molecule. Use CPEX.loadMoleculeUsingFilePath() first.");
        }

        // Get atomic (van der Waals) radii (in meters)
        const atomicRadii = this.getAtomicRadii(atoms);

        // Bounding box must be padded by at least the probe radius, otherwise
        // the SAS surface would be clipped by the sampling box.
        const bounds = this.getBoundingBox(atoms, padding + probeRadius);

        // Calculate volume of bounding box
        const boxVolume = this.calculateBoxVolume(bounds);

        // Monte Carlo integration - sample once, classify each point against
        // BOTH the bare van der Waals surface and the probe-expanded (SAS) surface.
        let insideMolecularCount = 0; // inside van der Waals surface (probe = 0)
        let insideSASCount = 0;       // inside solvent-accessible surface (probe = probeRadius)

        const pointsInsideMolecular = [];
        const pointsInsideSAS = [];
        const pointsOutside = [];

        for (let i = 0; i < numPoints; i++) {
            const point = this.randomPointInBox(bounds);

            const insideMolecular = this.isPointInsideMolecule(point, atoms, atomicRadii, 0);
            const insideSAS = insideMolecular || this.isPointInsideMolecule(point, atoms, atomicRadii, probeRadius);

            if (insideMolecular) {
                insideMolecularCount++;
                pointsInsideMolecular.push(point);
            }

            if (insideSAS) {
                insideSASCount++;
                pointsInsideSAS.push(point);
            } else {
                pointsOutside.push(point);
            }
        }

        const molecularVolumeRatio = insideMolecularCount / numPoints;
        const sasVolumeRatio = insideSASCount / numPoints;

        const molecularVolume = boxVolume * molecularVolumeRatio;              // actual (VDW) molecular volume
        const solventAccessibleVolume = boxVolume * sasVolumeRatio;            // volume enclosed by SAS (molecule + probe)

        // Calculate solvent accessible surface area using the atomic radii + probe
        const surfaceArea = this.calculateSurfaceArea(atoms, atomicRadii, probeRadius);

        // Get geometry validation info
        const geometryCheck = this.validateGeometry(atoms);

        return {
            // --- the two requested volumes ---
            molecularVolume: molecularVolume,                       // m^3, actual molecular (VDW) volume
            molecularVolumeA3: molecularVolume * 1e30,               // Å^3
            solventAccessibleVolume: solventAccessibleVolume,        // m^3, volume enclosed by the SAS
            solventAccessibleVolumeA3: solventAccessibleVolume * 1e30, // Å^3

            // --- supporting data ---
            boxVolume: boxVolume,
            boxVolumeA3: boxVolume * 1e30,
            surfaceArea: surfaceArea,
            surfaceAreaA2: surfaceArea * 1e20, // in Å²
            confidence: this.calculateConfidence(insideMolecularCount, numPoints),
            solventAccessibleConfidence: this.calculateConfidence(insideSASCount, numPoints),
            pointsInsideMolecular: pointsInsideMolecular,
            pointsInsideSAS: pointsInsideSAS,
            pointsOutside: pointsOutside,
            numPoints: numPoints,
            probeRadius: probeRadius,
            geometryIssues: geometryCheck.issues,
            isGroundState: geometryCheck.isValid,
            warning: geometryCheck.message
        };
    }

    /**
     * Calculate volume using the Connolly/Richards rolling sphere method
     * @param {number} probeRadius - Probe radius in meters (default: 1.4e-10)
     * @param {number} spherePoints - Number of points per sphere (default: 20)
     * @returns {Object} Connolly surface results
     */
    static calculateConnollyVolume(probeRadius = 1.4e-10, spherePoints = 20) {
        const atoms = CPEX.getAtoms();
        if (!atoms || atoms.length === 0) {
            throw new Error("No atoms loaded in the molecule. Use CPEX.loadMoleculeUsingFilePath() first.");
        }

        const atomicRadii = this.getAtomicRadii(atoms);
        const expandedRadii = atomicRadii.map(r => r + probeRadius);

        // Generate points on the surface of each atom (expanded by probe radius)
        const allSurfacePoints = [];
        const surfaceNormals = [];

        atoms.forEach((atom, index) => {
            const pos = atom.getAtomInfo().position;
            const radius = expandedRadii[index];

            // Generate golden spiral points on sphere surface
            const points = this.generateSpherePoints(spherePoints);

            points.forEach(point => {
                const surfacePoint = {
                    x: pos.x + point.x * radius,
                    y: pos.y + point.y * radius,
                    z: pos.z + point.z * radius
                };

                // Check if this point is accessible (not inside any other expanded sphere)
                let isAccessible = true;
                for (let j = 0; j < atoms.length; j++) {
                    if (j === index) continue;
                    const otherPos = atoms[j].getAtomInfo().position;
                    const otherRadius = expandedRadii[j];

                    const dist = this.distance(surfacePoint, otherPos);
                    if (dist < otherRadius - 1e-12) {
                        isAccessible = false;
                        break;
                    }
                }

                if (isAccessible) {
                    allSurfacePoints.push(surfacePoint);
                    surfaceNormals.push({
                        x: point.x,
                        y: point.y,
                        z: point.z
                    });
                }
            });
        });

        // Calculate surface area using triangulation
        const surfaceArea = this.calculateTriangulatedSurfaceArea(allSurfacePoints, surfaceNormals);

        // Estimate volume using the surface points
        const volume = this.calculateVolumeFromSurface(allSurfacePoints);

        // Get geometry validation
        const geometryCheck = this.validateGeometry(atoms);

        return {
            surfaceArea: surfaceArea,
            surfaceAreaA2: surfaceArea * 1e20,
            volume: volume,
            volumeA3: volume * 1e30,
            numSurfacePoints: allSurfacePoints.length,
            surfacePoints: allSurfacePoints,
            normals: surfaceNormals,
            probeRadius: probeRadius,
            geometryIssues: geometryCheck.issues,
            isGroundState: geometryCheck.isValid,
            warning: geometryCheck.message
        };
    }

    /**
     * Validate molecular geometry for ground state reasonableness
     * @param {Array} atoms - Array of atom objects
     * @returns {Object} Validation results
     */
    static validateGeometry(atoms) {
        const issues = [];
        const bonds = CPEX.getBonds();

        // Build a lookup of directly-bonded atom-index pairs. Bonded atoms
        // sit much closer together than the sum of their van der Waals radii
        // by design (that's what a bond is) - their separation is governed
        // by bond length, not VDW contact, and is validated separately in
        // step 2 below. Without this exclusion, essentially every bond
        // (e.g. a 1.54 Å C-C single bond vs. a 0.7*(1.70+1.70)=2.38 Å VDW
        // threshold) would incorrectly report as a "severe clash".
        const bondedPairs = new Set();
        if (bonds && bonds.length > 0) {
            bonds.forEach(bond => {
                const info = bond.getBondInfo();
                const [atom1, atom2] = info.connectingAtoms;
                const idx1 = atoms.indexOf(atom1);
                const idx2 = atoms.indexOf(atom2);
                if (idx1 !== -1 && idx2 !== -1) {
                    const key = idx1 < idx2 ? `${idx1}-${idx2}` : `${idx2}-${idx1}`;
                    bondedPairs.add(key);
                }
            });
        }

        // 1. Check for overlapping (non-bonded) atoms
        for (let i = 0; i < atoms.length; i++) {
            for (let j = i + 1; j < atoms.length; j++) {
                if (bondedPairs.has(`${i}-${j}`)) continue; // directly bonded - not a clash, checked via bond length instead

                const pos1 = atoms[i].getAtomInfo().position;
                const pos2 = atoms[j].getAtomInfo().position;
                const dist = this.distance(pos1, pos2);

                const r1 = this.getAtomicRadiusForElement(atoms[i].getAtomInfo().atomicNumber);
                const r2 = this.getAtomicRadiusForElement(atoms[j].getAtomInfo().atomicNumber);

                if (dist < (r1 + r2) * 0.7) {
                    issues.push(`Severe clash: Atom ${i+1} and ${j+1} (distance: ${(dist*1e10).toFixed(2)} Å)`);
                }
            }
        }

        // 2. Check bond lengths against expected values
        if (bonds && bonds.length > 0) {
            bonds.forEach((bond, idx) => {
                const info = bond.getBondInfo();
                const [atom1, atom2] = info.connectingAtoms;
                const pos1 = atom1.getAtomInfo().position;
                const pos2 = atom2.getAtomInfo().position;
                const dist = this.distance(pos1, pos2);

                const expected = this.getExpectedBondLength(
                    atom1.getAtomInfo().atomicNumber,
                    atom2.getAtomInfo().atomicNumber,
                    info.order
                );

                if (expected && Math.abs(dist - expected) > expected * 0.2) {
                    issues.push(`Unusual bond: ${atom1.getAtomInfo().atomicNumber}--${atom2.getAtomInfo().atomicNumber} (${(dist*1e10).toFixed(2)} Å, expected ${(expected*1e10).toFixed(2)} Å)`);
                }
            });
        }

        return {
            issues: issues,
            isValid: issues.length === 0,
            message: issues.length === 0 ?
                "Geometry appears physically reasonable." :
                `Geometry may not represent ground state. Issues found: ${issues.length}`
        };
    }

    /**
     * Get atomic radii for elements (in meters)
     */
    static getAtomicRadii(atoms) {
        return atoms.map(atom => {
            const atomicNumber = atom.getAtomInfo().atomicNumber;
            return this.getAtomicRadiusForElement(atomicNumber);
        });
    }

    /**
     * Get atomic radius for a single element
     */
     static getAtomicRadiusForElement(atomicNumber) {
         // VAN DER WAALS RADII (in meters)
         const vdwRadii = {
             1: 1.20e-10,   // H
             2: 1.40e-10,   // He
             6: 1.70e-10,   // C
             7: 1.55e-10,   // N
             8: 1.52e-10,   // O
             9: 1.47e-10,   // F
             10: 1.54e-10,  // Ne
             15: 1.80e-10,  // P
             16: 1.80e-10,  // S
             17: 1.75e-10,  // Cl
             18: 1.88e-10,  // Ar
             35: 1.85e-10,  // Br
             36: 2.02e-10,  // Kr
             53: 1.98e-10,  // I
             54: 2.16e-10,  // Xe
             11: 2.27e-10,  // Na
             12: 1.73e-10,  // Mg
             19: 2.75e-10,  // K
             20: 2.31e-10,  // Ca
             26: 2.05e-10,  // Fe
             29: 1.40e-10,  // Cu
             30: 1.39e-10,  // Zn
             79: 1.66e-10   // Au
         };

         return vdwRadii[atomicNumber] || 1.70e-10; // Default to carbon size
     }

    /**
     * Get expected bond length for a pair of elements
     */
    static getExpectedBondLength(atomicNumber1, atomicNumber2, order = 1) {
        // Simplified bond lengths (in meters) - would need expansion
        const bondLengths = {
            '1-1': 0.74e-10,   // H-H
            '1-6': 1.09e-10,   // H-C
            '6-6': 1.54e-10,   // C-C
            '6-6_2': 1.34e-10, // C=C
            '6-6_3': 1.20e-10, // C≡C
            '6-7': 1.47e-10,   // C-N
            '6-8': 1.43e-10,   // C-O
            '7-7': 1.45e-10,   // N-N
            '8-8': 1.48e-10,   // O-O
            '6-16': 1.82e-10,  // C-S
            '6-17': 1.77e-10,  // C-Cl
            '6-35': 1.94e-10,  // C-Br
            '6-53': 2.14e-10,  // C-I
            '16-16': 2.05e-10, // S-S
        };

        const key = `${Math.min(atomicNumber1, atomicNumber2)}-${Math.max(atomicNumber1, atomicNumber2)}`;
        const orderKey = order > 1 ? `${key}_${order}` : key;

        return bondLengths[orderKey] || bondLengths[key] || null;
    }

    /**
     * Find bounding box of molecule with padding
     */
    static getBoundingBox(atoms, padding) {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        atoms.forEach(atom => {
            const pos = atom.getAtomInfo().position;
            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x);
            minY = Math.min(minY, pos.y);
            maxY = Math.max(maxY, pos.y);
            minZ = Math.min(minZ, pos.z);
            maxZ = Math.max(maxZ, pos.z);
        });

        return {
            minX: minX - padding,
            maxX: maxX + padding,
            minY: minY - padding,
            maxY: maxY + padding,
            minZ: minZ - padding,
            maxZ: maxZ + padding
        };
    }

    /**
     * Calculate volume of bounding box
     */
    static calculateBoxVolume(bounds) {
        const width = bounds.maxX - bounds.minX;
        const height = bounds.maxY - bounds.minY;
        const depth = bounds.maxZ - bounds.minZ;
        return width * height * depth;
    }

    /**
     * Generate random point within bounding box
     */
    static randomPointInBox(bounds) {
        return {
            x: bounds.minX + Math.random() * (bounds.maxX - bounds.minX),
            y: bounds.minY + Math.random() * (bounds.maxY - bounds.minY),
            z: bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ)
        };
    }

    /**
     * Check if a point is inside the molecule (considering probe radius)
     */
    static isPointInsideMolecule(point, atoms, radii, probeRadius) {
        for (let i = 0; i < atoms.length; i++) {
            const atomPos = atoms[i].getAtomInfo().position;
            const radius = radii[i] + probeRadius;

            const dist = this.distance(point, atomPos);
            if (dist < radius) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calculate distance between two points
     */
    static distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }

    /**
     * Calculate solvent-accessible surface area using a numerical
     * (Shrake-Rupley style) algorithm: sample a set of points on the
     * probe-expanded sphere of each atom, and test each point directly
     * against every other atom's probe-expanded sphere. Each atom's
     * contribution is its full sphere area scaled by the fraction of its
     * sample points that are NOT buried inside a neighboring sphere.
     *
     * This replaces an earlier pairwise analytic approximation that used a
     * `cosTheta > 0.5` gate to decide whether to subtract overlap. That
     * gate is only valid for shallow overlaps - for atoms that are close
     * together relative to their (probe-expanded) radii, such as directly
     * bonded atoms (e.g. a 1.54 Å C-C bond vs. ~3.1 Å expanded radii),
     * cosTheta drops well below 0.5 even though the overlap/burial is
     * large, so the old code skipped the subtraction entirely and grossly
     * over-counted exposed area (e.g. neopentane came out around 1400 Å²
     * instead of a realistic ~250-350 Å²). Direct point sampling has no
     * such blind spot - it is correct for both shallow and deep overlap.
     *
     * @param {number} spherePoints - Sample points per atom sphere (default: 100). Higher = more accurate but slower.
     */
    static calculateSurfaceArea(atoms, radii, probeRadius, spherePoints = 100) {
        let totalArea = 0;
        const expandedRadii = radii.map(r => r + probeRadius);
        const unitSpherePoints = this.generateSpherePoints(spherePoints);

        atoms.forEach((atom, index) => {
            const pos = atom.getAtomInfo().position;
            const radius = expandedRadii[index];

            let accessibleCount = 0;

            unitSpherePoints.forEach(point => {
                const surfacePoint = {
                    x: pos.x + point.x * radius,
                    y: pos.y + point.y * radius,
                    z: pos.z + point.z * radius
                };

                let isAccessible = true;
                for (let j = 0; j < atoms.length; j++) {
                    if (j === index) continue;
                    const otherPos = atoms[j].getAtomInfo().position;
                    const otherRadius = expandedRadii[j];

                    const dist = this.distance(surfacePoint, otherPos);
                    if (dist < otherRadius) {
                        isAccessible = false;
                        break;
                    }
                }

                if (isAccessible) accessibleCount++;
            });

            const sphereArea = 4 * Math.PI * radius * radius;
            totalArea += sphereArea * (accessibleCount / unitSpherePoints.length);
        });

        return totalArea;
    }

    /**
     * Generate points on a sphere using golden spiral method
     */
    static generateSpherePoints(numPoints) {
        const points = [];
        const phi = Math.PI * (3 - Math.sqrt(5));

        for (let i = 0; i < numPoints; i++) {
            const y = 1 - (i / (numPoints - 1)) * 2;
            const radius = Math.sqrt(1 - y*y);
            const theta = phi * i;

            points.push({
                x: Math.cos(theta) * radius,
                y: y,
                z: Math.sin(theta) * radius
            });
        }

        return points;
    }

    /**
     * Calculate confidence based on number of inside points
     */
    static calculateConfidence(insideCount, totalPoints) {
        const p = insideCount / totalPoints;
        const stdError = Math.sqrt(p * (1 - p) / totalPoints);
        return Math.max(0, Math.min(1, 1 - stdError * 2));
    }

    /**
     * Calculate volume from surface points using divergence theorem
     */
    static calculateVolumeFromSurface(surfacePoints) {
        if (surfacePoints.length < 4) return 0;

        const center = this.calculateCenter(surfacePoints);
        const sortedPoints = this.sortPointsByAngle(surfacePoints, center);

        let volume = 0;
        for (let i = 1; i < sortedPoints.length - 1; i++) {
            const p1 = sortedPoints[0];
            const p2 = sortedPoints[i];
            const p3 = sortedPoints[i + 1];

            volume += this.tetrahedronVolume(center, p1, p2, p3);
        }

        return Math.abs(volume);
    }

    /**
     * Calculate center of points
     */
    static calculateCenter(points) {
        let cx = 0, cy = 0, cz = 0;
        points.forEach(p => {
            cx += p.x;
            cy += p.y;
            cz += p.z;
        });
        return {
            x: cx / points.length,
            y: cy / points.length,
            z: cz / points.length
        };
    }

    /**
     * Sort points by spherical angle around center
     */
    static sortPointsByAngle(points, center) {
        return points.sort((a, b) => {
            const angleA = Math.atan2(a.y - center.y, a.x - center.x);
            const angleB = Math.atan2(b.y - center.y, b.x - center.x);
            return angleA - angleB;
        });
    }

    /**
     * Calculate tetrahedron volume
     */
    static tetrahedronVolume(p1, p2, p3, p4) {
        const v1 = {
            x: p2.x - p1.x,
            y: p2.y - p1.y,
            z: p2.z - p1.z
        };
        const v2 = {
            x: p3.x - p1.x,
            y: p3.y - p1.y,
            z: p3.z - p1.z
        };
        const v3 = {
            x: p4.x - p1.x,
            y: p4.y - p1.y,
            z: p4.z - p1.z
        };

        const cross = {
            x: v2.y * v3.z - v2.z * v3.y,
            y: v2.z * v3.x - v2.x * v3.z,
            z: v2.x * v3.y - v2.y * v3.x
        };

        const dot = v1.x * cross.x + v1.y * cross.y + v1.z * cross.z;
        return Math.abs(dot) / 6;
    }

    /**
     * Calculate triangulated surface area from surface points
     */
    static calculateTriangulatedSurfaceArea(points, normals) {
        if (points.length < 3) return 0;

        let totalArea = 0;
        const center = this.calculateCenter(points);
        const sortedIndices = this.sortPointsByAngleWithNormals(points, center, normals);

        for (let i = 0; i < sortedIndices.length - 2; i++) {
            const i1 = sortedIndices[i];
            const i2 = sortedIndices[i + 1];
            const i3 = sortedIndices[i + 2];

            const p1 = points[i1];
            const p2 = points[i2];
            const p3 = points[i3];

            const v1 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
            const v2 = { x: p3.x - p1.x, y: p3.y - p1.y, z: p3.z - p1.z };

            const cross = {
                x: v1.y * v2.z - v1.z * v2.y,
                y: v1.z * v2.x - v1.x * v2.z,
                z: v1.x * v2.y - v1.y * v2.x
            };

            const area = Math.sqrt(cross.x*cross.x + cross.y*cross.y + cross.z*cross.z) / 2;
            totalArea += area;
        }

        return totalArea;
    }

    /**
     * Sort points by angle with normals for proper triangulation
     */
    static sortPointsByAngleWithNormals(points, center, normals) {
        return points.map((_, i) => i).sort((a, b) => {
            const angleA = Math.atan2(points[a].y - center.y, points[a].x - center.x);
            const angleB = Math.atan2(points[b].y - center.y, points[b].x - center.x);
            return angleA - angleB;
        });
    }
}

export default VolumeCalculator;
