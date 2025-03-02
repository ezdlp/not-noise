
#!/bin/bash
# deploy-functions.sh - Automates deployment of Supabase Edge Functions with proper JWT verification settings

# Path to Supabase functions directory
FUNCTIONS_DIR="./supabase/functions"

# Set executable permissions if needed
chmod +x "$0"

# Helper function for colorized output
function log() {
  local color_code=$1
  local message=$2
  echo -e "\033[${color_code}m${message}\033[0m"
}

log "1;36" "🚀 Starting Supabase Edge Functions deployment..."
log "1;36" "📂 Functions directory: $FUNCTIONS_DIR"
log "1;36" "🔑 Project ID: ${SUPABASE_PROJECT_ID:-owtufhdsuuyrgmxytclj}"

# Initialize counters and lists
public_count=0
protected_count=0
error_count=0
public_functions=()
protected_functions=()
failed_functions=()

# Verify we have the supabase CLI
if ! command -v supabase &> /dev/null; then
  log "1;31" "❌ Error: Supabase CLI not found. Please install it first."
  exit 1
fi

# Loop through all function directories
for func_dir in "$FUNCTIONS_DIR"/*; do
  if [ -d "$func_dir" ]; then
    func_name=$(basename "$func_dir")
    
    # Skip directories that start with underscore (shared utilities)
    if [[ "$func_name" == _* ]]; then
      log "1;33" "⏭️  Skipping utility directory: $func_name"
      continue
    fi
    
    # Check if the marker file exists
    if [ -f "$func_dir/.no-verify-jwt" ]; then
      log "1;33" "🔓 Deploying $func_name WITHOUT JWT verification..."
      if supabase functions deploy "$func_name" --no-verify-jwt; then
        log "1;32" "✅ Successfully deployed $func_name without JWT verification"
        public_count=$((public_count + 1))
        public_functions+=("$func_name")
        
        # Double check settings were applied
        sleep 2
        settings=$(supabase functions inspect $func_name --json 2>/dev/null)
        verify_jwt=$(echo $settings | grep -o '"verify_jwt":[^,}]*' | cut -d':' -f2)
        
        if [[ "$verify_jwt" == "true" ]]; then
          log "1;31" "⚠️ WARNING: $func_name still has JWT verification enabled despite deployment flags!"
          log "1;33" "🔄 Re-deploying with explicit --no-verify-jwt flag..."
          supabase functions deploy "$func_name" --no-verify-jwt
        fi
      else
        log "1;31" "❌ Failed to deploy $func_name"
        error_count=$((error_count + 1))
        failed_functions+=("$func_name")
      fi
    else
      log "1;34" "🔒 Deploying $func_name WITH JWT verification..."
      if supabase functions deploy "$func_name"; then
        log "1;32" "✅ Successfully deployed $func_name with JWT verification"
        protected_count=$((protected_count + 1))
        protected_functions+=("$func_name")
      else
        log "1;31" "❌ Failed to deploy $func_name"
        error_count=$((error_count + 1))
        failed_functions+=("$func_name")
      fi
    fi
  fi
done

# Create a detailed deployment log file
log_file="supabase/deployment_log_$(date +%Y%m%d_%H%M%S).txt"
{
  echo "========================================"
  echo "Supabase Functions Deployment Log"
  echo "Date: $(date)"
  echo "Project ID: ${SUPABASE_PROJECT_ID:-owtufhdsuuyrgmxytclj}"
  echo "========================================"
  echo ""
  echo "📊 DEPLOYMENT SUMMARY:"
  echo "🔓 Public functions deployed ($public_count): ${public_functions[*]}"
  echo "🔒 Protected functions deployed ($protected_count): ${protected_functions[*]}"
  
  if [ ${#failed_functions[@]} -gt 0 ]; then
    echo "❌ Failed deployments ($error_count): ${failed_functions[*]}"
  else
    echo "✅ No deployment failures"
  fi
} > "$log_file"

echo ""
log "1;36" "📊 Deployment Summary:"
log "1;33" "🔓 Public functions deployed: $public_count"
log "1;34" "🔒 Protected functions deployed: $protected_count"
log "1;31" "❌ Deployment errors: $error_count"
log "1;36" "📝 Detailed log saved to: $log_file"

if [ $error_count -eq 0 ]; then
  log "1;32" "✨ All functions deployed successfully!"
  exit 0
else
  log "1;31" "⚠️ Some deployments failed. Check logs above for details."
  exit 1
fi
