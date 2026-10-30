import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } from 'chart.js';
import { parseGPXToFullProfile } from '../utils/gpxParser';
import { fetchGPXFile } from '../utils/fetchGPXFile';

Chart.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

// Chart.js draws on canvas and cannot read CSS variables; these mirror the user theme tokens
const CHART_COLORS = {
    line: '#1d4ed8', // --color-primary
    grid: '#e2e8f0', // light grid, intentionally lighter than --color-border
    text: '#475569', // --color-text-muted
    strong: '#0f172a', // --color-text
    surface: '#ffffff', // --color-surface
};

const getColorFromParticipant = (startnr) => {
    const hue = (startnr * 137) % 360;
    return `hsl(${hue}, 100%, 50%)`;
};

const ElevationChart = ({ gpxPath, participants }) => {
    const [dataPoints, setDataPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGPXData = async () => {
            setLoading(true);
            try {
                const gpxText = await fetchGPXFile(gpxPath);
                const fullProfile = parseGPXToFullProfile(gpxText, { include3D: false });
                // Extract just distance and elevation for the chart
                const elevationData = fullProfile.map(point => ({
                    distance: point.distance,
                    elevation: point.elevation,
                }));
                setDataPoints(elevationData);
            } catch {
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
                borderColor: CHART_COLORS.line,
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: CHART_COLORS.line,
                pointHoverBorderColor: CHART_COLORS.surface,
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
                pointBorderColor: CHART_COLORS.surface,
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
            // The card heading shows the title
            title: {
                display: false,
                text: 'Höhenprofil',
            },
            tooltip: {
                backgroundColor: 'rgba(255,255,255,0.9)',
                titleColor: CHART_COLORS.strong,
                bodyColor: CHART_COLORS.strong,
                borderColor: CHART_COLORS.grid,
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
                grid: { color: CHART_COLORS.grid },
                border: { display: false },
                ticks: {
                    stepSize: 1,
                    color: CHART_COLORS.text,
                    font: { size: 12 },
                    callback: (value) => value + ' km',
                },
                title: {
                    display: true,
                    text: 'Strecke (km)',
                    color: CHART_COLORS.text,
                    font: { size: 13, weight: '600' },
                },
            },
            y: {
                type: 'linear',
                grid: { color: CHART_COLORS.grid },
                border: { display: false },
                ticks: {
                    color: CHART_COLORS.text,
                    font: { size: 12 },
                },
                title: {
                    display: true,
                    text: 'Höhenmeter (m)',
                    color: CHART_COLORS.text,
                    font: { size: 13, weight: '600' },
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