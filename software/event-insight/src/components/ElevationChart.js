import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } from 'chart.js';

Chart.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

const getColorFromParticipant = (startnr) => {
    const hue = (startnr * 137) % 360;
    return `hsl(${hue}, 100%, 50%)`;
};

const ElevationChart = ({ gpxPath, participants }) => {
    const [dataPoints, setDataPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const parseGPXtoElevationData = (gpxText) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(gpxText, 'text/xml');
        const trackPoints = xmlDoc.getElementsByTagName('trkpt');

        let cumulativeDistance = 0;
        const R = 6371000;
        const toRad = (deg) => (deg * Math.PI) / 180;

        let prevLat = null, prevLon = null;
        const data = [];

        for (let i = 0; i < trackPoints.length; i++) {
            const lat = parseFloat(trackPoints[i].getAttribute('lat'));
            const lon = parseFloat(trackPoints[i].getAttribute('lon'));
            const elevation = parseFloat(trackPoints[i].getElementsByTagName('ele')[0]?.textContent || 0);

            if (prevLat !== null && prevLon !== null) {
                const dLat = toRad(lat - prevLat);
                const dLon = toRad(lon - prevLon);
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(prevLat)) * Math.cos(toRad(lat)) * Math.sin(dLon / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                cumulativeDistance += R * c;
            }
            prevLat = lat;
            prevLon = lon;

            data.push({ distance: cumulativeDistance, elevation });
        }
        return data;
    };

    useEffect(() => {
        const fetchGPXData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(gpxPath);
                const elevationData = parseGPXtoElevationData(response.data);
                setDataPoints(elevationData);
            } catch (err) {
                setError('Fehler beim Laden der GPX-Daten.');
            } finally {
                setLoading(false);
            }
        };

        if (gpxPath) {
            fetchGPXData();
        }
    }, [gpxPath]);

    if (loading) return <div>Lade Elevationsdaten...</div>;
    if (error) return <div>{error}</div>;

    const maxDistanceKm = Math.ceil((dataPoints[dataPoints.length - 1]?.distance || 0) / 1000);

    const chartData = {
        datasets: [
            {
                label: 'Elevation',
                data: dataPoints.map((dp) => ({ x: dp.distance / 1000, y: dp.elevation })),
                borderColor: '#0c67c9',
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#000000',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2,
                order: 2,
            },
            {
                label: 'Participants',
                data: participants.map((participant) => {
                    const progressIndex = Math.floor((participant.progress / 100) * dataPoints.length);
                    let point;
                    if (progressIndex === 0) {
                        point = dataPoints[0];
                    } else {
                        point = dataPoints[progressIndex - 1];
                    }
                    return {
                        x: point.distance / 1000,
                        y: point.elevation,
                        name: `${participant.Vorname} ${participant.Nachname}`,
                        startnr: participant.startnr,
                    };
                }),
                pointRadius: 7,
                pointBackgroundColor: participants.map((participant) => getColorFromParticipant(participant.startnr)),
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                showLine: false,
                order: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } },
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Höhenprofil',
                color: '#000000',
                font: { size: 20, weight: 'bold' },
            },
            tooltip: {
                backgroundColor: 'rgba(255,255,255,0.9)',
                titleColor: '#000000',
                bodyColor: '#000000',
                borderColor: '#666666',
                borderWidth: 1,
                displayColors: false,
                callbacks: {
                    label: (context) => {
                        const xValue = context.raw.x.toFixed(2) + ' km';
                        const yValue = context.raw.y.toFixed(2) + ' m';
                        if (context.datasetIndex === 0) {
                            return [`Strecke: ${xValue}`, `Höhe: ${yValue}`];
                        } else {
                            const { name, startnr } = context.raw;
                            return [`Name: ${name}`, `Startnummer: ${startnr}`, `Strecke: ${xValue}`, `Höhe: ${yValue}`];
                        }
                    },
                    title: () => '',
                },
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: true
        },
        scales: {
            x: {
                type: 'linear',
                min: 0,
                max: maxDistanceKm,
                grid: { color: '#000000' },
                ticks: {
                    stepSize: 1,
                    color: '#000000',
                    font: { size: 12 },
                    callback: (value) => value + ' km',
                },
                title: {
                    display: true,
                    text: 'Strecke (km)',
                    color: '#000000',
                    font: { size: 14, weight: 'bold' },
                },
            },
            y: {
                type: 'linear',
                grid: { color: '#000000' },
                ticks: {
                    color: '#000000',
                    font: { size: 12 },
                },
                title: {
                    display: true,
                    text: 'Höhenmeter (m)',
                    color: '#000000',
                    font: { size: 14, weight: 'bold' },
                },
            },
        },
        animation: false,
    };

    return (
        <div className="elevation-chart-wrapper" style={{ position: 'relative' }}>
            <Line data={chartData} options={chartOptions} />
        </div>
    );
};

export default ElevationChart;