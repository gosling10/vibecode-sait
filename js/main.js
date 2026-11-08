// ===== Коды погоды WMO и их описание =====
const weatherCodes = {
    0: { desc: 'Ясно', icon: '☀️' },
    1: { desc: 'Преимущественно ясно', icon: '🌤️' },
    2: { desc: 'Переменная облачность', icon: '⛅' },
    3: { desc: 'Пасмурно', icon: '☁️' },
    45: { desc: 'Туман', icon: '🌫️' },
    48: { desc: 'Изморозь', icon: '🌫️' },
    51: { desc: 'Лёгкая морось', icon: '🌦️' },
    53: { desc: 'Морось', icon: '🌦️' },
    55: { desc: 'Сильная морось', icon: '🌧️' },
    56: { desc: 'Ледяная морось', icon: '🌧️' },
    57: { desc: 'Сильная ледяная морось', icon: '🌧️' },
    61: { desc: 'Небольшой дождь', icon: '🌦️' },
    63: { desc: 'Дождь', icon: '🌧️' },
    65: { desc: 'Сильный дождь', icon: '🌧️' },
    66: { desc: 'Ледяной дождь', icon: '🌧️' },
    67: { desc: 'Сильный ледяной дождь', icon: '🌧️' },
    71: { desc: 'Небольшой снег', icon: '🌨️' },
    73: { desc: 'Снег', icon: '❄️' },
    75: { desc: 'Сильный снег', icon: '❄️' },
    77: { desc: 'Снежная крупа', icon: '❄️' },
    80: { desc: 'Небольшой ливень', icon: '🌦️' },
    81: { desc: 'Ливень', icon: '🌧️' },
    82: { desc: 'Сильный ливень', icon: '🌧️' },
    85: { desc: 'Небольшой снегопад', icon: '🌨️' },
    86: { desc: 'Сильный снегопад', icon: '❄️' },
    95: { desc: 'Гроза', icon: '⛈️' },
    96: { desc: 'Гроза с градом', icon: '⛈️' },
    99: { desc: 'Сильная гроза с градом', icon: '⛈️' }
};

function getWeatherInfo(code) {
    return weatherCodes[code] || { desc: 'Неизвестно', icon: '🌡️' };
}

// ===== Элементы DOM =====
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const geoBtn = document.getElementById('geo-btn');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const currentWeather = document.getElementById('current-weather');
const forecastSection = document.getElementById('forecast');
const forecastGrid = document.getElementById('forecast-grid');
const widgetsSection = document.getElementById('widgets');

// ===== Показать ошибку =====
function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.add('visible');
    setTimeout(() => {
        errorMessage.classList.remove('visible');
    }, 4000);
}

// ===== Скрыть ошибку =====
function hideError() {
    errorMessage.classList.remove('visible');
}

// ===== Форматирование даты =====
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatDay(dateStr) {
    const date = new Date(dateStr + 'T12:00:00');
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// ===== Поиск города через Nominatim =====
async function searchCity(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=ru`;
    const response = await fetch(url, {
        headers: { 'User-Agent': 'WeatherApp/1.0' }
    });
    if (!response.ok) throw new Error('Ошибка поиска города');
    const data = await response.json();
    if (data.length === 0) throw new Error('Город не найден');
    return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        name: data[0].name
    };
}

// ===== Получение погоды =====
async function fetchWeather(lat, lon, cityName) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m` +
        `&hourly=uv_index,pressure_msl,aqi` +
        `&daily=sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min` +
        `&timezone=auto&forecast_days=7`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Ошибка получения данных');
    return await response.json();
}

// ===== Отображение текущей погоды =====
function displayCurrentWeather(data, cityName) {
    const current = data.current;
    const weather = getWeatherInfo(current.weather_code);

    document.getElementById('city-name').textContent = cityName;
    document.getElementById('weather-date').textContent = formatDate(data.current.time);
    document.getElementById('weather-icon').textContent = weather.icon;
    document.getElementById('temperature').textContent = Math.round(current.temperature_2m);
    document.getElementById('weather-description').textContent = weather.desc;
    document.getElementById('humidity').textContent = current.relative_humidity_2m + '%';
    document.getElementById('wind').textContent = Math.round(current.wind_speed_10m) + ' км/ч';
    document.getElementById('feels-like').textContent = Math.round(current.apparent_temperature) + '°';
    document.getElementById('clouds').textContent = current.cloud_cover + '%';

    currentWeather.style.display = 'block';
}

// ===== Отображение прогноза =====
function displayForecast(data) {
    const daily = data.daily;
    forecastGrid.innerHTML = '';

    for (let i = 0; i < daily.time.length; i++) {
        const weather = getWeatherInfo(daily.weather_code[i]);
        const card = document.createElement('div');
        card.className = 'forecast__card';
        card.innerHTML = `
            <div class="forecast__day">${formatDay(daily.time[i])}</div>
            <div class="forecast__icon">${weather.icon}</div>
            <div class="forecast__temp-range">
                <span class="temp-max">${Math.round(daily.temperature_2m_max[i])}°</span>
                <span class="temp-min">${Math.round(daily.temperature_2m_min[i])}°</span>
            </div>
        `;
        forecastGrid.appendChild(card);
    }

    forecastSection.style.display = 'block';
}

// ===== Виджет 1: УФ-индекс =====
function displayUVWidget(data) {
    const hourly = data.hourly;
    const currentTime = data.current.time;
    
    // Находим текущий индекс UV
    let uvIndex = 0;
    const timeIndex = hourly.time.indexOf(currentTime);
    if (timeIndex !== -1) {
        uvIndex = hourly.uv_index[timeIndex];
    }

    // Определяем уровень
    let level, levelClass, advice;
    if (uvIndex <= 2) {
        level = 'Низкий';
        levelClass = 'uv-low';
        advice = 'Можно находиться на солнце без защиты.';
    } else if (uvIndex <= 5) {
        level = 'Умеренный';
        levelClass = 'uv-moderate';
        advice = 'Используйте солнцезащитный крем SPF 30+.';
    } else if (uvIndex <= 7) {
        level = 'Высокий';
        levelClass = 'uv-high';
        advice = 'Избегайте солнца с 10 до 16 часов.';
    } else if (uvIndex <= 10) {
        level = 'Очень высокий';
        levelClass = 'uv-very-high';
        advice = 'Минимизируйте пребывание на солнце.';
    } else {
        level = 'Экстремальный';
        levelClass = 'uv-extreme';
        advice = 'Избегайте выхода на солнце!';
    }

    document.getElementById('uv-value').textContent = uvIndex.toFixed(1);
    document.getElementById('uv-level').textContent = level;
    document.getElementById('uv-level').className = `widget__level ${levelClass}`;
    document.getElementById('uv-advice').textContent = advice;
    document.getElementById('uv-bar').style.width = Math.min((uvIndex / 11) * 100, 100) + '%';
}

// ===== Виджет 2: Восход/Закат =====
function displaySunWidget(data) {
    const daily = data.daily;
    const currentTime = data.current.time;
    
    const sunrise = daily.sunrise[0];
    const sunset = daily.sunset[0];
    
    document.getElementById('sunrise').textContent = formatTime(sunrise);
    document.getElementById('sunset').textContent = formatTime(sunset);

    // Вычисляем прогресс дня
    const sunriseDate = new Date(sunrise);
    const sunsetDate = new Date(sunset);
    const currentDate = new Date(currentTime);
    
    const totalDaylight = sunsetDate - sunriseDate;
    const elapsed = currentDate - sunriseDate;
    const progress = Math.max(0, Math.min(100, (elapsed / totalDaylight) * 100));
    
    document.getElementById('day-progress').style.width = progress + '%';
    document.getElementById('day-percent').textContent = Math.round(progress) + '%';
}

// ===== Виджет 3: Качество воздуха =====
function displayAirWidget(data) {
    const hourly = data.hourly;
    const currentTime = data.current.time;
    
    // Находим текущий индекс AQI
    let aqi = 0;
    const timeIndex = hourly.time.indexOf(currentTime);
    if (timeIndex !== -1) {
        aqi = hourly.aqi[timeIndex];
    }

    // Определяем уровень
    let level, levelClass;
    if (aqi <= 25) {
        level = 'Отличное';
        levelClass = 'uv-low';
    } else if (aqi <= 50) {
        level = 'Хорошее';
        levelClass = 'uv-moderate';
    } else if (aqi <= 75) {
        level = 'Удовлетворительное';
        levelClass = 'uv-moderate';
    } else if (aqi <= 100) {
        level = 'Плохое';
        levelClass = 'uv-high';
    } else {
        level = 'Очень плохое';
        levelClass = 'uv-very-high';
    }

    document.getElementById('aqi-value').textContent = aqi;
    document.getElementById('aqi-level').textContent = level;
    document.getElementById('aqi-level').className = `widget__level ${levelClass}`;
    document.getElementById('air-advice').textContent = aqi <= 50 ? 'Отличное качество воздуха для прогулок.' : 'Рекомендуется ограничить пребывание на улице.';
}

// ===== Основная функция поиска =====
async function getWeather(city) {
    hideError();

    try {
        const location = await searchCity(city);
        const weatherData = await fetchWeather(location.lat, location.lon, location.name);
        displayCurrentWeather(weatherData, location.name);
        displayForecast(weatherData);
        displayUVWidget(weatherData);
        displaySunWidget(weatherData);
        displayAirWidget(weatherData);
        widgetsSection.style.display = 'block';
        emptyState.style.display = 'none';
    } catch (err) {
        showError(err.message || 'Не удалось загрузить погоду');
    }
}

// ===== Геолокация =====
function getUserLocation() {
    if (!navigator.geolocation) {
        showError('Геолокация не поддерживается браузером');
        return;
    }

    geoBtn.textContent = '⏳';

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                const weatherData = await fetchWeather(lat, lon, 'Моё местоположение');
                displayCurrentWeather(weatherData, 'Моё местоположение');
                displayForecast(weatherData);
                displayUVWidget(weatherData);
                displaySunWidget(weatherData);
                displayAirWidget(weatherData);
                widgetsSection.style.display = 'block';
                emptyState.style.display = 'none';
            } catch (err) {
                showError(err.message || 'Ошибка получения погоды');
            } finally {
                geoBtn.textContent = '📍';
            }
        },
        (error) => {
            geoBtn.textContent = '📍';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    showError('Доступ к геолокации запрещён');
                    break;
                case error.POSITION_UNAVAILABLE:
                    showError('Не удалось определить местоположение');
                    break;
                case error.TIMEOUT:
                    showError('Превышено время ожидания');
                    break;
            }
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

// ===== Обработчики событий =====
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
    }
});

geoBtn.addEventListener('click', getUserLocation);
