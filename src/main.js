import { HomepageGame } from './game/index.js';
import { loadHomepageMap } from './map/index.js';
import { HOMEPAGE_CONTENT } from './content.js';
import { ModalController } from './ui/modal.js';

const canvas = document.getElementById('game');
const modal = document.getElementById('hotspot-modal');
const backdrop = document.getElementById('hotspot-backdrop');
const closeButton = document.getElementById('hotspot-close');
const kicker = document.getElementById('hotspot-kicker');
const title = document.getElementById('hotspot-title');
const body = document.getElementById('hotspot-body');
const bullets = document.getElementById('hotspot-bullets');

let game;
const modalController = new ModalController({
  modal,
  backdrop,
  closeButton,
  kicker,
  title,
  body,
  bullets,
});

function createBootstrapErrorMessage() {
  const message = document.createElement('p');
  message.textContent = 'Failed to load the map. Please refresh or check the console.';
  message.className = 'map-shell__error';
  return message;
}

function openModal(contentId) {
  const content = HOMEPAGE_CONTENT[contentId];
  if (!content) {
    return;
  }

  modalController.openContent(content);
}

function openTextModal({ prompt, text }) {
  modalController.openText({ prompt, text });
}

function handleHotspotInteraction(payload) {
  if (payload.contentId === 'contact') {
    window.open('https://www.google.com', '_blank', 'noopener,noreferrer');
    return;
  }

  if (payload.interactionType === 'route' && payload.route) {
    window.location.assign(payload.route);
    return;
  }

  if (payload.contentId && HOMEPAGE_CONTENT[payload.contentId]) {
    openModal(payload.contentId);
    return;
  }

  openTextModal(payload);
}

modalController.bindCloseInteractions();

async function bootstrap() {
  try {
    const map = await loadHomepageMap();
    game = new HomepageGame({
      canvas,
      map,
      onHotspotInteract: handleHotspotInteraction,
      isModalOpen: () => modalController.isOpen,
    });
    await game.init();
  } catch (error) {
    console.error(error);
    const message = createBootstrapErrorMessage();
    canvas.parentElement?.appendChild(message);
  }
}

window.addEventListener('beforeunload', () => {
  modalController.destroy();
  if (game) {
    game.destroy();
  }
});

bootstrap();