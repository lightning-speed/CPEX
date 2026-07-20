import {
  addAtom,
  traverseMolecule,
  initalizeSidePanel,
  initalizeEventListeners,
} from "./visualizer/moleculeTo3D.js";
import Molecule from "./molecule/molecule.js";
import Atom from "./molecule/atom.js";
import FileToMolecule from "../io/fileToMolecule.js";
import CPEX from "./extension_integration/CPEX.js";
import VolumeCalculator from "./ex_test/VolumeCalculator.js";
import ExtensionBar from "./extension_integration/extensionBar.js";
import Terminal from "./extension_integration/terminal.js";

async function start() {
  const link = window.location.href;
  const url = new URL(link);
  const moleculeId = url.searchParams.get("moleculeId");

  /*  const molecule = new Molecule(new Atom(6, 0x00ff00));

 // 2. Instantiate the remaining 5 carbons for the 6-membered ring
  const c2 = new Atom(6, 0x00ff00);
  const c3 = new Atom(6, 0x00ff00);
  const c4 = new Atom(6, 0x00ff00);
  const c5 = new Atom(6, 0x00ff00);
  const c6 = new Atom(6, 0x00ff00);

  // 3. Attach 2 hydrogen atoms to each carbon
  molecule.principalAtom.createBond(new Atom(1, 0x0000ff), 1);
  molecule.principalAtom.createBond(new Atom(1, 0x0000ff), 1);

  c2.createBond(new Atom(1, 0x0000ff), 1);
  c2.createBond(new Atom(1, 0x0000ff), 1);

  c3.createBond(new Atom(1, 0x0000ff), 1);
  c3.createBond(new Atom(1, 0x0000ff), 1);

  c4.createBond(new Atom(1, 0x0000ff), 1);
  c4.createBond(new Atom(1, 0x0000ff), 1);

  c5.createBond(new Atom(1, 0x0000ff), 1);
  c5.createBond(new Atom(1, 0x0000ff), 1);

  c6.createBond(new Atom(1, 0x0000ff), 1);
  c6.createBond(new Atom(1, 0x0000ff), 1);

  // 4. Connect the carbons sequentially to form a chain
  molecule.principalAtom.createBond(c2, 1);
  c2.createBond(c3, 1);
  c3.createBond(c4, 1);
  c4.createBond(c5, 1);
  c5.createBond(c6, 1);

  // 5. Close the ring by bonding the last carbon back to the first
  c6.createBond(molecule.principalAtom, 1);

  // 6. Traverse the graph to visualize
  traverseMolecule(molecule);*/
  Terminal.init();

  Terminal.print("Loading CPEX: ")
  traverseMolecule(await FileToMolecule.json("./json/" + moleculeId + ".json"));
  window.CA = Atom.getAllAtoms();
  initalizeSidePanel();
  ExtensionBar.init();
  ExtensionBar.addExtensionBoxToView({name:"SASA (Water)", description:"Finds Solvent Accessible Surface Area for Water"})
  initalizeEventListeners();
  Terminal.printColor("green", "[Done]")

}
start();

CPEX.addHandler(CPEX.ON_EQUILIBRIUM_ATTAINED, () => {
  const volume = VolumeCalculator.calculateMolecularVolume();
  console.log("Volume:", volume);
})
