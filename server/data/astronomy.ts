// Server-side astronomy-engine wrapper.
// In tsx, dynamic import wraps CJS modules so exports are under .default

let _ae: any = null;

async function getAE() {
  if (!_ae) {
    const mod = await import('astronomy-engine');
    _ae = mod.default ?? mod;
  }
  return _ae;
}

export async function geoMoon(date: Date): Promise<{ x: number; y: number; z: number }> {
  const ae = await getAE();
  return ae.GeoMoon(date);
}

export async function geoVector(body: string, date: Date): Promise<{ x: number; y: number; z: number }> {
  const ae = await getAE();
  return ae.GeoVector(ae.Body[body], date, false);
}

export async function siderealTime(date: Date): Promise<number> {
  const ae = await getAE();
  return ae.SiderealTime(date);
}

export async function getKmPerAU(): Promise<number> {
  const ae = await getAE();
  return ae.KM_PER_AU;
}
