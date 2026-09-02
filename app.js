/* ============================================================
   CinePulse — Main Application JavaScript
   TMDB API Integration, Search, Carousels, Content Locker
   ============================================================ */

// ── TMDB API Configuration ──
const TMDB_API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';
const IMG_POSTER = `${TMDB_IMG}/w500`;
const IMG_BACKDROP = `${TMDB_IMG}/original`;
const IMG_SMALL = `${TMDB_IMG}/w185`;

// ── CPA Network Configuration ──
// The frontend now securely fetches from your Vercel Serverless API.
// You MUST add CPA_API_TOKEN in your Vercel Environment Variables.
const CPA_API_ENDPOINT = '/api/offers';

// ── Helper: Fetch from TMDB ──
async function tmdbFetch(endpoint, params = {}) {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('TMDB fetch error:', err);
    return null;
  }
}

// ── Helper: Get year from date ──
function getYear(dateStr) {
  return dateStr ? dateStr.split('-')[0] : '';
}

// ── Helper: Format rating ──
function formatRating(vote) {
  return vote ? vote.toFixed(1) : 'N/A';
}

// ── Build movie card HTML ──
function buildMovieCard(item, type = 'movie') {
  const title = item.title || item.name || 'Untitled';
  const year = getYear(item.release_date || item.first_air_date);
  const rating = formatRating(item.vote_average);
  const posterPath = item.poster_path ? `${IMG_POSTER}${item.poster_path}` : '';
  const mediaType = type || item.media_type || 'movie';
  const watchUrl = `watch.html?id=${item.id}&type=${mediaType}`;

  const posterHtml = posterPath
    ? `<img src="${posterPath}" alt="${title}" loading="lazy" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--dark-card);color:var(--text-dim);font-size:14px;">No Poster</div>`;

  return `
    <a href="${watchUrl}" class="movie-card" title="${title}">
      <div class="card-poster">
        ${posterHtml}
        <div class="card-rating">★ ${rating}</div>
        <div class="card-quality">HD</div>
        <div class="card-overlay">
          <div class="card-play-icon">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title">${title}</div>
        <div class="card-year">${year}</div>
      </div>
    </a>
  `;
}

// ── Build skeleton card HTML ──
function buildSkeletonCard() {
  return `
    <div class="skeleton-card">
      <div class="skeleton skeleton-poster"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-year"></div>
    </div>
  `;
}

// ── Render skeletons into container ──
function showSkeletons(container, count = 8) {
  if (!container) return;
  container.innerHTML = Array(count).fill(buildSkeletonCard()).join('');
}

// ── Render movie cards into a carousel track ──
function renderCarousel(trackEl, items, type = 'movie') {
  if (!trackEl) return;
  if (!items || items.length === 0) {
    trackEl.innerHTML = '<div style="color:var(--text-dim);padding:20px;">No results found.</div>';
    return;
  }
  trackEl.innerHTML = items.map(item => buildMovieCard(item, type)).join('');
}

// ── Render movie cards into a grid ──
function renderGrid(gridEl, items, type = 'movie', append = false) {
  if (!gridEl) return;
  const html = items.map(item => buildMovieCard(item, type)).join('');
  if (append) {
    gridEl.insertAdjacentHTML('beforeend', html);
  } else {
    gridEl.innerHTML = html;
  }
}

// ── Carousel scroll buttons ──
function initCarouselButtons() {
  document.querySelectorAll('.carousel-wrapper').forEach(wrapper => {
    const track = wrapper.querySelector('.carousel-track');
    const prevBtn = wrapper.querySelector('.carousel-btn.prev');
    const nextBtn = wrapper.querySelector('.carousel-btn.next');
    if (!track) return;

    const scrollAmount = 600;
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
    }
  });
}

// ============================================================
// HOMEPAGE LOGIC
// ============================================================
async function initHomepage() {
  // Load hero featured movie
  const trendingData = await tmdbFetch('/trending/all/day');
  if (trendingData && trendingData.results && trendingData.results.length > 0) {
    const featured = trendingData.results[0];
    renderHero(featured);
    
    // Trending carousel
    const trendTrack = document.getElementById('trending-track');
    renderCarousel(trendTrack, trendingData.results.slice(1, 21));
  }

  // Popular Movies
  const popularMovies = await tmdbFetch('/movie/popular');
  if (popularMovies && popularMovies.results) {
    renderCarousel(document.getElementById('popular-movies-track'), popularMovies.results, 'movie');
  }

  // Now Playing
  const nowPlaying = await tmdbFetch('/movie/now_playing');
  if (nowPlaying && nowPlaying.results) {
    renderCarousel(document.getElementById('now-playing-track'), nowPlaying.results, 'movie');
  }

  // Top Rated
  const topRated = await tmdbFetch('/movie/top_rated');
  if (topRated && topRated.results) {
    renderCarousel(document.getElementById('top-rated-track'), topRated.results, 'movie');
  }

  // Popular TV
  const popularTV = await tmdbFetch('/tv/popular');
  if (popularTV && popularTV.results) {
    renderCarousel(document.getElementById('popular-tv-track'), popularTV.results, 'tv');
  }

  initCarouselButtons();
}

// ── Render Hero Section ──
function renderHero(item) {
  const backdrop = document.getElementById('hero-backdrop');
  const title = document.getElementById('hero-title');
  const desc = document.getElementById('hero-desc');
  const ratingEl = document.getElementById('hero-rating');
  const yearEl = document.getElementById('hero-year');
  const typeEl = document.getElementById('hero-type');
  const watchBtn = document.getElementById('hero-watch-btn');

  if (backdrop && item.backdrop_path) {
    backdrop.style.backgroundImage = `url('${IMG_BACKDROP}${item.backdrop_path}')`;
  }
  if (title) title.textContent = item.title || item.name || '';
  if (desc) desc.textContent = item.overview || '';
  if (ratingEl) ratingEl.textContent = `★ ${formatRating(item.vote_average)}`;
  if (yearEl) yearEl.textContent = getYear(item.release_date || item.first_air_date);
  if (typeEl) typeEl.textContent = item.media_type === 'tv' ? 'TV Series' : 'Movie';
  if (watchBtn) {
    const mediaType = item.media_type || 'movie';
    watchBtn.href = `watch.html?id=${item.id}&type=${mediaType}`;
  }
}

// ============================================================
// BROWSE PAGES (Movies / TV)
// ============================================================
let currentBrowsePage = 1;
let currentBrowseCategory = '';
let currentBrowseType = '';
let isLoadingMore = false;

async function initBrowsePage(type = 'movie') {
  currentBrowseType = type;
  const defaultCat = type === 'movie' ? 'popular' : 'popular';
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category') || defaultCat;
  
  // Set active tab
  document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.category === category);
  });

  // Add tab click handlers
  document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.category;
      window.history.replaceState(null, '', `?category=${cat}`);
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentBrowsePage = 1;
      loadBrowseContent(cat);
    });
  });

  loadBrowseContent(category);
}

async function loadBrowseContent(category, page = 1) {
  currentBrowseCategory = category;
  currentBrowsePage = page;
  const grid = document.getElementById('browse-grid');
  
  if (page === 1) {
    showSkeletons(grid, 20);
  }

  let endpoint = '';
  if (currentBrowseType === 'movie') {
    const catMap = {
      'popular': '/movie/popular',
      'now_playing': '/movie/now_playing',
      'upcoming': '/movie/upcoming',
      'top_rated': '/movie/top_rated'
    };
    endpoint = catMap[category] || '/movie/popular';
  } else {
    const catMap = {
      'popular': '/tv/popular',
      'airing_today': '/tv/airing_today',
      'on_the_air': '/tv/on_the_air',
      'top_rated': '/tv/top_rated'
    };
    endpoint = catMap[category] || '/tv/popular';
  }

  const data = await tmdbFetch(endpoint, { page: page.toString() });
  if (data && data.results) {
    renderGrid(grid, data.results, currentBrowseType, page > 1);
  }
  isLoadingMore = false;
}

function loadMoreBrowse() {
  if (isLoadingMore) return;
  isLoadingMore = true;
  currentBrowsePage++;
  loadBrowseContent(currentBrowseCategory, currentBrowsePage);
}

// ============================================================
// SEARCH
// ============================================================
let searchTimeout = null;

function initSearch() {
  const searchInputs = document.querySelectorAll('.search-input');
  searchInputs.forEach(input => {
    const resultsContainer = input.closest('.search-box, .mobile-search-box')?.querySelector('.search-results');

    input.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      const query = input.value.trim();
      if (query.length < 2) {
        if (resultsContainer) resultsContainer.classList.remove('active');
        return;
      }
      searchTimeout = setTimeout(() => performSearch(query, resultsContainer), 350);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        if (query.length >= 2) {
          performSearch(query, resultsContainer);
        }
      }
    });

    // Close results on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box') && !e.target.closest('.mobile-search-box')) {
        if (resultsContainer) resultsContainer.classList.remove('active');
      }
    });
  });
}

async function performSearch(query, container) {
  if (!container) return;
  const data = await tmdbFetch('/search/multi', { query, page: '1' });
  if (!data || !data.results) {
    container.innerHTML = '<div style="padding:16px;color:var(--text-dim);text-align:center;">No results found.</div>';
    container.classList.add('active');
    return;
  }

  const filtered = data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 8);
  if (filtered.length === 0) {
    container.innerHTML = '<div style="padding:16px;color:var(--text-dim);text-align:center;">No results found.</div>';
    container.classList.add('active');
    return;
  }

  container.innerHTML = filtered.map(item => {
    const title = item.title || item.name || 'Untitled';
    const year = getYear(item.release_date || item.first_air_date);
    const type = item.media_type === 'tv' ? 'TV' : 'Movie';
    const poster = item.poster_path ? `${IMG_SMALL}${item.poster_path}` : '';
    const posterHtml = poster
      ? `<img src="${poster}" alt="${title}" />`
      : `<div style="width:40px;height:56px;background:var(--dark-card);border-radius:6px;"></div>`;
    return `
      <a href="watch.html?id=${item.id}&type=${item.media_type}" class="search-result-item">
        ${posterHtml}
        <div class="search-result-info">
          <div class="search-result-title">${title}</div>
          <div class="search-result-meta">${year} • ${type} • ★ ${formatRating(item.vote_average)}</div>
        </div>
      </a>
    `;
  }).join('');
  container.classList.add('active');
}

// ============================================================
// WATCH PAGE LOGIC
// ============================================================
let watchTimerInterval = null;
let watchTimerSeconds = 0;
const LOCKER_TRIGGER_SECONDS = 300; // 5 minutes

async function initWatchPage() {
  const params = new URLSearchParams(window.location.search);
  const mediaId = params.get('id');
  const mediaType = params.get('type') || 'movie';

  if (!mediaId) {
    document.querySelector('.watch-content').innerHTML = '<div style="text-align:center;padding:80px 20px;"><h2 style="color:#fff;margin-bottom:8px;">No movie selected</h2><p style="color:var(--text-muted);">Please select a movie from the homepage.</p><a href="index.html" class="btn-primary" style="margin-top:20px;">← Back to Home</a></div>';
    return;
  }

  // Fetch movie/tv details
  const details = await tmdbFetch(`/${mediaType}/${mediaId}`);
  if (!details) return;

  populateWatchPage(details, mediaType);
}

function populateWatchPage(data, type) {
  const title = data.title || data.name || 'Untitled';
  const year = getYear(data.release_date || data.first_air_date);
  const rating = formatRating(data.vote_average);
  const genres = (data.genres || []).map(g => g.name).join(' / ');
  const runtime = data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : (data.episode_run_time && data.episode_run_time[0] ? `${data.episode_run_time[0]}m/ep` : 'N/A');
  const overview = data.overview || 'No synopsis available.';
  const posterUrl = data.poster_path ? `${IMG_POSTER}${data.poster_path}` : '';
  const backdropUrl = data.backdrop_path ? `${IMG_BACKDROP}${data.backdrop_path}` : '';

  // Update page title
  document.title = `${title} — Watch Free in HD | CinePulse`;

  // Update meta
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = `Watch ${title} (${year}) for free in HD on CinePulse. ${overview.substring(0, 120)}...`;

  // Movie title
  const titleEl = document.getElementById('display-movie-title');
  if (titleEl) titleEl.textContent = `${title} (${year})`;

  // Tags
  const qualityEl = document.getElementById('badge-quality');
  if (qualityEl) qualityEl.textContent = 'HD';

  const ratingEl = document.getElementById('badge-rating');
  if (ratingEl) ratingEl.textContent = `★ ${rating} IMDb`;

  const yearEl = document.getElementById('badge-year');
  if (yearEl) yearEl.textContent = year;

  const durationEl = document.getElementById('badge-duration');
  if (durationEl) durationEl.textContent = runtime;

  const genreEl = document.getElementById('badge-genre');
  if (genreEl) genreEl.textContent = genres;

  // Player backdrop
  const backdropEl = document.getElementById('player-backdrop-img');
  if (backdropEl && backdropUrl) {
    backdropEl.style.backgroundImage = `url('${backdropUrl}')`;
  }

  // Duration in controls
  const ctrlDurEl = document.getElementById('ctrl-duration');
  if (ctrlDurEl) ctrlDurEl.textContent = runtime;

  // Poster
  const posterEl = document.getElementById('movie-poster-img');
  if (posterEl && posterUrl) posterEl.src = posterUrl;

  // Synopsis
  const synopsisEl = document.getElementById('movie-synopsis-text');
  if (synopsisEl) synopsisEl.textContent = overview;

  // Store config for locker
  window.MOVIE_CONFIG = {
    movieTitle: `${title} (${year})`,
    releaseYear: year,
    duration: runtime,
    quality: 'HD',
    imdbRating: `★ ${rating} IMDb`,
    genre: genres,
    synopsis: overview,
    posterUrl: posterUrl,
    backdropUrl: backdropUrl,
    unlockedStreamUrl: type === 'tv'
      ? `https://player.videasy.net/tv/${data.id}/1/1?color=0ea5e9`
      : `https://player.videasy.net/movie/${data.id}?color=0ea5e9`,
    requiredOffers: 2,
    apiEndpoint: '/api/offers'
  };
}

// ── 5-Minute Watch Timer ──
function startRealMovie(e) {
  if (e && e.preventDefault) e.preventDefault();

  const mainPlayBtn = document.getElementById('main-play-btn');
  if (mainPlayBtn) mainPlayBtn.style.display = 'none';
  const playerBackdrop = document.getElementById('player-backdrop-img');
  if (playerBackdrop) playerBackdrop.style.display = 'none';
  
  const playerContainer = document.getElementById('unlocked-video-container');
  if (playerContainer && window.MOVIE_CONFIG && window.MOVIE_CONFIG.unlockedStreamUrl) {
    playerContainer.style.display = 'block';
    playerContainer.style.position = 'absolute';
    playerContainer.style.top = '0';
    playerContainer.style.left = '0';
    playerContainer.style.width = '100%';
    playerContainer.style.height = '100%';
    playerContainer.style.zIndex = '10';
    playerContainer.innerHTML = '<iframe src="' + window.MOVIE_CONFIG.unlockedStreamUrl + '" allow="autoplay; fullscreen" allowfullscreen style="width:100%;height:100%;border:none;"></iframe>';
  }

  startWatchTimer();
}

function startWatchTimer() {
  watchTimerSeconds = 0;
  const timerDisplay = document.getElementById('watch-timer-display');
  
  watchTimerInterval = setInterval(() => {
    watchTimerSeconds++;
    
    // Update timer display
    if (timerDisplay) {
      const mins = Math.floor(watchTimerSeconds / 60);
      const secs = watchTimerSeconds % 60;
      timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Simulate timeline progress
    const timelineFill = document.querySelector('.timeline-fill');
    if (timelineFill) {
      const progress = Math.min((watchTimerSeconds / LOCKER_TRIGGER_SECONDS) * 100, 100);
      timelineFill.style.width = progress + '%';
    }

    // Trigger locker at 5 minutes
    if (watchTimerSeconds >= LOCKER_TRIGGER_SECONDS) {
      clearInterval(watchTimerInterval);
      
      const playerContainer = document.getElementById('unlocked-video-container');
      if (playerContainer) {
          playerContainer.innerHTML = ''; // Stop the video
          playerContainer.style.display = 'none';
      }

      startStreamAccess();
    }
  }, 1000);
}

// ── Buffering Simulation → Content Locker (Skipped Temporarily) ──
function startStreamAccess(e) {
  if (e && e.preventDefault) e.preventDefault();
  clearInterval(watchTimerInterval);
  
  // Directly trigger the movie locker as requested
  triggerMovieLocker();
}

// ── Content Locker Modal ──
let completedOfferCount = new Set();
let currentLoadedOffers = [];

// Fisher-Yates shuffle
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function triggerMovieLocker() {
  const overlay = document.getElementById('movie-locker-overlay');
  if (overlay) overlay.classList.add('active');

  completedOfferCount.clear();

  // Reset all step indicators
  ['mstep1','mstep2','mstep3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('done','active');
  });
  ['mstep-conn','mstep-conn2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('done');
  });

  // Reset step dots text
  const dotTexts = { mstep1: '1', mstep2: '2', mstep3: '\u25b6' };
  Object.entries(dotTexts).forEach(([id, txt]) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add(id === 'mstep1' ? 'active' : '');
      const dot = el.querySelector('.s-dot');
      if (dot) dot.textContent = txt;
    }
  });
  document.getElementById('mstep1').classList.add('active');

  // Reset progress bar & label
  const fill = document.getElementById('locker-prog-fill');
  if (fill) fill.style.width = '0%';
  const stepLabel = document.getElementById('locker-step-label');
  if (stepLabel) stepLabel.textContent = 'Step 1 of 2 \u2014 Verify Viewer';

  // Set movie title
  const movieTitleSpan = document.getElementById('locker-movie-title');
  if (movieTitleSpan && window.MOVIE_CONFIG) movieTitleSpan.textContent = window.MOVIE_CONFIG.movieTitle;

  // Show loading state
  const container = document.getElementById('movie-offers-container');
  if (container) {
    container.innerHTML = '<div style="padding:28px 0;text-align:center;">' +
      '<div class="buffer-spinner" style="width:36px;height:36px;display:block;"></div>' +
      '<div style="color:var(--text-muted);font-size:13px;margin-top:12px;">Connecting to verification network\u2026</div>' +
      '</div>';
  }

  fetch(CPA_API_ENDPOINT, { headers: { 'Accept': 'application/json' } })
    .then(res => {
      if (!res.ok) throw new Error('API Error: ' + res.status);
      return res.json();
    })
    .then(data => {
      let offersToRender = [];
      if (Array.isArray(data)) offersToRender = data;
      else if (data && data.offers) offersToRender = data.offers;
      else if (data && data.data) offersToRender = data.data;

      if (offersToRender.length > 0) {
        // Filter: prefer email-submit / high-payout
        let filtered = offersToRender.filter(offer => {
          const txt = (offer.name || offer.name_short || offer.description || offer.adcopy || offer.category || offer.type || '').toLowerCase();
          const isEmailSubmit = txt.includes('email') || txt.includes('submit') || txt.includes('win');
          let payout = parseFloat(String(offer.payout || offer.amount || offer.epc || '0').replace(/[^0-9.]/g, ''));
          return isEmailSubmit && payout >= 1.30;
        });

        if (filtered.length < 2) {
          filtered = offersToRender.slice().sort((a, b) => {
            let pA = parseFloat(String(a.payout || 0).replace(/[^0-9.]/g, ''));
            let pB = parseFloat(String(b.payout || 0).replace(/[^0-9.]/g, ''));
            return pB - pA;
          });
        }

        // RANDOMIZE order for each session
        filtered = shuffleArray(filtered);
        currentLoadedOffers = filtered;
        renderMovieOffers(filtered);
      } else {
        const c = document.getElementById('movie-offers-container');
        if (c) c.innerHTML = '<div style="color:var(--primary);padding:20px;">No offers available right now. Please try again later.</div>';
      }
    })
    .catch(err => {
      console.error('API Fetch Error:', err);
      const c = document.getElementById('movie-offers-container');
      if (c) c.innerHTML = '<div style="color:#f87171;padding:20px;">Error connecting to verification network. Please disable AdBlock or check your connection.</div>';
    });
}

function renderMovieOffers(offers) {
  const container = document.getElementById('movie-offers-container');
  if (!container) return;
  container.innerHTML = '';

  if (!offers || offers.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:13.5px;padding:20px;border:1px dashed rgba(255,255,255,0.1);border-radius:12px;background:rgba(255,255,255,0.02);">No verification methods are currently available in your region or for your device. Please try again later.</div>';
    return;
  }

  const REQUIRED = 2; // Always require exactly 2 steps
  const pool = offers.slice(0, Math.max(REQUIRED, offers.length));
  const toShow = pool.slice(0, REQUIRED);

  // Emoji icon fallbacks (randomized per card)
  const emojiPool = ['\uD83C\uDF81', '\uD83C\uDF1F', '\u26A1', '\uD83D\uDD25', '\uD83C\uDFC6', '\uD83D\uDE80', '\uD83D\uDCB0', '\uD83C\uDFAF'];

  toShow.forEach((offer, idx) => {
    const name = offer.name_short || offer.name || 'Instant Verification Step';
    const adcopy = offer.adcopy || offer.description || 'Complete this quick sponsor step to verify your access.';
    const link = offer.link || '#';
    const pic = offer.picture || offer.image || '';
    const emoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];

    const card = document.createElement('a');
    card.className = 'movie-offer-card';
    card.id = 'movie-offer-' + idx;
    card.href = link;
    card.target = '_blank';
    card.rel = 'noopener';
    card.setAttribute('data-idx', idx);

    const thumbHtml = pic
      ? '<div class="offer-thumb"><img src="' + pic + '" alt="" loading="lazy" onerror="this.parentElement.textContent=\'' + emoji + '\'"/></div>'
      : '<div class="offer-thumb">' + emoji + '</div>';

    card.innerHTML =
      '<div class="offer-step-pill">' +
        '<div class="offer-step-num">' + (idx + 1) + '</div>' +
        '<div class="offer-step-of">of ' + REQUIRED + '</div>' +
      '</div>' +
      '<div class="offer-inner">' +
        thumbHtml +
        '<div class="offer-info">' +
          '<div class="offer-headline">' + name + '</div>' +
          '<div class="offer-desc">' + adcopy + '</div>' +
          '<div class="offer-tags">' +
            '<span class="offer-tag offer-tag-free">FREE</span>' +
            '<span class="offer-tag offer-tag-instant">\u26A1 INSTANT</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="offer-act-btn" id="offer-btn-' + idx + '">' +
        '<span class="offer-act-icon">\u25B6</span>' +
        '<span>UNLOCK</span>' +
        '<span>STREAM</span>' +
      '</div>';

    card.addEventListener('click', function() {
      // Mark this card as started visually
      card.classList.add('offer-card-started');
      const btn = document.getElementById('offer-btn-' + idx);
      if (btn) btn.innerHTML = '<div class="buffer-spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-right:6px;border-top-color:#FFF;border-right-color:rgba(255,255,255,0.2);border-bottom-color:rgba(255,255,255,0.2);border-left-color:rgba(255,255,255,0.2);"></div><span>Waiting...</span>';
      
      const stepLabel = document.getElementById('locker-step-label');
      if (stepLabel) stepLabel.textContent = 'Waiting for Verification...';

      // Start polling the server for actual completion
      if (!window.completionPollInterval) {
        window.completionPollInterval = setInterval(() => {
          fetch('/api/check')
            .then(res => res.json())
            .then(data => {
              if (data && data.completions >= REQUIRED) {
                clearInterval(window.completionPollInterval);
                
                // Both steps done — unlock!
                const fill = document.getElementById('locker-prog-fill');
                if (fill) fill.style.width = '100%';
                if (stepLabel) stepLabel.textContent = '\u2705 Stream Unlocked!';
                
                // Update UI to show unlocked state
                setTimeout(() => {
                  container.innerHTML =
                    '<div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 0 8px;">' +
                      '<div style="font-size:44px;">\uD83C\uDF89</div>' +
                      '<div style="font-size:18px;font-weight:800;color:#22c55e;">Stream Unlocked!</div>' +
                      '<div style="font-size:13px;color:var(--text-muted);">Thank you for verifying. Click below to start watching.</div>' +
                      '<button id="start-watch-btn" class="btn-play-main" onclick="onStreamUnlocked()" style="margin-top:4px;background:linear-gradient(135deg,#22c55e,#16a34a);box-shadow:0 8px 24px rgba(34,197,94,0.3);">' +
                        '<svg viewBox="0 0 24 24" style="width:20px;fill:#FFF;margin-right:8px;"><path d="M8 5v14l11-7z"/></svg> START WATCHING NOW' +
                      '</button>' +
                    '</div>';
                }, 400);
              }
            }).catch(e => console.error(e));
        }, 5000); // Check every 5 seconds
      }
    });

    container.appendChild(card);
  });
}

function onStreamUnlocked() {
  const lockerOverlay = document.getElementById('movie-locker-overlay');
  if (lockerOverlay) lockerOverlay.classList.remove('active');

  // Restore the video iframe if it was cleared
  const wrap = document.getElementById('watch-video-wrap');
  if (wrap && wrap.querySelector('iframe') === null && typeof buildStreamUrl === 'function' && currentMediaId) {
    wrap.innerHTML = '<iframe src="' + buildStreamUrl(currentMediaId, currentMediaType, 1) + '" frameborder="0" border="0" allowfullscreen webkitallowfullscreen mozallowfullscreen allow="autoplay; fullscreen"></iframe>';
  }
}

// ============================================================
// MOBILE NAV
// ============================================================
function initMobileNav() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const overlay = document.getElementById('mobile-nav-overlay');
  const closeBtn = document.getElementById('mobile-nav-close');

  if (menuBtn && overlay) {
    menuBtn.addEventListener('click', () => overlay.classList.add('active'));
  }
  if (closeBtn && overlay) {
    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
  }
  if (overlay) {
    overlay.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => overlay.classList.remove('active'));
    });
  }
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initSearch();
  initLangSwitcher();
});


// ============================================================
// GENRE CAROUSEL LAZY LOADING
// ============================================================
function initGenreCarousels() {
  const sections = document.querySelectorAll('.lazy-genre-section');
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const section = entry.target;
      if (section.dataset.loaded) return;
      section.dataset.loaded = 'true';
      observer.unobserve(section);

      const trackId = section.dataset.track;
      const mediaType = section.dataset.type || 'movie';
      const genreId = section.dataset.genre;
      const keywordId = section.dataset.keyword;
      const track = document.getElementById(trackId);
      if (!track) return;

      let endpoint, params;
      if (genreId) {
        endpoint = `/discover/${mediaType}`;
        params = { with_genres: genreId, sort_by: 'popularity.desc', 'vote_count.gte': '100' };
      } else if (keywordId) {
        endpoint = `/discover/${mediaType}`;
        params = { with_keywords: keywordId, sort_by: 'popularity.desc', 'vote_count.gte': '50' };
      } else {
        return;
      }

      tmdbFetch(endpoint, params).then(data => {
        if (data && data.results && data.results.length > 0) {
          renderCarousel(track, data.results.slice(0, 20), mediaType);
          // Re-init carousel buttons for newly loaded wrapper
          const wrapper = track.closest('.carousel-wrapper');
          if (wrapper) {
            const prev = wrapper.querySelector('.carousel-btn.prev');
            const next = wrapper.querySelector('.carousel-btn.next');
            if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -600, behavior: 'smooth' }));
            if (next) next.addEventListener('click', () => track.scrollBy({ left: 600, behavior: 'smooth' }));
          }
        } else {
          track.innerHTML = '<div style="color:var(--text-dim);padding:20px;font-size:14px;">No results found.</div>';
        }
      });
    });
  }, { rootMargin: '200px 0px', threshold: 0.01 });

  sections.forEach(s => observer.observe(s));
}

// ============================================================
// LANGUAGE SWITCHER  (EN / FR)
// ============================================================
const TRANSLATIONS = {
  en: {
    // Banner
    'banner-text': '✦ 100% Free & Ad-Free Streaming — No subscriptions, no interruptions ✦',
    // Nav
    'nav-movies': 'Movies',
    'nav-tv': 'TV Shows',
    'nav-home': 'Home',
    'search-placeholder': 'Type to search...',
    'search-placeholder-mobile': 'Search movies & TV shows...',
    // Hero
    'hero-badge': '🔥 Trending Now',
    'hero-desc-default': 'Discover thousands of movies and TV shows streaming for free in HD.',
    'hero-watch-btn': 'Watch Now',
    'hero-browse-btn': 'Browse All →',
    // Section titles
    'section-trending': '🔥 Trending Today',
    'section-popular-movies': '🎬 Popular Movies',
    'section-now-playing': '🍿 Now Playing',
    'section-top-rated': '⭐ Top Rated',
    'section-popular-tv': '📺 Popular TV Shows',
    'see-all': 'See all →',
    // Genre dividers
    'genre-movies-title': 'Movies by Genre',
    'genre-tv-title': 'TV Shows by Genre',
    // Browse page
    'movies-page-title': '🎬 Movies',
    'movies-page-subtitle': 'Browse thousands of movies available for free streaming in HD',
    'tv-page-title': '📺 TV Shows',
    'tv-page-subtitle': 'Browse thousands of TV series available for free streaming in HD',
    'tab-popular': 'Popular',
    'tab-now-playing': 'Now Playing',
    'tab-upcoming': 'Upcoming',
    'tab-top-rated': 'Top Rated',
    'tab-airing-today': 'Airing Today',
    'tab-on-air': 'On The Air',
    'load-more-movies': 'Load More Movies',
    'load-more-tv': 'Load More TV Shows',
    // Footer
    'footer-brand-desc': 'CinePulse is your ultimate destination for streaming movies and TV shows. We provide links to high-quality content from various sources.',
    'footer-quick-links': 'Quick Links',
    'footer-movies': 'Movies',
    'footer-tv': 'TV Shows',
    'footer-legal': 'Legal',
    'footer-disclaimer': 'This site does not store any files on our server, we only link to the media which is hosted on 3rd party services.',
    'footer-rights': '© 2026 CinePulse. All rights reserved.',
    // Movie detail badges
    'badge-hd': 'HD',
    // Watch button
    'watch-now': '▶ Watch Now',
  },
  fr: {
    // Banner
    'banner-text': '✦ 100% Gratuit & Sans Publicité — Sans abonnement, sans interruption ✦',
    // Nav
    'nav-movies': 'Films',
    'nav-tv': 'Séries TV',
    'nav-home': 'Accueil',
    'search-placeholder': 'Rechercher...',
    'search-placeholder-mobile': 'Rechercher films & séries...',
    // Hero
    'hero-badge': '🔥 Tendances',
    'hero-desc-default': 'Découvrez des milliers de films et séries en streaming gratuit HD.',
    'hero-watch-btn': 'Regarder',
    'hero-browse-btn': 'Tout parcourir →',
    // Section titles
    'section-trending': '🔥 Tendances du Jour',
    'section-popular-movies': '🎬 Films Populaires',
    'section-now-playing': '🍿 À l\'Affiche',
    'section-top-rated': '⭐ Les Mieux Notés',
    'section-popular-tv': '📺 Séries Populaires',
    'see-all': 'Voir tout →',
    // Genre dividers
    'genre-movies-title': 'Films par Genre',
    'genre-tv-title': 'Séries par Genre',
    // Browse page
    'movies-page-title': '🎬 Films',
    'movies-page-subtitle': 'Parcourez des milliers de films disponibles en streaming gratuit HD',
    'tv-page-title': '📺 Séries TV',
    'tv-page-subtitle': 'Parcourez des milliers de séries disponibles en streaming gratuit HD',
    'tab-popular': 'Populaires',
    'tab-now-playing': 'À l\'Affiche',
    'tab-upcoming': 'À Venir',
    'tab-top-rated': 'Les Mieux Notés',
    'tab-airing-today': 'Diffusion Aujourd\'hui',
    'tab-on-air': 'En Cours',
    'load-more-movies': 'Plus de Films',
    'load-more-tv': 'Plus de Séries',
    // Footer
    'footer-brand-desc': 'CinePulse est votre destination idéale pour le streaming de films et séries. Nous proposons des liens vers du contenu de qualité provenant de diverses sources.',
    'footer-quick-links': 'Liens Rapides',
    'footer-movies': 'Films',
    'footer-tv': 'Séries TV',
    'footer-legal': 'Légal',
    'footer-disclaimer': 'Ce site ne stocke aucun fichier sur nos serveurs, nous ne faisons que créer des liens vers des médias hébergés par des services tiers.',
    'footer-rights': '© 2026 CinePulse. Tous droits réservés.',
    // Movie detail badges
    'badge-hd': 'HD',
    // Watch button
    'watch-now': '▶ Regarder',
  }
};

// Map of data-i18n keys to DOM selectors
const I18N_SELECTORS = {
  'banner-text': '.top-banner p',
  'nav-movies': 'a[href="movies.html"].nav-link',
  'nav-tv': 'a[href="tv.html"].nav-link',
  'nav-home': 'a[href="index.html"].nav-link',
  'search-placeholder': '.search-box .search-input',
  'search-placeholder-mobile': '.mobile-search-box .search-input',
  'section-trending': '#trending-track ~ *',
  'see-all': '.section-more',
  'load-more-movies': '.btn-load-more',
  'footer-brand-desc': '.footer-brand-desc',
  'footer-quick-links': '.footer-col-title:nth-of-type(1)',
  'footer-disclaimer': '.footer-disclaimer',
};

function applyTranslations(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];

  // Apply data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) {
      if (el.tagName === 'INPUT') el.placeholder = t[key];
      else el.textContent = t[key];
    }
  });

  // Section titles
  document.querySelectorAll('.section-title').forEach(el => {
    const txt = el.textContent.trim();
    const map = {
      '🔥 Trending Today': t['section-trending'],
      '🎬 Popular Movies': t['section-popular-movies'],
      '🍿 Now Playing': t['section-now-playing'],
      '⭐ Top Rated': t['section-top-rated'],
      '📺 Popular TV Shows': t['section-popular-tv'],
      '🔥 Tendances du Jour': t['section-trending'],
      '🎬 Films Populaires': t['section-popular-movies'],
      '🍿 À l\'Affiche': t['section-now-playing'],
      '⭐ Les Mieux Notés': t['section-top-rated'],
      '📺 Séries Populaires': t['section-popular-tv'],
    };
    if (map[txt]) el.textContent = map[txt];
  });

  // See all links
  document.querySelectorAll('.section-more').forEach(el => {
    el.textContent = t['see-all'];
  });

  // Banner
  const banner = document.querySelector('.top-banner p');
  if (banner) banner.innerHTML = t['banner-text'];

  // Search placeholders
  document.querySelectorAll('.search-input').forEach((el, i) => {
    el.placeholder = i === 0 ? t['search-placeholder'] : t['search-placeholder-mobile'];
  });

  // Nav links text (keep SVG, only update text node)
  document.querySelectorAll('.nav-link').forEach(el => {
    const href = el.getAttribute('href') || '';
    let key = null;
    if (href.includes('movies')) key = 'nav-movies';
    else if (href.includes('tv')) key = 'nav-tv';
    else if (href === 'index.html') key = 'nav-home';
    if (key && t[key]) {
      // Replace text node only, preserve SVG
      const svg = el.querySelector('svg');
      if (svg) {
        el.textContent = '';
        el.appendChild(svg);
        el.append(' ' + t[key]);
      } else {
        el.textContent = t[key];
      }
    }
  });

  // Genre dividers
  document.querySelectorAll('.genre-divider-title').forEach(el => {
    const txt = el.textContent.trim();
    if (txt === 'Movies by Genre' || txt === 'Films par Genre') el.textContent = t['genre-movies-title'];
    if (txt === 'TV Shows by Genre' || txt === 'Séries par Genre') el.textContent = t['genre-tv-title'];
  });

  // Page titles / subtitles
  const pageTitle = document.querySelector('.page-title');
  const pageSubtitle = document.querySelector('.page-subtitle');
  if (pageTitle) {
    const txt = pageTitle.textContent.trim();
    if (txt.includes('Movie') || txt.includes('Film')) pageTitle.textContent = t['movies-page-title'];
    else if (txt.includes('TV') || txt.includes('Série')) pageTitle.textContent = t['tv-page-title'];
  }
  if (pageSubtitle) {
    const txt = pageSubtitle.textContent.trim();
    if (txt.includes('movie') || txt.includes('film')) pageSubtitle.textContent = t['movies-page-subtitle'];
    else if (txt.includes('TV') || txt.includes('série')) pageSubtitle.textContent = t['tv-page-subtitle'];
  }

  // Category tabs
  document.querySelectorAll('.cat-tab').forEach(el => {
    const cat = el.dataset.category;
    const tabMap = {
      'popular': t['tab-popular'],
      'now_playing': t['tab-now-playing'],
      'upcoming': t['tab-upcoming'],
      'top_rated': t['tab-top-rated'],
      'airing_today': t['tab-airing-today'],
      'on_the_air': t['tab-on-air'],
    };
    if (tabMap[cat]) el.textContent = tabMap[cat];
  });

  // Load more buttons
  document.querySelectorAll('.btn-load-more').forEach(el => {
    const txt = el.textContent.trim();
    if (txt.includes('Movie') || txt.includes('Film')) el.textContent = t['load-more-movies'];
    else el.textContent = t['load-more-tv'];
  });

  // Footer
  const footerDesc = document.querySelector('.footer-brand-desc');
  if (footerDesc) footerDesc.textContent = t['footer-brand-desc'];
  const footerDisclaimer = document.querySelector('.footer-disclaimer');
  if (footerDisclaimer) footerDisclaimer.textContent = t['footer-disclaimer'];
  const footerRights = document.querySelector('.footer-bottom p');
  if (footerRights) footerRights.innerHTML = t['footer-rights'];

  // Hero watch btn
  const heroWatchBtn = document.getElementById('hero-watch-btn');
  if (heroWatchBtn) {
    const svg = heroWatchBtn.querySelector('svg');
    heroWatchBtn.textContent = '';
    if (svg) heroWatchBtn.appendChild(svg);
    heroWatchBtn.append(' ' + (lang === 'fr' ? 'Regarder' : 'Watch Now'));
  }
  const heroBrowseBtn = document.querySelector('.btn-secondary');
  if (heroBrowseBtn && heroBrowseBtn.textContent.includes('Browse') || heroBrowseBtn && heroBrowseBtn.textContent.includes('parcourir')) {
    heroBrowseBtn.textContent = t['hero-browse-btn'];
  }

  // Set html lang attribute
  document.documentElement.lang = lang;
}

function setLanguage(lang) {
  localStorage.setItem('cinepulse-lang', lang);

  // Update button display
  const flagEl = document.getElementById('lang-flag');
  const labelEl = document.getElementById('lang-label');
  if (flagEl) flagEl.textContent = lang === 'fr' ? '🇫🇷' : '🇬🇧';
  if (labelEl) labelEl.textContent = lang === 'fr' ? 'FR' : 'EN';

  // Update active option
  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.lang === lang);
  });

  // Close dropdown
  const switcher = document.getElementById('lang-switcher');
  if (switcher) switcher.classList.remove('open');

  // Apply translations
  applyTranslations(lang);
}

function initLangSwitcher() {
  const btn = document.getElementById('lang-btn');
  const switcher = document.getElementById('lang-switcher');
  if (!btn || !switcher) return;

  // Toggle dropdown
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    switcher.classList.toggle('open');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#lang-switcher')) {
      switcher.classList.remove('open');
    }
  });

  // Load saved language
  const saved = localStorage.getItem('cinepulse-lang') || 'en';
  if (saved !== 'en') {
    setLanguage(saved);
  } else {
    // Update active state for EN
    const flagEl = document.getElementById('lang-flag');
    const labelEl = document.getElementById('lang-label');
    if (flagEl) flagEl.textContent = '🇬🇧';
    if (labelEl) labelEl.textContent = 'EN';
  }
}
