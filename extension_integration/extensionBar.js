

class ExtensionBar {
  static init() {
    this.extensionBar = document.getElementById("extensionBar")
    document.body.appendChild(this.extensionBar);
    this.extensionsData = [];
  }
  static addExtensionBoxToView(extensionData) {
    this.extensionsData.push(extensionData);
    const extensionBox = document.createElement('div');
    //REUSING SOME CSS CLASSES HERE
    extensionBox.innerHTML = `<br>
      <div class="atom-card"  style="border:1px solid ">
        <div class="extension-header" >
          <div class="atom-meta">
            <span class="atom-id">${extensionData.name}</span>
            <span class="atom-an">${extensionData.description}</span>
          </div>

          <hr style="margin-top:7px;margin-bottom:7px">
          <button class="use-btn">Use</button>
      </div>
    </div>`
    this.extensionBar.appendChild(extensionBox);
    this.extensionBar.querySelector('.use-btn').onclick = () => this.runExtension(this.extensionsData.length - 1);

  }
  static runExtension(index) {
    const extensionData = this.extensionsData[index];
    extensionData.func();
  }
}

export default ExtensionBar;
