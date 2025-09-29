#!/usr/bin/env python3
"""
Database migration script using Alembic
Usage:
    python migrate.py init     # Create initial migration
    python migrate.py upgrade  # Apply all migrations
    python migrate.py downgrade # Rollback one migration
    python migrate.py current   # Show current revision
    python migrate.py history   # Show migration history
"""

import os
import subprocess
import sys
from pathlib import Path


def run_alembic_command(command: str):
    """Run alembic command from the backend directory."""
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)

    cmd = f"alembic {command}"
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

    if result.returncode == 0:
        print(result.stdout)
    else:
        print(f"Error: {result.stderr}")
        sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "init":
        print("Creating initial migration...")
        run_alembic_command("revision --autogenerate -m 'Initial migration'")
    elif command == "upgrade":
        print("Applying migrations...")
        run_alembic_command("upgrade head")
    elif command == "downgrade":
        print("Rolling back migration...")
        run_alembic_command("downgrade -1")
    elif command == "current":
        print("Current revision:")
        run_alembic_command("current")
    elif command == "history":
        print("Migration history:")
        run_alembic_command("history")
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
