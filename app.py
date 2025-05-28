import os
import logging
from flask import Flask, render_template, request, jsonify
import json
from utils import load_skills_from_excel
from csv_loader import load_employee_data_from_csv, create_skills_from_csv, load_offices_data

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")

# Load data
def load_data():
    try:
        # Load employees from CSV
        employees = load_employee_data_from_csv()
        
        # Load skills from CSV structure
        skills = create_skills_from_csv()
        
        # Load offices
        offices = load_offices_data()
        
        # Update office employee counts
        for office in offices:
            office["employees_count"] = len([emp for emp in employees if emp.get("office") == office["name"]])
        
        logging.info(f"Loaded {len(employees)} employees, {len(skills['categories'])} skill categories, {len(offices)} offices")
        return employees, skills, offices
    except Exception as e:
        logging.error(f"Error loading data: {e}")
        return [], [], []

# Routes
@app.route('/')
def index():
    employees, skills, offices = load_data()
    return render_template('index.html', 
                          employees=employees, 
                          skills=skills, 
                          offices=offices)

@app.route('/api/employees', methods=['GET'])
def get_employees():
    employees, _, _ = load_data()
    
    # Filter by office if provided
    office = request.args.get('office')
    if office and office != 'all':
        employees = [e for e in employees if e.get('office') == office]
    
    # Filter by skill if provided
    skill = request.args.get('skill')
    if skill and skill != 'all':
        employees = [e for e in employees if skill in e.get('skills', {})]
    
    return jsonify(employees)

@app.route('/api/employee/<employee_id>', methods=['GET'])
def get_employee(employee_id):
    employees, _, _ = load_data()
    employee = next((e for e in employees if str(e.get('id')) == employee_id), None)
    
    if employee:
        return jsonify(employee)
    else:
        return jsonify({"error": "Employee not found"}), 404

@app.route('/api/skills', methods=['GET'])
def get_skills():
    _, skills, _ = load_data()
    return jsonify(skills)

@app.route('/api/offices', methods=['GET'])
def get_offices():
    _, _, offices = load_data()
    return jsonify(offices)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
