// ═══════════════════════════════════════════════════════════
// DATA / APPEARANCE / AVATAAARS.JS
// ═══════════════════════════════════════════════════════════

const AVATAAARS = {

  skinColors: [
    'light', 'pale', 'mellow', 'wheat', 'tan', 'brown', 'darkBrown', 'black',
  ],

  hairColors: [
    'auburn', 'black', 'blonde', 'blondeGolden', 'brown',
    'brownDark', 'pastelPink', 'platinum', 'red', 'silverGray',
  ],

  // Hair styles split by gender for sensible randomisation
  // Full list: https://www.dicebear.com/styles/avataaars
  hairStyles: {
    male: [
      'shortHairShortFlat', 'shortHairShortRound', 'shortHairShortWaved',
      'shortHairDreads01', 'shortHairDreads02', 'shortHairFrizzle',
      'shortHairTheCaesar', 'shortHairTheCaesarSidePart',
    ],
    female: [
      'longHairBigHair', 'longHairBob', 'longHairBun', 'longHairCurly',
      'longHairCurvy', 'longHairDreads', 'longHairFrida', 'longHairFro',
      'longHairMiaWallace', 'longHairNotTooLong', 'longHairShavedSides',
      'longHairStraight', 'longHairStraight2', 'longHairStraightStrand',
    ],
    any: [
      'shortHairShortFlat', 'shortHairShortRound', 'longHairBun',
      'shortHairDreads01', 'longHairFro',
    ],
  },

  facialHair: {
    none:   'blank',
    styles: ['beardMedium', 'beardLight', 'beardMajestic', 'moustacheFancy', 'moustacheMagnum'],
  },

  facialHairColors: [
    'auburn', 'black', 'blonde', 'blondeGolden', 'brown', 'brownDark', 'platinum', 'red',
  ],

  clothing: {
    male:   ['hoodie', 'blazerShirt', 'blazerSweater', 'collarSweater', 'graphicShirt', 'shirtCrewNeck', 'shirtScoopNeck'],
    female: ['blazerShirt', 'blazerSweater', 'collarSweater', 'graphicShirt', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck'],
  },

  clothingColors: [
    'black', 'blue01', 'blue02', 'blue03', 'gray01', 'gray02',
    'heather', 'pastelBlue', 'pastelGreen', 'pastelOrange',
    'pastelRed', 'pastelYellow', 'pink', 'red', 'white',
  ],

  eyes: [
    'close', 'cry', 'default', 'dizzy', 'eyeRoll', 'happy',
    'hearts', 'side', 'squint', 'surprised', 'wink', 'winkWacky',
  ],

  eyebrows: [
    'angry', 'angryNatural', 'default', 'defaultNatural', 'flatNatural',
    'raisedExcited', 'raisedExcitedNatural', 'sadConcerned',
    'sadConcernedNatural', 'unibrowNatural', 'upDown', 'upDownNatural',
  ],

  mouths: [
    'concerned', 'default', 'disbelief', 'eating', 'grimace',
    'sad', 'screamOpen', 'serious', 'smile', 'tongue', 'twinkle', 'vomit',
  ],

  accessories: [
    'blank', 'kurt', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers',
  ],
};