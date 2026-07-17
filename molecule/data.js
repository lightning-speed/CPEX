const elementInformation = [
  {
    //LONE PAIR
    atomicNumber: 0,
    element: "Lone Pair",
    symbol: "LP",
    bondLength_pm: 100,
    atomicMass_amu: 1.008,
    electroNegativity_pauling: 4.0,
    color: "#6B5BCD", // violet — abstract, non-element
  },
  {
    atomicNumber: 1,
    element: "Hydrogen",
    symbol: "H",
    bondLength_pm: 74,
    atomicMass_amu: 1.008,
    electroNegativity_pauling: 2.2,
    color: "#E8F4FD", // near-white blue — lightest element, colorless gas
  },
  {
    atomicNumber: 2,
    element: "Helium",
    symbol: "He",
    bondLength_pm: null,
    atomicMass_amu: 4.003,
    electroNegativity_pauling: null,
    note: "Noble gas; does not form covalent bonds",
    color: "#FFF5B0", // pale yellow — helium balloon glow
  },
  {
    atomicNumber: 3,
    element: "Lithium",
    symbol: "Li",
    bondLength_pm: 267,
    atomicMass_amu: 6.941,
    electroNegativity_pauling: 0.98,
    color: "#E83B3B", // crimson — lithium flame test color
  },
  {
    atomicNumber: 4,
    element: "Beryllium",
    symbol: "Be",
    bondLength_pm: 222,
    atomicMass_amu: 9.012,
    electroNegativity_pauling: 1.57,
    color: "#B5D8A0", // muted sage — alkaline earth metal, silvery
  },
  {
    atomicNumber: 5,
    element: "Boron",
    symbol: "B",
    bondLength_pm: 170,
    atomicMass_amu: 10.811,
    electroNegativity_pauling: 2.04,
    color: "#8B6914", // amber-brown — boron's earthy mineral tone
  },
  {
    atomicNumber: 6,
    element: "Carbon",
    symbol: "C",
    bondLength_pm: 154,
    atomicMass_amu: 12.011,
    electroNegativity_pauling: 2.55,
    color: "#2D2D2D", // near-black — graphite / charcoal
  },
  {
    atomicNumber: 7,
    element: "Nitrogen",
    symbol: "N",
    bondLength_pm: 145,
    atomicMass_amu: 14.007,
    electroNegativity_pauling: 3.04,
    color: "#5BA3D9", // sky blue — nitrogen makes up most of our atmosphere
  },
  {
    atomicNumber: 8,
    element: "Oxygen",
    symbol: "O",
    bondLength_pm: 148,
    atomicMass_amu: 15.999,
    electroNegativity_pauling: 3.44,
    color: "#E85D5D", // vivid red — oxygen's liquid form and combustion
  },
  {
    atomicNumber: 9,
    element: "Fluorine",
    symbol: "F",
    bondLength_pm: 142,
    atomicMass_amu: 18.998,
    electroNegativity_pauling: 3.98,
    color: "#A3E8A0", // pale green — fluorine gas is pale yellowish-green
  },
  {
    atomicNumber: 10,
    element: "Neon",
    symbol: "Ne",
    bondLength_pm: null,
    atomicMass_amu: 20.18,
    electroNegativity_pauling: null,
    note: "Noble gas; does not form covalent bonds",
    color: "#FF4D6A", // hot neon pink — classic neon sign color
  },
  {
    atomicNumber: 11,
    element: "Sodium",
    symbol: "Na",
    bondLength_pm: 308,
    atomicMass_amu: 22.99,
    electroNegativity_pauling: 0.93,
    color: "#FFD93D", // bright yellow — sodium flame test / streetlamp yellow
  },
  {
    atomicNumber: 12,
    element: "Magnesium",
    symbol: "Mg",
    bondLength_pm: 320,
    atomicMass_amu: 24.305,
    electroNegativity_pauling: 1.31,
    color: "#F5F5F0", // bright white — magnesium burns brilliant white
  },
  {
    atomicNumber: 13,
    element: "Aluminium",
    symbol: "Al",
    bondLength_pm: 260,
    atomicMass_amu: 26.982,
    electroNegativity_pauling: 1.61,
    color: "#B0BEC5", // metallic silver-gray — aluminium foil
  },
  {
    atomicNumber: 14,
    element: "Silicon",
    symbol: "Si",
    bondLength_pm: 235,
    atomicMass_amu: 28.086,
    electroNegativity_pauling: 1.9,
    color: "#607D8B", // blue-gray — semiconductor silicon wafer
  },
  {
    atomicNumber: 15,
    element: "Phosphorus",
    symbol: "P",
    bondLength_pm: 221,
    atomicMass_amu: 30.974,
    electroNegativity_pauling: 2.19,
    color: "#FF8C00", // deep orange — white phosphorus glows orange
  },
  {
    atomicNumber: 16,
    element: "Sulfur",
    symbol: "S",
    bondLength_pm: 205,
    atomicMass_amu: 32.065,
    electroNegativity_pauling: 2.58,
    color: "#F4D03F", // sulfur yellow — classic brimstone color
  },
  {
    atomicNumber: 17,
    element: "Chlorine",
    symbol: "Cl",
    bondLength_pm: 199,
    atomicMass_amu: 35.453,
    electroNegativity_pauling: 3.16,
    color: "#9ACD32", // yellow-green — chlorine gas is yellow-green
  },
  {
    atomicNumber: 18,
    element: "Argon",
    symbol: "Ar",
    bondLength_pm: null,
    atomicMass_amu: 39.948,
    electroNegativity_pauling: null,
    note: "Noble gas; does not form covalent bonds",
    color: "#8A6FD8", // lavender-purple — argon plasma glow
  },
  {
    atomicNumber: 19,
    element: "Potassium",
    symbol: "K",
    bondLength_pm: 392,
    atomicMass_amu: 39.098,
    electroNegativity_pauling: 0.82,
    color: "#C660C6", // violet-magenta — potassium flame test is lilac/violet
  },
  {
    atomicNumber: 20,
    element: "Calcium",
    symbol: "Ca",
    bondLength_pm: 358,
    atomicMass_amu: 40.078,
    electroNegativity_pauling: 1.0,
    color: "#FF6B35", // brick orange — calcium flame test is orange-red
  },
  {
    atomicNumber: 21,
    element: "Scandium",
    symbol: "Sc",
    bondLength_pm: 326,
    atomicMass_amu: 44.956,
    electroNegativity_pauling: 1.36,
    color: "#D4C5A9", // warm sand — rare earth, silvery metal
  },
  {
    atomicNumber: 22,
    element: "Titanium",
    symbol: "Ti",
    bondLength_pm: 286,
    atomicMass_amu: 47.867,
    electroNegativity_pauling: 1.54,
    color: "#546E7A", // dark steel — titanium is strong, dark-silvery
  },
  {
    atomicNumber: 23,
    element: "Vanadium",
    symbol: "V",
    bondLength_pm: 262,
    atomicMass_amu: 50.942,
    electroNegativity_pauling: 1.63,
    color: "#7B68B5", // slate blue-purple — vanadium compounds show vivid purples
  },
  {
    atomicNumber: 24,
    element: "Chromium",
    symbol: "Cr",
    bondLength_pm: 254,
    atomicMass_amu: 51.996,
    electroNegativity_pauling: 1.66,
    color: "#4CAF82", // chrome green — Cr(III) solutions are green
  },
  {
    atomicNumber: 25,
    element: "Manganese",
    symbol: "Mn",
    bondLength_pm: 258,
    atomicMass_amu: 54.938,
    electroNegativity_pauling: 1.55,
    color: "#C2185B", // deep rose — permanganate KMnO₄ is vivid magenta
  },
  {
    atomicNumber: 26,
    element: "Iron",
    symbol: "Fe",
    bondLength_pm: 252,
    atomicMass_amu: 55.845,
    electroNegativity_pauling: 1.83,
    color: "#8B4513", // rust brown — iron oxide / rust
  },
  {
    atomicNumber: 27,
    element: "Cobalt",
    symbol: "Co",
    bondLength_pm: 252,
    atomicMass_amu: 58.933,
    electroNegativity_pauling: 1.88,
    color: "#1565C0", // cobalt blue — cobalt glass and pigments
  },
  {
    atomicNumber: 28,
    element: "Nickel",
    symbol: "Ni",
    bondLength_pm: 249,
    atomicMass_amu: 58.693,
    electroNegativity_pauling: 1.91,
    color: "#78909C", // cool silver-blue — nickel's silvery metallic sheen
  },
  {
    atomicNumber: 29,
    element: "Copper",
    symbol: "Cu",
    bondLength_pm: 256,
    atomicMass_amu: 63.546,
    electroNegativity_pauling: 1.9,
    color: "#B87333", // copper — unmistakable warm metallic brown
  },
  {
    atomicNumber: 30,
    element: "Zinc",
    symbol: "Zn",
    bondLength_pm: 266,
    atomicMass_amu: 65.38,
    electroNegativity_pauling: 1.65,
    color: "#A5B8C8", // cool pale blue-gray — zinc's bluish-white metallic tone
  },
];

const BondEnergies = [
  // H(1) pairs
  [2, 1, 432], // He-H (no stable bond, N/A — excluded)
  // Note: Noble gases (He=2, Ne=10, Ar=18) don't form bonds, so excluded below

  // Period 1 & 2 pairs
  [6, 1, 413], // C-H
  [7, 1, 391], // N-H
  [8, 1, 459], // O-H
  [9, 1, 565], // F-H
  [11, 1, 196], // Na-H
  [12, 1, 288], // Mg-H
  [13, 1, 287], // Al-H
  [14, 1, 318], // Si-H
  [15, 1, 322], // P-H
  [16, 1, 363], // S-H
  [17, 1, 432], // Cl-H
  [19, 1, 363], // K-H
  [20, 1, 223], // Ca-H

  // C(6) pairs
  [6, 6, 347], // C-C (single)
  [7, 6, 305], // N-C
  [8, 6, 360], // O-C
  [9, 6, 453], // F-C
  [11, 6, 193], // Na-C
  [12, 6, 191], // Mg-C
  [13, 6, 274], // Al-C
  [14, 6, 301], // Si-C
  [15, 6, 264], // P-C
  [16, 6, 272], // S-C
  [17, 6, 339], // Cl-C
  [19, 6, 186], // K-C
  [20, 6, 176], // Ca-C

  // N(7) pairs
  [7, 7, 163], // N-N (single)
  [8, 7, 201], // O-N
  [9, 7, 272], // F-N
  [13, 7, 247], // Al-N
  [14, 7, 355], // Si-N
  [15, 7, 209], // P-N
  [16, 7, 464], // S-N
  [17, 7, 200], // Cl-N

  // O(8) pairs
  [8, 8, 146], // O-O (single)
  [9, 8, 190], // F-O
  [11, 8, 256], // Na-O
  [12, 8, 358], // Mg-O
  [13, 8, 502], // Al-O
  [14, 8, 452], // Si-O
  [15, 8, 335], // P-O
  [16, 8, 522], // S-O
  [17, 8, 203], // Cl-O
  [19, 8, 323], // K-O
  [20, 8, 402], // Ca-O

  // F(9) pairs
  [9, 9, 159], // F-F
  [11, 9, 477], // Na-F
  [12, 9, 477], // Mg-F
  [13, 9, 583], // Al-F
  [14, 9, 565], // Si-F
  [15, 9, 490], // P-F
  [16, 9, 285], // S-F
  [17, 9, 251], // Cl-F
  [19, 9, 498], // K-F
  [20, 9, 529], // Ca-F

  // Na(11) pairs
  [12, 11, 68], // Mg-Na
  [13, 11, 62], // Al-Na
  [17, 11, 410], // Cl-Na
  [19, 11, 63], // K-Na

  // Mg(12) pairs
  [13, 12, 71], // Al-Mg
  [17, 12, 312], // Cl-Mg
  [20, 12, 69], // Ca-Mg

  // Al(13) pairs
  [13, 13, 167], // Al-Al
  [14, 13, 225], // Si-Al
  [17, 13, 421], // Cl-Al
  [20, 13, 130], // Ca-Al

  // Si(14) pairs
  [14, 14, 226], // Si-Si
  [15, 14, 363], // P-Si
  [16, 14, 293], // S-Si
  [17, 14, 381], // Cl-Si
  [20, 14, 279], // Ca-Si

  // P(15) pairs
  [15, 15, 201], // P-P
  [16, 15, 335], // S-P
  [17, 15, 326], // Cl-P

  // S(16) pairs
  [16, 16, 266], // S-S
  [17, 16, 255], // Cl-S

  // Cl(17) pairs
  [17, 17, 243], // Cl-Cl
  [19, 17, 423], // K-Cl
  [20, 17, 429], // Ca-Cl

  // K(19) pairs
  [19, 19, 54], // K-K
  [20, 19, 57], // Ca-K

  // Ca(20) pairs
  [20, 20, 105], // Ca-Ca
];

const AtomizationEnergy = [
  [1, 218], // H
  [2, 0], // He (noble gas, already atomic)
  [3, 159], // Li
  [4, 324], // Be
  [5, 507], // B
  [6, 717], // C
  [7, 473], // N
  [8, 249], // O
  [9, 79], // F
  [10, 0], // Ne (noble gas, already atomic)
  [11, 107], // Na
  [12, 146], // Mg
  [13, 326], // Al
  [14, 456], // Si
  [15, 315], // P
  [16, 277], // S
  [17, 121], // Cl
  [18, 0], // Ar (noble gas, already atomic)
  [19, 89], // K
  [20, 178], // Ca
];
function getBondEnergyFor(atomicNumber1, atomicNumber2) {
  for (let i = 0; i < BondEnergies.length; i++) {
    const BE = BondEnergies[i];
    if (BE[0] == atomicNumber1 && BE[1] == atomicNumber2) return BE[2];
  }
  return 0;
}

function getAtomizationEnergyFor(atomicNumber) {
  for (let i = 0; i < AtomizationEnergy.length; i++) {
    const AE = AtomizationEnergy[i];
    if (AE[0] == atomicNumber) return AE[1];
  }
  return 0;
}

function getElementInformationFor(atomicNumber) {
  return elementInformation[atomicNumber];
}

export { getElementInformationFor, getBondEnergyFor, getAtomizationEnergyFor };
