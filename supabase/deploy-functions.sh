
#!/bin/bash
# deploy-functions.sh - Automates deployment of Supabase Edge Functions with proper JWT verification settings

# Path to Supabase functions directory
FUNCTIONS_DIR="./supabase/functions"

# Set executable permissions if needed
chmod +x "$0"

# Project ID with fallback
PROJECT_ID=${SUPABASE_PROJECT_ID:-owtufhdsuuyrgmxytclj}

# Helper function for colorized output
function log() {
  local color_code=$1
  local message=$2
  echo -e "\033[${color_code}m${message}\033[0m"
}

# Helper function to retry commands with exponential backoff
function retry_with_backoff() {
  local max_attempts=5
  local timeout=1
  local attempt=1
  local exit_code=0

  while [[ $attempt -le $max_attempts ]]; do
    "$@"
    exit_code=$?

    if [[ $exit_code -eq 0 ]]; then
      break
    fi

    log "1;33" "Command failed with exit code $exit_code. Retrying in $timeout seconds... (Attempt $attempt/$max_attempts)"
    sleep $timeout
    attempt=$(( attempt + 1 ))
    timeout=$(( timeout * 2 ))
  done

  if [[ $exit_code -ne 0 ]]; then
    log "1;31" "Command failed after $max_attempts attempts: $@"
  fi

  return $exit_code
}

log "1;36" "🚀 Starting Supabase Edge Functions deployment..."
log "1;36" "📂 Functions directory: $FUNCTIONS_DIR"
log "1;36" "🔑 Project ID: ${PROJECT_ID}"

# Initialize arrays to track functions and their JWT status
declare -a public_functions
declare -a protected_functions
declare -a existing_functions
declare -a deployed_functions
declare -a failed_functions
declare -a functions_to_delete

# Get the list of all existing functions in Supabase
mapfile -t existing_functions < <(supabase functions list -p ${PROJECT_ID} 2>/dev/null | grep -v "^$")
log "1;36" "📋 Existing functions in Supabase: ${existing_functions[*]}"

# Initialize counters
public_count=0
protected_count=0
error_count=0

# Verify we have the supabase CLI
if ! command -v supabase &> /dev/null; then
  log "1;31" "❌ Error: Supabase CLI not found. Please install it first."
  exit 1
fi

# Build the list of functions we're going to deploy
log "1;36" "🔍 Scanning for functions to deploy..."
for func_dir in "$FUNCTIONS_DIR"/*; do
  if [ -d "$func_dir" ]; then
    func_name=$(basename "$func_dir")
    
    # Skip directories that start with underscore (shared utilities)
    if [[ "$func_name" == _* ]]; then
      log "1;33" "⏭️  Skipping utility directory: $func_name"
      continue
    fi
    
    deployed_functions+=("$func_name")
  fi
done

# Find functions to delete (exist in Supabase but not in our codebase)
for func in "${existing_functions[@]}"; do
  if [[ ! " ${deployed_functions[*]} " =~ " ${func} " ]]; then
    functions_to_delete+=("$func")
  fi
done

# List functions that will be deleted (but don't delete them automatically)
if [ ${#functions_to_delete[@]} -gt 0 ]; then
  log "1;33" "🗑️  The following functions exist in Supabase but not in the codebase:"
  for func in "${functions_to_delete[@]}"; do
    log "1;33" "   - $func"
  done
  log "1;33" "⚠️  These functions need to be deleted manually through the Supabase dashboard."
fi

# Deploy the functions
log "1;36" "🚀 Deploying functions..."
for func_name in "${deployed_functions[@]}"; do
  # Check if the marker file exists
  if [ -f "$FUNCTIONS_DIR/$func_name/.no-verify-jwt" ]; then
    log "1;33" "🔓 Deploying $func_name WITHOUT JWT verification..."
    if retry_with_backoff supabase functions deploy "$func_name" --project-ref ${PROJECT_ID} --no-verify-jwt; then
      log "1;32" "✅ Successfully deployed $func_name without JWT verification"
      public_count=$((public_count + 1))
      public_functions+=("$func_name")
      
      # Double check settings were applied with multiple retries
      success=false
      for i in {1..3}; do
        sleep 2
        settings=$(supabase functions inspect $func_name --project-ref ${PROJECT_ID} --json 2>/dev/null)
        verify_jwt=$(echo $settings | grep -o '"verify_jwt":[^,}]*' | cut -d':' -f2)
        
        if [[ "$verify_jwt" == "true" ]]; then
          log "1;33" "⚠️ Attempt $i: $func_name still has JWT verification enabled despite deployment flags!"
          if [ $i -lt 3 ]; then
            log "1;33" "🔄 Re-deploying with explicit --no-verify-jwt flag..."
            retry_with_backoff supabase functions deploy "$func_name" --project-ref ${PROJECT_ID} --no-verify-jwt
          fi
        else
          log "1;32" "✅ Verified: $func_name correctly has JWT verification disabled"
          success=true
          break
        fi
      done
      
      if [ "$success" != true ]; then
        log "1;31" "⚠️ Failed to disable JWT verification for $func_name after multiple attempts"
        error_count=$((error_count + 1))
        failed_functions+=("$func_name")
      fi
    else
      log "1;31" "❌ Failed to deploy $func_name"
      error_count=$((error_count + 1))
      failed_functions+=("$func_name")
    fi
  else
    log "1;34" "🔒 Deploying $func_name WITH JWT verification..."
    if retry_with_backoff supabase functions deploy "$func_name" --project-ref ${PROJECT_ID}; then
      log "1;32" "✅ Successfully deployed $func_name with JWT verification"
      protected_count=$((protected_count + 1))
      protected_functions+=("$func_name")
      
      # Verify JWT setting is correctly applied
      sleep 2
      settings=$(supabase functions inspect $func_name --project-ref ${PROJECT_ID} --json 2>/dev/null)
      verify_jwt=$(echo $settings | grep -o '"verify_jwt":[^,}]*' | cut -d':' -f2)
      
      if [[ "$verify_jwt" != "true" ]]; then
        log "1;33" "⚠️ WARNING: $func_name should have JWT verification enabled but doesn't!"
        log "1;33" "🔄 Re-deploying with standard settings..."
        retry_with_backoff supabase functions deploy "$func_name" --project-ref ${PROJECT_ID}
      fi
    else
      log "1;31" "❌ Failed to deploy $func_name"
      error_count=$((error_count + 1))
      failed_functions+=("$func_name")
    fi
  fi
done

# Create a detailed deployment log file
log_file="supabase/deployment_log_$(date +%Y%m%d_%H%M%S).txt"
{
  echo "========================================"
  echo "Supabase Functions Deployment Log"
  echo "Date: $(date)"
  echo "Project ID: ${PROJECT_ID}"
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
  
  if [ ${#functions_to_delete[@]} -gt 0 ]; then
    echo ""
    echo "⚠️ FUNCTIONS TO DELETE MANUALLY:"
    for func in "${functions_to_delete[@]}"; do
      echo "   - $func"
    done
    echo ""
    echo "These functions exist in Supabase but not in the codebase."
    echo "They should be deleted manually through the Supabase dashboard."
  fi
  
  echo ""
  echo "📋 VERIFICATION STATUS:"
  for func_name in "${deployed_functions[@]}"; do
    settings=$(supabase functions inspect $func_name --project-ref ${PROJECT_ID} --json 2>/dev/null)
    verify_jwt=$(echo $settings | grep -o '"verify_jwt":[^,}]*' | cut -d':' -f2)
    echo "   - $func_name: JWT Verification = $verify_jwt"
  done
} > "$log_file"

echo ""
log "1;36" "📊 Deployment Summary:"
log "1;33" "🔓 Public functions deployed: $public_count"
log "1;34" "🔒 Protected functions deployed: $protected_count"
log "1;31" "❌ Deployment errors: $error_count"
log "1;36" "📝 Detailed log saved to: $log_file"

# Reminder about functions that need manual deletion
if [ ${#functions_to_delete[@]} -gt 0 ]; then
  log "1;33" "⚠️ IMPORTANT: Please manually delete these functions through the Supabase dashboard:"
  for func in "${functions_to_delete[@]}"; do
    log "1;33" "   - $func"
  done
fi

if [ $error_count -eq 0 ]; then
  log "1;32" "✨ All functions deployed successfully!"
  exit 0
else
  log "1;31" "⚠️ Some deployments failed. Check logs above for details."
  exit 1
fi
