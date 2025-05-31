// Fetch and display global stats
async function fetchGlobalData() {
  try {
    const response = await fetch('https://disease.sh/v3/covid-19/all');
    const data = await response.json();
    document.getElementById('totalCases').textContent = data.cases.toLocaleString();
    document.getElementById('totalDeaths').textContent = data.deaths.toLocaleString();
    document.getElementById('totalRecovered').textContent = data.recovered.toLocaleString();
    document.getElementById('activeCases').textContent = data.active.toLocaleString();

    // Global Chart
    const ctx = document.getElementById('globalChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Cases', 'Deaths', 'Recovered', 'Active'],
        datasets: [{
          label: 'Global COVID-19 Stats',
          data: [data.cases, data.deaths, data.recovered, data.active],
          backgroundColor: ['#60A5FA', '#F87171', '#34D399', '#60A5FA'],
          borderWidth: 1,
          borderColor: '#1F2937',
          borderRadius: 8,
          barThickness: 40
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: 'rgba(0, 0, 0, 0.8)', cornerRadius: 8 } }
      }
    });
  } catch (error) {
    console.error('Error fetching global data:', error);
  }
}

// Fetch and populate country list
async function fetchCountries() {
  try {
    const response = await fetch('https://disease.sh/v3/covid-19/countries');
    const data = await response.json();
    const countrySelects = document.querySelectorAll('#countrySelect');
    countrySelects.forEach(select => {
      data.forEach(country => {
        const option = document.createElement('option');
        option.value = country.country;
        option.textContent = country.country;
        select.appendChild(option);
      });
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
  }
}

// Fetch and display country stats and trends
async function fetchCountryData(country, days = 180) {
  try {
    console.log(`Fetching data for country: ${country}, days: ${days}`);
    const statsResponse = await fetch(`https://disease.sh/v3/covid-19/countries/${country}`);
    const stats = await statsResponse.json();
    const trendResponse = await fetch(`https://disease.sh/v3/covid-19/historical/${country}?lastdays=${days}`);
    const trend = await trendResponse.json();

    // Update title and stats
    document.getElementById('countryTitle').textContent = `${country} COVID-19 Stats`;
    document.getElementById('countryCases').textContent = stats.cases.toLocaleString();
    document.getElementById('countryDeaths').textContent = stats.deaths.toLocaleString();
    document.getElementById('countryRecovered').textContent = stats.recovered.toLocaleString();
    document.getElementById('todayCases').textContent = stats.todayCases.toLocaleString();
    document.getElementById('countryStats').classList.remove('hidden');
    document.getElementById('loading').classList.add('hidden');

    // Trend Chart
    const dates = Object.keys(trend.timeline.cases);
    const cases = Object.values(trend.timeline.cases);
    const deaths = Object.values(trend.timeline.deaths);
    const ctx = document.getElementById('trendChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Cases',
            data: cases,
            borderColor: '#60A5FA',
            backgroundColor: 'rgba(96, 165, 250, 0.2)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#60A5FA',
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Deaths',
            data: deaths,
            borderColor: '#F87171',
            backgroundColor: 'rgba(248, 113, 113, 0.2)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#F87171',
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
          x: { grid: { display: false }, ticks: { autoSkip: true, maxTicksLimit: 10 } }
        },
        plugins: { tooltip: { enabled: true, backgroundColor: 'rgba(0, 0, 0, 0.8)', cornerRadius: 8 } }
      }
    });
  } catch (error) {
    console.error('Error fetching country data:', error);
    document.getElementById('loading').classList.add('hidden');
  }
}

// Handle country selection and redirect
function setupCountryRedirect() {
  const buttons = document.querySelectorAll('#viewCountry');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const container = button.closest('.flex');
      const countrySelect = container ? container.querySelector('#countrySelect') : null;
      const country = countrySelect ? countrySelect.value : '';
      console.log('Selected country:', country);
      if (country) {
        if (document.getElementById('trendChart')) {
          const timeRangeSelect = document.getElementById('timeRangeSelect');
          const days = timeRangeSelect ? timeRangeSelect.value : '180';
          console.log('On country page, reloading data for:', country, 'days:', days);
          document.getElementById('loading').classList.remove('hidden');
          document.getElementById('countryStats').classList.add('hidden');
          fetchCountryData(country, days);
        } else {
          console.log('Redirecting to country.html for:', country);
          window.location.href = `country.html?country=${encodeURIComponent(country)}`;
        }
      } else {
        console.log('No country selected');
        alert('Please select a country from the dropdown.');
      }
    });
  });
}

// Handle time range selection
function setupTimeRangeSelector() {
  const timeRangeSelect = document.getElementById('timeRangeSelect');
  if (timeRangeSelect) {
    timeRangeSelect.addEventListener('change', () => {
      const days = timeRangeSelect.value;
      const countrySelect = document.getElementById('countrySelect');
      const country = countrySelect.value || new URLSearchParams(window.location.search).get('country');
      console.log('Time range changed to:', days, 'for country:', country);
      if (country) {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('countryStats').classList.add('hidden');
        fetchCountryData(country, days);
      } else {
        alert('Please select a country first.');
      }
    });
  }
}

// Parse URL and load country data on country.html
function loadCountryData() {
  const params = new URLSearchParams(window.location.search);
  const country = params.get('country');
  console.log('URL parameter country:', country);
  if (country && document.getElementById('countryStats')) {
    const timeRangeSelect = document.getElementById('timeRangeSelect');
    const days = timeRangeSelect ? timeRangeSelect.value : '180';
    fetchCountryData(country, days);
  } else {
    document.getElementById('loading').classList.add('hidden');
    console.log('No country in URL or no countryStats element');
  }
}

// Initialize based on page
if (document.getElementById('globalChart')) {
  console.log('Initializing home page');
  fetchGlobalData();
  fetchCountries();
  setupCountryRedirect();
} else if (document.getElementById('trendChart')) {
  console.log('Initializing country page');
  fetchCountries();
  setupCountryRedirect();
  setupTimeRangeSelector();
  loadCountryData();
}