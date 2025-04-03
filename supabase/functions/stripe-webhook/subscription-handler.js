/**
 * Handle Stripe subscription events properly to avoid duplicate subscription records
 * @param {object} supabase - Supabase client
 * @param {object} subscription - Stripe subscription object
 * @param {string} event - Stripe event type
 */
export async function handleSubscription(supabase, subscription, event) {
  try {
    // Get relevant data from Stripe subscription
    const subscriptionId = subscription.id;
    const customerId = subscription.customer;
    const status = subscription.status;
    const priceId = subscription.items.data[0]?.price.id;
    
    // Get metadata from the subscription
    const metadata = subscription.metadata || {};
    const userId = metadata.user_id || null;
    
    if (!userId) {
      console.log('⚠️ No user_id in metadata, cannot process subscription');
      return;
    }
    
    console.log(`🔍 Processing subscription ${subscriptionId} for user ${userId}`);
    
    // Get the subscription interval (month or year) from Stripe
    const stripeInterval = subscription.items.data[0]?.plan.interval || 'month';
    console.log(`📊 Stripe interval: ${stripeInterval}`);
    
    // Map it to our database enum values (monthly or annual)
    const billingPeriod = stripeInterval === 'year' ? 'annual' : 'monthly';
    console.log(`📊 Mapped to DB billing_period: ${billingPeriod}`);
    
    // Determine tier based on price ID
    // Add your own mapping here based on your Stripe price IDs
    const tier = priceId === 'price_1QsQGrFx6uwYcH3SCT6RJsSI' ? 'pro' : 'pro';
    
    // Determine if subscription is active
    const isActive = ['active', 'trialing'].includes(status);
    const dbStatus = isActive ? 'active' : 'inactive';
    
    // First check if user already has an active subscription
    const { data: existingSubscription, error: findError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (findError && findError.code !== 'PGRST116') {
      console.error(`❌ Error checking existing subscription: ${findError.message}`);
    }
    
    const now = new Date().toISOString();
    const periodStart = subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : now;
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : now;
    
    if (existingSubscription) {
      console.log(`⚠️ User ${userId} already has active subscription. Updating it.`);
      
      // Update the existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          tier,
          billing_period: billingPeriod,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          status: dbStatus,
          cancel_at_period_end: subscription.cancel_at_period_end || false,
          updated_at: now,
          payment_status: 'paid',
          last_payment_date: now
        })
        .eq('id', existingSubscription.id);
      
      if (updateError) {
        console.error(`❌ Error updating subscription: ${updateError.message}`);
      } else {
        console.log(`✅ Successfully updated subscription for user ${userId}`);
      }
    } else {
      // Check if user has other subscriptions that might be inactive
      const { data: inactiveSubscription, error: inactiveError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'inactive')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (inactiveError && inactiveError.code !== 'PGRST116') {
        console.error(`❌ Error checking inactive subscriptions: ${inactiveError.message}`);
      }
      
      if (inactiveSubscription) {
        console.log(`⚠️ User ${userId} has inactive subscription. Reactivating it.`);
        
        // Update the inactive subscription
        const { error: reactiveError } = await supabase
          .from('subscriptions')
          .update({
            tier,
            billing_period: billingPeriod,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            status: dbStatus,
            cancel_at_period_end: subscription.cancel_at_period_end || false,
            updated_at: now,
            payment_status: 'paid',
            last_payment_date: now
          })
          .eq('id', inactiveSubscription.id);
        
        if (reactiveError) {
          console.error(`❌ Error reactivating subscription: ${reactiveError.message}`);
        } else {
          console.log(`✅ Successfully reactivated subscription for user ${userId}`);
        }
      } else {
        console.log(`🆕 Creating new subscription for user ${userId}`);
        
        // Create a new subscription record
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            tier,
            billing_period: billingPeriod,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            status: dbStatus,
            is_early_adopter: false,
            is_lifetime: false,
            cancel_at_period_end: subscription.cancel_at_period_end || false,
            created_at: now,
            updated_at: now,
            payment_status: 'paid',
            last_payment_date: now
          });
        
        if (insertError) {
          console.error(`❌ Error creating subscription: ${insertError.message}`);
        } else {
          console.log(`✅ Successfully created subscription for user ${userId}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error processing subscription:', error);
  }
} 