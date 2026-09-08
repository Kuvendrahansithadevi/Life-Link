RED_FLAGS = [
    "chest pain", "heart attack", "unconscious", "cannot breathe", 
    "severe bleeding", "stroke", "seizure", "collapsed", "not breathing",
    "గుండె నొప్పి", "శ్వాస ఆడట్లేదు", "స్పృహ తప్పి", "छाती में दर्द", "बेहोश", "సాధ్యం కావట్లేదు"
]

def check_red_flags(text: str) -> bool:
    text_lower = text.lower()
    return any(flag in text_lower for flag in RED_FLAGS)