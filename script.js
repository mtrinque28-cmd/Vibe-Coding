const books = [
  {
    title: "Don Quixote",
    author: "Miguel de Cervantes",
    years: "1547–1616",
    year: 1605,
    coverHue: 18,
    impact:
      "Often called the first modern novel, Don Quixote reshaped Western storytelling with its blend of satire, psychology, and metafiction. Its deluded knight and loyal squire became global archetypes, influencing everything from the novel as an art form to modern film and psychology’s study of idealism versus reality.",
    location:
      "Early editions and Cervantes materials are held at the Biblioteca Nacional de España in Madrid, including prized copies central to Spanish literary heritage.",
    locationUrl: "https://www.bne.es/en",
  },
  {
    title: "A Tale of Two Cities",
    author: "Charles Dickens",
    years: "1812–1870",
    year: 1859,
    coverHue: 350,
    impact:
      "One of the best-selling novels of all time, it crystallized public memory of the French Revolution through unforgettable openings and sacrifice. Dickens proved the novel could address political terror and redemption at mass scale, shaping historical fiction and popular empathy for social upheaval.",
    location:
      "Manuscript leaves and first editions are preserved at the British Library in London, alongside one of the world’s richest Dickens collections.",
    locationUrl: "https://www.bl.uk",
  },
  {
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    years: "1892–1973",
    year: 1954,
    coverHue: 140,
    impact:
      "Tolkien rebuilt modern fantasy by fusing myth, linguistics, and moral epic. Middle-earth set the template for world-building in games, film, and literature—from Dungeons & Dragons to blockbuster franchises—while arguing that myth still speaks to industrial societies.",
    location:
      "Tolkien’s original manuscripts and drawings are housed at the Marquette University Libraries in Milwaukee, Wisconsin, USA.",
    locationUrl: "https://www.marquette.edu/library/archives/tolkien.php",
  },
  {
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    years: "1900–1944",
    year: 1943,
    coverHue: 210,
    impact:
      "A philosophical fable disguised as children’s literature, it has been translated more than any book except religious texts. Its lines on love, responsibility, and seeing with the heart made it a universal moral compass across cultures and generations.",
    location:
      "Saint-Exupéry’s original manuscript and watercolors are kept at the Morgan Library & Museum in New York City.",
    locationUrl: "https://www.themorgan.org",
  },
  {
    title: "Harry Potter and the Philosopher's Stone",
    author: "J.K. Rowling",
    years: "b. 1965",
    year: 1997,
    coverHue: 265,
    impact:
      "The series reignited global youth reading, created a shared pop-culture mythology, and transformed publishing, film, and merchandising. It demonstrated how one story world could span books, cinema, theme parks, and digital fandom at unprecedented scale.",
    location:
      "Rowling’s original manuscript and related materials have been exhibited at the British Library; institutional holdings continue to grow with literary archives worldwide.",
    locationUrl: "https://www.bl.uk",
  },
  {
    title: "And Then There Were None",
    author: "Agatha Christie",
    years: "1890–1976",
    year: 1939,
    coverHue: 30,
    impact:
      "The best-selling mystery novel ever published, it perfected the closed-circle whodunit and influenced crime fiction, film, and television. Christie’s puzzle-box plotting became the gold standard for detective stories and escape-room logic.",
    location:
      "Christie’s archives and publishing history are preserved at the British Library and the Agatha Christie Archive Trust in the UK.",
    locationUrl: "https://www.bl.uk",
  },
  {
    title: "Dream of the Red Chamber",
    author: "Cao Xueqin",
    years: "c. 1715–1763",
    year: 1791,
    coverHue: 0,
    impact:
      "Considered one of China’s four great classical novels, it offers an encyclopedic portrait of Qing dynasty society, family decline, and Buddhist-Taoist-Confucian themes. Its psychology and poetry shaped Chinese literary realism centuries before the European novel’s comparable works.",
    location:
      "Rare early Chinese editions and scholarly collections are held at the National Library of China in Beijing and major East Asian research libraries.",
    locationUrl: "http://www.nlc.cn/",
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    years: "1892–1973",
    year: 1937,
    coverHue: 95,
    impact:
      "Originally a bedtime story, The Hobbit bridged fairy tale and epic, inviting readers into immersive secondary worlds. It paved the way for modern fantasy publishing and proved children’s adventure could carry deep mythic weight.",
    location:
      "Tolkien’s papers, including Hobbit-related drafts, are held at the Bodleian Libraries, University of Oxford, England.",
    locationUrl: "https://www.bodleian.ox.ac.uk",
  },
  {
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    years: "1832–1898",
    year: 1865,
    coverHue: 320,
    impact:
      "Carroll’s nonsense logic influenced surrealism, psychology, mathematics, and children’s literature. Alice became a symbol of curiosity and absurd authority, referenced endlessly in art, film, and philosophy.",
    location:
      "Original manuscript “Alice’s Adventures Under Ground” is preserved at the British Library in London.",
    locationUrl: "https://www.bl.uk",
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    years: "1775–1817",
    year: 1813,
    coverHue: 175,
    impact:
      "Austen refined the novel of manners into sharp social comedy and free-indirect style, influencing how writers depict consciousness and class. Elizabeth Bennet and Mr. Darcy remain touchstones for romance, wit, and moral growth in fiction.",
    location:
      "First editions and Austen family materials are held at the British Library and Jane Austen’s House Museum in Hampshire, England.",
    locationUrl: "https://www.janeaustens.house",
  },
];

let currentIndex = 0;
let isAnimating = false;

const els = {
  card: document.getElementById("book-card"),
  cover: document.getElementById("book-cover"),
  coverYear: document.getElementById("cover-year"),
  coverTitle: document.getElementById("book-title"),
  coverAuthor: document.getElementById("cover-author"),
  authorName: document.getElementById("author-name"),
  authorYears: document.getElementById("author-years"),
  impact: document.getElementById("book-impact"),
  location: document.getElementById("book-location"),
  locationLink: document.getElementById("location-link"),
  bookIndex: document.getElementById("book-index"),
  bookTotal: document.getElementById("book-total"),
  dots: document.getElementById("dots"),
  prev: document.getElementById("prev-btn"),
  next: document.getElementById("next-btn"),
};

function init() {
  els.bookTotal.textContent = books.length;
  buildDots();
  render(0, "none");
  bindEvents();
}

function buildDots() {
  els.dots.innerHTML = "";
  books.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dot";
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-label", `Book ${i + 1}: ${books[i].title}`);
    btn.setAttribute("aria-selected", i === 0 ? "true" : "false");
    btn.addEventListener("click", () => goTo(i));
    els.dots.appendChild(btn);
  });
}

function render(index, direction) {
  const book = books[index];
  currentIndex = index;

  if (direction !== "none") {
    isAnimating = true;
    els.card.classList.remove("slide-left", "slide-right", "fade-in");
    void els.card.offsetWidth;
    els.card.classList.add(direction === "next" ? "slide-left" : "slide-right");
    setTimeout(() => {
      updateContent(book, index);
      els.card.classList.remove("slide-left", "slide-right");
      els.card.classList.add("fade-in");
      isAnimating = false;
    }, 220);
  } else {
    updateContent(book, index);
  }
}

function updateContent(book, index) {
  els.coverTitle.textContent = book.title;
  els.coverAuthor.textContent = book.author;
  els.coverYear.textContent = book.year;
  els.cover.style.setProperty("--cover-hue", book.coverHue);
  els.authorName.textContent = book.author;
  els.authorYears.textContent = book.years;
  els.impact.textContent = book.impact;
  els.location.textContent = book.location;
  els.locationLink.href = book.locationUrl;
  els.bookIndex.textContent = index + 1;

  document.querySelectorAll(".dot").forEach((dot, i) => {
    dot.setAttribute("aria-selected", i === index ? "true" : "false");
    dot.classList.toggle("active", i === index);
  });
}

function goTo(index) {
  if (isAnimating || index === currentIndex) return;
  const direction = index > currentIndex ? "next" : "prev";
  render(index, direction);
}

function step(delta) {
  const next = (currentIndex + delta + books.length) % books.length;
  goTo(next);
}

function bindEvents() {
  els.prev.addEventListener("click", () => step(-1));
  els.next.addEventListener("click", () => step(1));

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  let touchStartX = 0;
  els.card.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  els.card.addEventListener(
    "touchend",
    (e) => {
      const dx = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    },
    { passive: true }
  );
}

init();
