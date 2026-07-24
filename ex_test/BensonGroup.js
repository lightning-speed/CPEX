// FILE: calculations/bensonGroupCalculator.js
// This module imports CPEX from your extension integration
//
// Estimates ΔHf°(298K, gas) using BENSON GROUP ADDITIVITY:
// each heavy atom is classified into a "group" (its own type plus
// the types of its immediate neighbors), each group has an empirical
// contribution to ΔHf°, and the total is the sum over all groups.
//
// Source of group values: Cohen & Benson, "Estimation of heats of
// formation of organic compounds by additivity methods", Chem. Rev.
// 1993, 93(7), 2419-2438 (values in kcal/mol, 298K, ideal gas).
//
// SCOPE / HONESTY NOTE:
// Only C/H alkane and alkene groups are implemented, because these
// are the values that could be verified against reference compounds
// (see VALIDATION below). Heteroatoms (O, N, S, halogens), alkynes,
// aromatic rings, and ring-strain corrections are NOT covered by
// this table. Rather than silently substituting a guessed value
// (which is what caused the last bad estimate), unsupported atoms
// or groups cause this extension to throw a descriptive error so
// you know exactly what's missing instead of getting a wrong number.
//
// VALIDATION (group values reproduce experimental ΔHf°, kcal/mol):
//   ethane   = 2×P              = -20.00   (exp -20.03)
//   propane  = 2×P + 1×S        = -25.00   (exp -25.02)
//   isobutane= 3×P + 1×T        = -32.40   (exp -32.07)
//   neopentane=4×P + 1×Q        = -40.10   (exp -40.18)
//   ethylene = 2×Cd-(H)2        = +12.54   (exp +12.5)
//
// methane is a special case: Benson's P/S/T/Q parameters were fit
// from ethane/propane/isobutane/neopentane, and there is no
// "C-(H)4" group in the standard tables (every group requires at
// least one non-H substituent). Methane's literature ΔHf° is used
// directly as the base case.

import CPEX from "../extension_integration/CPEX.js";
import Terminal from "../extension_integration/terminal.js";

const KCAL_TO_KJ = 4.184;

class BensonGroupCalculator {

    // ΔHf° for the CH4 special case (kcal/mol), NIST/CODATA value.
    static METHANE_HF_KCAL = -17.89;

    /**
     * sp3 (alkane-type) carbon groups.
     * Key = "nC:<C nbrs>,nCd:<Cd nbrs>,nH:<H nbrs>" (no Ct support here)
     * Value = { kcal, label }
     */
    static ALKANE_GROUPS = {
        "nC:1,nCd:0,nH:3": { kcal: -10.00, label: "C-(C)(H)3" },        // primary, P
        "nC:2,nCd:0,nH:2": { kcal: -5.00, label: "C-(C)2(H)2" },        // secondary, S
        "nC:3,nCd:0,nH:1": { kcal: -2.40, label: "C-(C)3(H)" },         // tertiary, T
        "nC:4,nCd:0,nH:0": { kcal: -0.10, label: "C-(C)4" },            // quaternary, Q

        "nC:0,nCd:1,nH:3": { kcal: -10.00, label: "C-(Cd)(H)3" },
        "nC:1,nCd:1,nH:2": { kcal: -4.80, label: "C-(Cd)(C)(H)2" },
        "nC:2,nCd:1,nH:1": { kcal: -1.67, label: "C-(Cd)(C)2(H)" },
        "nC:3,nCd:1,nH:0": { kcal: 1.77, label: "C-(Cd)(C)3" },
        "nC:0,nCd:2,nH:2": { kcal: -4.30, label: "C-(Cd)2(H)2" },
    };

    /**
     * sp2 (alkene) carbon groups. The double-bond partner is implicit
     * in "Cd" classification and excluded from the substituent count;
     * only the other two sigma substituents are keyed here.
     * Key = "nC:<C sub>,nCd:<Cd sub>,nH:<H sub>"
     */
    static ALKENE_GROUPS = {
        "nC:0,nCd:0,nH:2": { kcal: 6.27, label: "Cd-(H)2" },
        "nC:1,nCd:0,nH:1": { kcal: 8.55, label: "Cd-(C)(H)" },
        "nC:2,nCd:0,nH:0": { kcal: 10.19, label: "Cd-(C)2" },
        "nC:0,nCd:1,nH:1": { kcal: 6.78, label: "Cd-(Cd)(H)" },
        "nC:1,nCd:1,nH:0": { kcal: 8.76, label: "Cd-(Cd)(C)" },
    };

    static runExtension() {
        let results;
        try {
            results = BensonGroupCalculator.calculateEnthalpyOfFormation();
        } catch (err) {
            Terminal.println();
            Terminal.println();
            Terminal.println("Benson Group Additivity Estimator");
            Terminal.println("==================================");
            Terminal.printColor('red', `Cannot compute: ${err.message}`);
            Terminal.println();
            return;
        }

        Terminal.println();
        Terminal.println();
        Terminal.println("Benson Group Additivity Estimator");
        Terminal.println("==================================");
        Terminal.println(`Formula: ${results.formula}`);
        Terminal.println();

        if (results.specialCase) {
            Terminal.println(`Special case: ${results.specialCase}`);
        } else {
            Terminal.println("Group decomposition:");
            results.groupBreakdown.forEach(g => {
                Terminal.println(`  ${g.count.toString().padStart(2)} x ${g.label.padEnd(20)} @ ${g.kcalEach.toFixed(2)} kcal/mol = ${(g.count * g.kcalEach).toFixed(2)} kcal/mol`);
            });
        }

        Terminal.println();
        Terminal.printColor('blue', `Estimated ΔHf°(298K, gas) = ${results.deltaHfKcal.toFixed(2)} kcal/mol`);
        Terminal.println();
        Terminal.printColor('blue', `                          = ${results.deltaHfKJ.toFixed(2)} kJ/mol`);
        Terminal.println();
        Terminal.println("Typical accuracy of Benson group additivity: ±2-3 kcal/mol");
        Terminal.println("(gauche/cis/ring-strain corrections not applied in this version).");
    }

    static calculateEnthalpyOfFormation() {
        const atoms = CPEX.getAtoms();
        const bonds = CPEX.getBonds();

        if (!atoms || atoms.length === 0) {
            throw new Error("No atoms loaded. Use CPEX.loadMoleculeUsingFilePath() first.");
        }
        if (!bonds) {
            throw new Error("No bond data available. This method requires connectivity information.");
        }

        // Build adjacency: atomId -> [{ neighborAtom, order }]
        const adjacency = new Map();
        atoms.forEach(atom => adjacency.set(atom.getAtomInfo().id, []));

        bonds.forEach(bond => {
            const info = bond.getBondInfo();
            const [a1, a2] = info.connectingAtoms;
            const id1 = a1.getAtomInfo().id;
            const id2 = a2.getAtomInfo().id;
            const order = Math.round(info.order) || 1;
            adjacency.get(id1).push({ neighbor: a2, order });
            adjacency.get(id2).push({ neighbor: a1, order });
        });

        const carbons = atoms.filter(a => a.getAtomInfo().atomicNumber === 6);
        const heavyNonCarbon = atoms.filter(a => {
            const z = a.getAtomInfo().atomicNumber;
            return z !== 6 && z !== 1;
        });

        if (heavyNonCarbon.length > 0) {
            const symbols = heavyNonCarbon.map(a => `atom #${a.getAtomInfo().id + 1} (Z=${a.getAtomInfo().atomicNumber})`).join(", ");
            throw new Error(`Unsupported element(s) present: ${symbols}. This extension only covers C/H alkane and alkene groups.`);
        }

        // Special case: methane (single carbon, no C-C connectivity at all)
        if (carbons.length === 1 && atoms.length === 5) {
            return {
                formula: "CH4",
                specialCase: `CH4 has no C-C bonds, so it isn't decomposable into standard groups. Using literature ΔHf°(CH4) = ${this.METHANE_HF_KCAL} kcal/mol directly.`,
                deltaHfKcal: this.METHANE_HF_KCAL,
                deltaHfKJ: this.METHANE_HF_KCAL * KCAL_TO_KJ,
                groupBreakdown: []
            };
        }

        // Classify hybridization of every carbon: 'sp3' | 'sp2' | 'sp'
        const hybridization = new Map();
        carbons.forEach(atom => {
            const id = atom.getAtomInfo().id;
            const nbrs = adjacency.get(id);
            const maxOrder = Math.max(...nbrs.map(n => n.order));
            if (maxOrder === 3) hybridization.set(id, 'sp');
            else if (maxOrder === 2) hybridization.set(id, 'sp2');
            else hybridization.set(id, 'sp3');
        });

        const groupCounts = new Map(); // label -> { count, kcalEach }
        const addGroup = (entry) => {
            if (!groupCounts.has(entry.label)) {
                groupCounts.set(entry.label, { count: 0, kcalEach: entry.kcal, label: entry.label });
            }
            groupCounts.get(entry.label).count += 1;
        };

        const classifyNeighbor = (neighborAtom) => {
            const info = neighborAtom.getAtomInfo();
            if (info.atomicNumber === 1) return 'H';
            if (info.atomicNumber === 6) {
                const h = hybridization.get(info.id);
                if (h === 'sp3') return 'C';
                if (h === 'sp2') return 'Cd';
                if (h === 'sp') return 'Ct';
            }
            return 'OTHER';
        };

        carbons.forEach(atom => {
            const info = atom.getAtomInfo();
            const id = info.id;
            const hyb = hybridization.get(id);
            const nbrs = adjacency.get(id);

            if (hyb === 'sp') {
                throw new Error(`Atom #${id + 1} is an sp (triple-bonded) carbon. Alkyne groups are not in this table.`);
            }

            if (hyb === 'sp3') {
                if (nbrs.length !== 4) {
                    throw new Error(`Atom #${id + 1} (sp3 carbon) has ${nbrs.length} bonds; expected 4. Check connectivity/valence.`);
                }
                let nC = 0, nCd = 0, nH = 0;
                nbrs.forEach(n => {
                    const t = classifyNeighbor(n.neighbor);
                    if (t === 'C') nC++;
                    else if (t === 'Cd') nCd++;
                    else if (t === 'H') nH++;
                    else throw new Error(`Atom #${id + 1}: unsupported neighbor type for group lookup.`);
                });
                const key = `nC:${nC},nCd:${nCd},nH:${nH}`;
                const entry = this.ALKANE_GROUPS[key];
                if (!entry) {
                    throw new Error(`Atom #${id + 1}: no tabulated group for substituent pattern (${nC} C, ${nCd} Cd, ${nH} H). This combination isn't in the current table.`);
                }
                addGroup(entry);
            }

            if (hyb === 'sp2') {
                const doubleBondNbrs = nbrs.filter(n => n.order === 2);
                const singleBondNbrs = nbrs.filter(n => n.order === 1);
                if (doubleBondNbrs.length !== 1) {
                    throw new Error(`Atom #${id + 1}: expected exactly 1 double bond for an sp2 carbon, found ${doubleBondNbrs.length}. Cumulated dienes/allenes not supported.`);
                }
                if (singleBondNbrs.length !== 2) {
                    throw new Error(`Atom #${id + 1} (sp2 carbon) has ${singleBondNbrs.length} single-bonded substituents; expected 2.`);
                }
                let nC = 0, nCd = 0, nH = 0;
                singleBondNbrs.forEach(n => {
                    const t = classifyNeighbor(n.neighbor);
                    if (t === 'C') nC++;
                    else if (t === 'Cd') nCd++;
                    else if (t === 'H') nH++;
                    else throw new Error(`Atom #${id + 1}: unsupported substituent type for alkene group lookup.`);
                });
                const key = `nC:${nC},nCd:${nCd},nH:${nH}`;
                const entry = this.ALKENE_GROUPS[key];
                if (!entry) {
                    throw new Error(`Atom #${id + 1}: no tabulated alkene group for substituent pattern (${nC} C, ${nCd} Cd, ${nH} H).`);
                }
                addGroup(entry);
            }
        });

        let deltaHfKcal = 0;
        const groupBreakdown = [];
        groupCounts.forEach(g => {
            deltaHfKcal += g.count * g.kcalEach;
            groupBreakdown.push(g);
        });

        const hCount = atoms.filter(a => a.getAtomInfo().atomicNumber === 1).length;
        const formula = carbons.length > 0
            ? `C${carbons.length > 1 ? carbons.length : ""}H${hCount > 1 ? hCount : ""}`
            : `H${hCount > 1 ? hCount : ""}`;

        return {
            formula,
            specialCase: null,
            deltaHfKcal,
            deltaHfKJ: deltaHfKcal * KCAL_TO_KJ,
            groupBreakdown
        };
    }
}

export default BensonGroupCalculator;
