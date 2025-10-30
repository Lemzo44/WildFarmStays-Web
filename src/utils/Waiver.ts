// Utility functions for waiver selection and content loading

// Vite raw imports to bundle text content
// Adjust paths if waivers are moved; currently they live at repository root `/waivers`
// and are imported via Vite's ?raw loader.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite raw import
import republicOfIrelandWaiver from '../../waivers/waiver-republic-ireland.txt?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite raw import
import northernIrelandWaiver from '../../waivers/waiver-northern-ireland.txt?raw';

const NORTHERN_IRELAND_COUNTIES = new Set([
  'Antrim', 'Armagh', 'Down', 'Fermanagh', 'Londonderry', 'Tyrone',
]);

export type WaiverType = 'republic-ireland' | 'northern-ireland';

export function isNorthernIrelandCounty(county?: string): boolean {
  if (!county) return false;
  const normalized = county.trim();
  if (!normalized) return false;
  return NORTHERN_IRELAND_COUNTIES.has(normalized);
}

export function detectWaiverType(params: { county?: string; location?: string }): WaiverType {
  const { county, location } = params;
  if (isNorthernIrelandCounty(county)) return 'northern-ireland';
  if (location && /northern ireland/i.test(location)) return 'northern-ireland';
  return 'republic-ireland';
}

export function getWaiverText(waiverType: WaiverType): string {
  return waiverType === 'northern-ireland' ? northernIrelandWaiver : republicOfIrelandWaiver;
}



