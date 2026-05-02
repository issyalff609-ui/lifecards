const STARSIGNS = [
  { sign:'Capricorn',   symbol:'♑', months:[[12,22],[1,19]]  },
  { sign:'Aquarius',    symbol:'♒', months:[[1,20],[2,18]]   },
  { sign:'Pisces',      symbol:'♓', months:[[2,19],[3,20]]   },
  { sign:'Aries',       symbol:'♈', months:[[3,21],[4,19]]   },
  { sign:'Taurus',      symbol:'♉', months:[[4,20],[5,20]]   },
  { sign:'Gemini',      symbol:'♊', months:[[5,21],[6,20]]   },
  { sign:'Cancer',      symbol:'♋', months:[[6,21],[7,22]]   },
  { sign:'Leo',         symbol:'♌', months:[[7,23],[8,22]]   },
  { sign:'Virgo',       symbol:'♍', months:[[8,23],[9,22]]   },
  { sign:'Libra',       symbol:'♎', months:[[9,23],[10,22]]  },
  { sign:'Scorpio',     symbol:'♏', months:[[10,23],[11,21]] },
  { sign:'Sagittarius', symbol:'♐', months:[[11,22],[12,21]] },
];

function getStarSign(day, month) {
  for (const s of STARSIGNS) {
    const [m1,d1] = s.months[0], [m2,d2] = s.months[1];
    if ((month===m1 && day>=d1)||(month===m2 && day<=d2)) return s;
  }
  return STARSIGNS[0];
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function ordinal(n) {
  const s=['th','st','nd','rd'], v=n%100;
  return n+(s[(v-20)%10]||s[v]||s[0]);
}
