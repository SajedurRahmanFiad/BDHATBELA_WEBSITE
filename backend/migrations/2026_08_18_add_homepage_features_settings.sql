START TRANSACTION;

-- Add homepage features (store advantage section) settings to the store settings JSON.
-- This seeds the "Why Shop With Us?" section defaults without overwriting existing values.
--
-- NOTE (MariaDB 10.4): JSON_SET cannot create multi-level paths (e.g. $.homepageFeatures.heading)
-- when the parent object does not exist yet, and COALESCE would force the value to a plain
-- string. So the whole object is written in one single-level path and guarded so it only runs
-- when the key is missing (keeps admin edits intact on re-run).

UPDATE `settings`
SET `setting_value` = JSON_SET(
    setting_value,
    '$.homepageFeatures',
    JSON_OBJECT(
        'enabled', TRUE,
        'backgroundColor', '#1E3A8A',
        'textColor', '#FFFFFF',
        'heading', 'Why Shop With Us?',
        'description', 'We prioritize customer satisfaction and guarantee high-quality product reliability.',
        'features', JSON_ARRAY(
            JSON_OBJECT(
                'icon', '🚚',
                'title', 'Super Fast Delivery',
                'description', 'Get fast and reliable delivery straight to your doorstep right after order confirmation.'
            ),
            JSON_OBJECT(
                'icon', '🛡️',
                'title', 'Secure Payments',
                'description', 'Check out securely using bKash, Nagad, bank transfers, or Cash on Delivery.'
            ),
            JSON_OBJECT(
                'icon', '✨',
                'title', 'Premium Quality',
                'description', 'Every item undergoes rigorous quality inspections before being dispatched.'
            ),
            JSON_OBJECT(
                'icon', '💬',
                'title', '24/7 Support',
                'description', 'Our dedicated customer service team is always here to assist with any questions.'
            )
        )
    )
)
WHERE setting_key = 'store_settings'
  AND NOT JSON_CONTAINS_PATH(setting_value, 'one', '$.homepageFeatures');

COMMIT;