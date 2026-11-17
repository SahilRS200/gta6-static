// Unlock-schedule table rows — rendered by the server (for crawlers) and re-rendered by the browser.
import { ZONES } from './zones.js';
import { unlockUtc, fmtUnlockLocal, fmtUtc } from './time.js';

const sortedZones = (usRule) => ZONES
  .map((zone) => ({ zone, at: unlockUtc(zone, usRule) }))
  .sort((a, b) => a.at - b.at || a.zone.city.localeCompare(b.zone.city));

const scheduleRowsHtml = (usRule) => sortedZones(usRule).map(({ zone, at }, i) => `
<tr data-zone="${zone.id}">
  <td class="num">${i + 1}</td>
  <td><a href="/gta-6-release-time/${zone.slug}/"><span class="flag" aria-hidden="true">${zone.flag}</span> ${zone.city}<span class="muted">, ${zone.country}</span></a></td>
  <td><time datetime="${new Date(at).toISOString()}">${fmtUnlockLocal(at, zone.tz)}</time>${zone.us && usRule ? ' <span class="tag tag-us" title="US PlayStation Store is keyed to Eastern Time">ET store</span>' : ''}</td>
  <td class="muted">${fmtUtc(at)}</td>
</tr>`).join('');

export { sortedZones, scheduleRowsHtml };
