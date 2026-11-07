export type DeliveryArea = {
  id: string;
  name: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
};

/** Neighbourhoods available for delivery from the Begur home kitchen. */
export const DELIVERY_AREAS: DeliveryArea[] = [
  {
    id: "jayanagar",
    name: "Jayanagar 4th Block",
    city: "Bengaluru",
    pincode: "560041",
    lat: 12.9293,
    lng: 77.5838,
  },
  {
    id: "basavanagudi",
    name: "Basavanagudi",
    city: "Bengaluru",
    pincode: "560004",
    lat: 12.941,
    lng: 77.5736,
  },
  {
    id: "jp-nagar",
    name: "JP Nagar",
    city: "Bengaluru",
    pincode: "560078",
    lat: 12.9063,
    lng: 77.5857,
  },
  {
    id: "banashankari",
    name: "Banashankari",
    city: "Bengaluru",
    pincode: "560085",
    lat: 12.9255,
    lng: 77.5468,
  },
  {
    id: "btm",
    name: "BTM Layout",
    city: "Bengaluru",
    pincode: "560076",
    lat: 12.9166,
    lng: 77.6101,
  },
  {
    id: "koramangala",
    name: "Koramangala",
    city: "Bengaluru",
    pincode: "560034",
    lat: 12.9352,
    lng: 77.6245,
  },
  {
    id: "wilson",
    name: "Wilson Garden",
    city: "Bengaluru",
    pincode: "560027",
    lat: 12.9482,
    lng: 77.5956,
  },
  {
    id: "lalbagh",
    name: "Lalbagh Road",
    city: "Bengaluru",
    pincode: "560027",
    lat: 12.9507,
    lng: 77.5848,
  },
  {
    id: "indiranagar",
    name: "Indiranagar",
    city: "Bengaluru",
    pincode: "560038",
    lat: 12.9784,
    lng: 77.6408,
  },
  {
    id: "hsr",
    name: "HSR Layout",
    city: "Bengaluru",
    pincode: "560102",
    lat: 12.9121,
    lng: 77.6446,
  },
  {
    id: "malleshwaram",
    name: "Malleshwaram",
    city: "Bengaluru",
    pincode: "560003",
    lat: 13.0035,
    lng: 77.5642,
  },
  {
    id: "jayanagar7",
    name: "Jayanagar 7th Block",
    city: "Bengaluru",
    pincode: "560082",
    lat: 12.9259,
    lng: 77.583,
  },
  {
    id: "hulimavu",
    name: "Hulimavu",
    city: "Bengaluru",
    pincode: "560076",
    lat: 12.8773486,
    lng: 77.6028031,
  },
  {
    id: "arekere",
    name: "Arekere",
    city: "Bengaluru",
    pincode: "560076",
    lat: 12.8872086,
    lng: 77.5960493,
  },
  {
    id: "hongsandra",
    name: "Hongsandra",
    city: "Bengaluru",
    pincode: "560068",
    lat: 12.8986261,
    lng: 77.6286732,
  },
  {
    id: "signsandra",
    name: "Signsandra",
    city: "Bengaluru",
    pincode: "560068",
    lat: 12.8787382,
    lng: 77.642089,
  },
  {
    id: "manipal-county",
    name: "Manipal County",
    city: "Bengaluru",
    pincode: "560114",
    lat: 12.8737015,
    lng: 77.6420142,
  },
  {
    id: "bommanahalli",
    name: "Bommanahalli",
    city: "Bengaluru",
    pincode: "560068",
    lat: 12.9034581,
    lng: 77.6230028,
  },
  {
    id: "kudlu",
    name: "Kudlu",
    city: "Bengaluru",
    pincode: "560068",
    lat: 12.8889126,
    lng: 77.6555716,
  },
  {
    id: "bettadasanapura",
    name: "Bettadasanapura",
    city: "Bengaluru",
    pincode: "560100",
    lat: 12.8415691,
    lng: 77.6319433,
  },
  {
    id: "mylasandra",
    name: "Mylasandra",
    city: "Bengaluru",
    pincode: "560100",
    lat: 12.8514983,
    lng: 77.6204097,
  },
];

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function deliveryFeePaise(distanceKm: number): number {
  if (distanceKm <= 3) return 0;
  if (distanceKm <= 6) return 3000;
  if (distanceKm <= 10) return 4900;
  return 7900;
}

/** Urban two-wheeler average plus a small buffer for signals. */
export const RIDER_KMH = 18;

export function rideMinutes(distanceKm: number): number {
  return Math.max(12, Math.round((distanceKm / RIDER_KMH) * 60) + 6);
}

export function interpolate(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  t: number,
) {
  const k = Math.min(1, Math.max(0, t));
  return {
    lat: a.lat + (b.lat - a.lat) * k,
    lng: a.lng + (b.lng - a.lng) * k,
  };
}

export function findArea(id: string): DeliveryArea | undefined {
  return DELIVERY_AREAS.find((a) => a.id === id);
}

export function nearestArea(lat: number, lng: number): DeliveryArea {
  return DELIVERY_AREAS.reduce((best, area) => {
    const d = haversineKm({ lat, lng }, area);
    const bd = haversineKm({ lat, lng }, best);
    return d < bd ? area : best;
  });
}
