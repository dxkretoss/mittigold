/**
 * Gujarat Territory Master: Predefined Zones, Cities, and Key Commercial/Residential Areas
 * Used for dynamic cascading selection, autocomplete, and territory conflict detection.
 */

export const GUJARAT_ZONES_TERRITORY = {
  'South Gujarat': {
    cities: {
      'Surat': [
        'Adajan',
        'Varachha',
        'Katargam',
        'Vesu',
        'Rander',
        'Udhna',
        'Pandesara',
        'Pal',
        'Althan',
        'Limbayat',
        'Sachin GIDC',
        'Piplod',
        'Ghod Dod Road',
        'Mota Varachha',
        'Dindoli',
        'Amroli',
        'Bhestan',
      ],
      'Navsari': [
        'Gandevi',
        'Jalalpore',
        'Chikhli',
        'Kaliawadi',
        'Station Road',
        'Vijalpore',
        'Lunsikui',
        'Eru Char Rasta',
        'Bilimora',
      ],
      'Valsad': [
        'Dharampur',
        'Pardi',
        'Umbergaon',
        'Vapi GIDC',
        'Gunjan',
        'Tithal Road',
        'Kaprada',
        'Bhilad',
        'Chanod Colony',
      ],
      'Bharuch': [
        'Ankleshwar GIDC',
        'Jhagadia',
        'Jambusar',
        'Zadeshwar',
        'Bholav',
        'Station Road',
        'Valia',
        'Hansot',
      ],
    },
  },
  'North Gujarat': {
    cities: {
      'Mehsana': [
        'Kadi',
        'Visnagar',
        'Unjha APMC',
        'Vadnagar',
        'Vijapur',
        'Modhera Road',
        'Radhanpur Road',
        'GIDC Mehsana',
        'Becharaji',
      ],
      'Palanpur': [
        'Deesa Highway',
        'Dhanera',
        'Tharad',
        'Danta',
        'Vadgam',
        'Gathaman Gate',
        'Abu Road Highway',
        'Amirgarh',
      ],
      'Patan': [
        'Siddhpur',
        'Chanasma',
        'Radhanpur',
        'Harij',
        'Sami',
        'College Road',
        'GIDC Patan',
      ],
      'Himatnagar': [
        'Idar',
        'Prantij',
        'Talod',
        'Modasa',
        'Khedbrahma',
        'Bhiloda',
        'Mahavirnagar',
        'Motipura',
      ],
    },
  },
  'Central Gujarat': {
    cities: {
      'Ahmedabad': [
        'Maninagar',
        'Bopal',
        'SG Highway',
        'Naroda GIDC',
        'Satellite',
        'Chandkheda',
        'Ashram Road',
        'Nikol',
        'Gota',
        'Vastrapur',
        'C.G. Road',
        'Odhav GIDC',
        'Vatva GIDC',
        'Isanpur',
        'Thaltej',
        'Prahlad Nagar',
        'Navrangpura',
        'Paldi',
        'Naranpura',
        'Ranip',
        'Vastral',
        'Science City',
        'Shahibaug',
      ],
      'Gandhinagar': [
        'Sector 1-10',
        'Sector 11-20',
        'Sector 21-30',
        'Kudasan',
        'Raysan',
        'Infocity',
        'Kalol',
        'Mansa',
        'Vavol',
        'Sargasan',
        'Pethapur',
        'GIFT City',
      ],
      'Anand': [
        'Vallabh Vidyanagar',
        'Petlad',
        'Khambhat',
        'Borsad',
        'Umreth',
        'Karamsad',
        'Amul Dairy Road',
        'GIDC Vitthal Udyognagar',
        'Ankleshwar Road',
      ],
      'Nadiad': [
        'Kheda',
        'Matar',
        'Mahudha',
        'Kapadvanj',
        'Dakor',
        'College Road',
        'Station Road',
        'Chaklasi',
      ],
      'Vadodara': [
        'Alkapuri',
        'Manjalpur',
        'Karelibaug',
        'Gotri',
        'Sayajigunj',
        'Makarpura GIDC',
        'Waghodia Road',
        'Fatehgunj',
        'Akota',
        'Subhanpura',
        'Gorwa GIDC',
        'Vasna Road',
        'Sama-Savli Road',
      ],
    },
  },
  'Saurashtra': {
    cities: {
      'Rajkot': [
        'Kalawad Road',
        '150ft Ring Road',
        'Gondal Road',
        'Mavdi',
        'Bhaktinagar',
        'Aji GIDC',
        'Yagnik Road',
        'Kothariya',
        'University Road',
        'Madhapar',
        'Shapar-Veraval',
        'Metoda GIDC',
      ],
      'Jamnagar': [
        'Digjam Circle',
        'Patel Colony',
        'Ranjit Nagar',
        'Bedi',
        'GIDC Phase 1-3',
        'Khambhalia Gate',
        'Gulabnagar',
        'Samarpan Road',
      ],
      'Bhavnagar': [
        'Kaliyabid',
        'Waghawadi Road',
        'Ghogha Circle',
        'Chitra GIDC',
        'Sihor',
        'Mahuva',
        'Talaja',
        'Subhashnagar',
        'Ruva Pari',
      ],
      'Junagadh': [
        'Keshod',
        'Mangrol',
        'Manavadar',
        'Visavadar',
        'Zanzarda Road',
        'Moti Baug',
        'Joshipura',
        'Girdhar Nagar',
      ],
      'Morbi': [
        'Ceramic Industrial Zone',
        'Trajpar',
        'Sanala Road',
        'Wankaner',
        'Lakhdhirpur Road',
        'Halvad Road',
        'Mahendranagar',
      ],
      'Amreli': [
        'Dhari',
        'Rajula',
        'Savarkundla',
        'Jafrabad',
        'Babra',
        'Lathi',
        'Chital Road',
      ],
      'Porbandar': [
        'Chhaya',
        'Ranavav',
        'Kutiyana',
        'MG Road',
        'Bhojeswar',
        'Rokadia Hanuman',
      ],
    },
  },
};

/**
 * Helper to get all cities for a given zone
 */
export function getCitiesForZone(zoneName) {
  if (!zoneName || !GUJARAT_ZONES_TERRITORY[zoneName]) return [];
  return Object.keys(GUJARAT_ZONES_TERRITORY[zoneName].cities || {});
}

/**
 * Helper to get all areas for a zone + city
 */
export function getAreasForCity(zoneName, cityName) {
  if (!zoneName || !cityName) return [];
  const zoneData = GUJARAT_ZONES_TERRITORY[zoneName];
  if (!zoneData || !zoneData.cities) return [];

  // Match city case-insensitively
  const matchedKey = Object.keys(zoneData.cities).find(
    (c) => c.toLowerCase() === cityName.toLowerCase().trim()
  );

  return matchedKey ? zoneData.cities[matchedKey] || [] : [];
}
