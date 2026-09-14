# Ad Analytics Events

Minimum events:

- ad_placement_opportunity
- interstitial_opportunity
- interstitial_start
- interstitial_complete
- interstitial_error
- interstitial_no_fill
- rewarded_ad_offer
- rewarded_ad_accept
- rewarded_ad_decline
- rewarded_ad_start
- rewarded_ad_complete
- rewarded_ad_closed
- rewarded_ad_error
- rewarded_ad_no_fill
- reward_granted
- reward_blocked
- continue_without_ad

Recommended properties:

- placement_id
- ad_type
- screen
- level
- run_id
- session_time
- active_gameplay_time
- reward_id
- reward_amount
- provider
- platform
- game_version
- device_type
- player_state
- reason_skipped

Never merge offer, start, completion, and reward-granted events.
