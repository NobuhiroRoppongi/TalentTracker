import os
import logging
from flask import Flask, render_template, request, jsonify
import json
from utils import load_skills_from_excel

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")

# Load data
def load_data():
    try:
        # Load employees and offices from JSON
        with open('static/data/employees.json', 'r', encoding='utf-8') as f:
            employees = json.load(f)
        with open('static/data/offices.json', 'r', encoding='utf-8') as f:
            offices = json.load(f)
        
        # Load skills from Excel file
        skills = load_skills_from_excel()
        
        # If Excel import fails, fallback to JSON
        if skills is None:
            logging.warning("Failed to load skills from Excel, falling back to JSON")
            try:
                with open('static/data/skills.json', 'r', encoding='utf-8') as f:
                    skills = json.load(f)
            except Exception as e:
                logging.error(f"Error loading skills from JSON: {e}")
                skills = {"categories": [], "top_skills": []}
        
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
