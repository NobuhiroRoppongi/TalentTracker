/**
 * HR Dashboard Filters
 * Handles filter initialization and updates
 */

/**
 * Initialize filter components
 */
function initializeFilters() {
    initializeOfficeFilter();
    initializeSkillFilter();
    updateFilterDisplay();
}

/**
 * Initialize office location filter
 */
function initializeOfficeFilter() {
    const officeFilter = document.getElementById('office-filter');
    
    // Add event listener for office selection
    officeFilter.addEventListener('change', function() {
        state.selectedOffice = this.value;
        updateFilterDisplay();
    });
}

/**
 * Initialize skill selection filters
 */
function initializeSkillFilter() {
    const skillFilter = document.getElementById('skill-filter');
    
    // Create skill category accordions
    state.skills.categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'accordion-item';
        categoryDiv.innerHTML = `
            <h2 class="accordion-header" id="heading-${category.id}">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                        data-bs-target="#collapse-${category.id}" aria-expanded="false" 
                        aria-controls="collapse-${category.id}">
                    ${category.name}
                </button>
            </h2>
            <div id="collapse-${category.id}" class="accordion-collapse collapse" 
                 aria-labelledby="heading-${category.id}" data-bs-parent="#skill-filter">
                <div class="accordion-body">
                    <div class="row" id="category-skills-${category.id}">
                        ${category.skills.map(skill => `
                            <div class="col-md-6 mb-2">
                                <div class="form-check">
                                    <input class="form-check-input skill-checkbox" type="checkbox" 
                                           value="${skill.name}" id="skill-${skill.id}">
                                    <label class="form-check-label" for="skill-${skill.id}">
                                        ${skill.name}
                                    </label>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        skillFilter.appendChild(categoryDiv);
    });
    
    // Add "Top Skills" category at the top
    const topSkillsDiv = document.createElement('div');
    topSkillsDiv.className = 'accordion-item';
    topSkillsDiv.innerHTML = `
        <h2 class="accordion-header" id="heading-top-skills">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" 
                    data-bs-target="#collapse-top-skills" aria-expanded="true" 
                    aria-controls="collapse-top-skills">
                トップスキル
            </button>
        </h2>
        <div id="collapse-top-skills" class="accordion-collapse collapse show" 
             aria-labelledby="heading-top-skills" data-bs-parent="#skill-filter">
            <div class="accordion-body">
                <div class="row" id="top-skills">
                    ${state.skills.top_skills.map(skill => `
                        <div class="col-md-6 mb-2">
                            <div class="form-check">
                                <input class="form-check-input skill-checkbox" type="checkbox" 
                                       value="${skill.name}" id="top-skill-${skill.id}">
                                <label class="form-check-label" for="top-skill-${skill.id}">
                                    ${skill.name}
                                </label>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    skillFilter.prepend(topSkillsDiv);
    
    // Add event listeners for skill checkboxes
    document.querySelectorAll('.skill-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                if (!state.selectedSkills.includes(this.value)) {
                    state.selectedSkills.push(this.value);
                }
            } else {
                const index = state.selectedSkills.indexOf(this.value);
                if (index !== -1) {
                    state.selectedSkills.splice(index, 1);
                }
            }
            
            updateFilterDisplay();
        });
    });
}

/**
 * Update the active filter display
 */
function updateFilterDisplay() {
    const activeFiltersDiv = document.getElementById('active-filters');
    activeFiltersDiv.innerHTML = '';
    
    // Add office filter badge if not 'all'
    if (state.selectedOffice !== 'all') {
        const officeBadge = document.createElement('span');
        officeBadge.className = 'badge bg-primary me-2 mb-2';
        officeBadge.textContent = `オフィス: ${state.selectedOffice}`;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-close btn-close-white ms-1';
        removeBtn.setAttribute('aria-label', 'Remove filter');
        removeBtn.style.fontSize = '0.5rem';
        removeBtn.addEventListener('click', function() {
            document.getElementById('office-filter').value = 'all';
            state.selectedOffice = 'all';
            updateFilterDisplay();
        });
        
        officeBadge.appendChild(removeBtn);
        activeFiltersDiv.appendChild(officeBadge);
    }
    
    // Add skill filter badges
    state.selectedSkills.forEach(skill => {
        const skillBadge = document.createElement('span');
        skillBadge.className = 'badge bg-info text-dark me-2 mb-2';
        skillBadge.textContent = `スキル: ${skill}`;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-close btn-close-white ms-1';
        removeBtn.setAttribute('aria-label', 'Remove filter');
        removeBtn.style.fontSize = '0.5rem';
        removeBtn.addEventListener('click', function() {
            // Uncheck the corresponding checkbox
            document.querySelectorAll('.skill-checkbox').forEach(checkbox => {
                if (checkbox.value === skill) {
                    checkbox.checked = false;
                }
            });
            
            // Remove from selected skills
            const index = state.selectedSkills.indexOf(skill);
            if (index !== -1) {
                state.selectedSkills.splice(index, 1);
            }
            
            updateFilterDisplay();
        });
        
        skillBadge.appendChild(removeBtn);
        activeFiltersDiv.appendChild(skillBadge);
    });
    
    // Show/hide the "no filters" message
    const noFiltersMsg = document.getElementById('no-filters-message');
    if (state.selectedOffice === 'all' && state.selectedSkills.length === 0) {
        noFiltersMsg.style.display = 'block';
    } else {
        noFiltersMsg.style.display = 'none';
    }
}
