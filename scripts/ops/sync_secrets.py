
import os
import subprocess
import sys

def get_gh_secrets():
    result = subprocess.run(['gh', 'secret', 'list', '--json', 'name'], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error listing secrets: {result.stderr}")
        return []
    import json
    secrets = json.loads(result.stdout)
    return [s['name'] for s in secrets]

def set_gh_secret(name, value):
    process = subprocess.Popen(['gh', 'secret', 'set', name], stdin=subprocess.PIPE, text=True)
    process.communicate(input=value)
    if process.returncode != 0:
        print(f"Error setting secret {name}")

def delete_gh_secret(name):
    subprocess.run(['gh', 'secret', 'delete', name], check=True)

def main():
    if not os.path.exists('secrets.env'):
        print("secrets.env not found")
        return

    protected_secrets = ['VPS_IP', 'VPS_PASSWORD', 'VPS_SSH_KEY', 'VPS_USER', 'GITHUB_TOKEN']
    
    local_secrets = {}
    with open('secrets.env', 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                name, value = line.split('=', 1)
                local_secrets[name.strip()] = value.strip()

    gh_secrets = get_gh_secrets()
    
    print(f"Syncing {len(local_secrets)} secrets to GitHub...")
    for name, value in local_secrets.items():
        print(f"Set: {name}")
        set_gh_secret(name, value)

    print("\nCleaning up legacy secrets...")
    for name in gh_secrets:
        if name not in local_secrets and name not in protected_secrets:
            print(f"Delete: {name}")
            try:
                delete_gh_secret(name)
            except:
                print(f"Failed to delete {name}")

if __name__ == "__main__":
    main()
