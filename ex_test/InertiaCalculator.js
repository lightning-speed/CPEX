// FILE: calculations/inertiaCalculator.js
// This module imports CPEX from your extension integration

import CPEX from "../extension_integration/CPEX.js";
import Terminal from "../extension_integration/terminal.js";

class InertiaCalculator {
    /**
     * Standard atomic masses in AMU (kg / 1.66053906660e-27)
     */
    static ATOMIC_MASSES = {
        1: 1.007825,   // H
        2: 4.002602,   // He
        6: 12.000000,  // C
        7: 14.003074,  // N
        8: 15.994915,  // O
        9: 18.998403,  // F
        10: 19.992440, // Ne
        15: 30.973762, // P
        16: 31.972071, // S
        17: 34.968853, // Cl
        18: 39.962383, // Ar
        35: 78.918338, // Br
        36: 83.911507, // Kr
        53: 126.904473,// I
        54: 131.293037,// Xe
        11: 22.989769, // Na
        12: 23.985042, // Mg
        19: 38.963706, // K
        20: 39.962591, // Ca
        26: 55.934937, // Fe
        29: 62.929597, // Cu
        30: 63.929142, // Zn
        79: 196.966569 // Au
    };

    // Physical Constants
    static H_BAR = 1.054571817e-34; // J·s
    static PLANCK_H = 6.62607015e-34; // J·s
    static C_MS = 299792458; // m/s
    static AMU_TO_KG = 1.66053906660e-27; // kg

    static runExtension() {
        const results = InertiaCalculator.calculateInertiaAndRotationalConstants();

        Terminal.println();
        Terminal.println();
        Terminal.println("Moment of Inertia & Rotational Constants Extension");
        Terminal.println("==================================================");
        Terminal.println(`Molecule Mass: ${results.totalMassAmu.toFixed(4)} amu`);
        Terminal.println(`Top Classification: ${results.topType.toUpperCase()} (Ray's κ = ${results.rayKappa !== null ? results.rayKappa.toFixed(4) : "N/A"})`);
        Terminal.println();
        Terminal.println("Principal Moments of Inertia (amu·Å²):");
        Terminal.println(`  I_A = ${results.principalMomentsAmuA2.Ia.toFixed(4)}`);
        Terminal.println(`  I_B = ${results.principalMomentsAmuA2.Ib.toFixed(4)}`);
        Terminal.println(`  I_C = ${results.principalMomentsAmuA2.Ic.toFixed(4)}`);
        Terminal.println();
        Terminal.println("Rotational Constants (GHz):");
        Terminal.printColor('blue', `  A = ${results.rotationalConstantsGHz.A.toFixed(4)} GHz`);
        Terminal.println();
        Terminal.printColor('blue', `  B = ${results.rotationalConstantsGHz.B.toFixed(4)} GHz`);
        Terminal.println();
        Terminal.printColor('blue', `  C = ${results.rotationalConstantsGHz.C.toFixed(4)} GHz`);
        Terminal.println();
        Terminal.println(`Rotational Constants (cm⁻¹): A = ${results.rotationalConstantsCm1.A.toFixed(4)}, B = ${results.rotationalConstantsCm1.B.toFixed(4)}, C = ${results.rotationalConstantsCm1.C.toFixed(4)}`);
    }

    /**
     * Compute Center of Mass, Moment of Inertia Tensor, Principal Moments,
     * Rotational Constants, and Top Classification.
     *
     * @returns {Object} Complete inertial properties
     */
    static calculateInertiaAndRotationalConstants() {
        const atoms = CPEX.getAtoms();
        if (!atoms || atoms.length === 0) {
            throw new Error("No atoms loaded in the molecule. Use CPEX.loadMoleculeUsingFilePath() first.");
        }

        // 1. Compute Center of Mass (COM)
        let totalMass = 0;
        let com = { x: 0, y: 0, z: 0 };

        const atomicData = atoms.map(atom => {
            const info = atom.getAtomInfo();
            const massAmu = this.ATOMIC_MASSES[info.atomicNumber] || 12.0000;
            const massKg = massAmu * this.AMU_TO_KG;
            totalMass += massKg;

            com.x += info.position.x * massKg;
            com.y += info.position.y * massKg;
            com.z += info.position.z * massKg;

            return { position: info.position, massKg, massAmu };
        });

        com.x /= totalMass;
        com.y /= totalMass;
        com.z /= totalMass;

        // 2. Build Moment of Inertia Tensor (in kg·m²)
        // I_xx = sum(m * (y^2 + z^2)), I_xy = -sum(m * x * y), etc.
        let Ixx = 0, Iyy = 0, Izz = 0;
        let Ixy = 0, Ixz = 0, Iyz = 0;

        atomicData.forEach(data => {
            const rx = data.position.x - com.x;
            const ry = data.position.y - com.y;
            const rz = data.position.z - com.z;
            const m = data.massKg;

            Ixx += m * (ry * ry + rz * rz);
            Iyy += m * (rx * rx + rz * rz);
            Izz += m * (rx * rx + ry * ry);

            Ixy -= m * rx * ry;
            Ixz -= m * rx * rz;
            Iyz -= m * ry * rz;
        });

        const tensorKgM2 = [
            [Ixx, Ixy, Ixz],
            [Ixy, Iyy, Iyz],
            [Ixz, Iyz, Izz]
        ];

        // 3. Diagonalize the Tensor to get Principal Moments (Ia <= Ib <= Ic)
        const principalMomentsKgM2 = this.diagonalizeSymmetric3x3(tensorKgM2).sort((a, b) => a - b);

        const [Ia_kgm2, Ib_kgm2, Ic_kgm2] = principalMomentsKgM2;

        // Conversion factors
        const kgm2ToAmuA2 = 1 / (this.AMU_TO_KG * 1e-20);
        const Ia_amuA2 = Ia_kgm2 * kgm2ToAmuA2;
        const Ib_amuA2 = Ib_kgm2 * kgm2ToAmuA2;
        const Ic_amuA2 = Ic_kgm2 * kgm2ToAmuA2;

        // 4. Calculate Rotational Constants: B_hz = h / (8 * pi^2 * I)
        const computeB = (I) => (I > 1e-48) ? (this.PLANCK_H / (8 * Math.PI * Math.PI * I)) : 0;

        const A_Hz = computeB(Ia_kgm2);
        const B_Hz = computeB(Ib_kgm2);
        const C_Hz = computeB(Ic_kgm2);

        const A_GHz = A_Hz / 1e9;
        const B_GHz = B_Hz / 1e9;
        const C_GHz = C_Hz / 1e9;

        const A_cm1 = A_Hz / (this.C_MS * 100);
        const B_cm1 = B_Hz / (this.C_MS * 100);
        const C_cm1 = C_Hz / (this.C_MS * 100);

        // 5. Determine Top Classification (Ovality / Symmetry) and Ray's Asymmetry Parameter (kappa)
        const topInfo = this.classifyMolecularTop(Ia_amuA2, Ib_amuA2, Ic_amuA2);

        return {
            centerOfMass: com,
            totalMassAmu: totalMass / this.AMU_TO_KG,
            totalMassKg: totalMass,

            inertiaTensorKgM2: tensorKgM2,

            principalMomentsKgM2: { Ia: Ia_kgm2, Ib: Ib_kgm2, Ic: Ic_kgm2 },
            principalMomentsAmuA2: { Ia: Ia_amuA2, Ib: Ib_amuA2, Ic: Ic_amuA2 },

            rotationalConstantsHz: { A: A_Hz, B: B_Hz, C: C_Hz },
            rotationalConstantsGHz: { A: A_GHz, B: B_GHz, C: C_GHz },
            rotationalConstantsCm1: { A: A_cm1, B: B_cm1, C: C_cm1 },

            topType: topInfo.type,
            rayKappa: topInfo.kappa,
            description: topInfo.description
        };
    }

    /**
     * Classify the molecule shape/top based on principal moments
     */
    static classifyMolecularTop(Ia, Ib, Ic, tol = 1e-3) {
        // Handle diatomic / linear molecules
        if (Ia < tol) {
            return {
                type: "linear",
                kappa: -1.0,
                description: "Linear molecule (Ia ≈ 0, Ib = Ic)"
            };
        }

        const diffAB = Math.abs(Ia - Ib);
        const diffBC = Math.abs(Ib - Ic);

        // Spherical Top: Ia = Ib = Ic
        if (diffAB < tol && diffBC < tol) {
            return {
                type: "spherical top",
                kappa: 0,
                description: "Spherical top (Ia = Ib = Ic)"
            };
        }

        // Prolate Symmetric Top: Ia < Ib = Ic
        if (diffBC < tol) {
            return {
                type: "prolate symmetric top",
                kappa: -1.0,
                description: "Prolate symmetric top (cigar-shaped: Ia < Ib = Ic)"
            };
        }

        // Oblate Symmetric Top: Ia = Ib < Ic
        if (diffAB < tol) {
            return {
                type: "oblate symmetric top",
                kappa: 1.0,
                description: "Oblate symmetric top (pancake-shaped: Ia = Ib < Ic)"
            };
        }

        // Asymmetric Top: Ia < Ib < Ic
        // Ray's asymmetry parameter: kappa = (2B - A - C) / (A - C)
        // Expressed in moments of inertia: kappa = (2*Ia*Ic - Ib*Ic - Ia*Ib) / (Ib * (Ic - Ia))
        const kappa = (2 * Ib - Ia - Ic) / (Ic - Ia);

        let subType = "asymmetric top";
        if (kappa < -0.5) subType = "asymmetric top (prolate-leaning)";
        else if (kappa > 0.5) subType = "asymmetric top (oblate-leaning)";

        return {
            type: subType,
            kappa: kappa,
            description: `Asymmetric top (Ia < Ib < Ic, Ray's κ = ${kappa.toFixed(4)})`
        };
    }

    /**
     * Eigenvalues of a 3x3 symmetric matrix using Jacobi eigenvalue algorithm
     */
    static diagonalizeSymmetric3x3(matrix) {
        let A = matrix.map(row => [...row]);
        const maxIter = 50;

        for (let iter = 0; iter < maxIter; iter++) {
            // Find largest off-diagonal element
            let p = 0, q = 1;
            let maxVal = Math.abs(A[0][1]);

            if (Math.abs(A[0][2]) > maxVal) { maxVal = Math.abs(A[0][2]); p = 0; q = 2; }
            if (Math.abs(A[1][2]) > maxVal) { maxVal = Math.abs(A[1][2]); p = 1; q = 2; }

            if (maxVal < 1e-15) break; // Convergence

            const app = A[p][p];
            const aqq = A[q][q];
            const apq = A[p][q];

            const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
            const c = Math.cos(phi);
            const s = Math.sin(phi);

            // Rotate
            const newA = A.map(row => [...row]);

            newA[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
            newA[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
            newA[p][q] = 0;
            newA[q][p] = 0;

            for (let r = 0; r < 3; r++) {
                if (r !== p && r !== q) {
                    const arp = A[r][p];
                    const arq = A[r][q];
                    newA[r][p] = c * arp - s * arq;
                    newA[p][r] = newA[r][p];
                    newA[r][q] = s * arp + c * arq;
                    newA[q][r] = newA[r][q];
                }
            }
            A = newA;
        }

        return [A[0][0], A[1][1], A[2][2]];
    }
}

export default InertiaCalculator;
