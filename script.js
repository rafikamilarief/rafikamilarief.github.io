document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    const toggle = document.getElementById("nav-toggle");
    if (toggle) toggle.checked = false;
  });
});
