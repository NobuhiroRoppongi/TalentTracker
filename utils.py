import pandas as pd
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
        
        # Assume the first column is categories and the second column is skills
        category_col = df.columns[0]
        skill_col = df.columns[1]
        
        # Create a structured dictionary for skills
        skills_data = {"categories": [], "top_skills": []}
        
        # Track all categories and their skills
        categories = {}
        skill_id = 1
        
        # Process each row in the dataframe
        for _, row in df.iterrows():
            category_name = row[category_col]
            skill_name = row[skill_col]
            
            # Skip rows with missing data
            if pd.isna(category_name) or pd.isna(skill_name) or str(category_name).strip() == '' or str(skill_name).strip() == '':
                continue
                
            # Create or update the category
            if category_name not in categories:
                category_id = len(categories) + 1
                categories[category_name] = {
                    "id": category_id,
                    "name": category_name,
                    "skills": []
                }
            
            # Add the skill to the category
            skill = {
                "id": skill_id,
                "name": skill_name
            }
            categories[category_name]["skills"].append(skill)
            
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