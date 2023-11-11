import { empty, el } from './lib/elements.js';
import { renderDetails, renderFrontpage, searchAndRender } from './lib/ui.js';
import { getLaunch } from './lib/api.js';

/**
 * Fall sem keyrir við leit.
 * @param {SubmitEvent} e
 * @returns {Promise<void>}
 */
async function onSearch(e) {
  e.preventDefault();

  if (!e.target || !(e.target instanceof Element)) {
    return;
  }

  const { value } = e.target.querySelector('input') ?? {};

  if (!value) {
    return;
  }

  await searchAndRender(document.body, e.target, value);
  window.history.pushState({}, '', `/?query=${value}`);
}

/**
 * Athugar hvaða síðu við erum á út frá query-string og birtir.
 * Ef `id` er gefið er stakt geimskot birt, annars er forsíða birt með
 * leitarniðurstöðum ef `query` er gefið.
 */
function route() {
  const { search } = window.location;

  const qs = new URLSearchParams(search);

  const query = qs.get('query') ?? undefined;
  const id = qs.get('id');

  const parentElement = document.body;

  empty(parentElement);

  if (id) {
    renderDetails(parentElement, id);
  } else {
    renderFrontpage(parentElement, onSearch, query);
  }
}

// Bæta við viðbrögðum við onpopstate atburðinum
window.onpopstate = () => {
  route(); // Kalla á route fallið til að ákvarða hvað skal birta út frá núverandi URL
};

// Útfæra renderDetails fallið
export async function renderMyDetails(parentElement, id) {
  // Fjarlægja öll börn úr parentElement til að undirbúa nýtt efni
  empty(parentElement);

  // Búa til og bæta við container fyrir gögnin
  const detailsContainer = el('div', { class: 'details' });
  parentElement.appendChild(detailsContainer);

  // Þessar aðgerðir sýna og fela hleðsluskilaboðin

  /**
   * Sýnir hleðsluskilaboð á meðan gögn eru sótt.
   * @param {HTMLElement} container - Elementið sem á að birta hleðsluskilaboðin í.
   */
  function setLoading(container) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = 'Sæki gögn...';
    container.appendChild(loadingDiv);
  }

  /**
   * @param {HTMLElement} container - Elementið sem inniheldur hleðsluskilaboðin.
   */
  function setNotLoading(container) {
    const loadingDiv = container.querySelector('.loading');
    if (loadingDiv) {
      loadingDiv.remove();
    }
  }

  // Sýna loading skilaboð
  setLoading(detailsContainer);

  try {
    // Sækja gögn fyrir geimskotið
    const result = await getLaunch(id);

    // Fjarlægja loading skilaboð
    setNotLoading(detailsContainer);

    if (result) {
      // Búa til og bæta við upplýsingum um geimskotið
      const launchDetails = el(
        'div',
        {},
        el('h1', {}, result.name),
        el('p', {}, `Gluggi: ${result.window_start} - ${result.window_end}`),
        result.image
          ? el('img', { src: result.image, alt: `Mynd af ${result.name}` })
          : 'null',
        el(
          'p',
          {},
          `Staða: ${result.status.name} - ${result.status.description}`
        ),
        result.mission
          ? el(
              'p',
              {},
              `Verkefni: ${result.mission.name} - ${result.mission.description}`
            )
          : 'null'
      );
      detailsContainer.appendChild(launchDetails);
    } else {
      // Engin gögn fundust
      detailsContainer.appendChild(
        el('p', {}, 'Engin gögn fundust fyrir þetta geimskot.')
      );
    }
  } catch (error) {
    // Villa kom upp við að sækja gögn
    console.error(error);
    setNotLoading(detailsContainer);
    detailsContainer.appendChild(
      el('p', { class: 'error' }, 'Villa kom upp við að sækja upplýsingar.')
    );
  }
}

// Nú er route fallið kallað þegar síðan er hlaðin og viðbrögð við onpopstate
route();
