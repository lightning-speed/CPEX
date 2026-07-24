import * as THREE from "three";
import { getElementInformationFor, getBondEnergyFor } from "./data.js";
import { isEquilibriumAttained } from "../visualizer/moleculeTo3D.js";

import * as vec from "./vec.js";

const Bonds = [];

class Bond {
  constructor(atom1, atom2, order) {
    this.atom1 = atom1;
    this.atom2 = atom2;
    this.order = order;
    Bonds.push(this);
    this.calculateEnergy();
  }
  calculateEnergy() {
    const ats = [this.atom1.atomicNumber, this.atom2.atomicNumber].sort(
      (a, b) => b - a,
    );
    if (ats[0] != 0 && ats[1] != 0)
      this.energy = getBondEnergyFor(ats[0], ats[1]);
    else this.energy = 0;
    console.log(this.energy);
  }
  evolve() {
    this.interactionForce();
    const points = [];
    points.push(
      new THREE.Vector3(
        this.atom1.position.x / (PICO * scale),
        this.atom1.position.y / (PICO * scale),
        this.atom1.position.z / (PICO * scale),
      ),
    );
    points.push(
      new THREE.Vector3(
        this.atom2.position.x / (PICO * scale),
        this.atom2.position.y / (PICO * scale),
        this.atom2.position.z / (PICO * scale),
      ),
    );

    this.line.geometry.dispose();
    this.line.geometry = new THREE.BufferGeometry().setFromPoints(points);
  }
  interactionEnergy() {}
  getIsolatedBondLenth() {
    if (this.calculatedIsolatedBondLength)
      return this.calculatedIsolatedBondLength;
    //We know d(A-A) & d(B-B)  from data collected by claude
    //d(A-B) = (d(A-A)+d(B-B)-0.18x|E.N(A)-E.N(B)|)/2
    //I HAVE NO IDEA ABOUT THE ABOVE EXPRESSION, GOOGLE GAVE IT
    //EDIT : WE DON'T NEED TO ACCOUNT FOR EN here.

    if (this.atom1.isLP || this.atom2.isLP) return 70 * PICO;
    const atom1Info = getElementInformationFor(this.atom1.atomicNumber);
    const atom2Info = getElementInformationFor(this.atom2.atomicNumber);
    const ExpectedBL =
      (PICO *
        (atom1Info.bondLength_pm +
          atom2Info.bondLength_pm -
          44 *
            Math.pow(
              Math.abs(
                atom1Info.electroNegativity_pauling -
                  atom2Info.electroNegativity_pauling,
              ),
              1.4,
            ))) /
      2;
    //WE WON'T RETURN EXPECTED BOND LENGTH AS THERE ARE REPULSION FORCES ALSO. WE CALCULATE rBL INSTEAD.After simulation the bond length will be adjusted to ExpectedBL
    const A = (STERIC_COEFF * Math.pow(PICO, 7)) / ATTRACTION_COEFF;
    const rBL = ExpectedBL - A / Math.pow(ExpectedBL, 6);
    this.calculatedIsolatedBondLength = rBL;
    return rBL;
  }
  getActualBondLength() {
    const vec_1 = vec.posToVec(this.atom1.position);
    const vec_2 = vec.posToVec(this.atom2.position);
    const r_vec12 = vec.vecSub(vec_1, vec_2);
    return vec.vecMag(r_vec12);
  }
  interactionForce() {
    if (isEquilibriumAttained()) return;
    let BL = this.getIsolatedBondLenth();
    const vec_1 = vec.posToVec(this.atom1.position);
    const vec_2 = vec.posToVec(this.atom2.position);
    const r_vec12 = vec.vecSub(vec_1, vec_2);
    let r = vec.vecMag(r_vec12);
    if (debugOnce)
      console.log(
        this.getActualBondLength(),
        "CONNECTS LP",
        this.atom1.isLP || this.atom2.isLP,
      );

    const forceMag = ATTRACTION_COEFF * (BL - r);

    this.atom1.acceleration = vec.vecAdd(
      this.atom1.acceleration,
      vec.vecMultiply(vec.unitVec(r_vec12), forceMag / this.atom1.mass),
    );
    this.atom2.acceleration = vec.vecAdd(
      this.atom2.acceleration,
      vec.vecMultiply(vec.unitVec(r_vec12), -forceMag / this.atom2.mass),
    );

    //console.log(forceMag);
  }
  getBondInfo() {
    return {
      connectingAtoms: [this.atom1, this.atom2],
      order: this.order,
      bondLength: this.getActualBondLength(),
    };
  }

  static calclateBondOnlyStericEnergy() {
    let sum = 0;
    Bonds.forEach((bond) => {
      const vec_1 = vec.posToVec(bond.atom1.position);
      const vec_2 = vec.posToVec(bond.atom2.position);
      const r_vec12 = vec.vecSub(vec_1, vec_2);
      let r = vec.vecMag(r_vec12);
      sum += (STERIC_COEFF * Math.pow(PICO, 6)) / Math.pow(r, 5);
    });
    return sum;
  }
  static getConnectingBonds(atom) {
    return Bonds.filter((bond) => bond.atom1 === atom || bond.atom2 === atom);
  }
  static getAllBonds() {
    return Bonds;
  }
  static calculateSumOfBondEnergies() {
    let sum = 0;
    for (let i = 0; i < Bonds.length; i++) {
      sum += Bonds[i].energy;
    }
    return sum;
  }
}
export default Bond;
