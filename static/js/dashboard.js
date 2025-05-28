/**
 * HR Dashboard Main JavaScript
 * Handles the core functionality of the HR dashboard
 */

// Global state for selected employees, skills, and offices
const state = {
    selectedEmployees: [],
    selectedSkills: [],
    selectedOffices: [],
    selectedCertifications: [],
    selectedPersonalityTypes: [],
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
        
        // Ensure top_skills exists or create it from categories
        const topSkills = skillsData.top_skills || (skillsData.categories && skillsData.categories.length > 0 ? 
            skillsData.categories[0].skills?.slice(0, 8) || [] : []);
        initializeCharts(employeesData, topSkills);
        
        // Set up event listeners
        setupEventListeners();
    })
    .catch(error => {
        console.error('Error initializing dashboard:', error);
        // Initialize with empty data to prevent complete failure
        state.employees = [];
        state.skills = { categories: [], top_skills: [] };
        state.offices = [];
        
        // Still try to initialize UI components with empty data
        initializeFilters();
        populateEmployeeTable([]);
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
            <td colspan="5" class="text-center">No employees match your filters</td>
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
        
        // Business capacity with progress bar
        const businessCapacity = employee.business_capacity || 0;
        const capacityColor = businessCapacity >= 90 ? 'bg-danger' : 
                             businessCapacity >= 80 ? 'bg-warning' : 'bg-success';
        
        row.innerHTML = `
            <td class="text-center">${employee.name}</td>
            <td class="text-center">${employee.office}</td>
            <td class="text-center">${avgScore}</td>
            <td class="text-center">
                <div class="progress position-relative" style="height: 25px;">
                    <div class="progress-bar ${capacityColor}" role="progressbar" 
                         style="width: ${businessCapacity}%" aria-valuenow="${businessCapacity}" 
                         aria-valuemin="0" aria-valuemax="100">
                    </div>
                    <span class="position-absolute w-100 text-center" style="line-height: 25px; color: #000; font-weight: bold;">
                        ${businessCapacity}%
                    </span>
                </div>
            </td>
            <td class="text-center">
                <div class="btn-group" style="gap: 2px;">
                    <button class="btn btn-sm btn-outline-primary view-details-btn" data-id="${employee.id}">
                        <i class="bi bi-info-circle"></i> 詳細
                    </button>
                    <button class="btn btn-sm btn-outline-info view-projects-btn" data-id="${employee.id}">
                        <i class="bi bi-briefcase"></i> プロジェクト
                    </button>
                    <button class="btn btn-sm btn-outline-success view-personality-btn" data-id="${employee.id}">
                        <i class="bi bi-person-heart"></i> 性格
                    </button>
                </div>
            </td>
        `;
        
        // Add event listener for row selection
        row.addEventListener('click', function(e) {
            if (!e.target.closest('.btn')) {
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

    // Add event listeners for projects buttons
    document.querySelectorAll('.view-projects-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const employeeId = parseInt(this.dataset.id);
            showEmployeeProjects(employeeId);
        });
    });

    // Add event listeners for personality buttons
    document.querySelectorAll('.view-personality-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const employeeId = parseInt(this.dataset.id);
            showEmployeePersonality(employeeId);
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
    
    // Get all certifications/qualifications from the "スキル" category
    const skillCategory = state.skills.categories.find(cat => cat.name === "スキル");
    const certifications = skillCategory ? skillCategory.skills.map(skill => skill.name) : [];
    
    // Format employee details
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h5>基本情報</h5>
                <p><strong>オフィス:</strong> ${employee.office}</p>
                <p><strong>出身地:</strong> ${employee.personal_info.birthplace}</p>
                <p><strong>言語:</strong> ${employee.personal_info.languages ? (Array.isArray(employee.personal_info.languages) ? employee.personal_info.languages.join(', ') : employee.personal_info.languages) : '情報なし'}</p>
                <p><strong>入社日:</strong> ${formatDate(employee.personal_info.joined_date)}</p>
                <p><strong>趣味:</strong> ${employee.personal_info.hobbies ? (Array.isArray(employee.personal_info.hobbies) ? employee.personal_info.hobbies.join(', ') : employee.personal_info.hobbies) : '情報なし'}</p>
            </div>
            <div class="col-md-6">
                <h5>スキル評価</h5>
                <div class="skills-radar-container">
                    <canvas id="employee-skills-radar"></canvas>
                </div>
            </div>
        </div>
        <div class="row mt-4">
            <div class="col-md-6">
                <h5>スキル詳細</h5>
                <div class="skill-bars">
                    ${getDisplayableSkills(employee).map(([skill, level]) => `
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
            <div class="col-md-6">
                <h5>資格・認定</h5>
                <div class="certification-indicators">
                    ${Object.entries(employee.Shikaku || {})
                        .sort((a, b) => b[1] - a[1]) // Sort so certifications with value 1 (green icons) appear at top
                        .map(([cert, value]) => {
                            const hasCert = value > 0;
                            return `
                                <div class="certification-item mb-2">
                                    <span class="certification-badge ${hasCert ? 'bg-success' : 'bg-secondary'}">
                                        <i class="bi ${hasCert ? 'bi-check-lg' : 'bi-x-lg'}"></i>
                                    </span>
                                    <span class="certification-name">${cert}</span>
                                </div>
                            `;
                        }).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Create radar chart for employee skills - use same logic as skill bars
    const ctx = document.getElementById('employee-skills-radar').getContext('2d');
    
    // Get the same skills that are displayed in the skill bars
    const displayableSkills = getDisplayableSkills(employee);
    
    const skillLabels = displayableSkills.map(([skill, _]) => skill);
    const skillValues = displayableSkills.map(([_, value]) => value);
    
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
 * Show employee projects information
 * @param {number} employeeId - ID of the employee to show projects for
 */
function showEmployeeProjects(employeeId) {
    const employee = state.employees.find(emp => emp.id === employeeId);
    
    if (!employee) {
        return;
    }
    
    const modalTitle = document.getElementById('projectsModalLabel');
    const modalContent = document.getElementById('projects-content');
    
    modalTitle.textContent = `${employee.name} - 進行中のプロジェクト`;
    
    if (!employee.ongoing_projects || employee.ongoing_projects.length === 0) {
        modalContent.innerHTML = `
            <div class="text-center text-muted">
                <i class="bi bi-briefcase" style="font-size: 3rem;"></i>
                <p class="mt-3">現在進行中のプロジェクトはありません</p>
            </div>
        `;
    } else {
        modalContent.innerHTML = `
            <div class="projects-list">
                ${employee.ongoing_projects.map(project => {
                    const progressColor = project.progress >= 80 ? 'bg-success' : 
                                        project.progress >= 50 ? 'bg-primary' : 'bg-warning';
                    const deadline = new Date(project.deadline);
                    const isUrgent = deadline < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
                    
                    return `
                        <div class="card mb-3">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h6 class="mb-0">${project.name}</h6>
                                <span class="badge ${isUrgent ? 'bg-danger' : 'bg-secondary'}">
                                    締切: ${formatDate(project.deadline)}
                                </span>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <p><strong>役割:</strong> ${project.role}</p>
                                        <p><strong>フェーズ:</strong> ${project.phase || '開発中'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-2">
                                            <strong>進捗率:</strong>
                                            <div class="progress mt-1 position-relative" style="height: 25px;">
                                                <div class="progress-bar ${progressColor}" role="progressbar" 
                                                     style="width: ${project.progress}%" 
                                                     aria-valuenow="${project.progress}" 
                                                     aria-valuemin="0" aria-valuemax="100">
                                                </div>
                                                <span class="position-absolute w-100 text-center" style="line-height: 25px; color: #000; font-weight: bold;">
                                                    ${project.progress}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    const projectsModal = document.getElementById('projects-modal');
    const modal = new bootstrap.Modal(projectsModal);
    modal.show();
}

/**
 * Show employee personality traits
 * @param {number} employeeId - ID of the employee to show personality for
 */
function showEmployeePersonality(employeeId) {
    const employee = state.employees.find(emp => emp.id === employeeId);

    if (!employee) return;

    const modalTitle = document.getElementById('personalityModalLabel');
    const modalContent = document.getElementById('personality-content');

    modalTitle.textContent = `${employee.name} - 性格特性`;

    if (!employee.personality_traits) {
        modalContent.innerHTML = `
            <div class="text-center text-muted">
                <i class="bi bi-person-heart" style="font-size: 3rem;"></i>
                <p class="mt-3">性格特性データがありません</p>
            </div>
        `;
        return;
    }

    const traits = Object.entries(employee.personality_traits);
    const rawValues = traits.map(([_, value]) => value);
    const maxScore = Math.max(...rawValues);
    const chartMax = Math.min(100, Math.ceil((maxScore + 5) / 5) * 5);

    const normalizedTraits = traits.map(([trait, value]) => {
        return {
            name: trait,
            raw: value,
            normalized: (value / chartMax) * 5
        };
    });

    const personalityType = determinePersonalityType(employee.personality_traits);

    modalContent.innerHTML = `
        <div class="personality-profile">
            <div class="row">
                <div class="col-md-12 mb-4">
                    <div class="card personality-type-card">
                        <div class="card-header bg-primary text-white text-center">
                            <h5 class="mb-0">総合性格タイプ</h5>
                        </div>
                        <div class="card-body text-center">
                            <div class="personality-icon mb-3">
                                <i class="${personalityType.icon}" style="font-size: 4rem; color: ${personalityType.color};"></i>
                            </div>
                            <h4 class="personality-name">${personalityType.name}</h4>
                            <p class="personality-description">${personalityType.description}</p>
                            <div class="personality-badges">
                                ${personalityType.traits.map(trait => 
                                    `<span class="badge bg-light text-dark me-1">${trait}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header text-center">
                            <h6 class="mb-0">性格特性チャート(標準化)</h6>
                        </div>
                        <div class="card-body">
                            <canvas id="personality-radar-chart" width="300" height="300"></canvas>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header text-center">
                            <h6 class="mb-0">詳細分析</h6>
                        </div>
                        <div class="card-body">
                            ${normalizedTraits.map(({ name, raw, normalized }) => {
                                const levelColor = normalized >= 4 ? 'bg-success' : 
                                                    normalized >= 3 ? 'bg-primary' : 
                                                    normalized >= 2 ? 'bg-warning' : 'bg-danger';

                                return `
                                    <div class="mb-3">
                                        <div class="d-flex justify-content-between align-items-center mb-1">
                                            <span class="trait-name">${name}</span>
                                            <span class="trait-level badge ${levelColor}">${raw} </span>
                                        </div>
                                        <div class="progress" style="height: 8px;">
                                            <div class="progress-bar ${levelColor}" role="progressbar" 
                                                 style="width: ${(normalized / 5) * 100}%"
                                                 aria-valuenow="${normalized.toFixed(2)}"
                                                 aria-valuemin="0" aria-valuemax="5">
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Radar Chart Setup
    setTimeout(() => {
        const ctx = document.getElementById("personality-radar-chart").getContext("2d");
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: normalizedTraits.map(t => t.name),
                datasets: [{
                    label: '性格スコア',
                    data: normalizedTraits.map(t => t.normalized),
                    backgroundColor: "rgba(54, 162, 235, 0.2)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        min: 0,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: value => value.toFixed(1)
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const raw = normalizedTraits[context.dataIndex].raw;
                                return `スコア: ${raw} / 100`;
                            }
                        }
                    }
                }
            }
        });
    }, 100);

    
    const personalityModal = document.getElementById('personality-modal');
    const modal = new bootstrap.Modal(personalityModal);
    modal.show();
}

/**
 * Determine personality type based on traits
 * @param {Object} traits - Personality traits object
 * @returns {Object} Personality type information
 */
function determinePersonalityType(traits) {
    const leadership = traits['リーダーシップ'] || 0;
    const communication = traits['コミュニケーション'] || 0;
    const problemSolving = traits['問題解決能力'] || 0;
    const teamwork = traits['チームワーク'] || 0;
    const creativity = traits['創造性'] || 0;
    const adaptability = traits['適応性'] || 0;
    const analytical = traits['分析力'] || 0;
    const responsibility = traits['責任感'] || 0;

    // Determine dominant type based on trait combinations
    if (leadership >= 4 && communication >= 4) {
        return {
            name: 'リーダータイプ',
            description: 'チームを牽引し、効果的なコミュニケーションでプロジェクトを成功に導く',
            icon: 'bi bi-person-arms-up',
            color: '#dc3545',
            traits: ['リーダーシップ', 'コミュニケーション', '責任感']
        };
    } else if (analytical >= 4 && problemSolving >= 4) {
        return {
            name: 'アナリストタイプ',
            description: '論理的思考と分析力で複雑な問題を解決する',
            icon: 'bi bi-graph-up',
            color: '#0d6efd',
            traits: ['分析力', '問題解決能力', '責任感']
        };
    } else if (creativity >= 4 && adaptability >= 4) {
        return {
            name: 'クリエイタータイプ',
            description: '創造性と柔軟性で革新的なソリューションを生み出す',
            icon: 'bi bi-lightbulb',
            color: '#fd7e14',
            traits: ['創造性', '適応性', 'コミュニケーション']
        };
    } else if (teamwork >= 4 && communication >= 4) {
        return {
            name: 'コラボレータータイプ',
            description: 'チームワークを重視し、協調性を活かして成果を上げる',
            icon: 'bi bi-people',
            color: '#198754',
            traits: ['チームワーク', 'コミュニケーション', '適応性']
        };
    } else if (responsibility >= 4 && analytical >= 3) {
        return {
            name: 'スペシャリストタイプ',
            description: '専門知識と責任感で高品質な成果物を提供する',
            icon: 'bi bi-award',
            color: '#6610f2',
            traits: ['責任感', '分析力', '問題解決能力']
        };
    } else {
        return {
            name: 'バランスタイプ',
            description: '各特性がバランス良く発達した安定型',
            icon: 'bi bi-balance-scale',
            color: '#6c757d',
            traits: ['バランス', '安定性', '柔軟性']
        };
    }
}

/**
 * Create radar chart for individual personality traits
 * @param {Object} traits - Personality traits object
 */
function createPersonalityRadarChart(traits) {
    const canvas = document.getElementById('personality-radar-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const labels = Object.keys(traits);
    const data = Object.values(traits);
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '性格特性',
                data: data,
                fill: true,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgb(54, 162, 235)',
                pointBackgroundColor: 'rgb(54, 162, 235)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(54, 162, 235)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
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
                    display: false
                }
            }
        }
    });
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
    
    // Filter by offices (multiple selection)
    if (state.selectedOffices && state.selectedOffices.length > 0) {
        filteredEmployees = filteredEmployees.filter(emp => 
            state.selectedOffices.includes(emp.office)
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
    
    // Filter by certifications (Shikaku)
    if (state.selectedCertifications && state.selectedCertifications.length > 0) {
        filteredEmployees = filteredEmployees.filter(emp => {
            return state.selectedCertifications.some(certName => {
                return emp.Shikaku && emp.Shikaku[certName] && emp.Shikaku[certName] > 0;
            });
        });
    }
    
    // Filter by personality types
    if (state.selectedPersonalityTypes && state.selectedPersonalityTypes.length > 0) {
        filteredEmployees = filteredEmployees.filter(emp => 
            state.selectedPersonalityTypes.includes(emp.personality_type)
        );
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
/**
 * Get skills to display based on current filter selection
 * @param {Object} employee - Employee object
 * @returns {Array} Array of [skill, level] pairs to display
 */
function getDisplayableSkills(employee) {
    const topSkills = [
        "Azure Functions", "C#", "C++", "Docker", "Java", "JavaScript", "Kubernetes"
    ];

    const skills = Object.entries(employee.skills || {}).map(([skill, level]) => [skill, parseInt(level, 10)]);

    // If no filters are selected, show all top skills (even with level 0)
    if (!state.selectedSkills || state.selectedSkills.length === 0) {
        return topSkills.map(skillName => {
            const match = skills.find(([s]) => s === skillName);
            return match || [skillName, 0];
        });
    }
        // If filters are selected, show only the selected skills (regardless of level)
        return state.selectedSkills.map(skillName => {
            const match = skills.find(([s]) => s === skillName);
            return match || [skillName, 0];
        });
    }

    
function getSkillLevelColor(level) {
    if (level === 0) return 'secondary';
    if (level === 1) return 'danger';
    if (level === 2) return 'warning';
    if (level === 3) return 'info';
    if (level === 4) return 'primary';
    if (level === 5) return 'success';
    return 'primary';
}
