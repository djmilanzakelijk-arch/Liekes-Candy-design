// Adres van een afbeelding uit /public/beelden. In de losse 'alles-in-één'-HTML
// staan de afbeeldingen ingebakken in window.__NDS_IMAGES.
const BASE = import.meta.env.BASE_URL;

export function imageUrl(file) {
  return (typeof window !== 'undefined' && window.__NDS_IMAGES?.[file]) || `${BASE}beelden/${file}`;
}
