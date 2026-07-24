// FILE: calculations/enthalpyCalculator.js
// This module imports CPEX from your extension integration
// Estimates standard enthalpy of formation (ΔHf°, gas phase, 298 K)
// using the ATOMIZATION METHOD:
//
//   ΔHf°(molecule) ≈ Σ ΔHf°(atoms, gaseous) - Σ D(bonds)
//
// i.e. the energy to form the molecule from its already-gaseous atoms
// (sum of atomic heats of formation) minus the energy released when
// those atoms bond together (sum of bond dissociation energies).
//
// This is an approximation (no resonance, strain, or conjugation
// corrections) but works reasonably for simple organics/inorganics
// built from single/double/triple bonds between common elements.

import CPEX from "../extension_integration/CPEX.js";
import Terminal from "../extension_integration/terminal.js";

class EnthalpyCalculator {

    /**
     * Standard enthalpies of formation of GASEOUS ATOMS at 298K, kJ/mol.
     * (i.e. the energy to atomize the element's standard state into
     * free gaseous atoms). Source: standard thermochemical tables.
     */
    static ATOMIC_HF_GAS_KJMOL = {
        1: 217.999,   // H
        6: 716.680,   // C
        7: 472.680,   // N
        8: 249.170,   // O
        9: 79.380,    // F
        15: 316.500,  // P
        16: 278.800,  // S
        17: 121.300,  // Cl
        35: 111.870,  // Br
        53: 106.760,  // I
        14: 450.000,  // Si
        5: 565.000,   // B
    };

    static ELEMENT_SYMBOLS = {
        1: "H", 5: "B", 6: "C", 7: "N", 8: "O", 9: "F", 14: "Si",
        15: "P", 16: "S", 17: "Cl", 35: "Br", 53: "I"
    };

    /**
     * Average bond dissociation energies, kJ/mol, keyed by
     * "z1-z2-order" where z1 <= z2 (sorted atomic numbers).
     * These are averaged values compiled from standard bond-energy
     * tables (e.g. Blanksby & Ellison; CRC Handbook averages).
     */
    static BOND_ENERGIES_KJMOL = {
        // Carbon backbone
        "6-6-1": 346,   // C-C
        "6-6-2": 602,   // C=C
        "6-6-3": 835,   // C≡C
        "1-6-1": 411,   // C-H
        // C-N
        "6-7-1": 305,
        "6-7-2": 615,
        "6-7-3": 887,
        // C-O
        "6-8-1": 358,
        "6-8-2": 799,
        // C-F/Cl/Br/I
        "6-9-1": 485,
        "6-17-1": 327,
        "6-35-1": 285,
        "6-53-1": 213,
        // C-S / C-P / C-Si
        "6-16-1": 272,
        "6-15-1": 264,
        "6-14-1": 318,
        // N-H, O-H, S-H, P-H
        "1-7-1": 386,
        "1-8-1": 459,
        "1-16-1": 363,
        "1-15-1": 322,
        // N-N, N-O
        "7-7-1": 167,
        "7-7-2": 418,
        "7-7-3": 942,
        "7-8-1": 201,
        "7-8-2": 607,
        // O-O, O-S, O-Si
        "8-8-1": 142,
        "8-8-2": 494,   // O=O (rarely a "bond" in a molecule graph, kept for completeness)
        "8-16-1": 265,
        "8-16-2": 522,
        "8-14-1": 452,
        // S-S, S-Cl, halogens-halogens
        "16-16-1": 226,
        "9-9-1": 159,
        "17-17-1": 243,
        "35-35-1": 193,
        "53-53-1": 151,
        // Si-H, Si-Si
        "1-14-1": 318,
        "14-14-1": 222,
        // B-H, B-F
        "1-5-1": 389,
        "5-9-1": 613,
    };

    /**
     * Fallback bond energy if a specific pair/order isn't tabulated:
     * scaled from single-bond average, multiplied roughly per order.
     */
    static estimateFallbackBondEnergy(z1, z2, order) {
        const base = 300; // generic single-bond estimate, kJ/mol
        const orderFactor = order === 1 ? 1.0 : order === 2 ? 1.7 : order === 3 ? 2.2 : 1.0;
        return base * orderFactor;
    }

    static getBondEnergy(z1, z2, order) {
        const lo = Math.min(z1, z2);
        const hi = Math.max(z1, z2);
        const key = `${lo}-${hi}-${order}`;
        if (this.BOND_ENERGIES_KJMOL[key] !== undefined) {
            return { value: this.BOND_ENERGIES_KJMOL[key], estimated: false };
        }
        return { value: this.estimateFallbackBondEnergy(lo, hi, order), estimated: true };
    }

    static runExtension() {
        const results = EnthalpyCalculator.calculateEnthalpyOfFormation();

        Terminal.println();
        Terminal.println();
        Terminal.println("Enthalpy of Formation Estimator (Atomization Method)");
        Terminal.println("======================================================");
        Terminal.println(`Formula: ${results.formula}`);
        Terminal.println(`Sum of atomic ΔHf° (gaseous atoms): ${results.sumAtomicHf.toFixed(2)} kJ/mol`);
        Terminal.println(`Sum of bond dissociation energies:  ${results.sumBondEnergies.toFixed(2)} kJ/mol`);
        Terminal.println();
        Terminal.printColor('blue', `Estimated ΔHf°(molecule, gas) = ${results.deltaHf.toFixed(2)} kJ/mol`);
        Terminal.println();
        Terminal.printColor('blue', `                              = ${(results.deltaHf / 4.184).toFixed(2)} kcal/mol`);
        Terminal.println();

        if (results.bondsUsingFallback.length > 0) {
            Terminal.println();
            Terminal.println("Note: the following bonds used a generic fallback energy");
            Terminal.println("(no tabulated value for this element pair/order):");
            results.bondsUsingFallback.forEach(b => {
                Terminal.println(`  ${b.atom1Symbol}-${b.atom2Symbol} (order ${b.order}): ~${b.energy.toFixed(1)} kJ/mol`);
            });
        }

        Terminal.println();
        Terminal.println("Caveats: this is a first-order estimate only. It does not");
        Terminal.println("account for resonance stabilization, ring strain, steric");
        Terminal.println("effects, conjugation, or hybridization-specific bond energies.");
    }

    /**
     * Compute ΔHf° estimate for the currently loaded molecule.
     * @returns {Object} breakdown of the calculation
     */
    static calculateEnthalpyOfFormation() {
        const atoms = CPEX.getAtoms();
        const bonds = CPEX.getBonds();

        if (!atoms || atoms.length === 0) {
            throw new Error("No atoms loaded in the molecule. Use CPEX.loadMoleculeUsingFilePath() first.");
        }
        if (!bonds) {
            throw new Error("No bond data available. This method requires connectivity information.");
        }

        // 1. Sum atomic heats of formation (gaseous atoms)
        let sumAtomicHf = 0;
        const elementCounts = {};

        atoms.forEach(atom => {
            const info = atom.getAtomInfo();
            const z = info.atomicNumber;
            const hf = this.ATOMIC_HF_GAS_KJMOL[z];
            if (hf === undefined) {
                throw new Error(`No tabulated gaseous atomic ΔHf for atomic number ${z}. Add it to ATOMIC_HF_GAS_KJMOL.`);
            }
            sumAtomicHf += hf;

            const sym = this.ELEMENT_SYMBOLS[z] || `Z${z}`;
            elementCounts[sym] = (elementCounts[sym] || 0) + 1;
        });

        // 2. Sum bond dissociation energies over all bonds
        let sumBondEnergies = 0;
        const bondsUsingFallback = [];

        bonds.forEach(bond => {
            const info = bond.getBondInfo();
            const [atom1, atom2] = info.connectingAtoms;
            const z1 = atom1.getAtomInfo().atomicNumber;
            const z2 = atom2.getAtomInfo().atomicNumber;
            const order = Math.round(info.order) || 1;

            const { value, estimated } = this.getBondEnergy(z1, z2, order);
            sumBondEnergies += value;

            if (estimated) {
                bondsUsingFallback.push({
                    atom1Symbol: this.ELEMENT_SYMBOLS[z1] || `Z${z1}`,
                    atom2Symbol: this.ELEMENT_SYMBOLS[z2] || `Z${z2}`,
                    order,
                    energy: value
                });
            }
        });

        // 3. ΔHf°(molecule) = Σ ΔHf°(atoms) - Σ D(bonds)
        const deltaHf = sumAtomicHf - sumBondEnergies;

        // Build a simple Hill-order-ish formula string
        const formula = this.buildFormulaString(elementCounts);

        return {
            formula,
            elementCounts,
            sumAtomicHf,
            sumBondEnergies,
            deltaHf,
            deltaHfKcal: deltaHf / 4.184,
            bondsUsingFallback
        };
    }

    /**
     * Build a Hill-system-like formula string: C first, H second,
     * then remaining elements alphabetically.
     */
    static buildFormulaString(elementCounts) {
        const syms = Object.keys(elementCounts);
        const parts = [];

        const appendPart = (sym) => {
            if (elementCounts[sym]) {
                const n = elementCounts[sym];
                parts.push(n > 1 ? `${sym}${n}` : sym);
            }
        };

        if (syms.includes("C")) {
            appendPart("C");
            appendPart("H");
            syms.filter(s => s !== "C" && s !== "H").sort().forEach(appendPart);
        } else {
            syms.sort().forEach(appendPart);
        }

        return parts.join("");
    }
}

export default EnthalpyCalculator;
