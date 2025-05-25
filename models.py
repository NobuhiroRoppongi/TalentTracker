# This file is kept intentionally simple as we're using JSON files for data storage
# In a real-world application, this would contain SQLAlchemy models

class Employee:
    """Class representing an employee."""
    def __init__(self, id, name, office, skills, personal_info):
        self.id = id
        self.name = name
        self.office = office
        self.skills = skills  # Dictionary of skill_name: skill_level
        self.personal_info = personal_info  # Dictionary containing hobbies, birthplace, etc.

class Skill:
    """Class representing a skill."""
    def __init__(self, id, name, category):
        self.id = id
        self.name = name
        self.category = category

class Office:
    """Class representing an office location."""
    def __init__(self, id, name, location):
        self.id = id
        self.name = name
        self.location = location
