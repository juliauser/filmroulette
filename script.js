const API_TOKEN = 'x';

let currentPage = 1;
let totalPages = 1;
let currentGenreId = null;
let currentGenreName = '';
let currentSearchQuery = '';
let currentSearchPage = 1;
let searchTotalPages = 1;

// --- Funções de Roleta (Mantido como estava) ---
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

// --- Funções de API e Renderização Comuns ---
async function fetchAPI(url) {
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${API_TOKEN}`
    }
  };
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar dados da API:", error);
    return null;
  }
}

function renderMovies(movies, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container com ID '${containerId}' não encontrado.`);
    return;
  }
  container.innerHTML = ''; // Limpa o container antes de adicionar filmes

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
    card.onclick = () => openModal(movie.id);
    container.appendChild(card);
  });
}

// --- Funções do Modal de Detalhes do Filme ---
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
    // CORREÇÃO: Sintaxe correta para URL do YouTube
    const trailerEmbed = trailer
      ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>`
      : `<p>🎬 Trailer não disponível.</p>`;

    document.getElementById('modalTitle').innerText = `${title} (${year})`;
    document.getElementById('modalInfo').innerText = `${duration} | ${genres} | ⭐ ${rating}`;
    document.getElementById('modalOverview').innerText = overview;
    // Certifique-se de que o elemento 'modalTrailer' existe no seu modal HTML
    const modalTrailerElement = document.getElementById('modalTrailer');
    if (modalTrailerElement) {
        modalTrailerElement.innerHTML = trailerEmbed;
    } else {
        console.warn("Elemento 'modalTrailer' não encontrado no modal.");
    }
    

    document.getElementById('movieModal').style.display = 'block';
  } catch (error) {
    console.error('Erro ao carregar dados do filme no modal:', error);
  }
}

function closeModal() {
  document.getElementById('movieModal').style.display = 'none';
  // Opcional: Pausar o vídeo do trailer ao fechar o modal
  const modalTrailerElement = document.getElementById('modalTrailer');
  if (modalTrailerElement) {
    modalTrailerElement.innerHTML = ''; // Limpa o iframe para parar o vídeo
  }
}


// --- Funções de Navegação e Paginação ---
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

function scrollToTop() {
    window.scrollTo({
        top: 0,         // Rola para o topo (posição 0 na vertical)
        behavior: 'smooth' // Faz a rolagem de forma suave e animada
    });
}


// Redireciona para a página de gênero específico
function goToGenre(id, nome) {
  window.location.href = `genre.html?genre=${id}&nome=${nome}`;
}


// --- Funções da Página Inicial (index.html) ---
async function loadPopular() {
  const url = 'https://api.themoviedb.org/3/movie/popular?language=pt-BR';
  const data = await fetchAPI(url);
  renderMovies(data.results, 'popularContainer');
}

async function loadLatest() {
  const url = 'https://api.themoviedb.org/3/movie/now_playing?language=pt-BR';
  const data = await fetchAPI(url);
  renderMovies(data.results, 'latestContainer');
}


// --- Funções da Página de Gênero Específico (genre.html) ---
async function loadGenrePage(page = 1) {
  const params = new URLSearchParams(window.location.search);
  const genreId = params.get('genre');
  const genreName = params.get('nome');

  if (!genreId || !genreName) {
    console.error("ID ou nome do gênero não encontrados na URL para genre.html");
    document.getElementById('genreTitle').innerText = 'Gênero não encontrado';
    document.getElementById('genreContainer').innerHTML = '<p>Por favor, selecione um gênero válido.</p>';
    return;
  }

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


// --- Funções da Página de Listagem de Gêneros (genrelist.html) ---
async function fetchMoviesByGenre(genreId, limit = 15) {
    const url = `https://api.themoviedb.org/3/discover/movie?with_genres=${genreId}&language=pt-BR&sort_by=popularity.desc&page=1`;
    const data = await fetchAPI(url);
    return data.results ? data.results.slice(0, limit) : [];
}

async function loadGenres() {
    console.log("Carregando gêneros...");
    const url = 'https://api.themoviedb.org/3/genre/movie/list?language=pt-BR';
    const data = await fetchAPI(url);
    const genres = data.genres;

    const container = document.getElementById('genresContainer');
    if (!container) {
        console.error("Elemento 'genresContainer' não encontrado na genrelist.html.");
        return;
    }

    container.innerHTML = ''; // Limpa antes de adicionar

    for (const genre of genres) {
        const section = document.createElement('div');
        section.classList.add('genre-section');

        // Crie um contêiner para o cabeçalho da seção do gênero
const sectionHeader = document.createElement('div');
sectionHeader.classList.add('genre-section-header'); // Adicione uma nova classe para estilização

// Título do gênero
const title = document.createElement('h2');
title.innerText = genre.name;
sectionHeader.appendChild(title); // Adicione o título ao novo contêiner

// Link "Ver todos"
const seeAllLink = document.createElement('a');
seeAllLink.href = `genre.html?genre=${genre.id}&nome=${genre.name}`;
seeAllLink.innerText = 'Ver todos';
seeAllLink.classList.add('see-all-link');
sectionHeader.appendChild(seeAllLink); // Adicione o link ao novo contêiner

section.appendChild(sectionHeader); // Adicione o novo contêiner à seção principal

        // Container dos filmes
        const movieRow = document.createElement('div');
        movieRow.classList.add('movie-row');

        // Buscar os filmes do gênero
        let movies = [];
        try {
            movies = await fetchMoviesByGenre(genre.id, 15);
        } catch (error) {
            console.error(`Erro ao buscar filmes do gênero "${genre.name}":`, error);
            continue; // Pula para o próximo gênero se houver um erro
        }

        if (movies && movies.length > 0) {
            movies.forEach(movie => {
                const poster = movie.poster_path
                    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                    : 'https://via.placeholder.com/300x450?text=Sem+Imagem';

                const card = document.createElement('div');
                card.classList.add('movie-card');
                // CORREÇÃO: Sintaxe correta para template literals na URL da imagem
                card.innerHTML = `
                    <img src="${poster}" alt="${movie.title}">
                    <p>${movie.title}</p>
                `;
                card.onclick = () => openModal(movie.id);
                movieRow.appendChild(card);
            });
        } else {
            const noMoviesMessage = document.createElement('p');
            noMoviesMessage.innerText = 'Nenhum filme encontrado para este gênero no momento.';
            movieRow.appendChild(noMoviesMessage);
        }

        section.appendChild(movieRow);
        container.appendChild(section);
    }
}

// --- Funções da Página de ver todos (vertodospopulares.html) ---
async function loadAllPopularMovies(page = 1) {
  const url = `https://api.themoviedb.org/3/movie/popular?language=pt-BR&page=${page}`;
  const data = await fetchAPI(url);

  if (!data || !data.results) {
    console.error("Erro ao carregar filmes populares.");
    return;
  }

  renderMovies(data.results, 'allPopularMoviesContainer');

  totalPages = data.total_pages;
  document.getElementById('currentPage').innerText = `Página ${page}`;
}







// --- Funções da Página de Busca (search.html) ---
// Essa função está mais complexa devido à tentativa de criar um container dinamicamente.
// Recomendo que a estrutura HTML para resultados de busca já exista na página search.html
// para simplificar a renderização.
async function searchMovies(page = 1) {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  currentSearchQuery = query;
  currentSearchPage = page;

  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=pt-BR&page=${page}`;
  const data = await fetchAPI(url);

  const searchTitleElement = document.getElementById('searchTitle');
  const searchResultsContainer = document.getElementById('searchResults');
  const searchPageIndicator = document.getElementById('searchPageIndicator');

  if (searchTitleElement) searchTitleElement.innerText = `🎬 Resultados para "${query}"`;
  if (searchResultsContainer) renderMovies(data.results, 'searchResults');
  
  searchTotalPages = data.total_pages;
  if (searchPageIndicator) searchPageIndicator.innerText = `Página ${currentSearchPage}`;
}

// Funções de paginação para busca (precisam ser implementadas para a página search.html)
function previousSearchPage() {
    if (currentSearchPage > 1) {
        searchMovies(currentSearchPage - 1);
    }
}

function nextSearchPage() {
    if (currentSearchPage < searchTotalPages) {
        searchMovies(currentSearchPage + 1);
    }
}

// Renderiza o card principal grande na página de busca (se houver um elemento 'searchResult')
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
  const searchResultElement = document.getElementById('searchResult');
  if (searchResultElement) {
      searchResultElement.innerHTML = card;
  }
}

async function loadSearchPage(page = 1) {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('query');

  if (!query) {
    const searchResultElement = document.getElementById('searchResult');
    if (searchResultElement) searchResultElement.innerHTML = '<p>Nenhum termo de busca informado.</p>';
    return;
  }

  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=pt-BR&page=${page}`;
  const data = await fetchAPI(url);

  if (data.results.length === 0) {
    const searchResultElement = document.getElementById('searchResult');
    if (searchResultElement) searchResultElement.innerHTML = `<p>Nenhum resultado encontrado para "${query}".</p>`;
  } else {
    // Renderiza o primeiro resultado como destaque (se houver um elemento searchResult)
    renderMainResult(data.results[0]); 
    
    // Renderiza os outros resultados na lista (se houver um elemento searchResults)
    const resultsContainer = document.getElementById('searchResults');
    if (resultsContainer) {
        resultsContainer.innerHTML = ''; // Limpa antes de renderizar
        // Renderiza os resultados restantes, a partir do segundo
        renderMovies(data.results.slice(1), 'searchResults'); 
    }
  }
  loadPopular(); // Carregar também os filmes populares
}

// --- Inicialização baseada na URL da Página ---
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
  loadPopular();
  loadLatest();
} else if (window.location.pathname.includes('genre.html')) {
  loadGenrePage();
} else if (window.location.pathname.includes('search.html')) {
  loadSearchPage();
} else if (window.location.pathname.includes('genrelist.html')) {
  loadGenres(); // Chama a função para carregar todos os gêneros
}


// --- Funções de Perfil de Usuário (Mantido como estava) ---
const profileIcon = document.querySelector('.profile-icon');
if (profileIcon) {
  profileIcon.addEventListener('click', () => {
    window.location.href = 'profile.html';
  });
}

// Verifica se há um usuário logado e dados de usuário antes de tentar manipulá-los
const users = JSON.parse(localStorage.getItem('users')) || {};
const loggedUser = localStorage.getItem('loggedUser');
const userData = users[loggedUser];

if (loggedUser && userData) {
  const usernameElement = document.getElementById('username');
  if (usernameElement) usernameElement.textContent = loggedUser;

  const listsContainer = document.getElementById('lists-container');
  if (listsContainer) {
    listsContainer.innerHTML = '';
    userData.lists.forEach(list => {
      const li = document.createElement('li');
      li.textContent = list;
      listsContainer.appendChild(li);
    });
  }

  const soundSelect = document.getElementById('sound-select');
  const animationSelect = document.getElementById('animation-select');

  if (soundSelect) soundSelect.value = userData.rouletteSound || '';
  if (animationSelect) animationSelect.value = userData.rouletteAnimation || '';

  const saveButton = document.querySelector('.save-button');
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      if (soundSelect) userData.rouletteSound = soundSelect.value;
      if (animationSelect) userData.rouletteAnimation = animationSelect.value;

      users[loggedUser] = userData;
      localStorage.setItem('users', JSON.stringify(users));
      alert('Configurações salvas!');
    });
  }

  const avatarSelect = document.getElementById('avatar-select');
  const profilePhoto = document.querySelector('.profile-photo');

  if (avatarSelect) avatarSelect.value = userData.avatar || '👤';
  if (profilePhoto) profilePhoto.textContent = userData.avatar || '👤';
  if (usernameElement) usernameElement.textContent = userData.username || 'Usuário';

  if (avatarSelect) {
    avatarSelect.addEventListener('change', () => {
      userData.avatar = avatarSelect.value;
      if (profilePhoto) profilePhoto.textContent = userData.avatar;
      saveUserData();
    });
  }

  function saveUserData() {
    users[loggedUser] = userData;
    localStorage.setItem('users', JSON.stringify(users));
  }
}

// Função de logout (certifique-se de ter um botão no HTML que chame logout())
function logout() {
  localStorage.removeItem('loggedUser');
  window.location.href = 'login.html';
}

function displayGenres(genres) {
    const genresContainer = document.getElementById('genresContainer');
    genres.forEach(genre => {
        // Crie o elemento da seção de gênero
        const genreSection = document.createElement('div');
        genreSection.classList.add('genre-section'); // GARANTA ESSA CLASSE AQUI
        genreSection.innerHTML = `
                <h2>${genre.name}</h2>
                <a href="#" class="see-all-link">Ver todos</a>
            <div class="movies-list"></div> `;
        genresContainer.appendChild(genreSection);

        // Agora, dentro desta mesma função ou em outra, você adiciona os filmes
        const moviesList = genreSection.querySelector('.movies-list');
        // Você pode precisar adicionar uma classe aqui para a lista de filmes se ela não for o próprio .genre-section
        // Por exemplo: moviesList.classList.add('filmes-row'); // Se você quer o comportamento de scroll dentro de uma div aninhada

        genre.movies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.classList.add('movie-card'); // GARANTA ESSA CLASSE AQUI
            movieCard.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" alt="${movie.title}">
                <p>${movie.title}</p>
            `;
            moviesList.appendChild(movieCard); // Ou genreSection.appendChild(movieCard) se o moviesList não existir
        });
    });
}

// 2. Procure por manipulações de estilo diretas via JavaScript
// Evite ao máximo definir estilos como display, width, flex-wrap diretamente no JS.
// Exemplo ruim (a evitar):
// someElement.style.display = 'block';
// someElement.style.width = '200px';
// someElement.style.flexWrap = 'wrap';

// 3. Verifique listeners de eventos de redimensionamento de janela
// Se houver um evento 'resize' que recalcula o layout, ele pode estar sobrescrevendo seu CSS.
window.addEventListener('resize', () => {
    // Verifique se há código aqui que modifica o layout dos cards ou de .genre-section
});

// 4. Se você estiver usando as setas de scroll (scroll-btn)
// Certifique-se de que a lógica de scroll esteja apenas movendo a posição de scroll
// e não alterando o display ou flex-wrap.
// Exemplo:
const scrollContainer = document.querySelector('.filmes-row'); // Ou .genre-section
const scrollAmount = 200; // Ajuste conforme necessário

document.querySelector('.scroll-right').addEventListener('click', () => {
    scrollContainer.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
    });
});