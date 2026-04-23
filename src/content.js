/**
 * Content data for interactive hotspots on the homepage map.
 *
 * Each key corresponds to the `contentId` property on a TMX object
 * of type "hotspot" in assets/maps/homepage.tmx:
 *   - "about"    → object ID 18
 *   - "projects" → object ID 19
 *   - "contact"  → object ID 20
 */
export const HOMEPAGE_CONTENT = {
  about: {
    kicker: 'About',
    title: 'A homepage you can walk through',
    body: [
      'This prototype treats the homepage like a small explorable room instead of a static hero section.',
      'The intent is to make the site feel tactile while keeping the actual content readable, accessible, and easy to extend.',
    ],
  },
  projects: {
    kicker: 'Projects',
    title: 'Selected work lives behind map hotspots',
    body: [
      'Use each hotspot as a content anchor for case studies, experiments, client work, or personal builds.',
      'The quick implementation keeps the copy in JavaScript, but the next pass should move these records into structured content data.',
    ],
    bullets: [
      'Product design systems and frontend engineering',
      'Interactive brand sites and campaign microsites',
      'Creative coding, motion, and spatial navigation experiments',
    ],
  },
  contact: {
    kicker: 'Contact',
    title: 'Make the map lead somewhere real',
    body: [
      'Swap this placeholder copy with your real contact details, booking link, email address, or social handles.',
      'You can also turn this modal into a contact form, an outbound link list, or a final call-to-action screen.',
    ],
  },
};