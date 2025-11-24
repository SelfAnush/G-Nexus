#!/usr/bin/env python3
"""
Generate game-index.json from games directory structure.
This script scans the games/ directory for subdirectories containing game files,
and creates a JSON index file with game metadata.
"""

import json
import os
from pathlib import Path

def get_game_metadata(game_dir):
    """
    Extract metadata from a game directory.
    
    Args:
        game_dir: Path object pointing to a game directory
        
    Returns:
        Dictionary containing game metadata
    """
    game_name = game_dir.name
    
    # Check for config.json to get additional metadata
    config_file = game_dir / "config.json"
    config_data = {}
    if config_file.exists():
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
        except Exception as e:
            print(f"Warning: Could not read config.json for {game_name}: {e}")
    
    # Build metadata object
    metadata = {
        "name": config_data.get("title", game_name),
        "path": f"games/{game_name}",
        "folder": game_name
    }
    
    # Add optional fields if they exist in config
    if "description" in config_data:
        metadata["description"] = config_data["description"]
    if "category" in config_data:
        metadata["category"] = config_data["category"]
    if "thumbnail" in config_data:
        metadata["thumbnail"] = f"games/{game_name}/{config_data['thumbnail']}"
    elif (game_dir / "thumbnail.png").exists():
        metadata["thumbnail"] = f"games/{game_name}/thumbnail.png"
    
    return metadata

def generate_game_index():
    """
    Generate game-index.json from the games directory.
    """
    # Get the project root directory (parent of scripts/)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    games_dir = project_root / "games"
    
    if not games_dir.exists():
        print(f"Error: Games directory not found at {games_dir}")
        return
    
    games = []
    
    # Scan for game directories
    for item in sorted(games_dir.iterdir()):
        if item.is_dir():
            # Check if it's a valid game directory (has index.html)
            if (item / "index.html").exists():
                metadata = get_game_metadata(item)
                games.append(metadata)
                print(f"Found game: {metadata['name']}")
    
    # Write the index file
    output_file = games_dir / "game-index.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(games, f, indent=2, ensure_ascii=False)
    
    print(f"\nGenerated {output_file} with {len(games)} game(s)")

if __name__ == "__main__":
    generate_game_index()
