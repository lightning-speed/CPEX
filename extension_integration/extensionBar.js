

class ExtensionBar {
  static init() {
    this.extensionBar = document.getElementById("extensionBar")
    document.body.appendChild(this.extensionBar);
    this.extensionBar.appendChild(document.createElement('br'))
    this.extensionBar.appendChild(document.createElement('br'))

    this.extensionsData = [];
  }
  static async addExtensionBoxToView(extensionData) {
    const extensionBox = document.createElement('div');
    //REUSING SOME CSS CLASSES HERE
    extensionBox.innerHTML = `
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
    const Ext = await import(extensionData.filePath)
    extensionData.func = Ext.default.runExtension
    const v = this.extensionsData.length
    extensionBox.querySelector('.use-btn').onclick = () => this.runExtension(v);

    this.extensionsData.push(extensionData)
    this.extensionBar.appendChild(extensionBox);




  }
  static runExtension(index) {
    console.log(index)
    const extensionData = this.extensionsData[index];
    extensionData.func();
  }
}

export default ExtensionBar;
