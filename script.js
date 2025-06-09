const API_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNGQyYmU3YmU4ZDc3NDAxNjBkM2Y5YjJhNTg2MGUzYiIsIm5iZiI6MTc0ODgwMjE4MC42OTgsInN1YiI6IjY4M2M5YTg0OWQzYzgzMjU1NTI4OGMzZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.I3vkGUePNaq8IvW_vEB795js7lzNYSAt5gYiFkCGaEA';

let currentPage = 1;
let totalPages = 1;
let currentGenreId = null;
let currentGenreName = '';

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

// Redireciona para a página de gênero
function goToGenre(id, nome) {
  window.location.href = `genre.html?genre=${id}&nome=${nome}`;
}

// Carregar filmes populares na index
async function loadPopular() {
  const url = 'https://api.themoviedb.org/3/movie/popular?language=pt-BR';
  const data = await fetchAPI(url);
  renderMovies(data.results, 'popularContainer');
}

// Carregar lançamentos na index
async function loadLatest() {
  const url = 'https://api.themoviedb.org/3/movie/now_playing?language=pt-BR';
  const data = await fetchAPI(url);
  renderMovies(data.results, 'latestContainer');
}

// Carregar filmes por gênero (na genre.html)
async function loadGenrePage(page = 1) {
  const params = new URLSearchParams(window.location.search);
  const genreId = params.get('genre');
  const genreName = params.get('nome');

  currentGenreId = genreId;
  currentGenreName = genreName;
  currentPage = page;

  document.getElementById('genreTitle').innerText = `🎬 ${genreName}`;

  const url = `https://api.themoviedb.org/3/discover/movie?with_genres=${genreId}&language=pt-BR&sort_by=popularity.desc&page=${page}`;
  const data = await fetchAPI(url);

  renderMovies(data.results, 'genreContainer');

  totalPages = data.total_pages;

  document.getElementById('currentPage').innerText = `Página ${currentPage}`;
}

// Função para buscar dados da API
async function fetchAPI(url) {
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${API_TOKEN}`
    }
  };
  const res = await fetch(url, options);
  return await res.json();
}

// Renderizar filmes em qualquer container
function renderMovies(movies, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  movies.forEach(movie => {
    const poster = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : 'https://via.placeholder.com/300x450?text=Sem+Imagem';

    const card = document.createElement('div');
    card.classList.add('movie-card');
    card.innerHTML = `
      <img src="${poster}" alt="${movie.title}">
      <p>${movie.title}</p>
    `;
    card.onclick = () => openModal(movie.id);  // <-- Clique abre o modal
    container.appendChild(card);
  });
}

// 🚀 Inicializa dependendo da página
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
  loadPopular();
  loadLatest();
}

if (window.location.pathname.includes('genre.html')) {
  loadGenrePage();
}

if (window.location.pathname.includes('search.html')) {
  loadSearchPage();
}

// Chame loadGenres apenas quando estiver na página genrelist.html
if (window.location.pathname.includes('genrelist.html')) {
  loadGenres(); // <-- Chame a nova função aqui
}

// 🔍 Função de busca por nome
async function searchMovies(page = 1) {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  currentSearchQuery = query;
  currentSearchPage = page;

  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=pt-BR&page=${page}`;
  const data = await fetchAPI(url);

  // Cria container de resultados se não existir
  let container = document.getElementById('searchTitle').innerText = `🎬 Resultados para "${query}"`;
  if (!container) {
    const section = document.createElement('div');
    section.innerHTML = `
      <h1 id="searchTitle">🎬 Resultados para "${query}"</h1>
      <div class="card-container" id="searchResults"></div>

      <div class="pagination">
        <button onclick="previousSearchPage()">⬅️ Anterior</button>
        <span id="searchPageIndicator">Página ${currentSearchPage}</span>
        <button onclick="nextSearchPage()">Próxima ➡️</button>
      </div>
    `;
    document.querySelector('.container').appendChild(section);
    container = document.getElementById('searchTitle').innerText = `🎬 Resultados para "${query}"`;
  }

  container.innerHTML = '';
  renderMovies(data.results, 'searchResults');

  searchTotalPages = data.total_pages;
  document.getElementById('searchPageIndicator').innerText = `Página ${currentSearchPage}`;
}

// 📖 Abre o modal com mais informações do filme
async function openModal(movieId) {
  try {
    const movieUrl = `https://api.themoviedb.org/3/movie/${movieId}?language=pt-BR`;
    const videoUrl = `https://api.themoviedb.org/3/movie/${movieId}/videos?language=pt-BR`;

    const [movieData, videoData] = await Promise.all([
      fetchAPI(movieUrl),
      fetchAPI(videoUrl)
    ]);

    const title = movieData.title;
    const overview = movieData.overview || 'Sem sinopse disponível.';
    const year = movieData.release_date ? movieData.release_date.slice(0, 4) : 'Ano desconhecido';
    const duration = movieData.runtime ? `${movieData.runtime} min` : 'Duração desconhecida';
    const genres = movieData.genres.map(g => g.name).join(', ');
    const rating = movieData.vote_average ? `${movieData.vote_average.toFixed(1)}/10` : 'Sem nota';

    const trailer = videoData.results.find(
      vid => vid.type === 'Trailer' && vid.site === 'YouTube'
    );
    const trailerEmbed = trailer
      ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>`
      : `<p>🎬 Trailer não disponível.</p>`;

    document.getElementById('modalTitle').innerText = `${title} (${year})`;
    document.getElementById('modalInfo').innerText = `${duration} | ${genres} | ⭐ ${rating}`;
    document.getElementById('modalOverview').innerText = overview;
    document.getElementById('modalTrailer').innerHTML = trailerEmbed;

    document.getElementById('movieModal').style.display = 'block';
  } catch (error) {
    console.error('Erro ao carregar dados do filme:', error);
  }
}

function closeModal() {
  document.getElementById('movieModal').style.display = 'none';
}

function nextPage() {
  if (currentPage < totalPages) {
    loadGenrePage(currentPage + 1);
  }
}

function previousPage() {
  if (currentPage > 1) {
    loadGenrePage(currentPage - 1);
  }
}

//Página de busca
// 🚀 Carregar a página de busca
async function loadSearchPage(page = 1) {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('query');

  if (!query) {
    document.getElementById('searchResult').innerHTML = '<p>Nenhum termo de busca informado.</p>';
    return;
  }

  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=pt-BR&page=1`;
  const data = await fetchAPI(url);

  if (data.results.length === 0) {
    document.getElementById('searchResult').innerHTML = `<p>Nenhum resultado encontrado para "${query}".</p>`;
  } else {
    renderMainResult(data.results[0]); // Mostra o primeiro resultado como destaque
    // Mostra o restante na lista
    const resultsContainer = document.getElementById('searchResults');
  }
 
  // Carregar também os filmes populares
  loadPopular();
}

// 🎨 Renderizar o card principal grande
function renderMainResult(movie) {
  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/300x450?text=Sem+Imagem';

  const year = movie.release_date ? movie.release_date.slice(0, 4) : 'Ano desconhecido';
  const overview = movie.overview || 'Sem sinopse disponível.';
  const rating = movie.vote_average ? `${movie.vote_average.toFixed(1)}/10` : 'Sem nota';

  const card = `
    <div class="main-result-card">
      <img src="${poster}" alt="${movie.title}">
      <div class="info">
        <h2>${movie.title} (${year})</h2>
        <p><strong>⭐ Nota:</strong> ${rating}</p>
        <p><strong>Sinopse:</strong> ${overview}</p>
        <button onclick="openModal(${movie.id})">Ver Detalhes</button>
      </div>
    </div>
  `;

  document.getElementById('searchResult').innerHTML = card;
}


//profile
const profileIcon = document.querySelector('.profile-icon');
profileIcon.addEventListener('click', () => {
  window.location.href = 'profile.html';
});

const users = JSON.parse(localStorage.getItem('users')) || {};
const loggedUser = localStorage.getItem('loggedUser');

const userData = users[loggedUser];

// Mostrar nome
document.getElementById('username').textContent = loggedUser;

// Mostrar listas
const listsContainer = document.getElementById('lists-container');
listsContainer.innerHTML = '';

userData.lists.forEach(list => {
  const li = document.createElement('li');
  li.textContent = list;
  listsContainer.appendChild(li);
});

// Carregar configurações
const soundSelect = document.getElementById('sound-select');
const animationSelect = document.getElementById('animation-select');

soundSelect.value = userData.rouletteSound;
animationSelect.value = userData.rouletteAnimation;

// Salvar configurações
document.querySelector('.save-button').addEventListener('click', () => {
  userData.rouletteSound = soundSelect.value;
  userData.rouletteAnimation = animationSelect.value;

  users[loggedUser] = userData;
  localStorage.setItem('users', JSON.stringify(users));

  alert('Configurações salvas!');
});

// Logout
function logout() {
  localStorage.removeItem('loggedUser');
  window.location.href = 'login.html';
}

// selecionar elementos
const avatarSelect = document.getElementById('avatar-select');
const profilePhoto = document.querySelector('.profile-photo');
const username = document.getElementById('username');

// preencher informações
avatarSelect.value = userData.avatar || '👤';
profilePhoto.textContent = userData.avatar || '👤';
username.textContent = userData.username || 'Usuário';

// trocar avatar
avatarSelect.addEventListener('change', () => {
  userData.avatar = avatarSelect.value;
  profilePhoto.textContent = userData.avatar;
  saveUserData();
});

// salvar dados
function saveUserData() {
  users[loggedUser] = userData;
  localStorage.setItem('users', JSON.stringify(users));
}

// Nova função para carregar a lista de gêneros
async function loadGenres() {
  const url = 'https://api.themoviedb.org/3/genre/movie/list?language=pt-BR';
  const data = await fetchAPI(url);
  const genres = data.genres;

  const container = document.getElementById('genresContainer');
  if (container) { // Verifica se o container existe
    container.innerHTML = ''; // Limpa o container antes de adicionar novos gêneros

    genres.forEach(genre => {
      const genreCard = document.createElement('div');
      genreCard.classList.add('genre-card'); // Adicione uma classe CSS para estilização
      genreCard.innerText = genre.name;
      // Ao clicar no gênero, redireciona para genre.html com os parâmetros
      genreCard.onclick = () => goToGenre(genre.id, genre.name); 
      container.appendChild(genreCard);
    });
  }
}