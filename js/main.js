TABS=document.querySelectorAll('.tab');

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
