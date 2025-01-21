const API_KEY = '5c18231daac9c30c66e623788c43d5a6'; // Replace with your OpenWeather API key
const weatherIcon = document.getElementById('weather-icon');
const tempDiv = document.getElementById('temp-div');
const weatherInfo = document.getElementById('weather-info');
const hourlyForecast = document.getElementById('hourly-forecast');
const currentDate = document.getElementById('current-date');
const humiditySpan = document.getElementById('humidity');
const windSpan = document.getElementById('wind');
const sunriseSpan = document.getElementById('sunrise');
const sunsetSpan = document.getElementById('sunset');

// Weather icon mapping
const weatherIconMap = {
    '01d': 'wi-day-sunny',
    '01n': 'wi-night-clear',
    '02d': 'wi-day-cloudy',
    '02n': 'wi-night-alt-cloudy',
    '03d': 'wi-cloud',
    '03n': 'wi-cloud',
    '04d': 'wi-cloudy',
    '04n': 'wi-cloudy',
    '09d': 'wi-showers',
    '09n': 'wi-showers',
    '10d': 'wi-day-rain',
    '10n': 'wi-night-alt-rain',
    '11d': 'wi-thunderstorm',
    '11n': 'wi-thunderstorm',
    '13d': 'wi-snow',
    '13n': 'wi-snow',
    '50d': 'wi-fog',
    '50n': 'wi-fog'
};

// Format time function
function formatTime(timestamp) {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Format date
function formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Update current date
function updateCurrentDate() {
    const now = new Date();
    currentDate.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Function to update air quality
function updateAirQuality(aqiValue) {
    const aqiNumber = document.getElementById('aqi');
    const aqiText = document.getElementById('aqi-text');
    
    aqiNumber.textContent = aqiValue;
    
    let aqiDescription;
    let color;
    
    switch(aqiValue) {
        case 1:
            aqiDescription = 'Good';
            color = '#4ade80';
            break;
        case 2:
            aqiDescription = 'Fair';
            color = '#fbbf24';
            break;
        case 3:
            aqiDescription = 'Moderate';
            color = '#fb923c';
            break;
        case 4:
            aqiDescription = 'Poor';
            color = '#ef4444';
            break;
        case 5:
            aqiDescription = 'Very Poor';
            color = '#7f1d1d';
            break;
        default:
            aqiDescription = 'Unknown';
            color = '#94a3b8';
    }
    
    aqiText.textContent = aqiDescription;
    aqiNumber.style.color = color;
}

// Main weather fetching function
async function getWeather() {
    const cityInput = document.getElementById('city');
    const city = cityInput.value.trim();

    if (!city) return;

    try {
        // Get coordinates
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.length) {
            throw new Error('City not found');
        }

        const { lat, lon } = geoData[0];

        // Fetch all data in parallel
        const [weatherData, forecastData, airQualityData] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`).then(res => res.json()),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`).then(res => res.json()),
            fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`).then(res => res.json())
        ]);

        // Update current weather
        weatherIcon.className = `wi ${weatherIconMap[weatherData.weather[0].icon]}`;
        tempDiv.textContent = `${Math.round(weatherData.main.temp)}°C`;
        weatherInfo.textContent = weatherData.weather[0].description;
        humiditySpan.textContent = `${weatherData.main.humidity}%`;
        windSpan.textContent = `${Math.round(weatherData.wind.speed)} m/s`;
        
        // Update sunrise/sunset
        sunriseSpan.textContent = formatTime(weatherData.sys.sunrise);
        sunsetSpan.textContent = formatTime(weatherData.sys.sunset);

        // Update air quality
        if (airQualityData && airQualityData.list && airQualityData.list[0]) {
            updateAirQuality(airQualityData.list[0].main.aqi);
        }

        // Update current date
        updateCurrentDate();

        // Update hourly forecast
        hourlyForecast.innerHTML = '';
        const next24Hours = forecastData.list.slice(0, 8);

        next24Hours.forEach(hour => {
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            
            forecastItem.innerHTML = `
                <div class="forecast-time">${formatTime(hour.dt)}</div>
                <i class="wi ${weatherIconMap[hour.weather[0].icon]}"></i>
                <div class="forecast-temp">${Math.round(hour.main.temp)}°C</div>
                <div class="forecast-desc">${hour.weather[0].description}</div>
            `;
            
            hourlyForecast.appendChild(forecastItem);
        });

    } catch (error) {
        console.error('Error:', error);
        weatherInfo.textContent = 'Error fetching weather data. Please try again.';
    }
}

// Initialize current date
updateCurrentDate();

// Add enter key support for search
document.getElementById('city').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getWeather();
    }
});

// Load default city on page load (optional)
window.addEventListener('load', () => {
    document.getElementById('city').value = 'London';
    getWeather();
});