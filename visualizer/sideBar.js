const sideBar = document.getElementById("sideBar");
const atomDetailCardElements = [];

// Periodic table helper to map atomic numbers to symbols
const ATOMIC_SYMBOLS = {
  0: "LP",
  1: "H",
  6: "C",
  7: "N",
  8: "O",
  9: "F",
  15: "P",
  16: "S",
  17: "Cl",
};

/**
 * Initializes and builds the interactive atom UI cards inside the sidebar.
 * Call this function whenever you load a new molecule configuration.
 * * @param {Array} atomsList - Array of atom objects returned by your simulation
 */
function initializeAtomDetails(atomsList) {
  // 1. Reset both the DOM sidebar container and your tracking array safely
  sideBar.innerHTML = "";

  atomsList.forEach((atom, index) => {
    const atomInfo = atom.getAtomInfo();
    const symbol = ATOMIC_SYMBOLS[atom.atomicNumber] || "X";

    // 2. Build the main atom card element wrapper
    let cardContainer;
    if (atomDetailCardElements.length < atomsList.length) {
      cardContainer = document.createElement("div");
      cardContainer.className = "atom-card";
      atom.cardContainerElement = cardContainer;
    } else {
      cardContainer = atomDetailCardElements[index].domElement;
    }

    // 3. Insert layout structure with the squircle badge template
    if (atomDetailCardElements.length < atomsList.length)
      cardContainer.innerHTML = `
      <div class="atom-header">
        <div class="squircle-badge" style="background-color: ${atom.color ?? "#ccc"}">${symbol}</div>
        <div class="atom-meta">
          <span class="atom-id">Atom ${index + 1} (${symbol})</span>
          <span class="atom-an">Atomic Number: ${atom.atomicNumber}</span>
        </div>
      </div>
      <div class="atom-body is-collapsed">
        <div class="bonds-section">
          <h4>Connected Bonds</h4>
          <ul class="bonds-list"></ul>
        </div>

        <div class="custom-properties-zone">
          <p><strong>Mass:</strong> ${"Faahhh"}</p>
          <p><strong>Is Lone Pair:</strong> ${atom.isLP ?? "false"}</p>
          </div>
      </div>
    `;

    // 4. Reference and populate all associated simulation bond vectors
    const bondsListUI = cardContainer.querySelector(".bonds-list");
    const bonds = atomInfo.connectingBonds;
    if (bonds && bonds.length > 0) {
      bonds.forEach((bond, bondIdx) => {
        let bondLengthText =
          ((bond.getActualBondLength() / PICO).toFixed(2) ?? "N/A") + "pm";

        let li;
        if (atomDetailCardElements.length < atomsList.length)
          li = document.createElement("li");
        else
          li = atomDetailCardElements[index].domElement.querySelector(
            `.bond-item:nth-child(${bondIdx + 1})`,
          );
        li.className = "bond-item";
        li.innerHTML = `
          <div><strong>Bond ${bondIdx + 1}</strong> (${ATOMIC_SYMBOLS[bond.atom1.atomicNumber]} - ${ATOMIC_SYMBOLS[bond.atom2.atomicNumber]} Bond)</div>
          <div>Length: <span class="bond-len">${bondLengthText}</span></div>

          `;
        if (atomDetailCardElements.length < atomsList.length)
          bondsListUI.appendChild(li);
      });
    } else {
      bondsListUI.innerHTML =
        '<li class="no-bonds">No active connected bonds</li>';
    }

    // 5. Wire up the native toggle click behavior
    const headerElement = cardContainer.querySelector(".atom-header");
    const bodyElement = cardContainer.querySelector(".atom-body");

    headerElement.onclick = () => {
      headerElement.scrollIntoView({
        behavior: "smooth", // Animates the scroll smoothly instead of jumping instantly
        block: "start", // Aligns the top of the element with the top of the visible area
        inline: "nearest", // Affects horizontal scrolling alignment
      });
      bodyElement.classList.toggle("is-collapsed");
    };

    // 6. Append tracking reference to array and append node directly to your sideBar
    if (atomDetailCardElements.length < atomsList.length)
      atomDetailCardElements.push({
        atomIndex: index,
        atomRef: atom,
        domElement: cardContainer,
        bodyElement: bodyElement,
      });

    sideBar.appendChild(cardContainer);
  });
}

export { initializeAtomDetails };
