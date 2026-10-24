// Preserve upstream links and apply separately audited PDF relations when supplied.
// Small containment tolerance applies only inside an explicitly linked feature;
// it never links distinct pieces or changes the imported drawing geometry.
export const LINKED_SEAM_TOLERANCE_IN = 0.0051;
export const pointSegmentDistance = (p,a,b) => {
  const dx=b.x-a.x,dy=b.y-a.y;
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
};

export function groupTerrainAreas(areas, rawById, pdfSymbols = []) {
  const parents = areas.map((_,i) => i);
  const indexById = new Map(areas.map((area,i) => [area.id,i]));
  const root = i => parents[i] === i ? i : (parents[i] = root(parents[i]));
  const join = (a,b) => { parents[root(b)] = root(a); };
  for (let i=0; i<areas.length; i++) for (let j=i+1; j<areas.length; j++) {
    const link = rawById.get(areas[i].id)?.link_group;
    if (link && link === rawById.get(areas[j].id)?.link_group) join(i,j);
  }
  for (const symbol of pdfSymbols.filter(symbol => symbol.linked)) {
    const [a,b] = symbol.pair.map(id => indexById.get(id));
    if (a === undefined || b === undefined) throw new Error('PDF link references missing area');
    join(a,b);
  }
  for (const symbol of pdfSymbols.filter(symbol => !symbol.linked)) {
    const [a,b] = symbol.pair.map(id => indexById.get(id));
    if (a === undefined || b === undefined || root(a) === root(b)) throw new Error('Source/PDF separate-area conflict');
  }
  const groups = new Map();
  areas.forEach((area,i) => {
    const key = root(i);
    if (!groups.has(key)) groups.set(key, { members: [] });
    groups.get(key).members.push(area);
  });
  return [...groups.values()].map(({ members }) => {
    const linkGroup = members.map(area => rawById.get(area.id)?.link_group).find(Boolean);
    const pdfOnly = members.length > 1 && !members.every(area => linkGroup && rawById.get(area.id)?.link_group === linkGroup);
    const id = linkGroup ? `linked:${linkGroup}` : `pdf:${members.map(area=>area.id).join('+')}`;
    const shared = { linkGroup, memberIds: members.map(area => area.id), groupOrigin: pdfOnly ? 'pdf' : linkGroup ? 'explicit' : 'single' };
    if (members.length === 1) return { ...members[0], ...shared };
    const polygons = members.map(area => area.polygon), vertices = polygons.flat();
    return {
      id, name: linkGroup || members.map(area=>area.name).join(" + "), kind: 'ruin', x: 0, y: 0, rotation: 0,
      width: Math.max(...vertices.map(p => p.x)) - Math.min(...vertices.map(p => p.x)),
      height: Math.max(...vertices.map(p => p.y)) - Math.min(...vertices.map(p => p.y)),
      ...shared, polygons, seamTolerance: LINKED_SEAM_TOLERANCE_IN,
    };
  });
}

// Signature of resolved area geometry: a changed layout must be re-audited
// against the PDF before applying PDF-only relationships to new coordinates.
export function geometrySignature(resolved) {
  const text = JSON.stringify(resolved.filter(p=>p.piece_type==='area').map(p=>[p.id,p.vertices]));
  let hash = 2166136261;
  for (let i=0;i<text.length;i++) hash = Math.imul(hash ^ text.charCodeAt(i),16777619);
  return (hash>>>0).toString(16).padStart(8,'0');
}
