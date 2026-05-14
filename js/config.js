const BASE='https://b3250884.smushcdn.com/3250884/wp-content/uploads/2026/03/';
const Q='?lossy=2&strip=1&webp=1';
const PHOTOS=[
  'TheWaterfrontAtCatalinaLanding_Exterior-00.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-1.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-2.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-3.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-4.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-5.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-6.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-7.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-9.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-11.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-13.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-01.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-02.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-05.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-07.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-09.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-11.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-13.jpg',
  'TheWaterfrontAtCatalinaLanding_SeaFloor-1.jpg',
  'TheWaterfrontAtCatalinaLanding_SeaFloor-3.jpg',
  'TheWaterfrontAtCatalinaLanding_SeaFloor-8.jpg',
].map(f=>BASE+f+Q);

const WX_COND={0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Fog',48:'Freezing Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',61:'Light Rain',63:'Moderate Rain',65:'Heavy Rain',71:'Light Snow',73:'Moderate Snow',75:'Heavy Snow',80:'Showers',81:'Rain Showers',82:'Heavy Showers',95:'Thunderstorm',96:'Thunderstorm',99:'Severe Storm'};
const WX_SHORT={0:'Clear',1:'Mostly Clear',2:'Pt. Cloudy',3:'Overcast',45:'Fog',48:'Fog',51:'Drizzle',53:'Drizzle',55:'Rain',61:'Rain',63:'Rain',65:'Rain',71:'Snow',73:'Snow',75:'Snow',80:'Showers',81:'Showers',82:'Showers',95:'Storm',96:'Storm',99:'Storm'};
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MODES=['pw','pdir','pevt','pphoto'];
const DURS=[10000,15000,12000,12000];
