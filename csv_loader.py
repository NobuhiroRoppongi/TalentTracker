import pandas as pd
import json
import logging
import numpy as np

def load_employee_data_from_csv():
    """
    Load employee data from the CSV file and convert it to the format expected by the dashboard.
    """
    try:
        # Read the CSV file
        df = pd.read_csv('attached_assets/自己紹介マトリクス_全員分_merge.csv', encoding='utf-8')
        
        # Get employee data starting from row 1 (row 0 contains headers)
        employee_ids = df.iloc[1].values[2:]  # Skip first two columns (所属, 社員番号)
        employee_names = df.iloc[3].values[2:]  # 氏名 row
        offices = df.iloc[7].values[2:]  # 所属営業所 row
        engineer_skills = df.iloc[6].values[2:]  # エンジニアスキル row
        genders = df.iloc[5].values[2:]  # 男女比 row
        ages = df.iloc[4].values[2:]  # 年齢層 row
        birthplaces = df.iloc[11].values[2:]  # 出身地 row
        lifestyles = df.iloc[12].values[2:]  # 暮らしのスタイル row
        work_styles = df.iloc[13].values[2:]  # ワークスタイル row
        
        employees = []
        
        # Get skill categories and their row indices
        skill_categories = [
            ("システム開発_基幹", 16),
            ("システム開発_オープン", 17),
            ("システム開発_Web", 18),
            ("システム開発_組込・制御", 19),
            ("システム開発_ノーコード・ローコード", 20),
            ("システム開発_スマホアプリ", 21),
            ("ITインフラ_ネットワーク", 22),
            ("ITインフラ_オンプレ", 23),
            ("ITインフラ_クラウド", 24),
            ("ITインフラ_データベース", 25),
            ("ITインフラ_ミドルウェア", 26),
            ("ITインフラ_セキュリティ", 27),
            ("保守_基幹", 28),
            ("保守_オープン", 29),
            ("保守_Web", 30),
            ("保守_組込・制御", 31),
            ("保守_ノーコード・ローコード", 32),
        ]
        
        for i, emp_id in enumerate(employee_ids):
            if pd.isna(emp_id) or str(emp_id).strip() == '' or str(emp_id) == '-':
                continue
                
            name = employee_names[i] if i < len(employee_names) and not pd.isna(employee_names[i]) else f"社員{emp_id}"
            office = offices[i] if i < len(offices) and not pd.isna(offices[i]) else "東京"
            
            # Convert office names
            if office == "大阪":
                office_name = "大阪"
            elif office == "東京":
                office_name = "東京"
            elif office == "沖縄":
                office_name = "沖縄"
            else:
                office_name = "東京"
            
            # Build skills dictionary
            skills = {}
            for skill_name, row_idx in skill_categories:
                if row_idx < len(df):
                    skill_values = df.iloc[row_idx].values[2:]
                    if i < len(skill_values):
                        skill_value = skill_values[i]
                        if not pd.isna(skill_value) and str(skill_value).strip() != '':
                            try:
                                skill_level = int(skill_value)
                                if skill_level > 0:
                                    # Map to simplified skill names
                                    simplified_name = skill_name.replace("システム開発_", "").replace("ITインフラ_", "").replace("保守_", "")
                                    skills[simplified_name] = skill_level
                            except (ValueError, TypeError):
                                pass
            
            # Generate some project and personality data
            business_capacity = np.random.randint(60, 96)
            
            # Create ongoing projects
            project_names = [
                "システム開発プロジェクト", "インフラ構築", "データ分析", "UI改善", "セキュリティ強化",
                "クラウド移行", "API開発", "データベース最適化", "モバイルアプリ開発", "AI実装"
            ]
            
            roles = ["開発者", "リーダー", "アーキテクト", "プロジェクトマネージャー", "コンサルタント", "エンジニア"]
            phases = ["設計フェーズ", "開発フェーズ", "テストフェーズ", "実装フェーズ", "運用フェーズ"]
            
            num_projects = np.random.randint(1, 3)
            ongoing_projects = []
            for j in range(num_projects):
                project = {
                    "name": np.random.choice(project_names),
                    "role": np.random.choice(roles),
                    "progress": np.random.randint(20, 95),
                    "phase": np.random.choice(phases),
                    "deadline": f"2025-{np.random.randint(6, 12):02d}-{np.random.randint(1, 28):02d}"
                }
                ongoing_projects.append(project)
            
            # Generate personality traits
            personality_traits = {
                "リーダーシップ": np.random.randint(1, 6),
                "コミュニケーション": np.random.randint(2, 6),
                "問題解決能力": np.random.randint(2, 6),
                "チームワーク": np.random.randint(2, 6),
                "創造性": np.random.randint(1, 6),
                "適応性": np.random.randint(2, 6),
                "分析力": np.random.randint(1, 6),
                "責任感": np.random.randint(2, 6)
            }
            
            # Personal info
            gender = genders[i] if i < len(genders) and not pd.isna(genders[i]) else "男性"
            age = ages[i] if i < len(ages) and not pd.isna(ages[i]) else "30代"
            birthplace = birthplaces[i] if i < len(birthplaces) and not pd.isna(birthplaces[i]) else "関西"
            lifestyle = lifestyles[i] if i < len(lifestyles) and not pd.isna(lifestyles[i]) else "一人暮らし"
            work_style = work_styles[i] if i < len(work_styles) and not pd.isna(work_styles[i]) else "テレワーク"
            
            hobbies = ["読書", "映画鑑賞", "スポーツ", "旅行", "料理", "ゲーム", "音楽", "写真"]
            languages = ["日本語", "英語"]
            
            personal_info = {
                "birthplace": birthplace,
                "hobbies": list(np.random.choice(hobbies, size=np.random.randint(2, 4), replace=False)),
                "languages": languages,
                "joined_date": f"20{np.random.randint(18, 24)}-{np.random.randint(1, 13):02d}-{np.random.randint(1, 29):02d}",
                "gender": gender,
                "age": age,
                "lifestyle": lifestyle,
                "work_style": work_style
            }
            
            employee = {
                "id": int(emp_id) if str(emp_id).isdigit() else i + 1,
                "name": name,
                "office": office_name,
                "business_capacity": business_capacity,
                "skills": skills,
                "ongoing_projects": ongoing_projects,
                "personality_traits": personality_traits,
                "personal_info": personal_info
            }
            
            employees.append(employee)
        
        logging.info(f"Loaded {len(employees)} employees from CSV")
        return employees
        
    except Exception as e:
        logging.error(f"Error loading CSV data: {e}")
        return []

def create_skills_from_csv():
    """
    Create skills structure from the CSV categories.
    """
    skills_data = {
        "categories": [
            {
                "id": 1,
                "name": "システム開発",
                "skills": [
                    {"id": 1, "name": "基幹"},
                    {"id": 2, "name": "オープン"},
                    {"id": 3, "name": "Web"},
                    {"id": 4, "name": "組込・制御"},
                    {"id": 5, "name": "ノーコード・ローコード"},
                    {"id": 6, "name": "スマホアプリ"}
                ]
            },
            {
                "id": 2,
                "name": "ITインフラ",
                "skills": [
                    {"id": 7, "name": "ネットワーク"},
                    {"id": 8, "name": "オンプレ"},
                    {"id": 9, "name": "クラウド"},
                    {"id": 10, "name": "データベース"},
                    {"id": 11, "name": "ミドルウェア"},
                    {"id": 12, "name": "セキュリティ"}
                ]
            },
            {
                "id": 3,
                "name": "保守",
                "skills": [
                    {"id": 13, "name": "基幹"},
                    {"id": 14, "name": "オープン"},
                    {"id": 15, "name": "Web"},
                    {"id": 16, "name": "組込・制御"},
                    {"id": 17, "name": "ノーコード・ローコード"}
                ]
            }
        ],
        "top_skills": [
            {"id": 1, "name": "基幹"},
            {"id": 2, "name": "Web"},
            {"id": 3, "name": "クラウド"},
            {"id": 4, "name": "データベース"},
            {"id": 5, "name": "ネットワーク"},
            {"id": 6, "name": "セキュリティ"}
        ]
    }
    
    return skills_data

def load_offices_data():
    """
    Create office data.
    """
    return [
        {
            "id": 1,
            "name": "東京",
            "location": "東京都渋谷区",
            "employees_count": 0
        },
        {
            "id": 2,
            "name": "大阪", 
            "location": "大阪府大阪市",
            "employees_count": 0
        },
        {
            "id": 3,
            "name": "沖縄",
            "location": "沖縄県那覇市",
            "employees_count": 0
        }
    ]