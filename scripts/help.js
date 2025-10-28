// Show Help Modal
const helpButton = document.querySelector(".help-button");
const helpOverlay = document.getElementById("helpOverlay");
const closeHelp = document.getElementById("closeHelp");
const closeHelpFooter = document.getElementById("closeHelpFooter");

helpButton.addEventListener("click", () => {
  helpOverlay.style.display = "flex"; // show modal
});

closeHelp.addEventListener("click", () => {
  helpOverlay.style.display = "none"; // hide modal
});

closeHelpFooter.addEventListener("click", () => {
  helpOverlay.style.display = "none"; // hide modal
});
