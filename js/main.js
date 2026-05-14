TABS=document.querySelectorAll('.tab');

let _cursorTimer;
function activateCursor(){
  document.body.classList.add('cursor-active');
  clearTimeout(_cursorTimer);
  _cursorTimer=setTimeout(()=>document.body.classList.remove('cursor-active'),3000);
}
document.addEventListener('mousemove',activateCursor);
document.addEventListener('mousedown',activateCursor);

initSettings();
applyInfo();

renderEvents();
initEventEditor();

renderDirectory();
initDirectoryEditor();

initInfoEditor();

tick();
setInterval(tick,1000);

initBackground();

loadWeather();

goMode(0);
