function toggleMenu() {
  document.getElementById("menu").classList.toggle("active");
  document.getElementById("hamburger").classList.toggle("active");
}


const articles = document.querySelectorAll("article");

articles.forEach((article) => {
  article.addEventListener("click", () => {
    article.classList.toggle("open");

    const antwoord = article.querySelector("p");

    antwoord.classList.toggle("visible");
  });
});
