const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// 'public' is the name of the folder you want to host
// Change 'public' to '.' if you want to host the current directory
const folderToHost = path.join(__dirname, ".");

app.use(express.static(folderToHost));

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
