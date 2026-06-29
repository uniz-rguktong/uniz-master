#!/usr/bin/env python3
"""Pin k8s deployments to tags in /root/.uniz_k8s_image_tags.json (run on VPS)."""
import json
import subprocess
import sys

manifest = sys.argv[1] if len(sys.argv) > 1 else "/root/.uniz_k8s_image_tags.json"
tags = json.load(open(manifest))
containers = {
    "uniz-auth-service": "auth-service",
    "uniz-user-service": "user-service",
    "uniz-gateway-api": "gateway-api",
    "uniz-academics-service": "academics-service",
    "uniz-outpass-service": "outpass-service",
    "uniz-files-service": "files-service",
    "uniz-mail-service": "mail-service",
    "uniz-notification-service": "notification-service",
    "uniz-cron-service": "cron-worker",
    "uniz-portal": "portal",
    "uniz-docs-service": "docs-service",
    "uniz-gateway": "gateway-nginx",
    "uniz-landing": "landing",
}
for dep, con in containers.items():
    tag = tags.get(dep)
    if not tag:
        continue
    full = f"ghcr.io/uniz-rguktong/{dep}:{tag}"
    print(f"set {dep} -> {full}")
    subprocess.run(
        ["kubectl", "set", "image", f"deployment/{dep}", f"{con}={full}"],
        check=False,
    )
    subprocess.run(
        [
            "kubectl",
            "patch",
            f"deployment/{dep}",
            "--type=json",
            "-p",
            '[{"op":"replace","path":"/spec/template/spec/containers/0/imagePullPolicy","value":"IfNotPresent"}]',
        ],
        check=False,
    )
