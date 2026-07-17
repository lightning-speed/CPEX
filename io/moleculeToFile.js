import Atom from "../molecule/atom.js";
import Bond from "../molecule/bond.js";
class MoleculeToFile {
  static convertToJson() {
    const atoms = Atom.getAllAtoms();

    const atomsData = [];
    const bondsData = [];

    atoms.forEach((atom) => {
      atomsData.push({
        atomId: atom.getAtomId(),
        atomicNumber: atom.atomicNumber,
        position: atom.position,
      });
      atom.bondedInfo.forEach((bondInfo) => {
        bondsData.push({
          AB: [
            bondInfo.bond.atom1.getAtomId(),
            bondInfo.bond.atom2.getAtomId(),
          ],
          order: bondInfo.bond.order,
        });
      });
    });
    return {
      atomsData: atomsData,
      bondsData: bondsData,
      equilibriumAttained: true,
    };
  }
}

export default MoleculeToFile;
