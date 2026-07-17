import Atom from "./atom.js";

class Molecule {
  constructor(principalAtom) {
    this.principalAtom = principalAtom;
  }
  create3DModel() {
    //Energy minimization via viscous relaxation(YES, THIS METHOD HAS A NAME)
  }
  getPrincipalAtom() {
    return this.principalAtom;
  }
}
export default Molecule;
