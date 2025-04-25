/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Reports = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/advisor/report', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP Error: ${response.status}, Response: ${errorText}`);
                }

                const data = await response.json();
                setReportData(data.data || []);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching report:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchReportData();
    }, []);

    const handleDownloadExcel = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/advisor/download-excel-report', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'report.xlsx'); // Filename for the Excel file
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error downloading Excel report:', err);
            alert('Failed to download Excel report.');
        }
    };

    const chartData = {
        labels: [...new Set(reportData.map(r => r.Course))],
        datasets: [
            {
                label: 'Total Requests',
                data: reportData.map(r => r.TotalRequests),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
            {
                label: 'Average GPA',
                data: reportData.map(r => r.AverageGPA),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
            },
        ],
    };

    return (
        <div className="report-container">
            <h1 className="report-heading">Prerequisite Waiver Report</h1>
            {loading ? (
                <p className="loading-text">Loading...</p>
            ) : error ? (
                <div className="error-message">
                    <p>Error: {error}</p>
                </div>
            ) : (
                <>
                    <div className="chart-container">
                        <Bar data={chartData} />
                    </div><div className="note-modal-buttons">
                    <button className="download-btn" onClick={handleDownloadExcel}>
                        Download Excel
                    </button></div>
                </>
            )}
        </div>
    );
};

export default Reports;
