import {
  vecMag,
  vecAdd,
  vecSub,
  unitVec,
  posToVec,
  vecMultiply,
  vecDot,
  NULL_VEC,
} from "./vec.js";
import Bond from "./bond.js";
import { getElementInformationFor, getAtomizationEnergyFor } from "./data.js";
import { isEquilibriumAttained } from "../visualizer/moleculeTo3D.js";

let fno = 0;

const Atoms = [];
let heatOfAtomizationSum = 0; // HEAT OF ATOMIZATION OF REACTANT ATOMS (NOT MOLECULE)
class Atom {
  static collection = Atoms;
  constructor(atomicNumber, color) {
    this.atomicNumber = atomicNumber;
    this.mass = 1;
    if (atomicNumber == 0) {
      this.isLP = true;
    } else {
      this.isLP = false;
      heatOfAtomizationSum += getAtomizationEnergyFor(atomicNumber);
    }
    this.bondedInfo = [];
    this.resetVectors();
    this.color = getElementInformationFor(atomicNumber).color;
    Atoms.push(this);
  }
  createBond(atom, order) {
    const bond = new Bond(this, atom, order);
    this.bondedInfo.push({ atom: atom, bond: bond });
  }
  createLonePair() {
    const atom = new Atom(0);
    this.createBond(atom, 1);
  }
  tick() {
    const self = this;
    this.bondedInfo.forEach((info) => {
      info.bond.evolve();
    });
    if (!isEquilibriumAttained()) {
      this.applyDrag();
      this.velocity = vecAdd(this.velocity, vecMultiply(this.acceleration, dt));
      this.position = vecAdd(this.position, vecMultiply(this.velocity, dt));
    }

    this.acceleration = {
      x: 0,
      y: 0,
      z: 0,
    };
    this.sphere3D.position.x = this.position.x / (PICO * scale);
    this.sphere3D.position.y = this.position.y / (PICO * scale);
    this.sphere3D.position.z = this.position.z / (PICO * scale);
  }
  applyDrag() {
    const drag = vecMultiply(this.velocity, DRAG_COEFF);
    this.acceleration = vecSub(this.acceleration, drag);
  }
  angleBetweenAtoms(atom1, atom2) {
    const v0 = this.position;
    const vec_1 = atom1.position;
    const vec_2 = atom2.position;
    let vec10 = vecSub(vec_1, v0);
    let vec20 = vecSub(vec_2, v0);
    let r = vecMag(vec10) * vecMag(vec20);
    let dot = vecDot(vec10, vec20);
    return Math.acos(dot / r);
  }
  getAtomInfo() {
    const connectingBonds = Bond.getConnectingBonds(this);
    return {
      id: this.getAtomId(),
      connectingBonds: connectingBonds,
      atomicNumber: this.atomicNumber,
      position: this.position,
      color: this.color,
    
    };
  }
  resetVectors() {
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.position = {
      x: Math.random() * 300 * PICO - Math.random() * 300 * PICO,
      y: Math.random() * 300 * PICO - Math.random() * 300 * PICO,
      z: -200 * PICO + Math.random() * 200 * PICO,
    };
  }
  clicked() {
    if (this.cardContainerElement) {
      this.cardContainerElement.querySelector(".atom-header").click();
    }
  }
  static applyRepulsionForces(atoms) {
    if (isEquilibriumAttained()) return;

    fno++;
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const atom1 = atoms[i];
        const atom2 = atoms[j];

        const vec_1 = atoms[i].position;
        const vec_2 = atoms[j].position;
        let r_vec12 = vecSub(vec_1, vec_2);
        let r = vecMag(r_vec12);
        if (isNaN(r) || vecMag(atom1.velocity) > (PICO * 300) / dt) {
          for (let k = 0; k < atoms.length; k++) atoms[k].resetVectors();
          console.log(
            "TO PREVENT CRASH DUE TO CLOSE DISTANCE, TWO ATOMS WERE REPOSITIONED ",
          );
          break;
        }

        //FORCE CALCULATION
        const forceMag1 =
          (REPULSION_COEFF *
            Math.pow(PICO, 3) *
            atom1.atomicNumber *
            atom2.atomicNumber) /
          Math.pow(r, 2);
        const forceMag2 = (STERIC_COEFF * Math.pow(PICO, 7)) / Math.pow(r, 6);

        //FORCE APPLICATION
        atom1.acceleration = vecAdd(
          atom1.acceleration,
          vecMultiply(unitVec(r_vec12), (forceMag1 + forceMag2) / atom1.mass),
        );
        atom2.acceleration = vecAdd(
          atom2.acceleration,
          vecMultiply(unitVec(r_vec12), -(forceMag1 + forceMag2) / atom2.mass),
        );
      }
    }
  }
  static getHeatOfAtomizationSum() {
    return heatOfAtomizationSum;
  }

  static calculateStericEnergy() {
    let energy = 0;

    for (let i = 0; i < Atoms.length; i++) {
      for (let j = i + 1; j < Atoms.length; j++) {
        const vec_1 = Atoms[i].position;
        const vec_2 = Atoms[j].position;
        let r_vec12 = vecSub(vec_1, vec_2);
        let r = vecMag(r_vec12);
        energy += (STERIC_COEFF * Math.pow(PICO, 6)) / Math.pow(r, 5);
      }
    }
    return energy;
  }
  static getAllAtoms() {
    return Atoms;
  }
  getAtomId() {
    return Atoms.indexOf(this);
  }

}
export default Atom;
