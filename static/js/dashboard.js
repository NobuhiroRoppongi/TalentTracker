/**
 * HR Dashboard Main JavaScript
 * Handles the core functionality of the HR dashboard
 */

// Global state for selected employees, skills, and offices
const state = {
    selectedEmployees: [],
    selectedSkills: [],
    selectedOffice: 'all',
    employees: [],
    skills: {},
    offices: []
};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    Promise.all([
        fetch('/api/employees').then(response => response.json()),
        fetch('/api/skills').then(response => response.json()),
        fetch('/api/offices').then(response => response.json())
    ])
    .then(([employeesData, skillsData, officesData]) => {
        // Store data in state
        state.employees = employeesData;
        state.skills = skillsData;
        state.offices = officesData;
        
        // Initialize UI components
        initializeFilters();
        populateEmployeeTable(employeesData);
        initializeCharts(employeesData, skillsData.top_skills);
        
        // Set up event listeners
        setupEventListeners();
    })
    .catch(error => {
        console.error('Error initializing dashboard:', error);
        displayErrorMessage('Failed to load dashboard data. Please refresh the page.');
    });
});

/**
 * Populate the employee table with data
 * @param {Array} employees - List of employee objects
 */
function populateEmployeeTable(employees) {
    const tableBody = document.getElementById('employee-table-body');
    tableBody.innerHTML = '';

    if (employees.length === 0) {
        // Display no results message
        const noResultsRow = document.createElement('tr');
        noResultsRow.innerHTML = `
            <td colspan="4" class="text-center">No employees match your filters</td>
        `;
        tableBody.appendChild(noResultsRow);
        return;
    }

    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.dataset.id = employee.id;
        row.className = state.selectedEmployees.includes(employee.id) ? 'table-active' : '';
        
        // Calculate average skill score
        const skillValues = Object.values(employee.skills);
        const avgScore = skillValues.length > 0 ? 
            (skillValues.reduce((sum, val) => sum + val, 0) / skillValues.length).toFixed(1) : 
            'N/A';
        
        row.innerHTML = `
            <td>${employee.name}</td>
            <td>${employee.office}</td>
            <td>${avgScore}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary view-details-btn" data-id="${employee.id}">
                    <i class="bi bi-info-circle"></i> Details
                </button>
            </td>
        `;
        
        // Add event listener for row selection
        row.addEventListener('click', function(e) {
            if (!e.target.closest('.view-details-btn')) {
                toggleEmployeeSelection(employee.id);
            }
        });
        
        tableBody.appendChild(row);
    });

    // Add event listeners for detail buttons
    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const employeeId = parseInt(this.dataset.id);
            showEmployeeDetails(employeeId);
        });
    });
}

/**
 * Toggle employee selection state
 * @param {number} employeeId - ID of the employee to toggle
 */
function toggleEmployeeSelection(employeeId) {
    const index = state.selectedEmployees.indexOf(employeeId);
    
    if (index === -1) {
        // Add employee to selection
        state.selectedEmployees.push(employeeId);
    } else {
        // Remove employee from selection
        state.selectedEmployees.splice(index, 1);
    }
    
    // Update UI to reflect selection
    updateEmployeeTableSelection();
    
    // Update charts based on selection
    if (state.selectedEmployees.length > 0) {
        const selectedEmployeeData = state.employees.filter(emp => 
            state.selectedEmployees.includes(emp.id)
        );
        updateCharts(selectedEmployeeData, state.skills.top_skills);
    } else {
        // If no employees selected, show all employees from current filter
        const filteredEmployees = getFilteredEmployees();
        updateCharts(filteredEmployees, state.skills.top_skills);
    }
}

/**
 * Update the employee table to reflect current selection state
 */
function updateEmployeeTableSelection() {
    const rows = document.querySelectorAll('#employee-table-body tr');
    
    rows.forEach(row => {
        const rowId = parseInt(row.dataset.id);
        if (state.selectedEmployees.includes(rowId)) {
            row.classList.add('table-active');
        } else {
            row.classList.remove('table-active');
        }
    });
    
    // Update selection counter
    const selectionCount = document.getElementById('selection-count');
    selectionCount.textContent = state.selectedEmployees.length;
    
    // Also update summary statistics
    updateSummaryStatisticsUI();
}

/**
 * Show detailed information for a specific employee
 * @param {number} employeeId - ID of the employee to show details for
 */
function showEmployeeDetails(employeeId) {
    const employee = state.employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
        console.error('Employee not found:', employeeId);
        return;
    }
    
    const detailsModal = document.getElementById('employee-details-modal');
    const modalTitle = detailsModal.querySelector('.modal-title');
    const modalBody = detailsModal.querySelector('.modal-body');
    
    modalTitle.textContent = employee.name;
    
    // Format employee details
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h5>基本情報</h5>
                <p><strong>オフィス:</strong> ${employee.office}</p>
                <p><strong>出身地:</strong> ${employee.personal_info.birthplace}</p>
                <p><strong>言語:</strong> ${employee.personal_info.languages.join(', ')}</p>
                <p><strong>入社日:</strong> ${formatDate(employee.personal_info.joined_date)}</p>
                <p><strong>趣味:</strong> ${employee.personal_info.hobbies.join(', ')}</p>
            </div>
            <div class="col-md-6">
                <h5>スキル評価</h5>
                <div class="skills-radar-container">
                    <canvas id="employee-skills-radar"></canvas>
                </div>
            </div>
        </div>
        <div class="row mt-4">
            <div class="col-12">
                <h5>スキル詳細</h5>
                <div class="skill-bars">
                    ${Object.entries(employee.skills)
                        .sort((a, b) => b[1] - a[1])
                        .map(([skill, level]) => `
                            <div class="skill-bar-label">${skill}</div>
                            <div class="progress mb-3">
                                <div class="progress-bar bg-${getSkillLevelColor(level)}" 
                                     role="progressbar" 
                                     style="width: ${level * 20}%" 
                                     aria-valuenow="${level}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="5">
                                    ${level}
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Create radar chart for employee skills - focus on our specific top skills
    const ctx = document.getElementById('employee-skills-radar').getContext('2d');
    
    // Prioritize these specific skills
    const prioritySkills = ["AWS", "C++", "Java", "JavaScript", "Azure", "BI tools", "GCP", "PHP"];
    
    // Filter skills that the employee has
    const employeeSkills = {};
    
    // First add the priority skills that the employee has
    prioritySkills.forEach(skillName => {
        if (employee.skills[skillName] !== undefined) {
            employeeSkills[skillName] = employee.skills[skillName];
        }
    });
    
    // Then add any other skills the employee has (up to a reasonable limit)
    const otherSkills = Object.entries(employee.skills)
        .filter(([name, _]) => !prioritySkills.includes(name))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
        
    otherSkills.forEach(([name, value]) => {
        employeeSkills[name] = value;
    });
    
    const skillLabels = Object.keys(employeeSkills);
    const skillValues = Object.values(employeeSkills);
    
    if (window.employeeSkillsChart) {
        window.employeeSkillsChart.destroy();
    }
    
    window.employeeSkillsChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: skillLabels,
            datasets: [{
                label: 'スキルレベル',
                data: skillValues,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgb(54, 162, 235)',
                pointBackgroundColor: 'rgb(54, 162, 235)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(54, 162, 235)'
            }]
        },
        options: {
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
                    suggestedMax: 5
                }
            }
        }
    });
    
    // Show the modal
    const modal = new bootstrap.Modal(detailsModal);
    modal.show();
}

/**
 * Apply filters and update the dashboard
 */
function applyFilters() {
    const filteredEmployees = getFilteredEmployees();
    
    // Update the employee table with filtered results
    populateEmployeeTable(filteredEmployees);
    
    // Clear employee selection when filters change
    state.selectedEmployees = [];
    updateEmployeeTableSelection();
    
    // Update charts based on filtered employees
    updateCharts(filteredEmployees, state.skills.top_skills);
    
    // Update summary statistics UI
    updateSummaryStatisticsUI();
}

/**
 * Update the summary statistics display based on current selection
 */
function updateSummaryStatisticsUI() {
    // Get the employees to base statistics on (selected employees or all filtered employees)
    let employeesToCalculate = [];
    
    if (state.selectedEmployees.length > 0) {
        employeesToCalculate = state.employees.filter(emp => state.selectedEmployees.includes(emp.id));
    } else {
        employeesToCalculate = getFilteredEmployees();
    }
    
    // Calculate total skill score
    const totalScore = employeesToCalculate.reduce((total, emp) => {
        return total + Object.values(emp.skills).reduce((sum, val) => sum + val, 0);
    }, 0);
    
    // Calculate average skill score
    const avgScore = totalScore / (employeesToCalculate.length || 1);
    
    // Update the UI elements
    document.getElementById('total-score').textContent = totalScore;
    document.getElementById('avg-score').textContent = avgScore.toFixed(2);
    
    // Update the individual employee table average skills
    updateEmployeeAverageSkills();
}

/**
 * Get employees based on current filters
 * @returns {Array} Filtered employee objects
 */
function getFilteredEmployees() {
    let filteredEmployees = [...state.employees];
    
    // Filter by office
    if (state.selectedOffice !== 'all') {
        filteredEmployees = filteredEmployees.filter(emp => 
            emp.office === state.selectedOffice
        );
    }
    
    // Filter by skills
    if (state.selectedSkills.length > 0) {
        filteredEmployees = filteredEmployees.filter(emp => {
            return state.selectedSkills.some(skillName => {
                return emp.skills[skillName] && emp.skills[skillName] > 0;
            });
        });
    }
    
    return filteredEmployees;
}

/**
 * Update the average skill display in the employee table
 */
function updateEmployeeAverageSkills() {
    const rows = document.querySelectorAll('#employee-table-body tr');
    
    rows.forEach(row => {
        const employeeId = parseInt(row.dataset.id);
        if (!employeeId) return;
        
        const employee = state.employees.find(emp => emp.id === employeeId);
        if (!employee) return;
        
        // Get the skills cell (3rd column)
        const skillCell = row.querySelector('td:nth-child(3)');
        if (!skillCell) return;
        
        // Calculate average skill score for this employee
        const skillValues = Object.values(employee.skills);
        const avgScore = skillValues.length > 0 ? 
            (skillValues.reduce((sum, val) => sum + val, 0) / skillValues.length).toFixed(1) : 
            'N/A';
            
        // Update the cell content
        skillCell.textContent = avgScore;
    });
}

/**
 * Set up event listeners for dashboard interactions
 */
function setupEventListeners() {
    // Apply filters button
    document.getElementById('apply-filters-btn').addEventListener('click', applyFilters);
    
    // Clear filters button
    document.getElementById('clear-filters-btn').addEventListener('click', function() {
        clearFilters();
        applyFilters();
    });
    
    // Clear selection button
    document.getElementById('clear-selection-btn').addEventListener('click', function() {
        state.selectedEmployees = [];
        updateEmployeeTableSelection();
        
        // Update charts with all employees
        const filteredEmployees = getFilteredEmployees();
        updateCharts(filteredEmployees, state.skills.top_skills);
    });
}

/**
 * Clear all applied filters
 */
function clearFilters() {
    // Reset office selection
    document.getElementById('office-filter').value = 'all';
    state.selectedOffice = 'all';
    
    // Reset skill selection
    document.querySelectorAll('#skill-filter input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    state.selectedSkills = [];
    
    // Update the UI to reflect cleared filters
    updateFilterDisplay();
}

/**
 * Display an error message to the user
 * @param {string} message - Error message to display
 */
function displayErrorMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.querySelector('.container').prepend(alertDiv);
}

/**
 * Format a date string to a more readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Get appropriate color class based on skill level
 * @param {number} level - Skill level (0-5)
 * @returns {string} Bootstrap color class
 */
function getSkillLevelColor(level) {
    if (level === 0) return 'secondary';
    if (level === 1) return 'danger';
    if (level === 2) return 'warning';
    if (level === 3) return 'info';
    if (level === 4) return 'primary';
    if (level === 5) return 'success';
    return 'primary';
}
