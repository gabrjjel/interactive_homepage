export class ModalController {
  constructor({ modal, backdrop, closeButton, kicker, title, body, bullets }) {
    this.modal = modal;
    this.backdrop = backdrop;
    this.closeButton = closeButton;
    this.kicker = kicker;
    this.title = title;
    this.body = body;
    this.bullets = bullets;
    this.modalOpen = false;

    this.handleBackdropClick = this.close.bind(this);
    this.handleCloseClick = this.close.bind(this);
    this.handleEscape = this.handleEscape.bind(this);
  }

  get isOpen() {
    return this.modalOpen;
  }

  bindCloseInteractions() {
    this.closeButton.addEventListener('click', this.handleCloseClick);
    this.backdrop.addEventListener('click', this.handleBackdropClick);
    window.addEventListener('keydown', this.handleEscape);
  }

  destroy() {
    this.closeButton.removeEventListener('click', this.handleCloseClick);
    this.backdrop.removeEventListener('click', this.handleBackdropClick);
    window.removeEventListener('keydown', this.handleEscape);
  }

  handleEscape(event) {
    if (event.key === 'Escape' && this.modalOpen) {
      event.preventDefault();
      this.close();
    }
  }

  close() {
    this.modal.classList.remove('is-open');
    this.modal.setAttribute('aria-hidden', 'true');
    this.modalOpen = false;
  }

  openContent(content) {
    this.render({
      kicker: content.kicker ?? '',
      title: content.title ?? '',
      bodyParagraphs: content.body ?? [],
      bulletItems: content.bullets ?? [],
    });
  }

  openText({ prompt, text }) {
    this.render({
      kicker: 'Interaction',
      title: prompt || 'Message',
      bodyParagraphs: [text || '...'],
      bulletItems: [],
    });
  }

  render({ kicker, title, bodyParagraphs, bulletItems }) {
    this.kicker.textContent = kicker;
    this.title.textContent = title;

    this.body.replaceChildren(
      ...bodyParagraphs.map((paragraphText) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = paragraphText;
        return paragraph;
      }),
    );

    this.bullets.replaceChildren(
      ...bulletItems.map((bulletText) => {
        const item = document.createElement('li');
        item.textContent = bulletText;
        return item;
      }),
    );
    this.bullets.style.display = bulletItems.length ? 'block' : 'none';

    this.modal.classList.add('is-open');
    this.modal.setAttribute('aria-hidden', 'false');
    this.modalOpen = true;
  }
}