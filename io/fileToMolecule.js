import Molecule from "../molecule/molecule.js";
import Atom from "../molecule/atom.js";
import { FindingEquilibrium } from "../visualizer/moleculeTo3D.js";

class FileToMolecule {
  static jsonToMolecule(json) {
    const data = JSON.parse(json);
    const molecule = new Molecule();
    data.atomsData.sort((a, b) => a.atomId - b.atomId);
    data.atomsData.forEach((atomData) => {
      const atomObj = new Atom(atomData.atomicNumber);
      if (atomData.atomId == 0) molecule.principalAtom = atomObj;
      if (atomData.position != null) atomObj.position = atomData.position;
      atomObj.velocity = { x: 0, y: 0, z: 0 };
    });
    const atoms = Atom.getAllAtoms();
    data.bondsData.forEach((bondData) => {
      const atom1 = atoms[bondData.AB[0]];
      const atom2 = atoms[bondData.AB[1]];
      atom1.createBond(atom2, bondData.order);
    });
    return molecule;
  }
  static async json(fileLink) {
    const json = await fetch(fileLink).then((res) => res.text());
    console.log(json);
    return this.jsonToMolecule(json);
  }
}

export default FileToMolecule;
