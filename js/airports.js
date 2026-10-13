'use strict';
/* Cities served by one main passenger airport, so a flight to "Amsterdam" can be shown as AMS.
   Cities with several major airports (London, New York, Paris, Tokyo, Chicago, Washington,
   Milan, Rome, Istanbul, Toronto, Dubai, Seoul, Bangkok, São Paulo and others) are left out on
   purpose: Via can't tell which one is meant, so those need the code typed in, e.g. "London (LHR)".
   Names that match more than one place (Portland, San Jose, Perth, Valencia...) are left out too. */
const CITY_AIRPORTS = {
  'abu dhabi': 'AUH', amsterdam: 'AMS', anchorage: 'ANC', athens: 'ATH', atlanta: 'ATL', auckland: 'AKL',
  austin: 'AUS', baltimore: 'BWI', bangalore: 'BLR', bengaluru: 'BLR', barcelona: 'BCN', berlin: 'BER',
  bogota: 'BOG', boston: 'BOS', brisbane: 'BNE', brussels: 'BRU', budapest: 'BUD', busan: 'PUS',
  cairo: 'CAI', calgary: 'YYC', cancun: 'CUN', 'cape town': 'CPT', casablanca: 'CMN', charlotte: 'CLT',
  chennai: 'MAA', christchurch: 'CHC', cincinnati: 'CVG', cleveland: 'CLE', copenhagen: 'CPH',
  delhi: 'DEL', 'new delhi': 'DEL', denpasar: 'DPS', denver: 'DEN', detroit: 'DTW', doha: 'DOH',
  dubrovnik: 'DBV', dublin: 'DUB', dusseldorf: 'DUS', edinburgh: 'EDI', edmonton: 'YEG', florence: 'FLR',
  frankfurt: 'FRA', fukuoka: 'FUK', geneva: 'GVA', halifax: 'YHZ', hamburg: 'HAM', hanoi: 'HAN',
  helsinki: 'HEL', 'ho chi minh city': 'SGN', 'hong kong': 'HKG', honolulu: 'HNL', indianapolis: 'IND',
  johannesburg: 'JNB', 'kansas city': 'MCI', kolkata: 'CCU', krakow: 'KRK', 'kuala lumpur': 'KUL',
  'las vegas': 'LAS', lima: 'LIM', lisbon: 'LIS', 'los angeles': 'LAX', lyon: 'LYS', madrid: 'MAD',
  malaga: 'AGP', manchester: 'MAN', manila: 'MNL', marrakech: 'RAK', marseille: 'MRS', melbourne: 'MEL',
  miami: 'MIA', milwaukee: 'MKE', minneapolis: 'MSP', montreal: 'YUL', mumbai: 'BOM', munich: 'MUC',
  naples: 'NAP', nashville: 'BNA', 'new orleans': 'MSY', nice: 'NCE', orlando: 'MCO', oslo: 'OSL',
  ottawa: 'YOW', palma: 'PMI', philadelphia: 'PHL', phoenix: 'PHX', pittsburgh: 'PIT', porto: 'OPO',
  prague: 'PRG', raleigh: 'RDU', sacramento: 'SMF', 'salt lake city': 'SLC', 'san diego': 'SAN',
  'san francisco': 'SFO', santiago: 'SCL', seattle: 'SEA', seville: 'SVQ', singapore: 'SIN', split: 'SPU',
  'st louis': 'STL', 'saint louis': 'STL', sydney: 'SYD', tampa: 'TPA', 'tel aviv': 'TLV',
  vancouver: 'YVR', venice: 'VCE', vienna: 'VIE', warsaw: 'WAW', wellington: 'WLG', zurich: 'ZRH',
};

// "Zürich" → "zurich", "St. Louis" → "st louis"
const placeKey = (s) => (s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const cityAirport = (city) => CITY_AIRPORTS[placeKey(city)] || '';
