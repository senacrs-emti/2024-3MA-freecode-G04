function createVelocimeter(containerId) {
    return Highcharts.chart(containerId, {
        chart: {
            type: 'gauge',
            plotBackgroundColor: null,
            plotBackgroundImage: null,
            plotBorderWidth: 0,
            plotShadow: false
        },
        title: { text: '' },
        credits: { enabled: false },
        exporting: { enabled: false },
        pane: createGaugePane(),
        yAxis: createVelocimeterYAxis(),
        series: [{
            name: 'Velocidade',
            data: [0],
            tooltip: { valueSuffix: ' km/h' },
            dataLabels: {
                enabled: true,
                format: '{y}',
                style: {
                    fontSize: '25px',
                    fontWeight: 'bold',
                    color: '#000'
                }
            }
        }]
    });
}

function createRpmGauge(containerId) {
    return Highcharts.chart(containerId, {
        chart: {
            type: 'gauge',
            plotBackgroundColor: null,
            plotBackgroundImage: null,
            plotBorderWidth: 0,
            plotShadow: false
        },
        title: { text: '' },
        credits: { enabled: false },
        exporting: { enabled: false },
        pane: createGaugePane(),
        yAxis: createRpmYAxis(),
        series: [{
            name: 'RPM',
            data: [0],
            tooltip: { valueSuffix: 'RPM' },
            dataLabels: {
                enabled: true,
                format: '{y}',
                style: {
                    fontSize: '25px',
                    fontWeight: 'bold',
                    color: '#000'
                }
            }
        }]
    });
}

function createGaugePane() {
    return {
        startAngle: -150,
        endAngle: 150,
        background: [{
            backgroundColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                    [0, '#FFF'],
                    [1, '#333']
                ]
            },
            borderWidth: 0,
            outerRadius: '109%'
        }, {
            backgroundColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                    [0, '#333'],
                    [1, '#FFF']
                ]
            },
            borderWidth: 1,
            outerRadius: '107%'
        }, {}, {
            backgroundColor: '#DDD',
            borderWidth: 0,
            outerRadius: '105%',
            innerRadius: '103%'
        }]
    };
}

function createVelocimeterYAxis() {
    return {
        min: 0,
        max: 90,
        minorTickInterval: 'auto',
        minorTickWidth: 1,
        minorTickLength: 10,
        minorTickPosition: 'inside',
        minorTickColor: '#666',
        tickPixelInterval: 30,
        tickWidth: 2,
        tickPosition: 'inside',
        tickLength: 10,
        tickColor: '#666',
        labels: { step: 2, rotation: 'auto' },
        title: { text: 'km/h' },
        plotBands: [{
            from: 0,
            to: 30,
            color: '#55BF3B' // Green
        }, {
            from: 30,
            to: 60,
            color: '#DDDF0D' // Yellow
        }, {
            from: 60,
            to: 90,
            color: '#DF5353' // Red
        }]
    };
}

function createRpmYAxis() {
    return {
        min: 0,
        max: 4500,
        minorTickInterval: 'auto',
        minorTickWidth: 1,
        minorTickLength: 10,
        minorTickPosition: 'inside',
        minorTickColor: '#666',
        tickPixelInterval: 30,
        tickWidth: 2,
        tickPosition: 'inside',
        tickLength: 10,
        tickColor: '#666',
        labels: { step: 2, rotation: 'auto' },
        title: { text: 'RPM' },
        plotBands: [{
            from: 0,
            to: 1500,
            color: '#55BF3B' // Green
        }, {
            from: 1500,
            to: 3000,
            color: '#DDDF0D' // Yellow
        }, {
            from: 3000,
            to: 4500,
            color: '#DF5353' // Red
        }]
    };
}

function updateChart(chart, value) {
    var point = chart.series[0].points[0];
    point.update(Math.floor(value));
}

function updateGearState(engaged) {
    if (engaged) $('#luz-marcha').addClass('ativa');
    else         $('#luz-marcha').removeClass('ativa');
}

let blinkInterval = null;
function updateBlinkerState(state) {    
    clearInterval(blinkInterval);

    if (state === 0) {
        $('#pisca-esquerda').removeClass('ativo');
        $('#pisca-direita' ).removeClass('ativo');
    } else if (state === 1) {
        $('#pisca-esquerda').addClass   ('ativo');
        $('#pisca-direita' ).removeClass('ativo');
        startBlinking('#pisca-esquerda');
    } else if (state === 2) {
        $('#pisca-esquerda').removeClass('ativo');
        $('#pisca-direita' ).addClass   ('ativo');
        startBlinking('#pisca-direita');
    } else if (state === 3) {
        $('#pisca-esquerda').addClass('ativo');
        $('#pisca-direita' ).addClass('ativo');
        startBlinking('#pisca-esquerda, #pisca-direita');
    }
}

function startBlinking(selector) {
    const elements = $(selector);
    let active = true;

    blinkInterval = setInterval(() => {
        if (active) elements.removeClass('ativo');
        else        elements.addClass('ativo');
        
        active = !active;
    }, 250);
}

function updateLightState(state) {
    document.querySelectorAll('tbody tr').forEach(row => row.classList.remove('luz-tabela-ativo'));

    switch (state) {
        case 0: break;
        case 1:
            document.getElementById('estado-lanternas').classList.add('luz-tabela-ativo');
            break;
        case 2:
            document.getElementById('estado-farol-baixo').classList.add('luz-tabela-ativo');
            break;
        case 3:
            document.getElementById('estado-luz-alta').classList.add('luz-tabela-ativo');
            break;
        default:
            console.warn('Estado inválido:', state);
    }
}

function updateDoorState(state) {
    $('#portas-container').children().removeClass('porta-aberta');

    if (state & 0b001) $('#porta-motorista' ).addClass('porta-aberta');
    if (state & 0b010) $('#porta-passageiro').addClass('porta-aberta');
    if (state & 0b100) $('#porta-traseira'  ).addClass('porta-aberta');
}

const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
}).setView([0, 0], 18);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const marker = L.marker([0, 0]).addTo(map);

function updateMap(lat, lng) {
    const newLatLng = new L.LatLng(lat, lng);
    marker.setLatLng(newLatLng);
    map.setView(newLatLng, 18);
}

$(document).ready(function () {
    const velocimeterChart = createVelocimeter('velocimetro');
    const rpmChart = createRpmGauge('rpm');

    setInterval(function () {
        fetch('api.php')
            .then(response => response.json())
            .then(data => {
                if (data.data.length !== 8)
                    return;

                data.data = data.data.sort((a, b) => a.key - b.key);
                
                updateChart(velocimeterChart, parseInt(data.data[0].value));
                updateChart(rpmChart        , parseInt(data.data[1].value));
                updateGearState   (parseInt(data.data[2].value));
                updateLightState  (parseInt(data.data[3].value));
                updateBlinkerState(parseInt(data.data[4].value));
                updateDoorState   (parseInt(data.data[5].value));
                updateMap         (parseFloat(data.data[6].value), parseFloat(data.data[7].value));
            });
    }, 1000);
});
