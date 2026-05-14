const WX_ICONS={
  sun:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/></svg>`,
  sunCloud:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.6"/><path d="M8 2v1.4M8 12.6V14M2 8h1.4M14 8h-1.4M3.8 3.8l1 1M12.2 12.2l-1-1M3.8 12.2l1-1M12.2 3.8l-1 1"/><path d="M18.5 19.5a3.5 3.5 0 0 0 0-7 4.5 4.5 0 0 0-8.7-1.3 3 3 0 0 0-1.3 5.8h10z"/></svg>`,
  cloud:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 5.5 5.5 0 0 0-10.8 1.5 4 4 0 0 0 .3 7.5h10.5z"/></svg>`,
  rain:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 14.5a4.5 4.5 0 0 0 0-9 5.5 5.5 0 0 0-10.8 1.5 4 4 0 0 0 .3 7.5h10.5z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/></svg>`,
  drizzle:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 14.5a4.5 4.5 0 0 0 0-9 5.5 5.5 0 0 0-10.8 1.5 4 4 0 0 0 .3 7.5h10.5z"/><path d="M9 18.5v1.5M12 18.5v1.5M15 18.5v1.5"/></svg>`,
  snow:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 14.5a4.5 4.5 0 0 0 0-9 5.5 5.5 0 0 0-10.8 1.5 4 4 0 0 0 .3 7.5h10.5z"/><path d="M8 18v3M12 18v3M16 18v3M6.5 19.5l3-1M10.5 19.5l3-1M14.5 19.5l3-1M6.5 20.5l3 1M10.5 20.5l3 1M14.5 20.5l3 1"/></svg>`,
  fog:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M3 7.5h18M3 12h13M7 16.5h17M3 21h14"/></svg>`,
  showers:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2"/><path d="M6 2v1M6 9v1M2 6h1M9 6h1M3.3 3.3l.7.7M8 8l.7.7M3.3 8.7l.7-.7M8 4l.7-.7"/><path d="M19 16.5a3.5 3.5 0 0 0 0-7 4.5 4.5 0 0 0-8.7-1.3 3 3 0 0 0-1.3 5.8h10z"/><path d="M11 18.5l-1 2M15 18.5l-1 2"/></svg>`,
  storm:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 14a4.5 4.5 0 0 0 0-9 5.5 5.5 0 0 0-10.8 1.5 4 4 0 0 0 .3 7.5h10.5z"/><path d="M13 15.5l-2.5 4h2.5l-1 3"/></svg>`
};

function getWeatherIcon(code){
  if(code===0) return WX_ICONS.sun;
  if(code===1||code===2) return WX_ICONS.sunCloud;
  if(code===3) return WX_ICONS.cloud;
  if(code===45||code===48) return WX_ICONS.fog;
  if(code>=51&&code<=55) return WX_ICONS.drizzle;
  if(code>=61&&code<=65) return WX_ICONS.rain;
  if(code>=71&&code<=75) return WX_ICONS.snow;
  if(code>=80&&code<=82) return WX_ICONS.showers;
  if(code>=95) return WX_ICONS.storm;
  return '';
}

let wxRetryCount=0;
const WX_RETRY_DELAYS=[30000,60000,120000];
const WX_REGULAR_INTERVAL=10*60*1000;
let wxTimer=null;

function scheduleNextWeather(delay){
  clearTimeout(wxTimer);
  wxTimer=setTimeout(loadWeather,delay);
}

async function loadWeather(){
  try{
    const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude=33.7701&longitude=-118.1937&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,uv_index,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FLos_Angeles&forecast_days=5');
    if(!r.ok) throw new Error('http '+r.status);
    const d=await r.json();const c=d.current;
    const target=Math.round(c.temperature_2m);
    let cur=0;const step=Math.max(1,Math.ceil(target/50));
    const el=document.getElementById('wx-temp-big');
    const iv=setInterval(()=>{cur=Math.min(cur+step,target);el.textContent=cur;if(cur>=target)clearInterval(iv);},25);
    document.getElementById('wx-condition').textContent=WX_COND[c.weather_code]||'—';
    const iconEl=document.getElementById('wx-icon');
    if(iconEl) iconEl.innerHTML=getWeatherIcon(c.weather_code);
    document.getElementById('wx-fl').innerHTML=Math.round(c.apparent_temperature)+'<span class="ws-u">°</span>';
    document.getElementById('wx-hum').innerHTML=c.relative_humidity_2m+'<span class="ws-u">%</span>';
    document.getElementById('wx-wind').innerHTML=Math.round(c.wind_speed_10m)+'<span class="ws-u">mph</span>';
    document.getElementById('wx-uv').textContent=c.uv_index??'—';
    const fc=document.getElementById('wx-fc');fc.innerHTML='';
    const allMax=d.daily.temperature_2m_max.slice(1,5);
    const allMin=d.daily.temperature_2m_min.slice(1,5);
    const rangeMax=Math.max(...allMax),rangeMin=Math.min(...allMin),rangeSpan=rangeMax-rangeMin||1;
    for(let i=1;i<=4;i++){
      const dt=new Date(d.daily.time[i]+'T12:00:00');
      const hi=Math.round(d.daily.temperature_2m_max[i]);
      const lo=Math.round(d.daily.temperature_2m_min[i]);
      const barW=Math.round(((hi-rangeMin)/rangeSpan)*100);
      const code=d.daily.weather_code[i];
      const el=document.createElement('div');el.className='fc';
      el.innerHTML=`<div class="fc-n">${DAYS[dt.getDay()]}</div><div class="fc-icon">${getWeatherIcon(code)}</div><div class="fc-cond">${WX_SHORT[code]||'—'}</div><div class="fc-temps"><span class="fc-h">${hi}°</span><span class="fc-lo">${lo}°</span></div><div class="fc-bar"><div class="fc-bar-fill" style="width:${barW}%"></div></div>`;
      fc.appendChild(el);
    }
    wxRetryCount=0;
    scheduleNextWeather(WX_REGULAR_INTERVAL);
  }catch(e){
    document.getElementById('wx-condition').textContent='Unavailable';
    const delay=WX_RETRY_DELAYS[Math.min(wxRetryCount,WX_RETRY_DELAYS.length-1)];
    wxRetryCount++;
    scheduleNextWeather(delay);
  }
}
