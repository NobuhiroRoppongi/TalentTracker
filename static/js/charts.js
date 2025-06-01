/**
 * HR Dashboard Charts
 * Handles chart creation and updates
 */

// Chart objects
let skillDistributionChart = null;
let officeComparisonChart = null;
let skillMatrixChart = null;
let personalityTraitsChart = null;
let skillRankingChart = null;

/**
 * Initialize dashboard charts
 * @param {Array} employees - Employee data
 * @param {Array} topSkills - List of top skills
 */
function initializeCharts(employees, topSkills) {
    createSkillDistributionChart(employees, topSkills);
    createOfficeComparisonChart(employees);
    createSkillMatrixChart(employees, topSkills);
    createPersonalityTraitsChart(employees);
    initializeSkillRankingChart(employees, topSkills);
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
    updatePersonalityTraitsChart(employees);
    updateSkillRankingChart(employees);
    
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

/**
 * Create the personality traits chart
 * @param {Array} employees - Employee data
 */
function createPersonalityTraitsChart(employees) {
    const ctx = document.getElementById('personality-traits-chart').getContext('2d');
    
    // Calculate aggregated personality traits
    const traitData = calculatePersonalityTraits(employees);
    
    personalityTraitsChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: traitData.labels,
            datasets: [{
                label: 'チーム平均',
                data: traitData.values,
                fill: true,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(75, 192, 192, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                line: {
                    borderWidth: 3
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

/**
 * Update the personality traits chart
 * @param {Array} employees - Employee data
 */
function updatePersonalityTraitsChart(employees) {
    if (!personalityTraitsChart) return;
    
    const traitData = calculatePersonalityTraits(employees);
    
    personalityTraitsChart.data.labels = traitData.labels;
    personalityTraitsChart.data.datasets[0].data = traitData.values;
    personalityTraitsChart.update();
}

/**
 * Calculate aggregated personality traits for selected employees
 * @param {Array} employees - Employee data
 * @returns {Object} Object with labels and values arrays
 */
function calculatePersonalityTraits(employees) {
    if (employees.length === 0) {
        return {
            labels: [],
            values: []
        };
    }
    
    // Get all unique personality traits
    const allTraits = new Set();
    employees.forEach(employee => {
        if (employee.personality_traits) {
            Object.keys(employee.personality_traits).forEach(trait => {
                allTraits.add(trait);
            });
        }
    });
    
    if (allTraits.size === 0) {
        return {
            labels: ['データなし'],
            values: [0]
        };
    }
    
    const labels = Array.from(allTraits);
    const values = labels.map(trait => {
        const employeesWithTrait = employees.filter(emp => 
            emp.personality_traits && emp.personality_traits[trait] !== undefined
        );
        
        if (employeesWithTrait.length === 0) return 0;
        
        const sum = employeesWithTrait.reduce((total, emp) => 
            total + emp.personality_traits[trait], 0
        );
        
        return sum / employeesWithTrait.length;
    });
    
    return {
        labels,
        values
    };
}

/**
 * Initialize the skill ranking chart and dropdown
 * @param {Array} employees - Employee data
 * @param {Array} topSkills - List of top skills
 */
function initializeSkillRankingChart(employees, topSkills) {
    const selector = document.getElementById('skill-ranking-selector');
    if (!selector) return;
    
    // Populate dropdown with available skills
    populateSkillSelector(selector, employees, topSkills);
    
    // Add event listener for skill selection
    selector.addEventListener('change', function() {
        const selectedSkill = this.value;
        if (selectedSkill) {
            // Use current filtered employees instead of all employees
            createSkillRankingChart(getFilteredEmployees(), selectedSkill);
        } else {
            // Clear chart if no skill selected
            if (skillRankingChart) {
                skillRankingChart.destroy();
                skillRankingChart = null;
            }
        }
    });
}

/**
 * Populate the skill selector dropdown
 * @param {HTMLElement} selector - The select element
 * @param {Array} employees - Employee data
 * @param {Array} topSkills - List of top skills
 */
function populateSkillSelector(selector, employees, topSkills) {
    // Clear existing options except the first one
    selector.innerHTML = '<option value="">スキルを選択...</option>';
    
    // Get all available skills from selected skills or top skills
    let skillsToUse = [];
    
    if (state.selectedSkills && state.selectedSkills.length > 0) {
        skillsToUse = state.selectedSkills;
    } else {
        skillsToUse = topSkills.map(skill => skill.name);
    }
    
    // Add options for each skill
    skillsToUse.forEach(skillName => {
        const option = document.createElement('option');
        option.value = skillName;
        option.textContent = skillName;
        selector.appendChild(option);
    });
}

/**
 * Create the skill ranking chart for a specific skill
 * @param {Array} employees - Employee data
 * @param {string} skillName - Name of the skill to analyze
 */
function createSkillRankingChart(employees, skillName) {
    const ctx = document.getElementById('skill-ranking-chart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (skillRankingChart) {
        skillRankingChart.destroy();
    }
    
    // Use filtered employees from the current dashboard state
    const filteredEmployees = getFilteredEmployees();
    
    // Get employees with the selected skill and sort by score (high to low)
    let employeesWithSkill = filteredEmployees
        .filter(emp => emp.skills[skillName] !== undefined && emp.skills[skillName] > 0)
        .map(emp => ({
            name: emp.name,
            score: emp.skills[skillName],
            isSelected: state.selectedEmployees.includes(emp.id)
        }))
        .sort((a, b) => {
            // Prioritize selected employees, then sort by score
            if (a.isSelected && !b.isSelected) return -1;
            if (!a.isSelected && b.isSelected) return 1;
            return b.score - a.score;
        });
    
    if (employeesWithSkill.length === 0) {
        // No employees have this skill
        const chartCtx = ctx.getContext('2d');
        skillRankingChart = new Chart(chartCtx, {
            type: 'bar',
            data: {
                labels: ['データなし'],
                datasets: [{
                    label: skillName,
                    data: [0],
                    backgroundColor: 'rgba(108, 117, 125, 0.5)',
                    borderColor: 'rgba(108, 117, 125, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${skillName} - スキルランキング`
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        title: {
                            display: true,
                            text: 'スキルレベル'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '従業員'
                        }
                    }
                }
            }
        });
        return;
    }
    
    // Create colors based on selection status and score
    const colors = employeesWithSkill.map((emp, index) => {
        if (emp.isSelected) {
            // Selected employees - use blue gradient
            const ratio = (employeesWithSkill.length - index) / employeesWithSkill.length;
            const intensity = Math.floor(100 + 155 * ratio);
            return `rgba(54, 162, 235, 0.8)`;
        } else {
            // Non-selected employees - use green/red gradient based on score
            const ratio = emp.score / 5; // Normalize score to 0-1
            const green = Math.floor(255 * ratio);
            const red = Math.floor(255 * (1 - ratio));
            return `rgba(${red}, ${green}, 100, 0.6)`;
        }
    });
    
    const borderColors = employeesWithSkill.map((emp, index) => {
        if (emp.isSelected) {
            // Selected employees - use blue border
            return `rgba(54, 162, 235, 1)`;
        } else {
            // Non-selected employees - use green/red gradient based on score
            const ratio = emp.score / 5; // Normalize score to 0-1
            const green = Math.floor(255 * ratio);
            const red = Math.floor(255 * (1 - ratio));
            return `rgba(${red}, ${green}, 100, 1)`;
        }
    });
    
    const chartCtx = ctx.getContext('2d');
    skillRankingChart = new Chart(chartCtx, {
        type: 'bar',
        data: {
            labels: employeesWithSkill.map(emp => emp.name),
            datasets: [{
                label: skillName,
                data: employeesWithSkill.map(emp => emp.score),
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${skillName} - スキルランキング (高得点順)`
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.y}/5`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5,
                    title: {
                        display: true,
                        text: 'スキルレベル'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '従業員 (高得点順)'
                    }
                }
            }
        }
    });
}

/**
 * Update the skill ranking chart when filters change
 * @param {Array} employees - Employee data
 */
function updateSkillRankingChart(employees) {
    const selector = document.getElementById('skill-ranking-selector');
    if (!selector) return;
    
    const selectedSkill = selector.value;
    
    // Update the dropdown options based on current skill selection and filtered employees
    const topSkills = window.topSkills || [];
    const filteredEmployees = getFilteredEmployees();
    populateSkillSelector(selector, filteredEmployees, topSkills);
    
    // Restore the selected skill if it's still available
    if (selectedSkill && [...selector.options].some(option => option.value === selectedSkill)) {
        selector.value = selectedSkill;
        // Update chart with filtered employees
        createSkillRankingChart(filteredEmployees, selectedSkill);
    } else if (selectedSkill) {
        // Clear the chart if the selected skill is no longer available
        if (skillRankingChart) {
            skillRankingChart.destroy();
            skillRankingChart = null;
        }
    }
}
