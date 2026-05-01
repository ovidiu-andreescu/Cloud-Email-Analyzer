#!/usr/bin/env python3
import json
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_POPULATION_FILE = ROOT / "fixtures" / "demo_population.json"


def run(cmd, env):
    result = subprocess.run(cmd, cwd=ROOT, env=env, text=True)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def load_population():
    population_file = Path(os.getenv("DEMO_POPULATION_FILE", DEFAULT_POPULATION_FILE))
    return json.loads(population_file.read_text())


def main():
    env = {
        **os.environ,
        "PYTHONPATH": f"{ROOT / 'libs' / 'common' / 'src'}{os.pathsep}{os.environ.get('PYTHONPATH', '')}",
    }
    population = load_population()

    run([sys.executable, str(ROOT / "scripts" / "create_demo_users.py")], env)

    seed_script = ROOT / "scripts" / "local_seed_email.py"
    for message in population.get("messages", []):
        cmd = [
            sys.executable,
            str(seed_script),
            "--email",
            str(ROOT / message["email"]),
            "--to",
            message["to"],
            "--message-id",
            message["messageId"],
        ]
        if message.get("fromAddress"):
            cmd.extend(["--from-address", message["fromAddress"]])
        run(cmd, env)

    print("\nDemo users and sample messages created.")


if __name__ == "__main__":
    main()
