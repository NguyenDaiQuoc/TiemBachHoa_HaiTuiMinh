document.addEventListener("DOMContentLoaded", function () {
  const toggles = document.querySelectorAll(".dropdown-toggle");

  toggles.forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      const menu = toggle.nextElementSibling;
      const isOpen = menu.style.display === "block";
      menu.style.display = isOpen ? "none" : "block";
    });
  });
});
