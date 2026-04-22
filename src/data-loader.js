
// Initial Data Loader
fetch('./data/initial-data.json')
  .then(r => r.json())
  .then(data => {
    localStorage.setItem('ventureData', JSON.stringify(data));
    console.log('[venture-ctrl] Initial data loaded');
  })
  .catch(e => console.warn('[venture-ctrl] Using default data'));
