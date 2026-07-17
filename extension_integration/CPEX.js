//THIS FILE IS EXPECTED TO BE IMPORTED BY THE EXTENSION/PLUGIN


//THE FOLLOWING CODE MUST BE GIVEN TO AI,OR ANY PERSON WITH INTEREST  IN MAKING A NEW EXTENSION/PLUGIN
/*
 loadMoleculeFromFile(): return molecule
 getAtoms(): returns array of atoms
 getBonds(): returns array of bonds
 addHandler(type,method): add event handler
 class Molecule:
  getPrincipalAtom(): returns the principal atom of the molecule
 class Atom:
  getAtomInfo():
  returns{
    id: number (0 to n-1 in molecule with n atoms, in UI atom number = id+1),
    connectingBonds: Array of bonds,
    atomicNumber: number,
    position: { x: number(Unit: meter), y: number(Unit: meter)  , z: number(Unit: meter) },
    color: string (ex:'#ffffff'),
  };
 class Bond:
  getBondInfo():
  returns{
    connectingAtoms: Array of atoms -> [atom1, atom2],
    order: number,
    bondLength:number(Unit: meter),
  };
*/

import Molecule from "../molecule/molecule.js";
import Atom from "../molecule/atom.js";
import Bond from "../molecule/bond.js";
import FileToMolecule from "../io/fileToMolecule.js";


class CPEX {

  static ON_MOLECULE_LOADED = "moleculeLoaded";
  static ON_EQUILIBRIUM_ATTAINED = "equilibriumAttained";
  static ON_ATOM_CLICKED = "atomClicked";
  static ON_BOND_CLICKED = "bondClicked";

  static handlers = {};

  static handlers = {};
  static async loadMoleculeUsingFilePath(filePath) {
    const molecule = await FileToMolecule.json(filePath);
    return molecule;
  }
  static getAtoms() {
    return Atom.getAllAtoms();
  }
  static getBonds() {
    return Bond.getAllBonds();
  }
  static addHandler(type, method) {
    if (this.handlers[type] == undefined)
      this.handlers[type] = [];
    this.handlers[type].push(method);
  }
  static launchHandlers(type,event) {
    if (this.handlers[type] != undefined)
      this.handlers[type].forEach(method => method(event));
  }
}


export default CPEX;
