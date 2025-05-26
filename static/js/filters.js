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
    initializeCertificationFilter();
    updateFilterDisplay();
}

/**
 * Initialize certification filter section
 */
function initializeCertificationFilter() {
    const certContainer = document.getElementById('certification-filter-container');
    if (!certContainer) return;
    
    // Find the "スキル" category
    const skillCategory = state.skills.categories.find(cat => cat.name === "スキル");
    if (!skillCategory) return;
    
    // Create toggles for each certification in a multi-column layout
    let html = '<div class="row">';
    skillCategory.skills.forEach((cert, index) => {
        html += `
            <div class="col-md-6 mb-2">
                <div class="certification-toggle">
                    <label class="certification-toggle-label">
                        <input type="checkbox" class="certification-toggle-input certification-checkbox" 
                               value="${cert.name}" id="cert-${cert.id}">
                        <span>${cert.name}</span>
                    </label>
                </div>
            </div>
        `;
        
        // Create a new row after every 2 certifications for better layout in dropdown
        if ((index + 1) % 2 === 0 && index < skillCategory.skills.length - 1) {
            html += '</div><div class="row">';
        }
    });
    html += '</div>';
    
    certContainer.innerHTML = html;
    
    // Update the certification dropdown button text to show count
    function updateCertificationDropdownText() {
        const certDropdown = document.getElementById('certificationsDropdown');
        if (!certDropdown) return;
        
        const selectedCount = state.selectedSkills.filter(skill => 
            skillCategory.skills.some(cert => cert.name === skill)
        ).length;
        
        if (selectedCount > 0) {
            certDropdown.textContent = `資格・認定 (${selectedCount} 選択)`;
        } else {
            certDropdown.textContent = '資格・認定を選択...';
        }
    }
    
    // Add event listeners
    document.querySelectorAll('.certification-checkbox').forEach(checkbox => {
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
            updateCertificationDropdownText();
            
            // Immediately update charts when certifications are selected/deselected
            applyFilters();
        });
    });
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
    const skillCategoriesContainer = document.getElementById('skill-categories-container');
    if (!skillCategoriesContainer) return;
    
    // Create category buttons for the foldable tab design
    let html = '<div class="row">';
    
    // Add Top Skills button first
    html += `
        <div class="col-md-6 mb-2">
            <button class="btn btn-outline-primary w-100 skill-category-btn" 
                    data-category="top-skills" data-category-name="トップスキル">
                トップスキル
            </button>
        </div>
    `;
    
    // Add other skill categories (excluding "スキル" category)
    state.skills.categories.forEach((category, index) => {
        if (category.name === "スキル") return;
        
        html += `
            <div class="col-md-6 mb-2">
                <button class="btn btn-outline-primary w-100 skill-category-btn" 
                        data-category="${category.id}" data-category-name="${category.name}">
                    ${category.name}
                </button>
            </div>
        `;
        
        // Start new row after every 2 buttons
        if ((index + 1) % 2 === 0) {
            html += '</div><div class="row">';
        }
    });
    html += '</div>';
    
    skillCategoriesContainer.innerHTML = html;
    
    // Add event listeners for category buttons
    document.querySelectorAll('.skill-category-btn').forEach(button => {
        button.addEventListener('click', function() {
            const categoryId = this.dataset.category;
            const categoryName = this.dataset.categoryName;
            openSkillSelectionModal(categoryId, categoryName);
        });
    });
    
    // Update the skills tab text to show count
    updateSkillsTabText();
    
    // Set up modal event listeners
    setupSkillModalEventListeners();
}

/**
 * Open skill selection modal for a specific category
 */
function openSkillSelectionModal(categoryId, categoryName) {
    const modal = new bootstrap.Modal(document.getElementById('skill-selection-modal'));
    const modalTitle = document.getElementById('skillSelectionModalLabel');
    const modalContent = document.getElementById('skill-selection-content');
    
    modalTitle.textContent = `${categoryName} - スキル選択`;
    
    let skills = [];
    if (categoryId === 'top-skills') {
        skills = state.skills.top_skills;
    } else {
        const category = state.skills.categories.find(cat => cat.id == categoryId);
        skills = category ? category.skills : [];
    }
    
    // Create checkboxes for skills
    let html = '<div class="row">';
    skills.forEach((skill, index) => {
        const isChecked = state.selectedSkills.includes(skill.name) ? 'checked' : '';
        html += `
            <div class="col-md-6 mb-2">
                <div class="form-check">
                    <input class="form-check-input skill-modal-checkbox" type="checkbox" 
                           value="${skill.name}" id="modal-skill-${skill.id}" ${isChecked}>
                    <label class="form-check-label" for="modal-skill-${skill.id}">
                        ${skill.name}
                    </label>
                </div>
            </div>
        `;
        
        // Start new row after every 2 skills
        if ((index + 1) % 2 === 0 && index < skills.length - 1) {
            html += '</div><div class="row">';
        }
    });
    html += '</div>';
    
    modalContent.innerHTML = html;
    modal.show();
}

/**
 * Set up event listeners for skill modal
 */
function setupSkillModalEventListeners() {
    const modal = document.getElementById('skill-selection-modal');
    const cancelBtn = document.getElementById('skill-modal-cancel');
    const applyBtn = document.getElementById('skill-modal-apply');
    
    // Cancel button - just close modal without saving changes
    cancelBtn.addEventListener('click', function() {
        const modalInstance = bootstrap.Modal.getInstance(modal);
        modalInstance.hide();
    });
    
    // Apply button - save changes and close modal
    applyBtn.addEventListener('click', function() {
        // Get all checked skills from modal
        const checkedSkills = [];
        document.querySelectorAll('.skill-modal-checkbox:checked').forEach(checkbox => {
            checkedSkills.push(checkbox.value);
        });
        
        // Get all unchecked skills from modal
        const uncheckedSkills = [];
        document.querySelectorAll('.skill-modal-checkbox:not(:checked)').forEach(checkbox => {
            uncheckedSkills.push(checkbox.value);
        });
        
        // Update state.selectedSkills
        // Add checked skills that aren't already selected
        checkedSkills.forEach(skill => {
            if (!state.selectedSkills.includes(skill)) {
                state.selectedSkills.push(skill);
            }
        });
        
        // Remove unchecked skills that are currently selected
        uncheckedSkills.forEach(skill => {
            const index = state.selectedSkills.indexOf(skill);
            if (index !== -1) {
                state.selectedSkills.splice(index, 1);
            }
        });
        
        // Update UI
        updateFilterDisplay();
        updateSkillsTabText();
        applyFilters();
        
        // Close modal
        const modalInstance = bootstrap.Modal.getInstance(modal);
        modalInstance.hide();
    });
}

/**
 * Update the skills tab text to show count
 */
function updateSkillsTabText() {
    const skillsTabText = document.getElementById('skills-tab-text');
    if (!skillsTabText) return;
    
    const selectedCount = state.selectedSkills.filter(skill => 
        !state.skills.categories.find(cat => cat.name === "スキル")?.skills.some(cert => cert.name === skill)
    ).length;
    
    if (selectedCount > 0) {
        skillsTabText.textContent = `スキル (${selectedCount} 選択)`;
    } else {
        skillsTabText.textContent = 'スキルを選択...';
    }
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
            // Update charts to reflect filter changes
            applyFilters();
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
            
            // Update charts immediately when removing a skill filter
            applyFilters();
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
