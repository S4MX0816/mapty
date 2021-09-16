'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnDeleteAll = document.querySelector('.workouts__delete__all__text');

let map, mapEvent;

class WorkOut {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _getDescription() {
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        this.description = `${this.type.replace(
            this.type[0],
            this.type[0].toUpperCase()
        )} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Running extends WorkOut {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._getDescription();
    }

    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends WorkOut {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._getDescription();
    }

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

class App {
    #map;
    #mapEvent;
    #mapZoom = 15;
    #workouts = [];
    #markers = [];
    constructor() {
        this._getPosition();
        this._getLocalStorage();

        form.addEventListener('submit', this._newWorkOut.bind(this));
        inputType.addEventListener(
            'change',
            this._toggleElevationField.bind(this)
        );
        containerWorkouts.addEventListener(
            'click',
            this._containerFunctions.bind(this)
        );
        btnDeleteAll.addEventListener('click', this.reset);
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () {
                    alert('Could not get your location');
                }
            );
        }
    }

    _loadMap(position) {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];

        console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        this.#map = L.map('map').setView(coords, this.#mapZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));

        this.#workouts.forEach(work => this._renderWorkoutMarker(work));
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        // clearing input fields
        inputDistance.value =
            inputDuration.value =
            inputCadence.value =
            inputElevation.value =
                '';

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 10);
    }

    _toggleElevationField() {
        inputCadence
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
        inputElevation
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
    }

    _newWorkOut(e) {
        const validNumber = (...inputs) =>
            inputs.every(ev => Number.isFinite(ev));

        const allPostive = (...inputs) => inputs.every(ev => ev > 0);

        e.preventDefault();

        // Get data from the form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        // Check workout running and create its object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            if (
                !validNumber(distance, duration, cadence) ||
                !allPostive(distance, duration, cadence)
            )
                return alert('Enter valid data');

            workout = new Running([lat, lng], distance, duration, cadence);
        }

        // Check workout cycling and create its object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (
                !validNumber(distance, duration, elevation) ||
                !allPostive(distance, duration)
            )
                return alert('Enter valid data');

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        //Add new object to workout array
        this.#workouts.push(workout);

        // Render workout on map
        this._renderWorkoutMarker(workout);

        // Render workout on list
        this._renderWorkout(workout);

        // Hide Form
        this._hideForm();

        // Set local storage
        this._setLocalStorage();
    }

    _renderWorkoutMarker(workout) {
        const popupOptions = {
            maxWidth: 250,
            maxHeight: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
        };

        const mark = L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(L.popup(popupOptions))
            .setPopupContent(
                `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${
                    workout.description
                }`
            );

        mark.openPopup();
        this.#markers.push(mark);
    }

    _renderWorkout(workout) {
        if (this.#workouts.length === 2) {
            btnDeleteAll.parentElement.style.display = 'flex';
        }

        let html = `
            <li class="workout workout--${workout.type}" data-id="${
            workout.id
        }">
            <h2 class="workout__title">${workout.description}</h2>
            <p class='workout__delete'>X</p>
            <div class="workout__details">
                <span class="workout__icon">${
                    workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
                }</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
            `;
        if (workout.type === 'running')
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(
                        1
                    )}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>`;
        if (workout.type === 'cycling')
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed.toFixed(
                        1
                    )}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>`;

        form.insertAdjacentHTML('afterend', html);
    }

    _containerFunctions(e) {
        const workoutEl = e.target.closest('.workout');
        if (e.target.classList.contains('workout__delete')) {
            this._deleteWorkout(workoutEl);
            return;
        }
        this._gotoPopup(workoutEl);
    }

    _deleteWorkout(workoutEl) {
        const index = this.#workouts.findIndex(
            work => work.id === workoutEl.dataset.id
        );

        workoutEl.remove();
        this.#workouts.splice(index, 1);
        if (this.#workouts.length < 2) {
            btnDeleteAll.parentElement.style.display = 'none';
        }
        this.#markers.forEach(mark => this.#map.removeLayer(mark));
        this.#markers.splice(index, 1);
        this.#workouts.forEach(work => this._renderWorkoutMarker(work));
        this._setLocalStorage();
    }

    _gotoPopup(workoutEl) {
        const mapOptions = {
            animate: true,
            pan: {
                duration: 1,
            },
        };

        if (!workoutEl) return;

        const workout = this.#workouts.find(
            workout => workout.id === workoutEl.dataset.id
        );

        this.#map.setView(workout.coords, this.#mapZoom, mapOptions);
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));

        if (!data) return;

        this.#workouts = data;
        this.#workouts.forEach(work => this._renderWorkout(work));
    }

    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const app = new App();
