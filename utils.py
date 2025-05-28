import pandas as pd
import numpy as np
import logging
import json
import os


def load_skills_from_excel():
    """
    Load skills data from CSV file and structure it for the application.
    Returns a dictionary with categories and skills in the format needed by the app.
    """
    try:
        csv_path = 'static/data/自己紹介マトリクス_全員分_Sample.csv'
        if not os.path.exists(csv_path):
            logging.error(f"CSV file not found: {csv_path}")
            return None

        # Load CSV
        df = pd.read_csv(csv_path, encoding='utf-8')
        if df.empty or len(df.columns) < 1:
            logging.error("CSV file is empty or does not have enough columns")
            return None

        ################## Creating Skill Drop Down ##################
        # Step 1: Check the first column
        first_col = df.columns[0]
        # Step 2: Filter rows that contain '_'
        df = df[df[first_col].astype(str).str.contains('_', na=False)]
        # Step 3: Exclude rows with '自由記述'
        df = df[~df[first_col].astype(str).str.contains('自由記述', na=False)]
        # Step 4: Split the first column into category and skill
        df[['category',
            'skill']] = df[first_col].astype(str).str.split('_',
                                                            n=1,
                                                            expand=True)
        # Assign column names for further processing
        category_col, skill_col = 'category', 'skill'

        # Create a structured dictionary for skills
        skills_data = {"categories": [], "top_skills": []}
        ################## / Creating Skill Drop Down ##################
        # Track all categories and their skills
        categories = {}
        skill_id = 1

        # Define the specific top skills we want to prioritize (from employee data)
        top_skill_names = [
            "Azure Functions", "C#", "C++", "Docker", "Java", "JavaScript", "Kubernetes"
        ]

        # Convert dataframe to records for easier processing
        records = df.to_dict('records')

        ################## Creating JSON file for skills dropdown ###############
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
            skill = {"id": skill_id, "name": skill_str}
            categories[category_str]["skills"].append(skill)

            # Add to top skills if it's one of our priority skills
            if skill_str in top_skill_names and not any(
                    s["name"] == skill_str for s in skills_data["top_skills"]):
                skills_data["top_skills"].append(skill)

            skill_id += 1

        # If we didn't find all our top skills in the Excel file, add them manually
        for top_skill in top_skill_names:
            if not any(s["name"] == top_skill
                       for s in skills_data["top_skills"]):
                new_skill = {"id": skill_id, "name": top_skill}
                skills_data["top_skills"].append(new_skill)
                skill_id += 1

                # Also add to appropriate category or create a new one
                category_name = "技術スキル"
                if category_name not in categories:
                    category_id = len(categories) + 1
                    categories[category_name] = {
                        "id": category_id,
                        "name": category_name,
                        "skills": []
                    }
                categories[category_name]["skills"].append(new_skill)

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
        ################## Creating JSON file for employees ###############

    ################## Creating JSON file for employees dropdown ###############
    except Exception as e:
        logging.error(f"Error loading skills from Excel: {e}")
        return None


def generate_employees_json_from_csv():
    """
    Generate employee JSON including skills and Shikaku sections
    and overwrite static/data/employees.json
    """
    try:
        csv_path = 'static/data/自己紹介マトリクス_全員分_Sample.csv'
        if not os.path.exists(csv_path):
            logging.error(f"CSV file not found: {csv_path}")
            return

        df = pd.read_csv(csv_path, encoding='utf-8')
        # Transpose data and set index
        df_t = df.set_index(df.columns[0]).T.reset_index(drop=True)

        # Extract skill and qualification (Shikaku) indices
        row_labels = df[df.columns[0]].astype(str)

        # General skills: contain '_' but not 'スキル', '自由記述', 'personality_type', or 'business_capacity'
        skills_rows = row_labels[
            row_labels.str.contains('_') &
            ~row_labels.str.startswith('スキル') &
            ~row_labels.str.contains('自由記述') &
            ~row_labels.str.contains('personality_type') &
            ~row_labels.str.contains('business_capacity')
        ].tolist()

        # Certifications (Shikaku): contain 'スキル' and '_' but not '自由記述', 'personality_type', or 'business_capacity'
        shikaku_rows = row_labels[
            row_labels.str.contains('スキル') &
            row_labels.str.contains('_') &
            ~row_labels.str.contains('自由記述') &
            ~row_labels.str.contains('personality_type') &
            ~row_labels.str.contains('business_capacity')
        ].tolist()

        # Function to safely get integer value
        def safe_int(val):
            try:
                if pd.isna(val) or val == '' or str(val).lower() == 'nan':
                    return 0
                return int(float(val))
            except:
                return 0
        
        # Function to safely get string value
        def safe_str(val):
            if pd.isna(val) or str(val).lower() == 'nan':
                return ""
            return str(val).strip()

        def parse_traits(traits_str):
            try:
                return {
                    k.strip(): int(v)
                    for k, v in (item.split(':')
                                 for item in traits_str.split(';')
                                 if ':' in item)
                }
            except:
                return {}

        def parse_projects(projects_str):
            try:
                projects = []
                for p in projects_str.split(';'):
                    parts = p.strip().split('|')
                    if len(parts) == 5:
                        projects.append({
                            "name": parts[0].strip(),
                            "role": parts[1].strip(),
                            "progress": int(parts[2]),
                            "phase": parts[3].strip(),
                            "deadline": parts[4].strip()
                        })
                return projects
            except:
                return []

        # Construct JSON
        employees_json = []
        for idx, row in df_t.iterrows():
            # Skills and certifications
            skills = {
                label.split('_')[-1]: safe_int(row[label])
                for label in skills_rows if label in row
            }
            shikaku = {
                label.split('_')[-1]: safe_int(row[label])
                for label in shikaku_rows if label in row
            }

            employee = {
                "id": idx + 1,
                "name": safe_str(row.get("氏名", f"社員{idx+1}")).replace(" ", "").replace("　", ""),
                "office": safe_str(row.get("所属営業所", "")),
                "business_capacity": safe_int(row.get("business_capacity", 0)),
                "personalitytype": safe_str(row.get("personality_type", "")),
                "skills": skills,
                "Shikaku": shikaku,
                "ongoing_projects": parse_projects(safe_str(row.get("projects", ""))),
                "personality_traits": parse_traits(safe_str(row.get("traits", ""))),
                "personality_type": safe_str(row.get("personality_type", "")),
                "personal_info": {
                    "birthplace": safe_str(row.get("出身地", "")),
                    "workstyle": safe_str(row.get("ワークスタイル", "")),
                    "studentactivity": safe_str(row.get("学生時代の部活動", "")),
                    "bunkeirikei": safe_str(row.get("文理比", "")),
                    "agerange": safe_str(row.get("年齢層", "")),
                    "engskill": safe_str(row.get("エンジニアスキル", "")),
                    "joined_date": safe_str(row.get("入社日", ""))
                }
            }
            employees_json.append(employee)
        # Save to JSON
        output_path = 'static/data/employees.json'
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(employees_json, f, ensure_ascii=False, indent=2)
        logging.info("Employees data saved to static/data/employees.json")

    except Exception as e:
        logging.error(f"Error generating employees JSON: {e}")
