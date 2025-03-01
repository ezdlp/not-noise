
#!/bin/bash
# deploy-functions.sh - Automates deployment of Supabase Edge Functions with proper JWT verification settings

# Path to Supabase functions directory
FUNCTIONS_DIR="./supabase/functions"

# Set executable permissions if needed
chmod +x "$0"

echo "🚀 Starting Supabase Edge Functions deployment..."
echo "📂 Functions directory: $FUNCTIONS_DIR"

# Initialize counters
public_count=0
protected_count=0
error_count=0

# Loop through all function directories
for func_dir in "$FUNCTIONS_DIR"/*; do
  if [ -d "$func_dir" ]; then
    func_name=$(basename "$func_dir")
    
    # Skip directories that start with underscore (shared utilities)
    if [[ "$func_name" == _* ]]; then
      echo "⏭️  Skipping utility directory: $func_name"
      continue
    fi
    
    # Check if the marker file exists
    if [ -f "$func_dir/.no-verify-jwt" ]; then
      echo "🔓 Deploying $func_name WITHOUT JWT verification..."
      if supabase functions deploy "$func_name" --no-verify-jwt; then
        echo "✅ Successfully deployed $func_name without JWT verification"
        public_count=$((public_count + 1))
      else
        echo "❌ Failed to deploy $func_name"
        error_count=$((error_count + 1))
      fi
    else
      echo "🔒 Deploying $func_name WITH JWT verification..."
      if supabase functions deploy "$func_name"; then
        echo "✅ Successfully deployed $func_name with JWT verification"
        protected_count=$((protected_count + 1))
      else
        echo "❌ Failed to deploy $func_name"
        error_count=$((error_count + 1))
      fi
    fi
  fi
done

echo ""
echo "📊 Deployment Summary:"
echo "🔓 Public functions deployed: $public_count"
echo "🔒 Protected functions deployed: $protected_count"
echo "❌ Deployment errors: $error_count"

if [ $error_count -eq 0 ]; then
  echo "✨ All functions deployed successfully!"
  exit 0
else
  echo "⚠️ Some deployments failed. Check logs above for details."
  exit 1
fi
