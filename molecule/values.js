const PICO = 1e-12;
let DRAG_COEFF = 0.2;
let ORIGINAL_DRAG_COEFF = DRAG_COEFF;
let MAX_PHY_ITERATIONS = 20000;

const dt = 0.04;
const ELECTROSTATIC_COEFF = 8.99e9;
const E = 1.6e-19;

let scale = 150;
let REPULSION_COEFF = 0;
let debugOnce = false;
let STERIC_COEFF = 1e14;
let ATTRACTION_COEFF = 10;
let TERMINAL_HEIGHT = 300;
