// ===== API ключ WeatherAPI.com =====
const API_KEY = '58e306a4f7794e728dd153727260811';

// ===== Коды погоды и их описание =====
const weatherCodes = {
    'Sunny': { desc: 'Ясно', icon: '☀️' },
    'Partly cloudy': { desc: 'Малооблачно', icon: '🌤️' },
    'Overcast': { desc: 'Пасмурно', icon: '☁️' },
    'Mist': { desc: 'Туман', icon: '🌫️' },
    'Patchy rain possible': { desc: 'Небольшой дождь', icon: '🌦️' },
    'Patchy rain nearby': { desc: 'Небольшой дождь', icon: '🌦️' },
    'Heavy rain': { desc: 'Сильный дождь', icon: '🌧️' },
    'Moderate rain': { desc: 'Дождь', icon: '🌧️' },
    'Light rain': { desc: 'Небольшой дождь', icon: '🌦️' },
    'Thundery outbreaks possible': { desc: 'Гроза', icon: '⛈️' },
    'Blizzard': { desc: 'Метель', icon: '❄️' },
    'Heavy snow': { desc: 'Сильный снег', icon: '❄️' },
    'Moderate snow': { desc: 'Снег', icon: '❄️' },
    'Light snow': { desc: 'Небольшой снег', icon: '🌨️' },
    'Ice pellets': { desc: 'Ледяной дождь', icon: '🌧️' },
    'Fog': { desc: 'Туман', icon: '🌫️' }
};

function getWeatherInfo(conditionText) {
    return weatherCodes[conditionText] || { desc: conditionText || 'Неизвестно', icon: '🌡️' };
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

// ===== Отображение текущей погоды =====
function displayCurrentWeather(data) {
    const current = data.current;
    const location = data.location;
    const info = getWeatherInfo(current.condition.text);

    document.getElementById('city-name').textContent = location.name + ', ' + location.country;
    document.getElementById('weather-date').textContent = formatDate(new Date(location.localtime));
    document.getElementById('weather-icon').textContent = info.icon;
    document.getElementById('temperature').textContent = Math.round(current.temp_c);
    document.getElementById('weather-description').textContent = info.desc;
    document.getElementById('humidity').textContent = current.humidity + '%';
    document.getElementById('wind').textContent = Math.round(current.wind_kph) + ' км/ч';
    document.getElementById('feels-like').textContent = Math.round(current.feelslike_c) + '°';
    document.getElementById('clouds').textContent = current.cloud + '%';

    currentWeather.style.display = 'block';
}

// ===== Отображение прогноза =====
function displayForecast(data) {
    const forecast = data.forecast;
    forecastGrid.innerHTML = '';

    forecast.forecastday.forEach(day => {
        const info = getWeatherInfo(day.day.condition.text);
        const card = document.createElement('div');
        card.className = 'forecast__card';
        card.innerHTML = `
            <div class="forecast__day">${formatDay(day.date)}</div>
            <div class="forecast__icon">${info.icon}</div>
            <div class="forecast__temp-range">
                <span class="temp-max">${Math.round(day.day.maxtemp_c)}°</span>
                <span class="temp-min">${Math.round(day.day.mintemp_c)}°</span>
            </div>
            <div class="forecast__desc">${info.desc}</div>
        `;
        forecastGrid.appendChild(card);
    });

    forecastSection.style.display = 'block';
}

// ===== Виджет 1: УФ-индекс =====
function displayUVWidget(data) {
    const uv = data.current.uv;
    
    let level, levelClass, advice;
    if (uv <= 2) {
        level = 'Низкий';
        levelClass = 'uv-low';
        advice = 'Можно находиться на солнце без защиты.';
    } else if (uv <= 5) {
        level = 'Умеренный';
        levelClass = 'uv-moderate';
        advice = 'Используйте солнцезащитный крем SPF 30+.';
    } else if (uv <= 7) {
        level = 'Высокий';
        levelClass = 'uv-high';
        advice = 'Избегайте солнца с 10 до 16 часов.';
    } else if (uv <= 10) {
        level = 'Очень высокий';
        levelClass = 'uv-very-high';
        advice = 'Минимизируйте пребывание на солнце.';
    } else {
        level = 'Экстремальный';
        levelClass = 'uv-extreme';
        advice = 'Избегайте выхода на солнце!';
    }

    document.getElementById('uv-value').textContent = uv;
    document.getElementById('uv-level').textContent = level;
    document.getElementById('uv-level').className = `widget__level ${levelClass}`;
    document.getElementById('uv-advice').textContent = advice;
    document.getElementById('uv-bar').style.width = Math.min((uv / 11) * 100, 100) + '%';
}

// ===== Виджет 2: Восход/Закат =====
function displaySunWidget(data) {
    const forecast = data.forecast;
    const today = forecast.forecastday[0];
    const astro = today.astro;
    
    document.getElementById('sunrise').textContent = astro.sunrise;
    document.getElementById('sunset').textContent = astro.sunset;

    // Простой прогресс-бар (ориентировочно)
    document.getElementById('day-progress').style.width = '50%';
    document.getElementById('day-percent').textContent = '50%';
}

// ===== Виджет 3: Качество воздуха (заглушка) =====
function displayAirWidget(data) {
    document.getElementById('aqi-value').textContent = '—';
    document.getElementById('aqi-level').textContent = 'Недоступно';
    document.getElementById('aqi-level').className = 'widget__level';
    document.getElementById('air-advice').textContent = 'Данные о качестве воздуха недоступны.';
}

// ===== Основная функция поиска =====
async function getWeather(city) {
    hideError();

    try {
        // Текущая погода + прогноз
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=7&lang=ru`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 400) {
                throw new Error('Город не найден');
            } else if (response.status === 403) {
                throw new Error('Ошибка API ключа');
            } else {
                throw new Error('Ошибка получения данных');
            }
        }
        
        const data = await response.json();
        
        displayCurrentWeather(data);
        displayForecast(data);
        displayUVWidget(data);
        displaySunWidget(data);
        displayAirWidget(data);
        widgetsSection.style.display = 'block';
        emptyState.style.display = 'none';
        
    } catch (err) {
        showError(err.message || 'Не удалось загрузить погоду');
        console.error(err);
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
                const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=7&lang=ru`;
                const response = await fetch(url);
                const data = await response.json();
                
                displayCurrentWeather(data);
                displayForecast(data);
                displayUVWidget(data);
                displaySunWidget(data);
                displayAirWidget(data);
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
