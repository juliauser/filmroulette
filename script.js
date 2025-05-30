function girarRoleta() {
  const filmes = ['Shrek', 'Os Incríveis', 'Coraline', 'Megamente'];
  const escolhido = filmes[Math.floor(Math.random() * filmes.length)];
  document.querySelector('.resultado-box').innerText = escolhido;
}

function scrollLeft(button) {
  const row = button.nextElementSibling;
  row.scrollLeft -= 300;
}

function scrollRight(button) {
  const row = button.previousElementSibling;
  row.scrollLeft += 300;
}
