import Atom from "../molecule/atom.js";
import Bond from "../molecule/bond.js";

import * as THREE from "three";
import { initializeAtomDetails } from "./sideBar.js";
import MoleculeToFile from "./io/moleculeToFile.js";
import CPEX from "../extension_integration/CPEX.js";

let rotatingLeft = true;
let rotationRate = 0.01;
let rotatingRight = false;
let cameraXZAngle = 0;
let phyIterations = 0;
let FindingEquilibrium = true;

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const scene = new THREE.Scene();
const allowedWidth = window.innerWidth - 350;
const allowedHeight = window.innerHeight - TERMINAL_HEIGHT;

const camera = new THREE.PerspectiveCamera(
  75,
  allowedWidth / allowedHeight,
  0.1,
  1000,
);
window.camera = camera;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(allowedWidth, allowedHeight);

setTimeout(() => {
  renderer.setAnimationLoop(animate);
}, 100);
document.body.appendChild(renderer.domElement);

camera.position.z = 5;
function traverseMolecule(molecule) {
  traverseAtom(molecule.principalAtom);
}
function traverseAtom(atom) {
  if (atom.isTraversed) return;
  atom.isTraversed = true;
  addAtom(atom);
  for (const bondedAtom of atom.bondedInfo) {
    console.log(bondedAtom);
    traverseAtom(bondedAtom.atom);
  }
}
function addAtom(atom) {
  const geometry = new THREE.SphereGeometry(0.1);
  const material = new THREE.MeshBasicMaterial({ color: atom.color });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.x = atom.position.x / PICO;
  sphere.position.y = atom.position.y / PICO;
  sphere.position.z = atom.position.z / PICO;
  console.log(atom.position.x / PICO);
  scene.add(sphere);
  for (const info of atom.bondedInfo) {
    addBond(info.bond);
  }
  atom.sphere3D = sphere;
}
function addBond(bond) {
  console.log(bond);
  const points = [];
  points.push(
    new THREE.Vector3(
      bond.atom1.position.x / (PICO * scale),
      bond.atom1.position.y / (PICO * scale),
      bond.atom1.position.z / (PICO * scale),
    ),
  );
  points.push(
    new THREE.Vector3(
      bond.atom2.position.x / (PICO * scale),
      bond.atom2.position.y / (PICO * scale),
      bond.atom2.position.z / (PICO * scale),
    ),
  );

  const geometryL = new THREE.BufferGeometry().setFromPoints(points);
  const materialL = new THREE.LineBasicMaterial({
    color: 0x00ff00,
    linewidth: 3,
  });

  //LINE WIDTH DOESN'T WORK ON MY GPU

  const line = new THREE.Line(geometryL, materialL);
  scene.add(line);
  bond.line = line;
  bond.geometry = geometryL;
}

//DO IT AT ONCE
function equilibriumAttained() {
  FindingEquilibrium = false;
  /*const j = Atom.calculateStericEnergy();
  console.log(
    Bond.calculateSumOfBondEnergies() - Atom.getHeatOfAtomizationSum(),
  );
  console.log("Steric Energy:", j);
  console.log("Bond Steric Energy:", Bond.calclateBondOnlyStericEnergy());*/

  console.log("Phy Iterations:", phyIterations);
  CPEX.launchHandlers(CPEX.ON_EQUILIBRIUM_ATTAINED,
    { /*EVENT DETAILS */ }
  );
}
function tickAtoms() {
  const atoms = Atom.getAllAtoms();
  for (const atom of atoms) {
    atom.tick();
  }
}
function runPhysics() {
  phyIterations += 1;
  if (phyIterations >= MAX_PHY_ITERATIONS) {
    equilibriumAttained();
  }
  if (DRAG_COEFF > 1e-10)
    DRAG_COEFF -= ORIGINAL_DRAG_COEFF / MAX_PHY_ITERATIONS;
  Atom.applyRepulsionForces(Atom.getAllAtoms());
  //SINCE ACCELRATION WILL BE NULLED AFTER tickAtoms() we PUT REPULSION FORCES FIRST.
  tickAtoms();

  debugOnce = false;
}
function rotationCheck() {
  if (rotatingLeft) {
    rotateCameraTo(cameraXZAngle);
    cameraXZAngle -= rotationRate;
  }
  if (rotatingRight) {
    rotateCameraTo(cameraXZAngle);
    cameraXZAngle += rotationRate;
  }
}
function animate(time) {
  rotationCheck();
  if (FindingEquilibrium)
    for (let k = 0; k < 150 && FindingEquilibrium; k++) runPhysics();
  renderer.render(scene, camera);
}
function stopRendering() {
  rendering = false;
  renderer.setAnimationLoop(null);
}
function initalizeSidePanel() {
  initializeAtomDetails(Atom.getAllAtoms());

  setInterval(() => initializeAtomDetails(Atom.getAllAtoms()), 2000);
}
function rotateCameraTo(t) {
  const atoms = Atom.getAllAtoms();
  camera.position.z = 5 * Math.cos(t) + atoms[0].position.z;
  camera.position.x = 5 * Math.sin(t) + atoms[0].position.x;
  camera.position.y = atoms[0].position.y;
  camera.lookAt(0, 0, 0);
}
function isEquilibriumAttained() {
  return !FindingEquilibrium;
}
function initalizeEventListeners() {
  document.getElementById("exportBtn").addEventListener("click", () => {
    const jsonD = MoleculeToFile.convertToJson();
    const jsonString = JSON.stringify(jsonD);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "data.json";
    link.click();
    //CLEANING THE FLOOR
    URL.revokeObjectURL(link.href);
  });

  //ATOM CLICK EVENT
  window.addEventListener("click", (event) => {
    mouse.x = (event.clientX / allowedWidth) * 2 - 1;
    mouse.y = -(event.clientY / allowedHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const atoms = Atom.getAllAtoms();
    for (const atom of atoms) {
      const intersects = raycaster.intersectObject(atom.sphere3D);

      if (intersects.length > 0) {
        atom.clicked();
      }
    }
  });

  //ROTATION L/R
  document.addEventListener("keydown", function (event) {
    rotationRate = 0.05;
    rotatingLeft = false;
    if (event.key === "ArrowLeft") {
      rotatingLeft = true;
    } else if (event.key === "ArrowRight") {
      rotatingRight = true;
    }
  });
  document.addEventListener("keyup", function (event) {
    if (event.key === "ArrowLeft") {
      rotatingLeft = false;
    }
    if (event.key === "ArrowRight") {
      rotatingRight = false;
    }
  });

  const scaleSlider = document.getElementById("simulationScaleSlider");
  const sliderScaleLabel = document.getElementById("sliderScale");

  //SCALE  SLIDEr
  function handleScaleUpdate(event) {
    const currentScaleValue = parseFloat(event.target.value);
    sliderScaleLabel.textContent = `Scale: ${currentScaleValue.toFixed(2)}x`;
    scale = 100 / currentScaleValue;
    tickAtoms();
  }
  scaleSlider.addEventListener("input", handleScaleUpdate);
}

export {
  scene,
  camera,
  renderer,
  addAtom,
  animate,
  traverseAtom,
  traverseMolecule,
  stopRendering,
  initalizeSidePanel,
  initalizeEventListeners,
  FindingEquilibrium,
  isEquilibriumAttained,
};
