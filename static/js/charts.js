/**
 * HR Dashboard Charts
 * Handles chart creation and updates
 */

// Chart objects
let skillDistributionChart = null;
let officeComparisonChart = null;
let skillMatrixChart = null;

/**
 * Initialize dashboard charts
 * @param {Array} employees - Employee data
 * @param {Array} topSkills - List of top skills
 */
function initializeCharts(employees, topSkills) {
    createSkillDistributionChart(employees, topSkills);
    createOfficeComparisonChart(employees);
    createSkillMatrixChart(employees, topSkills);
}

/**
 * Update all charts with new data
 * @param {Array} employees - Employee data
 * @param {Array} topSkills - List of top skills
 */
function updateCharts(employees, topSkills) {
    updateSkillDistributionChart(employees, topSkills);
    updateOfficeComparisonChart(employees);
    updateSkillMatrixChart(employees, topSkills);
    
    // Update summary statistics
    updateSummaryStatistics(employees);
}

/**
 * Create the skill distribution chart
 * @param {Array} employees - Employee data
 * @param {Array} topSkills - List of top skills
 */
function createSkillDistributionChart(employees, topSkills) {
    const ctx = document.getElementById('skill-distribution-chart').getContext('2d');
    
    // Process data for chart
    const skillCounts = calculateSkillCounts(employees, topSkills);
    
    skillDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: skillCounts.labels,
            datasets: [{
                label: 'スキル分布',
                data: skillCounts.counts,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'スキル分布'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '従業員数'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'スキル'
                    }
                }
            }
        }
    });
}

/**
 * Update the skill distribution chart
 * @param {Array} employees - Employee data
 * @param {Array} topSkills - List of top skills
 */
function updateSkillDistributionChart(employees, topSkills) {
    if (!skillDistributionChart) return;
    
    const skillCounts = calculateSkillCounts(employees, topSkills);
    
    skillDistributionChart.data.labels = skillCounts.labels;
    skillDistributionChart.data.datasets[0].data = skillCounts.counts;
    skillDistributionChart.update();
}

/**
 * Calculate skill counts for chart data
 * @param {Array} employees - Employee data
 * @param {Array} topSkills - List of top skills
 * @returns {Object} Object with labels and counts arrays
 */
function calculateSkillCounts(employees, topSkills) {
    // If we have selected skills, use those instead of top skills
    let skillsToUse = [];
    
    if (state.selectedSkills.length > 0) {
        // Use the selected skills
        skillsToUse = state.selectedSkills;
    } else {
        // Use the top skills
        skillsToUse = topSkills.map(skill => skill.name);
    }
    
    const counts = skillsToUse.map(skillName => {
        return employees.filter(emp => emp.skills[skillName] && emp.skills[skillName] > 3).length;
    });
    
    return { labels: skillsToUse, counts };
}

/**
 * Create the office comparison chart
 * @param {Array} employees - Employee data
 */
function createOfficeComparisonChart(employees) {
    const ctx = document.getElementById('office-comparison-chart').getContext('2d');
    
    // Process data for chart
    const officeData = calculateOfficeData(employees);
    
    officeComparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: officeData.skillLabels,
            datasets: officeData.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'オフィス別スキル比較'
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 5
                }
            }
        }
    });
}

/**
 * Update the office comparison chart
 * @param {Array} employees - Employee data
 */
function updateOfficeComparisonChart(employees) {
    if (!officeComparisonChart) return;
    
    const officeData = calculateOfficeData(employees);
    
    officeComparisonChart.data.labels = officeData.skillLabels;
    officeComparisonChart.data.datasets = officeData.datasets;
    officeComparisonChart.update();
}

/**
 * Calculate office data for chart
 * @param {Array} employees - Employee data
 * @returns {Object} Object with skillLabels and datasets arrays
 */
function calculateOfficeData(employees) {
    // Get all offices
    const offices = [...new Set(employees.map(emp => emp.office))];
    
    // Get skills to display
    let skillLabels = [];
    
    // If user has selected skills, use those
    if (state.selectedSkills.length > 0) {
        skillLabels = state.selectedSkills;
    } else {
        // Otherwise, get skills from employees
        const allSkills = new Set();
        employees.forEach(emp => {
            Object.keys(emp.skills).forEach(skill => {
                if (emp.skills[skill] > 0) {
                    allSkills.add(skill);
                }
            });
        });
        skillLabels = Array.from(allSkills).slice(0, 10); // Limit to top 10 for readability
    }
    
    // Generate colors for each office
    const colors = [
        { bg: 'rgba(54, 162, 235, 0.2)', border: 'rgb(54, 162, 235)' },
        { bg: 'rgba(255, 99, 132, 0.2)', border: 'rgb(255, 99, 132)' },
        { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgb(75, 192, 192)' },
        { bg: 'rgba(255, 159, 64, 0.2)', border: 'rgb(255, 159, 64)' }
    ];
    
    // Create datasets for each office
    const datasets = offices.map((office, i) => {
        const officeEmployees = employees.filter(emp => emp.office === office);
        
        // Calculate average skill levels for this office
        const skillData = skillLabels.map(skill => {
            const employeesWithSkill = officeEmployees.filter(emp => 
                emp.skills[skill] !== undefined && emp.skills[skill] > 0
            );
            
            if (employeesWithSkill.length === 0) return 0;
            
            const sum = employeesWithSkill.reduce((total, emp) => total + emp.skills[skill], 0);
            return sum / employeesWithSkill.length;
        });
        
        return {
            label: office,
            data: skillData,
            backgroundColor: colors[i % colors.length].bg,
            borderColor: colors[i % colors.length].border,
            pointBackgroundColor: colors[i % colors.length].border,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: colors[i % colors.length].border
        };
    });
    
    return { skillLabels, datasets };
}

/**
 * Create the skill matrix chart
 * @param {Array} employees - Employee data
 * @param {Array} topSkills - List of top skills
 */
function createSkillMatrixChart(employees, topSkills) {
    const ctx = document.getElementById('skill-matrix-chart').getContext('2d');
    
    // Process data for chart
    const matrixData = calculateMatrixData(employees, topSkills);
    
    skillMatrixChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: matrixData.employeeNames,
            datasets: matrixData.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'スキルマトリックス'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: '従業員'
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'スキルレベル合計'
                    }
                }
            }
        }
    });
}

/**
 * Update the skill matrix chart
 * @param {Array} employees - Employee data
 * @param {Array} topSkills - List of top skills
 */
function updateSkillMatrixChart(employees, topSkills) {
    if (!skillMatrixChart) return;
    
    const matrixData = calculateMatrixData(employees, topSkills);
    
    skillMatrixChart.data.labels = matrixData.employeeNames;
    skillMatrixChart.data.datasets = matrixData.datasets;
    skillMatrixChart.update();
}

/**
 * Calculate matrix data for chart
 * @param {Array} employees - Employee data
 * @param {Array} topSkills - List of top skills
 * @returns {Object} Object with employeeNames and datasets arrays
 */
function calculateMatrixData(employees, topSkills) {
    // Sort employees by total skill score
    const sortedEmployees = [...employees].sort((a, b) => {
        const aTotal = Object.values(a.skills).reduce((sum, val) => sum + val, 0);
        const bTotal = Object.values(b.skills).reduce((sum, val) => sum + val, 0);
        return bTotal - aTotal;
    });
    
    // Limit to top 10 employees for readability
    const topEmployees = sortedEmployees.slice(0, 10);
    const employeeNames = topEmployees.map(emp => emp.name);
    
    // Create datasets for each skill
    const skillColors = [
        { bg: 'rgba(54, 162, 235, 0.7)', border: 'rgb(54, 162, 235)' },
        { bg: 'rgba(255, 99, 132, 0.7)', border: 'rgb(255, 99, 132)' },
        { bg: 'rgba(75, 192, 192, 0.7)', border: 'rgb(75, 192, 192)' },
        { bg: 'rgba(255, 159, 64, 0.7)', border: 'rgb(255, 159, 64)' },
        { bg: 'rgba(153, 102, 255, 0.7)', border: 'rgb(153, 102, 255)' },
        { bg: 'rgba(255, 205, 86, 0.7)', border: 'rgb(255, 205, 86)' },
        { bg: 'rgba(201, 203, 207, 0.7)', border: 'rgb(201, 203, 207)' },
        { bg: 'rgba(255, 99, 71, 0.7)', border: 'rgb(255, 99, 71)' },
        { bg: 'rgba(46, 139, 87, 0.7)', border: 'rgb(46, 139, 87)' },
        { bg: 'rgba(106, 90, 205, 0.7)', border: 'rgb(106, 90, 205)' }
    ];
    
    // If user has selected skills, use those instead of top skills
    let skillsToDisplay = [];
    
    if (state.selectedSkills.length > 0) {
        // Create skill objects in the format needed for the chart
        skillsToDisplay = state.selectedSkills.map((skillName, index) => {
            return {
                name: skillName,
                id: index + 1
            };
        });
    } else {
        // Use the provided top skills
        skillsToDisplay = topSkills;
    }
    
    const datasets = skillsToDisplay.map((skill, i) => {
        return {
            label: skill.name,
            data: topEmployees.map(emp => emp.skills[skill.name] || 0),
            backgroundColor: skillColors[i % skillColors.length].bg,
            borderColor: skillColors[i % skillColors.length].border,
            borderWidth: 1
        };
    });
    
    return { employeeNames, datasets };
}

/**
 * Update the summary statistics section
 * @param {Array} employees - Employee data
 */
function updateSummaryStatistics(employees) {
    // Calculate total skill score
    const totalScore = employees.reduce((total, emp) => {
        return total + Object.values(emp.skills).reduce((sum, val) => sum + val, 0);
    }, 0);
    
    // Calculate average skill score
    const avgScore = totalScore / (employees.length || 1);
    
    // Update the UI
    document.getElementById('total-score').textContent = totalScore;
    document.getElementById('avg-score').textContent = avgScore.toFixed(2);
}
