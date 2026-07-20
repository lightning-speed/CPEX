class Terminal {
  static init() {
    this.terminalElement = document.getElementById('terminal')
  }
  static print(...args) {
    this.terminalElement.innerHTML += `<span class="terminal-text">${args.join(' ')}</span>`
  }
  static println(...args) {
    this.terminalElement.innerHTML += `<span class="terminal-text">${args.join(' ')}</span>` + '<br>'
  }
  static printColor(color,...args) {
    this.terminalElement.innerHTML += `<span class="terminal-text" style="color: ${color}">${args.join(' ')}</span>`

  }
}

export default Terminal;
