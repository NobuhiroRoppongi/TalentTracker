import pandas as pd
import numpy as np
import logging
import json
import os

def load_skills_from_excel():
    """
    Load skills data from Excel file and structure it for the application.
    Returns a dictionary with categories and skills in the format needed by the app.
    """
    try:
        excel_path = 'static/data/excel/skills.xlsx'
        if not os.path.exists(excel_path):
            logging.error(f"Excel file not found: {excel_path}")
            return None
        
        # Read the Excel file
        df = pd.read_excel(excel_path)
        
        if df.empty or len(df.columns) < 2:
            logging.error("Excel file is empty or does not have enough columns")
            return None
            
        # Get column names
        cols = df.columns.tolist()
        category_col, skill_col = cols[0], cols[1]
        
        # Create a structured dictionary for skills
        skills_data = {"categories": [], "top_skills": []}
        
        # Track all categories and their skills
        categories = {}
        skill_id = 1
        
        # Convert dataframe to records for easier processing
        records = df.to_dict('records')
        
        # Process each row in the dataframe
        for record in records:
            category_name = record.get(category_col)
            skill_name = record.get(skill_col)
            
            # Skip rows with missing data
            if category_name is None or skill_name is None:
                continue
                
            # Handle NaN values
            if isinstance(category_name, float) and np.isnan(category_name):
                continue
            if isinstance(skill_name, float) and np.isnan(skill_name):
                continue
            
            # Convert to string and check if empty
            category_str = str(category_name).strip()
            skill_str = str(skill_name).strip()
            
            if category_str == '' or skill_str == '':
                continue
                
            # Create or update the category
            if category_str not in categories:
                category_id = len(categories) + 1
                categories[category_str] = {
                    "id": category_id,
                    "name": category_str,
                    "skills": []
                }
            
            # Add the skill to the category
            skill = {
                "id": skill_id,
                "name": skill_str
            }
            categories[category_str]["skills"].append(skill)
            
            # Add to top skills if it's among the first 12 skills overall
            if skill_id <= 12:
                skills_data["top_skills"].append(skill)
                
            skill_id += 1
        
        # Convert categories dictionary to list for the final structure
        skills_data["categories"] = list(categories.values())
        
        # Save the structured data to JSON for caching
        try:
            with open('static/data/skills.json', 'w', encoding='utf-8') as f:
                json.dump(skills_data, f, ensure_ascii=False, indent=2)
            logging.info("Skills data saved to JSON file")
        except Exception as e:
            logging.error(f"Error saving skills data to JSON: {e}")
        
        return skills_data
        
    except Exception as e:
        logging.error(f"Error loading skills from Excel: {e}")
        return None