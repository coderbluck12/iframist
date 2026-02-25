const form = document.getElementById('scrapeForm');
const urlInput = document.getElementById('urlInput');
const scrapeBtn = document.getElementById('scrapeBtn');
const btnText = scrapeBtn.querySelector('.btn-text');
const btnSpinner = document.getElementById('btnSpinner');

const stateIdle = document.getElementById('stateIdle');
const stateLoading = document.getElementById('stateLoading');
const stateError = document.getElementById('stateError');
const stateEmpty = document.getElementById('stateEmpty');
const stateResults = document.getElementById('stateResults');

const errorMessage = document.getElementById('errorMessage');
const emptyMessage = document.getElementById('emptyMessage');
const resultsCount = document.getElementById('resultsCount');
const iframeList = document.getElementById('iframeList');
const copyAllBtn = document.getElementById('copyAllBtn');

let currentUrls = [];

function showState(name) {
    [stateIdle, stateLoading, stateError, stateEmpty, stateResults].forEach(el => {
        el.hidden = true;
    });
    const map = {
        idle: stateIdle,
        loading: stateLoading,
        error: stateError,
        empty: stateEmpty,
        results: stateResults,
    };
    if (map[name]) map[name].hidden = false;
}

function setLoading(on) {
    scrapeBtn.disabled = on;
    btnText.textContent = on ? 'Scraping…' : 'Scrape';
    btnSpinner.hidden = !on;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;

    setLoading(true);
    showState('loading');
    currentUrls = [];

    try {
        const res = await fetch('https://iframist-backend.onrender.com/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        const data = await res.json();

        if (!res.ok) {
            errorMessage.textContent = data.error || 'An unknown error occurred.';
            showState('error');
            return;
        }

        if (!data.iframes || data.iframes.length === 0) {
            emptyMessage.textContent = data.message ||
                'No iframes found on this page. The site may use JavaScript protection or iframes may load only after user interaction.';
            showState('empty');
            return;
        }

        currentUrls = data.iframes;
        renderResults(currentUrls);
        showState('results');

    } catch (err) {
        errorMessage.textContent = 'Could not connect to the server. Make sure the server is running.';
        showState('error');
    } finally {
        setLoading(false);
    }
});

function renderResults(urls) {
    const count = urls.length;
    resultsCount.textContent = `${count} iframe URL${count !== 1 ? 's' : ''} found`;

    iframeList.innerHTML = '';
    urls.forEach((url, i) => {
        const li = document.createElement('li');
        li.className = 'iframe-item';
        li.style.animationDelay = `${i * 40}ms`;

        li.innerHTML = `
      <span class="item-index">${i + 1}</span>
      <span class="item-url">${escapeHtml(url)}</span>
      <button class="copy-btn" data-url="${escapeHtml(url)}">Copy</button>
    `;
        iframeList.appendChild(li);
    });

    // Individual copy buttons
    iframeList.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            copyToClipboard(btn.dataset.url, btn);
        });
    });
}

copyAllBtn.addEventListener('click', () => {
    if (currentUrls.length === 0) return;
    copyToClipboard(currentUrls.join('\n'), copyAllBtn, 'Copied All!');
});

function copyToClipboard(text, btn, successLabel = 'Copied!') {
    navigator.clipboard.writeText(text).then(() => {
        const original = btn.textContent;
        btn.textContent = successLabel;
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = original;
            btn.classList.remove('copied');
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = successLabel;
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = btn.dataset.url ? 'Copy' : 'Copy All';
            btn.classList.remove('copied');
        }, 2000);
    });
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
