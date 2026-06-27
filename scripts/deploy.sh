#!/bin/bash
# --- UniZ Universal Deployment (VPS Cloud V5) ---
# CI/CD Context: ${DEPLOY_CONTEXT:-"LOCAL"}

# 1. Push code to GitHub
echo "[Push] Pushing code to GitHub..."
MSG=${1:-"chore: deployment update $(date +'%Y-%m-%d %H:%M:%S')"}

# Only try to commit/push if we are NOT on the VPS and NOT in CI/CD
if [ ! -f "/root/uniz-secrets.env" ] && [ "$DEPLOY_CONTEXT" != "GITHUB_ACTIONS" ]; then
  git add .
  git commit -m "$MSG" || echo "No changes to commit"
  git push origin main
fi

# shellcheck source=deploy-common.sh
source "$(dirname "$0")/deploy-common.sh"

# Latest local-<timestamp> tag for an image repo (docker first, then k3s ctr).
latest_local_image_tag() {
  local IMG="$1"
  local TAG=""
  mapfile -t tags < <(docker images --format "{{.Tag}}" "$IMG" 2>/dev/null | grep '^local-' | sort -t- -k2 -n || true)
  if [ "${#tags[@]}" -gt 0 ]; then
    echo "${tags[$((${#tags[@]} - 1))]}"
    return 0
  fi
  TAG=$(k3s ctr -n k8s.io images ls -q 2>/dev/null | grep "docker.io/library/$IMG:local-" | sort -V | tail -n 1 | cut -d: -f2)
  if [[ -n "$TAG" && "$TAG" =~ ^local-([0-9]+|[0-9a-f]{7,12})$ ]]; then
    echo "$TAG"
    return 0
  fi
  return 1
}

# Import a Docker-built image into k3s containerd (required for local tags).
import_image_to_k3s() {
  local IMG="$1"
  local TAG="$2"
  if ! docker image inspect "$IMG:$TAG" &>/dev/null; then
    echo "[Warn] Docker image $IMG:$TAG not found — skip import"
    return 1
  fi
  if k3s ctr -n k8s.io images ls -q 2>/dev/null | grep -q "docker.io/library/$IMG:$TAG"; then
    return 0
  fi
  echo "[Docker] Importing $IMG:$TAG into k3s..."
  docker save "$IMG:$TAG" | k3s ctr -n k8s.io images import -
}

# Remove stale uniz-*:local-<timestamp> Docker tags after deploy (keep latest 2 per repo + in-use).
prune_old_local_images() {
  echo "[Cleanup] Pruning old local-* Docker images..."
  local repos
  repos=$(docker images --format "{{.Repository}}" | grep -E '^uniz-' | sort -u || true)
  [ -z "$repos" ] && return 0

  for repo in $repos; do
    mapfile -t tags < <(docker images --format "{{.Tag}}" "$repo" | grep '^local-' | sort -t- -k2 -n || true)
    local count=${#tags[@]}
    [ "$count" -le 2 ] && continue
    local i
    for ((i=0; i<count-2; i++)); do
      docker rmi "$repo:${tags[$i]}" 2>/dev/null || true
    done
  done

  docker image prune -f >/dev/null 2>&1 || true
  docker builder prune -f --keep-storage 8GB >/dev/null 2>&1 || docker builder prune -f >/dev/null 2>&1 || true
  echo "[Cleanup] Docker prune complete."
}

# Prune stale images from k3s/containerd (main disk consumer on VPS).
prune_k3s_images() {
  if ! command -v k3s >/dev/null 2>&1; then
    return 0
  fi
  echo "[Cleanup] Pruning unused k3s/containerd images..."
  export CRICTL_TIMEOUT="${CRICTL_TIMEOUT:-10m}"
  k3s crictl rmi --prune 2>/dev/null || true
  k3s ctr -n k8s.io images prune --all 2>/dev/null || true
  echo "[Cleanup] k3s prune complete."
}

# Wait for key deployments and verify production health (fail CI if broken).
verify_deployment() {
  echo "[Verify] Waiting for rollouts..."
  local deps=()
  if [ "${#VERIFY_DEPLOYMENTS[@]}" -gt 0 ]; then
    local dep
    for dep in "${VERIFY_DEPLOYMENTS[@]}"; do
      [[ "$dep" == *"job"* ]] && continue
      kubectl get deployment "$dep" &>/dev/null || continue
      deps+=("$dep")
    done
    # Multi-service deploy on a small VPS: gate only the critical path.
    if [ "${#deps[@]}" -gt 3 ]; then
      local critical=(uniz-gateway-api uniz-auth-service uniz-user-service uniz-portal uniz-landing)
      local filtered=() d c
      for c in "${critical[@]}"; do
        for d in "${deps[@]}"; do
          [ "$d" = "$c" ] && filtered+=("$d") && break
        done
      done
      deps=("${filtered[@]}")
      echo "[Verify] Full deploy — checking critical rollouts only: ${deps[*]}"
    else
      echo "[Verify] Checking rollouts for updated workloads: ${deps[*]}"
    fi
  else
    deps=(
      uniz-gateway-api
      uniz-auth-service
      uniz-user-service
      uniz-portal
      uniz-landing
    )
  fi
  local rollout_timeout="${ROLLOUT_TIMEOUT:-300s}"
  local dep
  for dep in "${deps[@]}"; do
    if kubectl rollout status "deployment/$dep" --timeout="$rollout_timeout"; then
      continue
    fi
    # Single-node VPS: HPA may want more replicas than the node can schedule.
    local ready available
    ready=$(kubectl get deployment "$dep" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)
    available=$(kubectl get deployment "$dep" -o jsonpath='{.status.availableReplicas}' 2>/dev/null || echo 0)
    if [ "${ready:-0}" -ge 1 ] && [ "${available:-0}" -ge 1 ]; then
      echo "[Verify] Rollout incomplete for $dep but ${ready} ready — accepting on constrained VPS."
      kubectl get pods 2>/dev/null | grep "$dep" || true
      continue
    fi
    echo "[Verify] Rollout timeout for $dep"
    kubectl get pods 2>/dev/null | grep "$dep" || true
    return 1
  done

  echo "[Verify] Checking API health..."
  local skip_cluster_health=false
  if [ "${#VERIFY_DEPLOYMENTS[@]}" -gt 0 ]; then
    skip_cluster_health=true
    local dep
    for dep in "${VERIFY_DEPLOYMENTS[@]}"; do
      case "$dep" in
        uniz-landing|uniz-portal) ;;
        *) skip_cluster_health=false; break ;;
      esac
    done
  fi
  if [ "$skip_cluster_health" = true ]; then
    echo "[Verify] Skipping API health — only frontend workloads updated (${VERIFY_DEPLOYMENTS[*]})"
    return 0
  fi

  local attempt code body
  for attempt in 1 2 3 4 5; do
    # -k: host nginx LE cert for api.* may be expired; verify app health not TLS here
    code=$(curl -sk -o /tmp/uniz-health.json -w "%{http_code}" --max-time 15 \
      https://api-uniz.rguktong.in/api/v1/system/health 2>/dev/null || true)
    code=${code:-000}
    if [ "$code" = "200" ] || [ "$code" = "503" ]; then
      body=$(cat /tmp/uniz-health.json 2>/dev/null || echo "")
      if echo "$body" | grep -q '"status":"ok"'; then
        echo "[Verify] Health OK (HTTP $code, status ok)"
        return 0
      fi
      if echo "$body" | grep -q '"status":"degraded"'; then
        echo "[Verify] Health degraded but reachable — checking critical services..."
        if echo "$body" | grep -qE '"auth".*"healthy"|"name": "auth".*"healthy"'; then
          echo "[Verify] Core API reachable (HTTP $code, degraded — non-critical services down)"
          return 0
        fi
      fi
    fi
    echo "[Verify] Health attempt $attempt/5: HTTP $code — retry in 20s..."
    sleep 20
  done

  echo "[Verify] Production health check failed after 5 attempts (last HTTP $code)"
  cat /tmp/uniz-health.json 2>/dev/null || true
  return 1
}

ensure_ghcr_pull_secret() {
  if [ -z "${GHCR_PULL_TOKEN:-}" ]; then
    echo "[GHCR] No GHCR_PULL_TOKEN — assuming public packages or pre-configured pull secret."
    return 0
  fi
  local user="${GHCR_USERNAME:-uniz-rguktong}"
  echo "[GHCR] Syncing image pull secret ghcr-pull..."
  kubectl create secret docker-registry ghcr-pull \
    --docker-server=ghcr.io \
    --docker-username="$user" \
    --docker-password="$GHCR_PULL_TOKEN" \
    --dry-run=client -o yaml | kubectl apply -f -
}

apply_ghcr_image_to_workload() {
  local DEP="$1"
  local CON="$2"
  local FULL_IMAGE="$3"
  local pull_patch='{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"ghcr-pull"}]}}}}'

  if [[ "$DEP" == *"job"* ]]; then
    kubectl set image "cronjob/$DEP" "$CON=$FULL_IMAGE"
    kubectl patch "cronjob/$DEP" --type=merge -p "$pull_patch" 2>/dev/null || true
  else
    kubectl set image "deployment/$DEP" "$CON=$FULL_IMAGE"
    kubectl patch "deployment/$DEP" --type=merge -p \
      '{"spec":{"template":{"spec":{"containers":[{"name":"'"$CON"'","imagePullPolicy":"Always"}]}}}}' \
      2>/dev/null || true
    if kubectl get secret ghcr-pull &>/dev/null; then
      kubectl patch "deployment/$DEP" --type=merge -p "$pull_patch" 2>/dev/null || true
    fi
  fi
}

rollback_ghcr_images() {
  local prev_sha="$1"
  local short_tag="${prev_sha:0:7}"
  echo "[Rollback] Reverting updated workloads to ${short_tag}..."
  local s DIR IMG DEP CON FULL
  for s in "${ROLLBACK_TARGETS[@]}"; do
    IFS=':' read -r DIR IMG DEP CON <<< "$s"
    FULL=$(ghcr_image_ref "$IMG" "$short_tag")
    apply_ghcr_image_to_workload "$DEP" "$CON" "$FULL"
  done
  verify_deployment || true
}

# 16. Deploy Logic
deploy_logic() {
  set -e
  echo "[CI/CD] Deployment Verified at $(date)"
  export DOCKER_BUILDKIT=1

  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo "[Git] Branch: $CURRENT_BRANCH | Commit: $(git log -1 --format='%h - %s')"

  USE_GHCR="${USE_GHCR:-false}"
  if [ "$DEPLOY_CONTEXT" = "GITHUB_ACTIONS" ]; then
    USE_GHCR="${USE_GHCR:-true}"
  fi
  IMAGE_REGISTRY="${IMAGE_REGISTRY:-ghcr.io/uniz-rguktong}"

  STATE_FILE="/root/.uniz_last_deploy_sha"
  PREV_SHA=""
  if [ -f "$STATE_FILE" ]; then
    PREV_SHA=$(cat "$STATE_FILE")
  fi

  deploy_detect_changes "$@"

  ALL_SERVICES=("${UNIZ_SERVICES[@]}")
  K_BASE="infra/core-infra/kubernetes/base/core"
  [ ! -d "$K_BASE" ] && K_BASE="infra/core-infra/kubernetes/base"

  ROLLBACK_TARGETS=()
  VERIFY_DEPLOYMENTS=()

  # LOAD SECRETS (Sanitized)
  if [ -f "/root/uniz-secrets.env" ]; then
    echo "[Vault] Loading sanitized secrets..."
    while IFS= read -r line || [ -n "$line" ]; do
      [[ "$line" =~ ^#.*$ ]] && continue
      [[ -z "$line" ]] && continue
      [[ "$line" != *"="* ]] && continue
      eval "export $line"
    done < /root/uniz-secrets.env

  fi

  # Sync Prisma schemas before rolling out services (idempotent on every deploy).
  if [ -f "scripts/prisma-migrate-deploy-all.sh" ]; then
    echo "[Prisma] Applying database migrations..."
    bash scripts/prisma-migrate-deploy-all.sh
  fi

  # Generate Infrastructure from templates
  if [ -f "infra/core-infra/kubernetes/base/shared/secrets.yaml.template" ]; then
    echo "[Infra] Generating secrets.yaml..."
    envsubst < infra/core-infra/kubernetes/base/shared/secrets.yaml.template > infra/core-infra/kubernetes/base/shared/secrets.yaml
  fi

  # Apply Infrastructure
  echo "[Infra] Applying shared components..."
  # Stale ingress-nginx admission webhook blocks Ingress updates after controller removal
  kubectl delete validatingwebhookconfiguration ingress-nginx-admission 2>/dev/null || true
  kubectl apply -k infra/core-infra/kubernetes/base/shared/ || true

  if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
    echo "[Infra] Syncing Cloudflare DNS token for cert-manager..."
    kubectl create secret generic cloudflare-api-token -n cert-manager \
      --from-literal=api-token="$CLOUDFLARE_API_TOKEN" \
      --dry-run=client -o yaml | kubectl apply -f -
    echo "[Infra] Ensuring Cloudflare www.* DNS records..."
    bash "$(dirname "$0")/ensure-cloudflare-www-dns.sh" || true
  fi

  echo "[Infra] Syncing host nginx TLS + www redirects..."
  bash "$(dirname "$0")/sync-nginx-k8s-tls.sh" 2>/dev/null || true
  bash "$(dirname "$0")/install-nginx-www-redirects.sh" 2>/dev/null || true
  bash "$(dirname "$0")/install-nginx-k8s-tls-cron.sh" 2>/dev/null || true
  
  echo "[Infra] Applying branch components ($K_BASE)..."
  kubectl apply -k "$K_BASE" || true

  if [ "$USE_GHCR" == "true" ]; then
    echo "[GHCR] Pull-only deploy — images built in GitHub Actions."
    ensure_ghcr_pull_secret
    echo "[GHCR] Restoring image tags after kubectl apply..."
    bash "$(dirname "$0")/restore-ghcr-images-from-manifest.sh" /root/.uniz_k8s_image_tags.json
  fi

  # Build & Deploy Loop
  REBUILT_COUNT=0
  declare -A BUILT_IMAGES

  for s in "${ALL_SERVICES[@]}"; do
    IFS=':' read -r DIR IMG DEP CON <<< "$s"
    SHOULD_BUILD=false

    if service_should_build "$DIR" "$IMG"; then
      SHOULD_BUILD=true
    fi

    TAG=""
    FULL_IMAGE=""

    if [ "$SHOULD_BUILD" == "true" ]; then
      if [ "$USE_GHCR" == "true" ]; then
        if [ -z "${BUILT_IMAGES[$IMG]}" ]; then
          TAG="${DEPLOY_SHA:0:7}"
          BUILT_IMAGES[$IMG]=$TAG
          ((REBUILT_COUNT++)) || true
          ROLLBACK_TARGETS+=("$s")
        else
          TAG=${BUILT_IMAGES[$IMG]}
        fi
        FULL_IMAGE=$(ghcr_image_ref "$IMG" "$TAG")
      elif [ -z "${BUILT_IMAGES[$IMG]}" ]; then
        resolve_build_paths "$DIR"

        if [ ! -d "$BUILD_CONTEXT" ]; then
          echo "[Skip] Directory $BUILD_CONTEXT not found in branch $CURRENT_BRANCH"
          continue
        fi
        if [ ! -f "$DOCKERFILE" ]; then
          echo "[Skip] Dockerfile not found at $DOCKERFILE. Skipping build."
          continue
        fi

        if [ -n "${DEPLOY_SHA:-}" ]; then
          TAG="local-${DEPLOY_SHA:0:12}"
        else
          TAG="local-$(date +%s)"
        fi
        echo "[Build] Rebuilding $IMG:$TAG (context=$BUILD_CONTEXT, dockerfile=$DOCKERFILE)..."

        service_build_args "$DIR"

        CACHE_ARGS=""
        if [ -d "/tmp/.buildx-cache" ]; then
          CACHE_ARGS="--cache-from type=local,src=/tmp/.buildx-cache"
        fi
        mkdir -p /tmp/.buildx-cache 2>/dev/null || true

        if docker build --platform linux/amd64 \
          ${CACHE_ARGS} \
          --cache-to type=local,dest=/tmp/.buildx-cache-new,mode=max \
          $BUILD_ARGS \
          -f "$DOCKERFILE" \
          -t $IMG:$TAG \
          $BUILD_CONTEXT; then
          [ -d /tmp/.buildx-cache-new ] && rm -rf /tmp/.buildx-cache && mv /tmp/.buildx-cache-new /tmp/.buildx-cache
          echo "[Docker] Importing $IMG:$TAG..."
          import_image_to_k3s "$IMG" "$TAG"
          PREV_TAG="${BUILT_IMAGES[$IMG]:-}"
          BUILT_IMAGES[$IMG]=$TAG
          if [ -n "$PREV_TAG" ] && [ "$PREV_TAG" != "$TAG" ]; then
            docker rmi "$IMG:$PREV_TAG" 2>/dev/null || true
          fi
          ((REBUILT_COUNT++)) || true
        else
          echo "[Error] Build failed for $IMG."
          exit 1
        fi
      else
        TAG=${BUILT_IMAGES[$IMG]}
      fi
    else
      echo "[Skip] No changes for $DIR — reusing existing image."
      if [ "$USE_GHCR" == "true" ]; then
        TAG=""
      else
        TAG=$(latest_local_image_tag "$IMG" || true)
        if [ -z "$TAG" ]; then
          CURRENT=$(kubectl get deployment "$DEP" -o jsonpath="{.spec.template.spec.containers[?(@.name=='$CON')].image}" 2>/dev/null || true)
          if [[ "$CURRENT" =~ :local-([0-9]+|[0-9a-f]{7,12})$ ]]; then
            TAG="${CURRENT##*:}"
            echo "[Skip] Reusing deployment image tag $TAG for $DEP"
          else
            echo "[Warn] No local image for $IMG — leaving deployment image unchanged"
            TAG=""
          fi
        fi
      fi
    fi

    if [ "$USE_GHCR" == "true" ] && [ -n "$FULL_IMAGE" ]; then
      echo "[Deploy] Updating $DEP -> $FULL_IMAGE"
      apply_ghcr_image_to_workload "$DEP" "$CON" "$FULL_IMAGE"
    elif [ -n "$TAG" ]; then
      import_image_to_k3s "$IMG" "$TAG" || {
        echo "[Error] Cannot deploy $DEP — image $IMG:$TAG missing from Docker and k3s"
        exit 1
      }
      echo "[Deploy] Updating $DEP -> $IMG:$TAG"
      if [[ "$DEP" == *"job"* ]]; then
        kubectl set image "cronjob/$DEP" "$CON=docker.io/library/$IMG:$TAG"
      else
        kubectl set image "deployment/$DEP" "$CON=docker.io/library/$IMG:$TAG"
      fi
    fi
  done

  # Docker Compose Handling (Main branch only)
  if [ "$CURRENT_BRANCH" == "main" ]; then
    LANDING_BACKEND_DIR="apps/uniz-landing-backend"
    if [ "$FORCE_ALL" == "true" ] || echo "$CHANGED_FILES" | grep -q "^$LANDING_BACKEND_DIR/"; then
      echo "[Compose] Redeploying $LANDING_BACKEND_DIR..."
      BASE_DIR=$PWD
      cd "$BASE_DIR/$LANDING_BACKEND_DIR"
      
      # Generate a strictly mapped .env for Python backend
      echo "DATABASE_URL=$LANDING_DATABASE_URL" > .env
      echo "JWT_SECURITY_KEY=$LANDING_JWT_SECURITY_KEY" >> .env
      echo "JWT_ALGORITHM=$LANDING_JWT_ALGORITHM" >> .env
      echo "DUMMY_TOKEN=$DUMMY_TOKEN" >> .env
      echo "POSTGRES_USER=$LANDING_POSTGRES_USER" >> .env
      echo "POSTGRES_PASSWORD=$LANDING_POSTGRES_PASSWORD" >> .env
      echo "POSTGRES_DB=$LANDING_POSTGRES_DB" >> .env
      # Include specific DB connection params with safe defaults
      echo "DB_USER=${DB_USER:-$POSTGRES_USER}" >> .env
      echo "DB_PASS=${DB_PASS:-$POSTGRES_PASSWORD}" >> .env
      echo "DB_HOST=${DB_HOST:-"localhost"}" >> .env
      echo "DB_PORT=${DB_PORT:-"5432"}" >> .env
      echo "DB_NAME=${DB_NAME:-$POSTGRES_DB}" >> .env

      docker compose -f docker-compose.yml.vps up -d --build
      cd "$BASE_DIR"
    fi
  fi

  echo "[Build] Rebuilt $REBUILT_COUNT image(s) this deploy."

  VERIFY_DEPLOYMENTS=()
  for s in "${ROLLBACK_TARGETS[@]}"; do
    IFS=':' read -r _ _ dep _ <<< "$s"
    [[ "$dep" == *"job"* ]] && continue
    VERIFY_DEPLOYMENTS+=("$dep")
  done

  if [ "$DEPLOY_CONTEXT" = "GITHUB_ACTIONS" ]; then
    if [ "$REBUILT_COUNT" -eq 0 ]; then
      echo "[Verify] No images updated this deploy — skipping rollout verify."
    elif ! verify_deployment; then
      echo "[Warn] Deploy verify failed — leaving rolled-out images in place (no GHCR rollback; old SHA tags may not exist in registry)."
      exit 1
    fi
  fi

  if [ "$USE_GHCR" != "true" ]; then
    prune_old_local_images
  else
    prune_k3s_images
  fi

  if [ -f "$(dirname "$0")/install-vps-storage-cron.sh" ]; then
    bash "$(dirname "$0")/install-vps-storage-cron.sh" || true
  fi

  if [ -f "$(dirname "$0")/harden-vps.sh" ]; then
    bash "$(dirname "$0")/harden-vps.sh" || true
  fi

  if [ -f "$(dirname "$0")/setup-cloudflare-tunnel.sh" ]; then
    bash "$(dirname "$0")/setup-cloudflare-tunnel.sh" || true
  fi

  if [ -f "$(dirname "$0")/vps-storage-cleanup.sh" ]; then
    bash "$(dirname "$0")/vps-storage-cleanup.sh" || true
  fi

  if [ "$USE_GHCR" == "true" ] && [ -n "${PREV_SHA:-}" ] && [ -n "${NEW_HEAD:-}" ]; then
    local want="${DEPLOY_SHA:-$NEW_HEAD}"
    want="${want:0:7}"
    for s in "${ALL_SERVICES[@]}"; do
      IFS=':' read -r DIR IMG DEP CON <<< "$s"
      [[ "$DEP" == *"job"* ]] && continue
      if ! service_dir_changed_between "$DIR" "$PREV_SHA" "$NEW_HEAD"; then
        continue
      fi
      current=$(kubectl get deployment "$DEP" \
        -o jsonpath="{.spec.template.spec.containers[?(@.name=='$CON')].image}" 2>/dev/null \
        | sed 's/.*://' || true)
      if [ -n "$current" ] && [ "$current" != "$want" ]; then
        echo "[Error] $DEP still on :$current but $DIR changed since ${PREV_SHA:0:7} — expected :$want"
        echo "[Error] Refusing to mark deploy successful; fix image build or use [rebuild all]."
        exit 1
      fi
    done
  fi

  if [ -f "$(dirname "$0")/dump-k8s-image-tags.sh" ]; then
    bash "$(dirname "$0")/dump-k8s-image-tags.sh" /root/.uniz_k8s_image_tags.json || true
  fi

  echo "$NEW_HEAD" > "$STATE_FILE"
}

# Execution Entry Point
if [ -f "/root/uniz-secrets.env" ]; then
  deploy_logic "$@"
else
  # On Local Machine -> Trigger VPS
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  git add .
  git commit -m "${1:-"chore: auto-deploy from $CURRENT_BRANCH"}" || true
  git push origin "$CURRENT_BRANCH"

  echo "[SSH] Dispatching $CURRENT_BRANCH to VPS..."
  ssh -o StrictHostKeyChecking=no root@76.13.241.174 << EOF
    export WORK_DIR="/root/uniz-master-$CURRENT_BRANCH"
    if [ ! -d "\$WORK_DIR" ]; then
      echo "[Setup] Creating isolated directory for $CURRENT_BRANCH..."
      git clone https://github.com/uniz-rguktong/uniz-master.git "\$WORK_DIR"
    fi
    cd "\$WORK_DIR"
    git fetch origin $CURRENT_BRANCH
    git checkout -B $CURRENT_BRANCH origin/$CURRENT_BRANCH
    git reset --hard origin/$CURRENT_BRANCH
    git clean -fd
    /bin/bash ./scripts/deploy.sh "remote-trigger"
EOF
fi

echo "[Health] API: \$(curl -s -o /dev/null -w "%{http_code}" https://api-uniz.rguktong.in/api/v1/system/health || echo 'FAIL')"
echo "[Done] Branch $CURRENT_BRANCH Deployed."
